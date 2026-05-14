from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PitchViewSet

router = DefaultRouter()
router.register(r'pitches', PitchViewSet, basename='pitch')

urlpatterns = [
    path('', include(router.urls)),
]
