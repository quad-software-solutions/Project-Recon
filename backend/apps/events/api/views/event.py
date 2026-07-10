from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.events.api.permissions import IsEventStaff
from apps.events.api.serializers import EventSerializer, EventAdminSerializer
from apps.events.services.event_service import (
    list_events,
    create_event,
    update_event,
    delete_event,
    get_event_or_404,
    publish_event,
    unpublish_event,
    activate_event,
    deactivate_event,
)
from apps.events.services.queries import (
    PublicEventsQuery,
    LiveEventsQuery,
    UpcomingEventsQuery,
    PastEventsQuery,
)


class PublicEventListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = EventSerializer

    @extend_schema(tags=["Events - Public"])
    def get_queryset(self):
        return PublicEventsQuery.execute()


class PublicEventDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = EventSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Events - Public"])
    def get_object(self):
        return get_event_or_404(self.kwargs["pk"])


class LiveEventListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = EventSerializer

    @extend_schema(tags=["Events - Public"])
    def get_queryset(self):
        return LiveEventsQuery.execute()


class UpcomingEventListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = EventSerializer

    @extend_schema(tags=["Events - Public"])
    def get_queryset(self):
        return UpcomingEventsQuery.execute()


class PastEventListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = EventSerializer

    @extend_schema(tags=["Events - Public"])
    def get_queryset(self):
        return PastEventsQuery.execute()


class AdminEventListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = EventAdminSerializer

    @extend_schema(tags=["Events - Admin"])
    def get_queryset(self):
        return list_events()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = create_event(serializer.validated_data, actor=request.user)
        return Response(
            EventAdminSerializer(event).data,
            status=status.HTTP_201_CREATED,
        )


class AdminEventRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = EventAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Events - Admin"])
    def get_object(self):
        return get_event_or_404(self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        event = self.get_object()
        serializer = self.get_serializer(event, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        event = update_event(event, serializer.validated_data, actor=request.user)
        return Response(EventAdminSerializer(event).data)

    def destroy(self, request, *args, **kwargs):
        event = self.get_object()
        delete_event(event, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminEventPublishView(generics.GenericAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = EventAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Events - Admin"])
    def post(self, request, *args, **kwargs):
        event = get_event_or_404(self.kwargs["pk"])
        event = publish_event(event, actor=request.user)
        return Response(EventAdminSerializer(event).data)


class AdminEventUnpublishView(generics.GenericAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = EventAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Events - Admin"])
    def post(self, request, *args, **kwargs):
        event = get_event_or_404(self.kwargs["pk"])
        event = unpublish_event(event, actor=request.user)
        return Response(EventAdminSerializer(event).data)


class AdminEventActivateView(generics.GenericAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = EventAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Events - Admin"])
    def post(self, request, *args, **kwargs):
        event = get_event_or_404(self.kwargs["pk"])
        event = activate_event(event, actor=request.user)
        return Response(EventAdminSerializer(event).data)


class AdminEventDeactivateView(generics.GenericAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = EventAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Events - Admin"])
    def post(self, request, *args, **kwargs):
        event = get_event_or_404(self.kwargs["pk"])
        event = deactivate_event(event, actor=request.user)
        return Response(EventAdminSerializer(event).data)
