from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import UserModel, Feedback

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

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'category', 'created_at', 'short_text')
    list_filter = ('category', 'created_at')
    
    def short_text(self, obj):
        from django.template.defaultfilters import truncatechars
        return truncatechars(obj.text, 50)
    short_text.short_description = 'Текст'
