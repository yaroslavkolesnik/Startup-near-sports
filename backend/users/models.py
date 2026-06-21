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

class Feedback(models.Model):
    CATEGORY_CHOICES = [
        ('BUG', 'Ошибка'),
        ('IDEA', 'Идея'),
        ('OTHER', 'Другое'),
    ]
    user = models.ForeignKey(UserModel, on_delete=models.SET_NULL, null=True, blank=True, related_name='feedbacks')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='OTHER')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_category_display()} - {self.user.username if self.user else 'Аноним'}"
