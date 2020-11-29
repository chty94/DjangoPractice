from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
import numpy as np
import pandas as pd
import pickle

from pymongo import MongoClient
import joblib
import os
from demoapp.models import Datas, Summoner

def substract_list(a, b):
    return [item for item in a if item not in b]
def get_column_names_over(myDatas, hurdles):
    names = []
    for name, hurdle in hurdles.items():
        if myDatas[name].iloc[0] > hurdle:
            names.append(name)
    
    return names
def create_final_note(weights):
    finalNote = ""
    finalNote += "As a final note, {} and {} are deciding factors in your rank. ".format(weights[1][0], weights[2][0])
    finalNote += "So be sure to work on them as much as you can. "
    return finalNote
def create_body(prediction, myDatas, datas, weights):
    body = ""

    if prediction >= 0.5:
        body += "Alright, let's talk about what you did well. "
    else:
        body += "Even though the results is disappointing, there are still things you did well. "

    columnsToDrop = ['promotion'] + [w[0] for w in weights[8:]]
    print(columnsToDrop)
    promotedGroup = datas[datas['promotion'] == True].drop(columnsToDrop, axis=1)
    demotedGroup = datas[datas['promotion'] == False].drop(columnsToDrop, axis=1)

    goodColsNames = None
    veryGoodColsNames = None
    if prediction >= 0.5:
        goodColsNames = get_column_names_over(myDatas, promotedGroup.quantile(0.5))
        veryGoodColsNames = get_column_names_over(myDatas, promotedGroup.quantile(0.75))
        goodColsNames = substract_list(goodColsNames, veryGoodColsNames)
    else:
        goodColsNames = get_column_names_over(myDatas, demotedGroup.quantile(0.5))
        veryGoodColsNames = get_column_names_over(myDatas, promotedGroup.quantile(0.5))
        goodColsNames = substract_list(goodColsNames, veryGoodColsNames)

    body += "You did good for your group on {}. ".format(', '.join(goodColsNames)) if len(goodColsNames) > 0 else ""
    body += "And You did even better on {}. ".format(', '.join(veryGoodColsNames)) if len(veryGoodColsNames) > 0 else ""

    if prediction < 0.5 and len(veryGoodColsNames) > 0:
        body += "Which you did better than the average of the promoted group. "

    body += "Rest of it, as you may have already guessed, are things you should be now working on " + "before you move on to the next rank. " if prediction >= 0 else " to get your self out of demotion. "

    return body
def create_summary(prediction, myDatas, datas, model, cols):
    weights = sorted(list(zip(cols, model.coef_)), key=lambda x: -abs(x[1]))
    for col, w in weights:
        if w < 0:
            myDatas[col] *= -1
            datas[col] *= -1

    intro = ""

    if prediction >= 0.5:
        intro += "Congratulations! According to our analysis you are projected to be promoted! "
    else:
        intro += "Unfortunately, unless you improve your game you are in danger of getting demoted! "

    if myDatas['gameCount'].iloc[0] < datas['gameCount'].mean():
        intro += "But bear in mind that it is still too early for us to judge your performance since you have only played {} games. ".format(myDatas['gameCount'].iloc[0])
    else:
        if 0.5 <= prediction < 0.6:
            intro += "However, it is still early to feel confident yet. "
        elif 0.4 <= prediction < 0.5:
            intro += "However, the good news is you are not far behind. "
    
    return intro + create_body(prediction, myDatas, datas, weights) + create_final_note(weights)

# Create your views here.
def result(request, summonerName):
    summonerName = summonerName.lower()
    data = Datas.objects.get(summonerName=summonerName)
    user = Summoner.objects.get(summonerName=summonerName)
    Tier = user.tier # type(Tier) : class 'int'

    if Tier == 27:
        tier = 26
    elif Tier <= 5:
        tier = 6

    client = MongoClient('localhost', 27017, username='Riot', password='Riot')
    model_ = client['userINFO']
    
    # model_df = pd.DataFrame(model_['16_500_datas'].find())
    model_df = pd.DataFrame(model_['{}_500_datas'.format(Tier)].find())

    testDf = pd.DataFrame(data.metadata)

    # load the model from disk
    filename = '{}_500_model.sav'.format(Tier)
    loaded_model = joblib.load(os.getcwd() + "/result/Regression/" + filename)
    x_cols = testDf.drop(['accountId', 'goldEarned', 'champLevel', 'loss'], axis=1).columns.tolist()
    x_test = testDf[x_cols]
    y_predict = loaded_model.predict(x_test)

    promotion = True
    if y_predict >= 0.5: promotion = True
    else: promotion = False

    _average = model_df.groupby(['promotion'], as_index=False).mean()
    _standard = model_df.groupby(['promotion'], as_index=False).std()

    average = _average.groupby('promotion').get_group(promotion).to_dict()
    standard = _standard.groupby('promotion').get_group(promotion).to_dict()

    for key, value in average.items():
        average[key] = list(value.values())[0]

    for key, value in standard.items():
        standard[key] = list(value.values())[0]

    # Making 
    trainDf = pd.DataFrame(model_['{}_500_datas'.format(Tier)].find({}))
    testDf = pd.DataFrame(data.metadata)

    trainDf = trainDf.drop(['accountId', 'goldEarned', 'champLevel', 'loss'], axis=1)
    testDf = testDf.drop(['accountId', 'goldEarned', 'champLevel', 'loss'], axis=1)
    cols = testDf.columns.tolist()

    model = pickle.load(open(os.getcwd() + "/result/Regression/" + filename, 'rb'))
    prediction = model.predict(testDf)[0]

    k = create_summary(prediction, testDf, trainDf, model, cols)
    print(k)

    info = {
        'user_promotion': y_predict[0],
        'user_info': data.metadata,
        'public_average': average,
        'public_standard': standard, 
        'summary': k,
    }
    return JsonResponse(info)