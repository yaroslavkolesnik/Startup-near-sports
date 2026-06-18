from rest_framework import viewsets, status, filters, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import permissions
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied
from .models import Match, Message
from .serializers import MatchSerializer, MatchCreateSerializer, MessageSerializer
from .utils import send_expo_push_notification

class IsOrganizerOrReadOnly(permissions.BasePermission):
    """
    Разрешает редактирование объекта только его организатору.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.organizer == request.user

class IsMessageSender(permissions.BasePermission):
    """
    Разрешает удалять и редактировать сообщение только его отправителю.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.sender == request.user

class MatchViewSet(viewsets.ModelViewSet):
    queryset = Match.objects.all()
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'pitch__address', 'description']

    def get_queryset(self):
        queryset = Match.objects.all().order_by('-created_at')
        
        pitch_id = self.request.query_params.get('pitch_id')
        if pitch_id:
            queryset = queryset.filter(pitch_id=pitch_id)
            
        sport_type = self.request.query_params.get('sport_type')
        if sport_type:
            queryset = queryset.filter(sport_type=sport_type)
            
        is_paid = self.request.query_params.get('is_paid')
        if is_paid is not None:
            is_paid_bool = is_paid.lower() == 'true'
            queryset = queryset.filter(pitch__is_paid=is_paid_bool)
            
        return queryset

    def paginate_queryset(self, queryset):
        if self.request.query_params.get('no_page') == 'true':
            return None
        return super().paginate_queryset(queryset)

    def get_permissions(self):
        if self.action in ['join', 'leave', 'my_matches']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOrganizerOrReadOnly()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def get_serializer_class(self):
        if self.action == 'create':
            return MatchCreateSerializer
        return MatchSerializer

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({"data": response.data})

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        return Response({"data": response.data})

    def perform_create(self, serializer):
        # При сохранении автоматически назначаем организатором текущего пользователя
        match = serializer.save(organizer=self.request.user)
        # Сразу добавляем его в список участников
        match.participants.add(self.request.user)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        match = self.get_object()
        user = request.user
        
        if not user.is_authenticated:
            return Response({"error": "Необходима авторизация"}, status=status.HTTP_401_UNAUTHORIZED)

        # 1. Check if already joined (duplicate)
        if user in match.participants.all():
            return Response({"message": "Вы уже участвуете"}, status=status.HTTP_200_OK)

        # 2. Enforce logic limit
        if match.participants.count() >= match.max_players:
            if match.status != 'FULL':
                match.status = 'FULL'
                match.save(update_fields=['status'])
            return Response({"error": "Матч заполнен"}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Add to match
        match.participants.add(user)
        
        # --- Send Push Notification to Creator ---
        creator = match.organizer
        if creator and getattr(creator, 'expo_push_token', None) and creator != user:
            send_expo_push_notification(
                creator.expo_push_token,
                "Новый игрок! ⚽️",
                f"{user.username} присоединился к вашей игре '{match.title or match.sport_type}'!"
            )
        
        # 4. Check if we just reached the limit
        if match.participants.count() >= match.max_players:
            match.status = 'FULL'
            match.save(update_fields=['status'])

        return Response({"message": "Вы успешно присоединились"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        match = self.get_object()
        user = request.user
        
        if not user.is_authenticated:
            return Response({"error": "Необходима авторизация"}, status=status.HTTP_401_UNAUTHORIZED)

        # 1. Check if user is actually a participant
        if user not in match.participants.all():
            return Response({"error": "Вы не участвуете в этом матче"}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Remove user from match
        match.participants.remove(user)
        
        # 3. Limit Enforcement: Update status to OPEN if it was FULL
        if match.participants.count() < match.max_players and match.status == 'FULL':
            match.status = 'OPEN'
            match.save(update_fields=['status'])

        return Response({"message": "Вы покинули игру"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='rematch')
    def rematch(self, request, pk=None):
        original_match = self.get_object()
        user = request.user
        
        if user not in original_match.participants.all() and user != original_match.organizer:
            return Response({"error": "Только участники матча могут инициировать повтор."}, status=status.HTTP_403_FORBIDDEN)
            
        target_start_time = request.data.get('target_start_time')
        if not target_start_time:
            return Response({"error": "Необходимо указать target_start_time."}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.utils.dateparse import parse_datetime
        from datetime import timedelta
        
        target_dt = parse_datetime(target_start_time)
        if not target_dt:
            return Response({"error": "Неверный формат времени."}, status=status.HTTP_400_BAD_REQUEST)
            
        new_end_time = target_dt + timedelta(minutes=original_match.duration_minutes)
        
        active_matches = Match.objects.filter(
            pitch=original_match.pitch,
            start_time__date=target_dt.date()
        ).exclude(status='CANCELLED')
        
        overlapping_count = 0
        for existing_match in active_matches:
            existing_start_time = existing_match.start_time
            existing_end_time = existing_start_time + timedelta(minutes=existing_match.duration_minutes)
            
            if existing_start_time < new_end_time and existing_end_time > target_dt:
                overlapping_count += 1
                
        if overlapping_count >= original_match.pitch.fields_count:
            return Response(
                {"error": "К сожалению, на это время площадка уже полностью забронирована."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        new_match_data = {
            'title': original_match.title,
            'description': original_match.description,
            'pitch': original_match.pitch.id,
            'sport_type': original_match.sport_type,
            'level': original_match.level,
            'max_players': original_match.max_players,
            'duration_minutes': original_match.duration_minutes,
            'start_time': target_start_time,
        }
        
        serializer = MatchCreateSerializer(data=new_match_data, context={'request': request})
        if serializer.is_valid():
            new_match = serializer.save(organizer=user)
            new_match.participants.add(user)
            
            # Format datetime safely
            try:
                from django.utils.dateparse import parse_datetime
                dt = parse_datetime(target_start_time)
                time_str = dt.strftime('%d.%m.%Y %H:%M') if dt else target_start_time
            except Exception:
                time_str = target_start_time

            Message.objects.create(
                match=original_match,
                sender=user,
                text=f"Я создал повторную игру на {time_str}! Присоединяйтесь! Матч ID: {new_match.id}"
            )
            
            return Response({
                "message": "Повторный матч успешно создан", 
                "match_id": new_match.id,
                "data": MatchSerializer(new_match, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_matches(self, request):
        queryset = self.filter_queryset(self.get_queryset().filter(
            Q(organizer=request.user) | Q(participants=request.user)
        ).distinct())
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({"data": serializer.data})

class MatchMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        match_id = self.kwargs['match_id']
        return Message.objects.filter(match_id=match_id).order_by('created_at')

    def check_match_access(self, match):
        user = self.request.user
        if user not in match.participants.all() and user != match.organizer:
            raise PermissionDenied("Только участники могут получать доступ к чату.")

    def list(self, request, *args, **kwargs):
        match_id = self.kwargs['match_id']
        match = get_object_or_404(Match, id=match_id)
        self.check_match_access(match)
        
        response = super().list(request, *args, **kwargs)
        # Wrap response in 'data' object like the rest of the APIs
        return Response({"data": response.data})

    def perform_create(self, serializer):
        match_id = self.kwargs['match_id']
        match = get_object_or_404(Match, id=match_id)
        self.check_match_access(match)
        serializer.save(match=match, sender=self.request.user)

class MatchMessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsMessageSender]
    queryset = Message.objects.all()

    def perform_update(self, serializer):
        serializer.save(is_edited=True)
