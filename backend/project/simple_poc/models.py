from django.db import models

class Foo(models.Model):
    title = models.CharField(max_length=100, blank=True, default='')
