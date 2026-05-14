from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import UserModel

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Sports Info', {'fields': ('avatar', 'sport_skills', 'preferred_sports')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Sports Info', {
            'classes': ('wide',),
            'fields': ('avatar', 'sport_skills', 'preferred_sports'),
        }),
    )
    list_display = ['username', 'email', 'sport_skills', 'preferred_sports', 'is_staff']

admin.site.register(UserModel, CustomUserAdmin)
