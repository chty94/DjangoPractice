from django.http import HttpResponse
from pymongo import MongoClient

# Create your views here.
def league(request, tier):
    client = MongoClient('localhost', 27017, username='Riot', password='Riot')
    model_ = client['userINFO']
    info = list(model_['{}_500_datas'.format(tier)].find())
    
    return HttpResponse(info)