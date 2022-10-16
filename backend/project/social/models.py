from django.db import models


THUMBNAIL_SIZES = [
    (100, 100),
    (320, 180),
    (960, 540),
]

# TODO: Rename this... Snapshot / Image are too similar.
# It's confusing if "snapshots" have "images" and "thumbnails"
# Something like "region", "area", or "bookmark" may be better
class Snapshot(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True, default='')
    link = models.TextField()
    region_info = models.JSONField()

    class Meta:
        db_table = 'snapshots'


class Thumbnail(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    snapshot = models.ForeignKey(
        'social.Snapshot',
        related_name='thumbnails',
        on_delete=models.PROTECT,
    )
    filename = models.TextField()
    is_original = models.BooleanField()
    height = models.IntegerField()
    width = models.IntegerField()

    class Meta:
        db_table = 'thumbnails'
