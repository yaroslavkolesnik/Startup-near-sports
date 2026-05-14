from django.contrib.auth.models import AbstractUser
from django.db import models

class UserModel(AbstractUser):
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    sport_skills = models.JSONField(default=dict, blank=True)
    preferred_sports = models.CharField(max_length=255, blank=True)
    expo_push_token = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username
