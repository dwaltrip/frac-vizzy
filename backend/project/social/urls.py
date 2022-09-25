from django.urls import include, path
from rest_framework.routers import DefaultRouter

from social.views import SnapshotViewSet


router = DefaultRouter()
router.register(r'snapshots', SnapshotViewSet)


urlpatterns = [
    path('', include(router.urls)),
]
