from django.db import models
from django.conf import settings
from pitches.models import Pitch

class Match(models.Model):
    SPORT_CHOICES = [
        ('FOOTBALL', 'Футбол'),
        ('BASKETBALL', 'Баскетбол'),
        ('PING_PONG', 'Пинг-понг'),
        ('VOLLEYBALL', 'Волейбол'),
        ('TENNIS', 'Большой теннис'),
        ('WORKOUT', 'Воркаут / Турники'),
        ('RUNNING', 'Бег'),
        ('CYCLING', 'Велоспорт'),
        ('YOGA', 'Йога'),
        ('PADEL', 'Падел-теннис'),
        ('CHESS', 'Шахматы'),
        ('CHECKERS', 'Шашки'),
        ('BOXING', 'Бокс / Единоборства'),
        ('SWIMMING', 'Плавание'),
        ('GYM', 'Тренажерный зал / Фитнес'),
    ]

    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('FULL', 'Full'),
        ('CANCELLED', 'Cancelled'),
        ('FINISHED', 'Finished'),
    ]

    LEVEL_CHOICES = [
        ('ANY', 'Любой'),
        ('BEGINNER', 'Новичок'),
        ('AMATEUR', 'Любитель'),
        ('PRO', 'Профи'),
    ]

    title = models.CharField(max_length=255)
    pitch = models.ForeignKey(Pitch, on_delete=models.CASCADE, related_name='matches')
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organized_matches'
    )
    sport_type = models.CharField(max_length=50, choices=SPORT_CHOICES)
    max_players = models.PositiveIntegerField()
    start_time = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField()
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='joined_matches', 
        blank=True
    )
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='ANY')
    external_chat_link = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
