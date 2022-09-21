from rest_framework import viewsets

from simple_poc.models import Foo
from simple_poc.serializers import FooSerializer


class FooViewSet(viewsets.ModelViewSet):
    queryset = Foo.objects.all()
    serializer_class = FooSerializer
