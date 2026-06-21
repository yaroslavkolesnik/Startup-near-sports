from django.db import models
from django.conf import settings

class Pitch(models.Model):
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
        ('MULTI', 'Мультиспорт'),
    ]

    SURFACE_CHOICES = [
        ('NATURAL_GRASS', 'Натуральный газон'),
        ('SYNTHETIC_GRASS', 'Искусственный газон'),
        ('PARQUET', 'Паркет / Зал'),
        ('ASPHALT', 'Асфальт'),
        ('RUBBER', 'Резиновое покрытие'),
        ('SAND', 'Песок'),
    ]

    title = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    address = models.CharField(max_length=255)
    sport_type = models.CharField(max_length=50, choices=SPORT_CHOICES)
    surface_type = models.CharField(max_length=50, choices=SURFACE_CHOICES, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    photos = models.JSONField(default=list, blank=True)
    is_paid = models.BooleanField(default=False, verbose_name="Платная площадка")
    price_per_hour = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name="Цена за час")
    fields_breakdown = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_pitches'
    )
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    status_message = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
