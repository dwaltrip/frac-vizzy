from django.db import models


class SnapshotLike(models.Model):
    user = models.ForeignKey('social.User', on_delete=models.PROTECT)
    snapshot = models.ForeignKey('social.Snapshot', on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    # TODO: unique constraint on (snapshot, user)?
    class Meta:
        db_table = 'snapshot_likes'
