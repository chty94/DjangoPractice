from django.http import HttpResponse
from django.http import JsonResponse
from pymongo import MongoClient
import json
from bson import ObjectId


# Create your views here.
def league(request, tier):
    client = MongoClient('localhost', 27017, username='Riot', password='Riot')
    model_ = client['userINFO']
    if tier == '27':
        tier = '26'
    elif int(tier) <= 5:
        tier = '6'
        
    info = model_['{}_500_datas'.format(tier)].find({}, {'_id':0})
    
    res = {}
    i = 0
    for value in info:
        res[i] = value
        i += 1
    
    return JsonResponse(res)