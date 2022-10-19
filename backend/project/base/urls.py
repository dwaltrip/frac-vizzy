from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path

urlpatterns = [
    path('', include('social.urls')),
    path('api-auth/', include('rest_framework.urls')),

    # TODO: this is apparently not suitable for production...
    # https://docs.djangoproject.com/en/4.1/howto/static-files/#serving-uploaded-files-in-development
    # https://djangocentral.com/managing-media-files-in-django/
    *static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT),

    path('dj-rest-auth/', include('dj_rest_auth.urls')),
]
