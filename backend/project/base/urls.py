from django.urls import include, path

urlpatterns = [
    path('', include('social.urls')),
    # path('', include('simple_poc.urls')),
    path('api-auth/', include('rest_framework.urls')),
]
