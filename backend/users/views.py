from rest_framework import viewsets, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import UserModel
from .serializers import UserSerializer, UserRegistrationSerializer, UserProfileUpdateSerializer
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
