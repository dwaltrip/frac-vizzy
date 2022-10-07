from django.db import models

class Snapshot(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True, default='')
    link = models.TextField()
    region_info = models.JSONField()
    thumbnail_filename = models.TextField()

    class Meta:
        db_table = 'snapshots'
