from django.contrib import admin
from .models import Pitch

@admin.register(Pitch)
class PitchAdmin(admin.ModelAdmin):
    list_display = ('title', 'sport_type', 'is_verified', 'created_at', 'created_by')
    list_filter = ('sport_type', 'is_verified', 'surface_type')
    search_fields = ('title', 'address', 'description')
