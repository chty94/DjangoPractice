from django.urls import path
from . import views

urlpatterns = [
    path('<summonerName>/check', views.check, name='index')
]