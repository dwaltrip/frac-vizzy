from django.contrib.auth.models import User
from rest_framework import serializers

from social.models import Snapshot, Thumbnail


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = [
            'url',
            'id',
            'username',
        ]

class ThumbnailSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Thumbnail
        fields = [
            # 'id',
            'filename',
            'is_original',
            'height',
            'width',
        ]


class SnapshotSerializer(serializers.HyperlinkedModelSerializer):
    thumbnails = ThumbnailSerializer(many=True, read_only=True)

    class Meta:
        model = Snapshot
        fields = [
            'id',
            'url',
            'created_at',
            'description',
            'link',
            'region_info',
            'thumbnails',
        ]
