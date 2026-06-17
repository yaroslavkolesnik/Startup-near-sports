from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Match, Message
from datetime import timedelta
import bleach

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

    def validate_description(self, value):
        if value:
            return bleach.clean(value)
        return value

    def validate(self, attrs):
        pitch = attrs.get('pitch')
        if not pitch and self.instance:
            pitch = self.instance.pitch
            
        if pitch and not pitch.is_active:
            raise serializers.ValidationError({
                "non_field_errors": "Cannot create a match on a closed pitch."
            })
            
        sport_type = attrs.get('sport_type')
        if sport_type and pitch:
            if pitch.sport_type != 'MULTI' and pitch.sport_type != sport_type:
                raise serializers.ValidationError({
                    "sport_type": f"На этой площадке можно создать игру только по виду спорта: {pitch.get_sport_type_display()}."
                })

        start_time = attrs.get('start_time')
        if not start_time and self.instance:
            start_time = self.instance.start_time
            
        duration_minutes = attrs.get('duration_minutes')
        if not duration_minutes and self.instance:
            duration_minutes = self.instance.duration_minutes
            
        if start_time and duration_minutes and pitch:
            new_end_time = start_time + timedelta(minutes=duration_minutes)
            
            active_matches = Match.objects.filter(
                pitch=pitch,
                status__in=['OPEN', 'FULL'],
                start_time__date=start_time.date()
            )
            if self.instance:
                active_matches = active_matches.exclude(id=self.instance.id)
                
            overlapping_count = 0
            for existing_match in active_matches:
                existing_start_time = existing_match.start_time
                existing_end_time = existing_start_time + timedelta(minutes=existing_match.duration_minutes)
                
                if existing_start_time < new_end_time and existing_end_time > start_time:
                    overlapping_count += 1
                    
            if overlapping_count >= pitch.fields_count:
                raise serializers.ValidationError({
                    "non_field_errors": "К сожалению, все поля на этой площадке заняты на выбранное время."
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

    def validate_description(self, value):
        if value:
            return bleach.clean(value)
        return value

    def validate(self, attrs):
        pitch = attrs.get('pitch')
        if not pitch and self.instance:
            pitch = self.instance.pitch

        if pitch and not pitch.is_active:
            raise serializers.ValidationError({
                "non_field_errors": "Cannot create a match on a closed pitch."
            })

        sport_type = attrs.get('sport_type')
        if sport_type and pitch:
            if pitch.sport_type != 'MULTI' and pitch.sport_type != sport_type:
                raise serializers.ValidationError({
                    "sport_type": f"На этой площадке можно создать игру только по виду спорта: {pitch.get_sport_type_display()}."
                })

        start_time = attrs.get('start_time')
        if not start_time and self.instance:
            start_time = self.instance.start_time
            
        duration_minutes = attrs.get('duration_minutes')
        if not duration_minutes and self.instance:
            duration_minutes = self.instance.duration_minutes
            
        if start_time and duration_minutes and pitch:
            new_end_time = start_time + timedelta(minutes=duration_minutes)
            
            active_matches = Match.objects.filter(
                pitch=pitch,
                status__in=['OPEN', 'FULL'],
                start_time__date=start_time.date()
            )
            if self.instance:
                active_matches = active_matches.exclude(id=self.instance.id)
                
            overlapping_count = 0
            for existing_match in active_matches:
                existing_start_time = existing_match.start_time
                existing_end_time = existing_start_time + timedelta(minutes=existing_match.duration_minutes)
                
                if existing_start_time < new_end_time and existing_end_time > start_time:
                    overlapping_count += 1
                    
            if overlapping_count >= pitch.fields_count:
                raise serializers.ValidationError({
                    "non_field_errors": "К сожалению, все поля на этой площадке заняты на выбранное время."
                })

        return attrs

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = serializers.ImageField(source='sender.avatar', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'text', 'sender_name', 'sender_avatar', 'is_edited', 'updated_at', 'reply_to', 'created_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_edited']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.reply_to:
            representation['reply_to'] = {
                'id': instance.reply_to.id,
                'text': instance.reply_to.text,
                'sender_name': instance.reply_to.sender.username
            }
        return representation

    def validate_text(self, value):
        if value:
            return bleach.clean(value)
        return value
