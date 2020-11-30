from selenium.webdriver.chrome.options import Options
from django.http import JsonResponse, HttpResponse
import requests, re, time, json, sys, random
from datetime import datetime, timedelta
from pyvirtualdisplay import Display
from django.shortcuts import render
from pymongo import MongoClient
from selenium import webdriver
from bs4 import BeautifulSoup
from time import sleep
import numpy as np
import pandas as pd
import os, sys

from demproject.settings import API_KEY, _TIERS, _RANKS, FEATURES, DELAY
from .models import Summoner, Matches, Datas

# redundancy check and sequence check
CHECK = 0
def check(summonerName):    
    try:
        user = Summoner.objects.get(summonerName=summonerName)
        if user.wait == -1:
            print('기존 검색결과O')
            user.delete()
        elif user.wait != -1:
            print('검색 대기줄O')
            global CHECK
            CHECK = 1
            return
    except:
        print('기존 검색결과X')
    
    terminatedUser = Summoner.objects.all()
    count_terminated = 0
    for k in list(terminatedUser):
        if k.wait == -1:
            count_terminated += 1

    wait = Summoner.objects.all().count() - count_terminated
    newUser = Summoner()
    newUser.wait = wait
    newUser.summonerName = summonerName
    newUser.save()

    while True:
        if wait == 0:
            break
        try:
            uu = Summoner.objects.get(wait=wait-1)
            if uu:
                sleep(1)
                continue
        except:
            wait -= 1
            newUser.wait = wait
            newUser.save(force_update=True)
            continue
    
# CrollTier
crollingpossible = 0
def integer_to_tier_rank(i):
    if i > 24:
        return _TIERS[6 + i - 25], _RANKS[3]
    else:
        return _TIERS[(i-1)//4], _RANKS[(i-1)%4]
def convertTimestamp(timestamp):
    return [datetime.fromtimestamp(timestamp[0]//1000), timestamp[1]]
def filterTimeStamps(timestamps):
    timestamps = [t for t in timestamps if t]
    if len(timestamps) == 0:
        return []

    result = [convertTimestamp(timestamps[0])]
    for timestamp in timestamps[1:]:
        if result[-1][1] != timestamp[1]:
            result.append(convertTimestamp(timestamp))

    return result
def crollTier(summonerName):
    user = Summoner.objects.get(wait=0)
    chrome_options=webdriver.ChromeOptions()
    display = Display(visible=0, size=(800, 800))
    display.start()

    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    path = '/home/ubuntu/chromedriver'

    try:
        URL = 'https://www.leagueofgraphs.com/ko/summoner/kr/{summonerName}'
        print('Before the Webdriver.Chrome(path)')
        driver = webdriver.Chrome(path)
        print('Before the driver.get')
        driver.get(URL.format(summonerName=summonerName.replace(' ', '+')))
        print('Before the soup')
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        print('Before the script, wins, losses, lp')
        script = soup.select_one('#rankingHistory-1 > script:nth-child(3)')
        wins = soup.select_one('#mainContent > div.row > div.medium-13.small-24.columns > div.box.box-padding-10.summoner-rankings > div.best-league > div > div.row > div > div > div.txt.mainRankingDescriptionText > div.winslosses > span.wins > span')
        losses = soup.select_one('#mainContent > div.row > div.medium-13.small-24.columns > div.box.box-padding-10.summoner-rankings > div.best-league > div > div.row > div > div > div.txt.mainRankingDescriptionText > div.winslosses > span.losses > span')
        lp = soup.select_one('#mainContent > div.row > div.medium-13.small-24.columns > div.box.box-padding-10.summoner-rankings > div.best-league > div > div.row > div > div > div.txt.mainRankingDescriptionText > div.league-points > span')

        match = re.compile("data: (.*)").search(str(script))
        datas = filterTimeStamps(json.loads(match.group(1)[:-1]))
    except Exception as e:
        global crollingpossible
        print('except에 진입하였음', e)
        user.delete()
        crollingpossible = 1
        if driver:
            driver.quit()
        return
    if driver:
        driver.quit()

    user.crolling = True
    user.tier = datas[-1][1]
    for k in datas[-2::-1]:
        if k[1] != user.tier:
            user.start = [{'date': k[0], 'unix':int(k[0].timestamp()*1000)}]
            break
    user.wins = wins.get_text()
    user.losses = losses.get_text()
    user.lp = lp.get_text()

    user.save(force_update=True)
    
# GetMatchlist
def getMatchlist(summonerName):
    user = Summoner.objects.get(wait=0)
    
    ACCOUNT_ID_URL = 'https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/{}?api_key={}'
    MATCHLIST_URL = 'https://kr.api.riotgames.com/lol/match/v4/matchlists/by-account/{}?queue=420&beginTime={}&api_key={}'
    
    while True:
        try:
            acc_res = requests.get(ACCOUNT_ID_URL.format(summonerName, API_KEY))
            sleep(DELAY)
            acc_entry = acc_res.json()

            if acc_res.status_code != 200 or acc_entry == None:
                raise Exception('AccountId', acc_res.status_code, acc_entry)
            
            begin = user.start[0]['unix']
            break
        
        except:
            print('error in ACCOUNT_ID_URL')
            continue

    # totalGames Check
    totalGames = 0
    temp_res = requests.get(MATCHLIST_URL.format(acc_entry['accountId'], begin, API_KEY))
    temp_entry = temp_res.json()
    totalGames = temp_entry['totalGames']

    matches = []
    while True:
        try:
            if totalGames <= 50:
                print('50개 이하 게임수')
                ml_res = requests.get(MATCHLIST_URL.format(acc_entry['accountId'], begin, API_KEY))
            else:
                print('50개 초과 게임수')
                ml_res = requests.get(f'https://kr.api.riotgames.com/lol/match/v4/matchlists/by-account/{acc_entry["accountId"]}?queue=420&beginTime={begin}&endIndex={totalGames}&beginIndex={totalGames-50}&api_key={API_KEY}')
            sleep(DELAY)
            ml_entry = ml_res.json()
            
            if ml_res.status_code != 200 or ml_entry == None:
                raise Exception('Matchlist', ml_res.status_code, ml_entry)

            matches += ml_entry['matches']
            break
        
        except:
            print('error in MATCHLIST_URL')
            continue
    
    user.matches = matches
    user.accountId = acc_entry['accountId']
    user.getMatchlist = True
    user.save(force_update=True)

# GetMatches
def getMatches(summonerName):
    user = Summoner.objects.get(wait=0)
    MATCH_URL = 'https://kr.api.riotgames.com/lol/match/v4/matches/{}?api_key={}'

    gameIds = sorted(set(m['gameId'] for m in user.matches))

    fails = []
    successCount = 0
    failCount = 0
    gameCount = len(gameIds)
    start = datetime.now()

    print(gameCount, gameIds)
    for gameId in gameIds:
        try:
            response = requests.get(MATCH_URL.format(gameId, API_KEY))
            sleep(0.2)
            entry = response.json()
            
            if response.status_code != 200 or entry == None:
                raise Exception(response.status_code, entry)
            
            newMatches = Matches()
            newMatches.metadata = entry
            newMatches.save()
        except Exception as e:
            failCount += 1            
            print(successCount, failCount, gameCount, datetime.now()-start, e)
            fails.append(gameId)
            continue
        
        successCount += 1
        print(successCount, failCount, gameCount, datetime.now()-start)
        user.getMatches = [successCount, gameCount]
        user.save(force_update=True)

    return fails
def getMatches_again(summonerName, fail, timer):
    MATCH_URL = 'https://kr.api.riotgames.com/lol/match/v4/matches/{}?api_key={}'
    user = Summoner.objects.get(wait=0)

    fails = []
    failCount = len(fail)
    successCount = int(user.getMatches[1:-1].split(', ')[0])
    gameCount = int(user.getMatches[1:-1].split(', ')[1])
    start = datetime.now()
    
    fixed_max = False
    if timer == 2.6:
        fixed_max = True

    for gameId in fail:
        try:
            sleep(timer)
            response = requests.get(MATCH_URL.format(gameId, API_KEY))
            if timer != 0.2 and fixed_max:
                timer -= 0.1
            entry = response.json()
            
            if response.status_code != 200 or entry == None:
                raise Exception(response.status_code, entry)

            newMatches = Matches()
            newMatches.metadata = entry
            newMatches.save()
        except Exception as e:
            print(e)
            fails.append(gameId)
            continue

        successCount += 1
        failCount -= 1
        print(successCount, failCount, gameCount, datetime.now()-start, timer)
        user.getMatches = [successCount, gameCount]
        user.save(force_update=True)


    return fails

# CreateDatas
def getRatio(a, b):
    if a + b == 0:
        return 0
    else:
        return a / (a + b)
def createDatas(summonerName):   
    user = Summoner.objects.get(wait=0)
    matches = Matches.objects.all()
        
    stats = []
    gameIds = sorted(set(m['gameId'] for m in user.matches))
    matchResults = []

    for k in list(matches):
        match = k.metadata
        matchResult = {}
        participantId = 0
        for participantIdentity in match['participantIdentities']:
            if participantIdentity['player']['accountId'] == user.accountId:
                participantId = participantIdentity['participantId']
                break

        me = match['participants'][participantId-1]
        matchResult['win'] = me['stats']['win']
        matchResult['you'] = False
        you = None
        for p in match['participants']:
            if all(
                [me['teamId'] != p['teamId'],
                me['timeline']['role'] == p['timeline']['role'],
                me['timeline']['lane'] == p['timeline']['lane']]
                ):
                matchResult['you'] = True
                you = p
                break

        for feature in FEATURES:
            if you: matchResult[feature] = getRatio(me['stats'][feature], you['stats'][feature])
            else: matchResult[feature] = 0
        
        matchResults.append(matchResult)

    matchResults = pd.DataFrame(matchResults)

    stat = pd.Series(index=['accountId', 'gameCount', 'win', 'loss', 'missing'] + list(FEATURES), dtype='object')
    stat['accountId'] = user.accountId
    stat['gameCount'] = matchResults.shape[0]
    winCount = matchResults[matchResults['win'] == True].shape[0]
    lossCount = matchResults.shape[0] - winCount
    stat['win'] = getRatio(winCount, lossCount)
    stat['loss'] = getRatio(lossCount, winCount)
    stat['missing'] = matchResults[matchResults['you'] == False].shape[0]
    stat[list(FEATURES)] = matchResults.sum()[list(FEATURES)] / (stat['gameCount'] - stat['missing'])
    stats.append(stat)

    stats = pd.DataFrame(stats)
    
    data = Datas()
    data.summonerName = summonerName
    data.metadata = stats.to_dict(orient='records')
    data.save()

    user.createDatas = True
    user.save(force_update=True)

def search(request, summonerName):
    global CHECK, crollingpossible
    summonerName = summonerName.lower()
    
    # redundancy check and sequence check
    check(summonerName)
    if CHECK == 1:
        CHECK = 0
        return HttpResponse("re_search")


    # Crolling the User's Tier
    crollTier(summonerName)
    if crollingpossible == 1:
        crollingpossible = 0
        return JsonResponse({'result':'Fail'}) 


    # Getting Matchlist of User
    getMatchlist(summonerName)

    # Getting Matches from Matchlist above
    fail = getMatches(summonerName)

    # Creating a datas with the matches
    try:
        if len(fail) == 0:
            data = Datas.objects.get(summonerName=summonerName)
            data.delete()
            print('기존 결과값이 삭제되었습니다')
            createDatas(summonerName)
        else:
            timer = 1
            len_before = len(fail)
            while fail:
                print(fail, timer)
                fail = getMatches_again(summonerName, fail, timer)
                if len_before == len(fail):
                    timer += 0.1
                    if int(timer*10) == 27:
                        timer = 2.6
                else:
                    timer = 0.1
                len_before = len(fail)

            data = Datas.objects.get(summonerName=summonerName)
            data.delete()
            print('기존 결과값이 삭제되었습니다')
            createDatas(summonerName)
    except:
        createDatas(summonerName)


    # Organizing the result of <summonerName>/search 
    user = Summoner.objects.get(wait = 0)
    result = {
        'summonerName': user.summonerName,
        'crolling': user.crolling,
        'getMatchlist': user.getMatchlist,
        'getMatches': user.getMatches[1:-1],
        'createDatas': user.createDatas,
        'wins': user.wins,
        'losses': user.losses,
        'lp': user.lp,
        'wait': user.wait,
    }
    
    user.wait = -1
    user.save(force_update=True)

    matches = Matches.objects.all()
    matches.delete()
    
    return JsonResponse(result)
