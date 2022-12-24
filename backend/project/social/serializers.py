from dj_rest_auth.serializers import UserDetailsSerializer
from rest_framework import serializers

from social.models import Snapshot, Thumbnail, User

# remove 'pk' as we use 'id'
user_fields = tuple([
    field for field in UserDetailsSerializer.Meta.fields
    if field != 'pk'
])
class UserSerializer(UserDetailsSerializer):
    class Meta(UserDetailsSerializer.Meta):
        fields = (
            'id',
        ) + user_fields


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
