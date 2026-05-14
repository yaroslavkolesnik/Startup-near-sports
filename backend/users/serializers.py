from rest_framework import serializers
from .models import UserModel

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ['id', 'username', 'email', 'avatar', 'sport_skills', 'preferred_sports', 'expo_push_token', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = UserModel
        fields = ['username', 'email', 'password', 'avatar', 'sport_skills', 'preferred_sports']

    def create(self, validated_data):
        user = UserModel.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            avatar=validated_data.get('avatar', None),
            sport_skills=validated_data.get('sport_skills', {}),
            preferred_sports=validated_data.get('preferred_sports', '')
        )
        return user

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ['username', 'avatar', 'sport_skills', 'preferred_sports', 'expo_push_token']
