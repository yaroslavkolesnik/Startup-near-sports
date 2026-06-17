from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MatchViewSet, MatchMessageListCreateView, MatchMessageDetailView

router = DefaultRouter()
router.register(r'matches', MatchViewSet, basename='match')

urlpatterns = [
    path('', include(router.urls)),
    path('matches/<int:match_id>/messages/', MatchMessageListCreateView.as_view(), name='match-messages'),
    path('matches/<int:match_id>/messages/<int:pk>/', MatchMessageDetailView.as_view(), name='match-message-detail'),
]
