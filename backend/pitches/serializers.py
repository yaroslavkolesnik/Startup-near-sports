from rest_framework import serializers
from django.conf import settings
from .models import Pitch
import bleach

class PitchSerializer(serializers.ModelSerializer):
    photos = serializers.SerializerMethodField()
    creator_name = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Pitch
        fields = [
            'id', 'title', 'description', 'latitude', 'longitude', 'address', 
            'sport_type', 'surface_type', 'photos', 'created_by', 'creator_name', 'is_verified', 
            'is_paid', 'price_per_hour', 'fields_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'photos']

    def get_photos(self, obj):
        request = self.context.get('request')
        photo_urls = []
        if isinstance(obj.photos, list):
            for path in obj.photos:
                if not path.startswith('http') and not path.startswith('/media/'):
                    url = f"{settings.MEDIA_URL}{path}"
                else:
                    url = path
                if not url.startswith('http') and request:
                    url = request.build_absolute_uri(url)
                photo_urls.append(url)
        return photo_urls

    def validate_description(self, value):
        if value:
            return bleach.clean(value)
        return value

    def validate(self, data):
        is_paid = data.get('is_paid')
        if is_paid is None and self.instance:
            is_paid = self.instance.is_paid
        elif is_paid is None:
            is_paid = False

        if is_paid:
            price = data.get('price_per_hour')
            if price is None and self.instance:
                price = self.instance.price_per_hour
                
            if price is None or price <= 0:
                raise serializers.ValidationError({
                    "price_per_hour": "Для платной площадки необходимо указать цену за час больше нуля."
                })
        else:
            data['price_per_hour'] = None

        return data
