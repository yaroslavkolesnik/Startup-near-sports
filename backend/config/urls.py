from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from users.views import RegisterView
from django.http import HttpResponse

def landing_page(request):
    html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NearSports API</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding-top: 10%; background-color: #f4f4f9; color: #333; }
            h1 { color: #2c3e50; font-size: 3em; margin-bottom: 10px; }
            p { font-size: 1.2em; color: #7f8c8d; }
            .badge { display: inline-block; padding: 5px 15px; background-color: #27ae60; color: white; border-radius: 20px; font-weight: bold; margin-top: 20px; }
        </style>
    </head>
    <body>
        <h1>NearSports API</h1>
        <p>The backend infrastructure for the upcoming mobile application.</p>
        <div class="badge">System Status: Online / Private Testing</div>
    </body>
    </html>
    """
    return HttpResponse(html)

urlpatterns = [
    path('', landing_page),
    path('secure-admin-panel/', admin.site.urls),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('users.urls')),
    path('api/', include('pitches.urls')),
    path('api/', include('matches.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
