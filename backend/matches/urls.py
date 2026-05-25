from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MatchViewSet, MatchMessageListCreateView

router = DefaultRouter()
router.register(r'matches', MatchViewSet, basename='match')

urlpatterns = [
    path('', include(router.urls)),
    path('matches/<int:match_id>/messages/', MatchMessageListCreateView.as_view(), name='match-messages'),
]
