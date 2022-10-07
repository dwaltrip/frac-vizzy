from rest_framework import viewsets

from social.models import Snapshot
from social.serializers import SnapshotSerializer

from social.actions.snapshot_images import save_snapshot_image_to_filesystem

class SnapshotViewSet(viewsets.ModelViewSet):
    queryset = Snapshot.objects.all()
    serializer_class = SnapshotSerializer

    def perform_create(self, serializer):
        snapshot = serializer.save()
        thumbnail_filename = save_snapshot_image_to_filesystem(
            snapshot, 
            self.request.data.get('image_data'),
        )
        snapshot = serializer.save(
            thumbnail_filename=thumbnail_filename,
        )
