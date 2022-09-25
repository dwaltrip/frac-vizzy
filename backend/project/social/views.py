from rest_framework import viewsets

from social.models import Snapshot
from social.serializers import SnapshotSerializer


class SnapshotViewSet(viewsets.ModelViewSet):
    queryset = Snapshot.objects.all()
    serializer_class = SnapshotSerializer
