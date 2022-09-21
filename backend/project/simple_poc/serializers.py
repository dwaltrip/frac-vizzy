from rest_framework import serializers
from simple_poc.models import Foo


class FooSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = Foo
        fields = ['url', 'title']
