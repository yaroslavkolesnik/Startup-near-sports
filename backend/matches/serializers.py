from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Match

User = get_user_model()

class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'sport_skills']

class MatchSerializer(serializers.ModelSerializer):
    participants_count = serializers.SerializerMethodField()
    participants = ParticipantSerializer(many=True, read_only=True)
    pitch_surface = serializers.ReadOnlyField(source='pitch.surface_type')
    pitch_sport_type = serializers.ReadOnlyField(source='pitch.sport_type')
    pitch_latitude = serializers.ReadOnlyField(source='pitch.latitude')
    pitch_longitude = serializers.ReadOnlyField(source='pitch.longitude')
    pitch_name = serializers.ReadOnlyField(source='pitch.title')
    pitch_address = serializers.ReadOnlyField(source='pitch.address')
    pitch_is_paid = serializers.ReadOnlyField(source='pitch.is_paid')
    pitch_price_per_hour = serializers.ReadOnlyField(source='pitch.price_per_hour')

    class Meta:
        model = Match
        fields = [
            'id', 'title', 'description', 'pitch', 'pitch_name', 'pitch_address', 'pitch_surface', 'pitch_sport_type', 'pitch_latitude', 'pitch_longitude', 'pitch_is_paid', 'pitch_price_per_hour', 'organizer', 'sport_type', 'level', 'max_players',
            'start_time', 'duration_minutes', 'participants', 'participants_count',
            'external_chat_link', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organizer', 'status', 'created_at', 'updated_at', 'participants']

    def get_participants_count(self, obj):
        return obj.participants.count()

    def validate(self, attrs):
        pitch = attrs.get('pitch')
        if not pitch and self.instance:
            pitch = self.instance.pitch
            
        sport_type = attrs.get('sport_type')
        if sport_type and pitch:
            if pitch.sport_type != 'MULTI' and pitch.sport_type != sport_type:
                raise serializers.ValidationError({
                    "sport_type": f"На этой площадке можно создать игру только по виду спорта: {pitch.get_sport_type_display()}."
                })
        return attrs

class MatchCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = [
            'id', 'title', 'description', 'pitch', 'sport_type', 'level', 'max_players',
            'start_time', 'duration_minutes', 'external_chat_link', 
            'organizer', 'status'
        ]
        read_only_fields = ['id', 'organizer', 'status']

    def validate(self, attrs):
        pitch = attrs.get('pitch')
        sport_type = attrs.get('sport_type')
        if pitch and sport_type:
            if pitch.sport_type != 'MULTI' and pitch.sport_type != sport_type:
                raise serializers.ValidationError({
                    "sport_type": f"На этой площадке можно создать игру только по виду спорта: {pitch.get_sport_type_display()}."
                })
        return attrs
