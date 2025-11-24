

from django.db import models

# Create your models here.
from django.contrib.gis.db import models

class MyModel(models.Model):
    name = models.CharField(max_length=100)
    location = models.PolygonField()