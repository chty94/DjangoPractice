from djongo import models
from django.core.validators import int_list_validator
from django.contrib.postgres.fields import JSONField
from django import forms

# Create your models here.

# for startdDate <Array>
class Start(models.Model):
    date = models.DateTimeField()
    unix = models.IntegerField()
    class Meta:
        abstract = True
class StartForm(forms.ModelForm):
    class Meta:
        model = Start
        fields = (  
            'date', 'unix'
        )

# for Matches <Array>
class Match(models.Model):
    platformId = models.CharField(max_length=5)
    gameId = models.IntegerField()
    champion = models.IntegerField()
    queue = models.IntegerField()
    season = models.IntegerField()
    timestamp = models.IntegerField()
    role = models.CharField(max_length=15)
    lane = models.CharField(max_length=15)
    class Meta:
        abstract = True
class MatchForm(forms.ModelForm):
    class Meta:
        model = Match
        fields = (
            'platformId', 'gameId', 'champion', 'queue', 'season', 'timestamp', 'role', 'lane'
        )

class Summoner(models.Model): # Collection Name
    _id = models.ObjectIdField()
    wait = models.IntegerField()
    summonerName = models.CharField(max_length=50)
    crolling = models.BooleanField(default=False)
    getMatchlist = models.BooleanField(default=False)
    getMatches = models.CharField(validators=[int_list_validator], max_length=10, null=True)
    createDatas = models.BooleanField(default=False)
    start = models.ArrayField(model_container=Start, model_form_class=StartForm, null=True)
    wins = models.CharField(null=True, max_length=4)
    losses = models.CharField(null=True, max_length=4)
    tier = models.IntegerField(null=True)
    lp = models.CharField(null=True, max_length=4)
    accountId = models.CharField(max_length=100, null=True)
    matches = models.ArrayField(model_container=Match, model_form_class=MatchForm, null=True)
    objects = models.DjongoManager()

class Matches(models.Model): # Collection Name
    _id = models.ObjectIdField()
    metadata = models.JSONField()
    objects = models.DjongoManager()

class Datas(models.Model): # Collection Name
    _id = models.ObjectIdField()
    summonerName = models.CharField(max_length=50)
    metadata = models.JSONField()
    objects = models.DjongoManager()
