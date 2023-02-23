from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from social.models import Snapshot, User
from social.serializers import (
    SnapshotSerializer,
    SnapshotDetailSerializer,
    UserSerializer,
)

from social.actions.snapshot_images import create_images_for_snapshot


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class SnapshotViewSet(viewsets.ModelViewSet):
    queryset = Snapshot.objects.all()
    serializer_class = SnapshotDetailSerializer

    # TODO: Think about better patterns, once I've done more of this.
    eager_loading = {
        'select_related': ['author'],
        'prefetch_related': ['thumbnails', 'liked_by'],
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
    # NOTE: We don't use the actual `liked_by` objects in this view.
    #   But we do count them. It's not important at all any time soon,
    #   but one day we can optimize, so we don't have to prefetch `liked_by`.
    #   Maybe with some sort of `SnapshotStats` abstraction / table?
    def list(self, request):
        context = { 'request': request }
        data = self.filter_queryset(self.get_queryset())
        serializer = SnapshotSerializer(data, many=True, context=context)

        deduped_authors = set(snap.author for snap in data)
        return Response({
            'data': serializer.data,
            'sideload': {
                'users': [
                    UserSerializer(user, context=context).data
                    for user in deduped_authors
                ]
            }
        })

    # TODO: wrap requests in a transaction so this entire operation
    # is atomic.
    def perform_create(self, serializer):
        snapshot = serializer.save()
        create_images_for_snapshot(
            snapshot,
            self.request.data.get('image_data')
        )

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        snap = self.get_object()
        snap.liked_by.add(request.user)
        return Response(self.get_serializer(snap).data)

    @action(detail=True, methods=['post'])
    def unlike(self, request, pk=None):
        snap = self.get_object()
        snap.liked_by.remove(request.user)
        return Response(self.get_serializer(snap).data)
