from django.contrib import admin
from .models import Match

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ('title', 'sport_type', 'pitch', 'organizer', 'status', 'start_time')
    list_filter = ('status', 'sport_type')
    search_fields = ('title', 'description')
