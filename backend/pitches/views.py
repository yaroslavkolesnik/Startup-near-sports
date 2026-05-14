from rest_framework import viewsets, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from .models import Pitch
from .serializers import PitchSerializer
from .permissions import IsCreatorOrReadOnly

class PitchViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly, IsCreatorOrReadOnly]
    queryset = Pitch.objects.all()
    serializer_class = PitchSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'address']

    def get_queryset(self):
        queryset = super().get_queryset()
        sport_type = self.request.query_params.get('sport_type')
        if sport_type:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(sport_type=sport_type) | 
                Q(sport_type='MULTI') | 
                Q(matches__sport_type=sport_type)
            ).distinct()
            
        surface = self.request.query_params.get('surface_type')
        if surface:
            queryset = queryset.filter(surface_type=surface)
            
        is_paid = self.request.query_params.get('is_paid')
        if is_paid is not None:
            is_paid_bool = is_paid.lower() == 'true'
            queryset = queryset.filter(is_paid=is_paid_bool)
            
        return queryset

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        pitch = serializer.save(created_by=user)
        self.handle_photos(pitch)

    def perform_update(self, serializer):
        pitch = serializer.save()
        self.handle_photos(pitch)

    def handle_photos(self, pitch):
        files = self.request.FILES.getlist('photos')
        if not files:
            files = self.request.FILES.getlist('photo')
            
        if files:
            from django.core.files.storage import default_storage
            from django.utils.crypto import get_random_string
            
            photos_list = pitch.photos if isinstance(pitch.photos, list) else []
            
            for f in files:
                ext = f.name.split('.')[-1]
                filename = f"pitches/photos/{get_random_string(16)}.{ext}"
                path = default_storage.save(filename, f)
                photos_list.append(path)
            
            # Ограничение MVP: не более 5 фотографий
            pitch.photos = photos_list[-5:]
            pitch.save(update_fields=['photos'])

    @action(detail=False, methods=['get'])
    def my(self, request):
        pitches = self.filter_queryset(self.get_queryset().filter(created_by=request.user))
        serializer = self.get_serializer(pitches, many=True)
        return Response({"data": serializer.data})

    def list(self, request, *args, **kwargs):
        # Enforcing standard pattern from rules: wrap list responses inside a 'data' envelope
        response = super().list(request, *args, **kwargs)
        return Response({"data": response.data})

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        return Response({"data": response.data})
