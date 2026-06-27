from rest_framework import viewsets, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import random
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from .models import UserModel, Feedback
from .serializers import (
    UserSerializer, UserRegistrationSerializer, UserProfileUpdateSerializer, 
    FeedbackSerializer, PasswordChangeSerializer, PasswordResetRequestSerializer, 
    PasswordResetConfirmSerializer
)
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
#from rest_framework.permissions import IsAdminUser

class UserViewSet(viewsets.ModelViewSet):
    queryset = UserModel.objects.all()
    serializer_class = UserSerializer
    #permission_classes = [IsAdminUser]

    def list(self, request, *args, **kwargs):
        # Enforcing standard pattern from rules: Successful responses must wrap data in a {"data": ...} object.
        response = super().list(request, *args, **kwargs)
        return Response({"data": response.data})

class RegisterView(generics.CreateAPIView):
    queryset = UserModel.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response({"data": serializer.data}, status=201, headers=headers)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({"data": serializer.data})

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": UserSerializer(request.user).data})

class PasswordChangeView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PasswordChangeSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({"data": {"message": "Пароль успішно змінено"}}, status=200)

class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetRequestSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        
        try:
            user = UserModel.objects.get(email=email)
            pin = str(random.randint(100000, 999999))
            user.reset_pin = pin
            user.reset_pin_expires = timezone.now() + timedelta(minutes=15)
            user.save()
            
            send_mail(
                subject='Відновлення пароля',
                message=f'Ваш 6-значний код для відновлення пароля: {pin}\nКод дійсний 15 хвилин.',
                from_email=None,
                recipient_list=[user.email],
            )
            return Response({"data": {"message": "Код відправлено на ваш email"}}, status=200)
            
        except UserModel.DoesNotExist:
            return Response({"data": {"message": "Якщо email існує, код відправлено"}}, status=200)

class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        pin_code = serializer.validated_data['pin_code']
        new_password = serializer.validated_data['new_password']
        
        try:
            user = UserModel.objects.get(email=email)
        except UserModel.DoesNotExist:
            return Response({"error": "Користувача з таким email не знайдено"}, status=404)
            
        if user.reset_pin != pin_code:
            return Response({"error": "Невірний код"}, status=400)
            
        if not user.reset_pin_expires or timezone.now() > user.reset_pin_expires:
            return Response({"error": "Код прострочено. Запросіть новий код."}, status=400)
            
        user.set_password(new_password)
        user.reset_pin = None
        user.reset_pin_expires = None
        user.save()
        
        return Response({"data": {"message": "Пароль успішно змінено"}}, status=200)

class FeedbackCreateView(generics.CreateAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)
