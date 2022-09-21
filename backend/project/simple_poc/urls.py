from django.urls import include, path
from rest_framework.routers import DefaultRouter

from simple_poc.views import FooViewSet


router = DefaultRouter()
# The tutorial passed a `basename=` kwarg for these `register` calls,
#   but it seemed to break everything for me.
router.register(r'foos', FooViewSet)


urlpatterns = [
    path('', include(router.urls)),
]
