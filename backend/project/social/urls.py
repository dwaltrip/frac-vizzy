from django.urls import include, path
from rest_framework.routers import DefaultRouter

from social.views import SnapshotViewSet
from social.zzz_test_auth_views import test_view_1, test_view_2



router = DefaultRouter()
router.register(r'snapshots', SnapshotViewSet)


urlpatterns = [
    path('', include(router.urls)),
    path('test_1/', test_view_1),
    path('test_2/', test_view_2),
]
