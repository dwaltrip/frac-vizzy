from rest_framework import serializers
from social.models import Snapshot


class SnapshotSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = Snapshot
        fields = [
            'url',
            'created_at',
            'description',
            'link',
            'region_info',
        ]
