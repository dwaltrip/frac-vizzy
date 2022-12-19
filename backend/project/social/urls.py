from django.urls import include, path
from rest_framework.routers import DefaultRouter

from social.views import SnapshotViewSet, UserViewSet
from social.zzz_test_auth_views import test_view_1, test_view_2


router = DefaultRouter()
router.register(r'snapshots', SnapshotViewSet)
router.register(r'users', UserViewSet)


urlpatterns = [
    path('', include(router.urls)),
    path('test_1/', test_view_1),
    path('test_2/', test_view_2),
]
