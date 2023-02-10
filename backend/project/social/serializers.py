from dj_rest_auth.serializers import UserDetailsSerializer
from rest_framework import serializers

from social.models import Snapshot, Thumbnail, User

# remove 'pk' as we use 'id'
user_fields = tuple([
    field for field in UserDetailsSerializer.Meta.fields
    if field != 'pk'
])
class UserSerializer(UserDetailsSerializer, serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'url',
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
    author = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Snapshot
        fields = [
            'id',
            'url',
            'created_at',
            'description',
            'link',
            'region_info',
            'author',
            'thumbnails',
        ]


class SnapshotWithAuthorSerializer(SnapshotSerializer):

    def to_representation(self, instance):
        data = super().to_representation(instance)

        # TODO: This check is here because I copied it from a stackoverflow thing
        # Not sure if it is actually what I want...
        request = self.context.get('request')
        if request.method == 'GET':
            context = { 'request': request }
            author_data = UserSerializer(instance.author, context=context).data
            return {
                "data": data,
                "sideload": { "users": [author_data] }
            }
        return data
