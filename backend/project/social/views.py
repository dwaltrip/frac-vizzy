from rest_framework import filters, viewsets
from rest_framework.response import Response

from social.models import Snapshot, User
from social.serializers import (
    SnapshotSerializer,
    SnapshotWithAuthorSerializer,
    UserSerializer,
)

from social.actions.snapshot_images import create_images_for_snapshot


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class SnapshotViewSet(viewsets.ModelViewSet):
    queryset = Snapshot.objects.all()
    serializer_class = SnapshotWithAuthorSerializer

    # TODO: Think about better patterns, once I've done more of this.
    eager_loading = {
        'select_related': ['author'],
        'prefetch_related': ['thumbnails'],
    }

    def handle_eager_loading(self, queryset):
        for rel in self.eager_loading['select_related']:
            queryset = queryset.select_related(rel)

        for rel in self.eager_loading['prefetch_related']:
            queryset = queryset.prefetch_related(rel)

        return queryset

    def get_queryset(self):
        queryset = self.handle_eager_loading(super().get_queryset())

        author_id = self.request.query_params.get('author_id', None)
        if author_id is not None:
            queryset = queryset.filter(author_id=author_id)
        return queryset

    # Modified from mixins.ListModelMixin
    def list(self, request):
        context = { 'request': request }
        data = self.filter_queryset(self.get_queryset())

        # This is solely to de-dupe the authors for sideloading.
        authors_by_id = { item.author.id: item.author for item in data }
        authors = [
            UserSerializer(author, context=context).data
            for author in authors_by_id.values()
        ]

        serializer = SnapshotSerializer(data, many=True, context=context)
        return Response({
            'data': serializer.data,
            'sideload': { 'users': authors },
        })

    # TODO: wrap requests in a transaction so this entire operation
    # is atomic.
    def perform_create(self, serializer):
        snapshot = serializer.save()
        create_images_for_snapshot(
            snapshot,
            self.request.data.get('image_data')
        )
