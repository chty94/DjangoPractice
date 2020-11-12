from djongo import models

# Create your models here.
class Datas(models.Model): # Collection Name
    _id = models.ObjectIdField()
    summonerName = models.CharField(max_length=50)
    metadata = models.JSONField()
    objects = models.DjongoManager()