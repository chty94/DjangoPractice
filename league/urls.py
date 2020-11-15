from django.urls import path
from . import views

urlpatterns = [
    path('<tier>', views.league, name='index')
]