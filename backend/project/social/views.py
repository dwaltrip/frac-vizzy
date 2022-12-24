from rest_framework import viewsets

from social.models import Snapshot, User
from social.serializers import SnapshotSerializer, UserSerializer

from social.actions.snapshot_images import create_images_for_snapshot


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class SnapshotViewSet(viewsets.ModelViewSet):
    queryset = Snapshot.objects.all()
    serializer_class = SnapshotSerializer

    # TODO: wrap requests in a transaction so this entire operation
    # is atomic.
    def perform_create(self, serializer):
        snapshot = serializer.save()
        create_images_for_snapshot(
            snapshot,
            self.request.data.get('image_data')
        )
