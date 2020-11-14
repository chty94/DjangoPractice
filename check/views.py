from django.shortcuts import render
from django.http import JsonResponse
from demoapp.models import Summoner

# Create your views here.

def check(request, summonerName):
    user = Summoner.objects.get(summonerName=summonerName)

    try:
        temp = user.getMatches[1:-1]
    except TypeError:
        temp = None
    
    result = {
        'summonerName': user.summonerName,
        'crolling': user.crolling,
        'getMatchlist': user.getMatchlist,
        'getMatches': temp,
        'createDatas': user.createDatas,
        'wait': user.wait,
    }
    
    return JsonResponse(result)