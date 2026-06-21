from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, UserProfileView, FeedbackCreateView, PasswordChangeView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('change-password/', PasswordChangeView.as_view(), name='change-password'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('users/feedback/', FeedbackCreateView.as_view(), name='feedback-create'),
    path('', include(router.urls)),
]
