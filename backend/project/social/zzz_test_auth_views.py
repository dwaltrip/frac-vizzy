from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# ---------------------------------
# No auth required
# ---------------------------------
@api_view()
def test_view_1(request):
    return Response({ 'message': 'test_view_1' })

# ---------------------------------
# Auth required!!
# Woot it works!! Test with curl:
# curl localhost:8000/test_2/ -H "Authorization: Token ad4b0c803735d23c91521ef5d58689ab888b41af" 
# It also works correctly after logging out
# curl -X POST localhost:8000/dj-rest-auth/logout/
# ---------------------------------
@api_view()
@permission_classes([IsAuthenticated])
def test_view_2(request):
    return Response({ 'message': 'test_view_2' })
