from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from django_filters import rest_framework as django_filters
from rest_framework import filters

from apps.accounts.permissions.roles import (
    get_active_branch_ids,
    user_is_branch_manager,
    user_is_secretary,
)
from apps.events.api.pagination import StandardResultsSetPagination
from apps.events.api.permissions import IsEventStaff
from apps.events.api.serializers import EventSerializer, EventAdminSerializer
from apps.events.constants import EventType
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


class EventFilter(django_filters.FilterSet):
    event_type = django_filters.ChoiceFilter(choices=EventType.choices)


@extend_schema_view(
    get=extend_schema(
        tags=["Events - Public"],
        summary="List public events",
        description="Retrieve a paginated list of published, active, public events with optional filtering by event_type, search, and ordering.",
        parameters=[
            OpenApiParameter(name="event_type", description="Filter by event type", required=False, type=str),
            OpenApiParameter(name="search", description="Search in title, description, location", required=False, type=str),
            OpenApiParameter(name="ordering", description="Order by start_datetime, end_datetime, or title", required=False, type=str),
        ],
    ),
)
class PublicEventListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = EventSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [django_filters.DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = EventFilter
    search_fields = ["title", "description", "location"]
    ordering_fields = ["start_datetime", "end_datetime", "title"]
    ordering = ["start_datetime"]

    def get_queryset(self):
        return PublicEventsQuery.execute()


@extend_schema_view(
    get=extend_schema(tags=["Events - Public"], summary="Get event details", description="Retrieve a single published event by ID."),
)
class PublicEventDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = EventSerializer
    lookup_url_kwarg = "pk"

    def get_object(self):
        return get_event_or_404(self.kwargs["pk"])


@extend_schema_view(
    get=extend_schema(tags=["Events - Public"], summary="List live events", description="Retrieve events currently happening (started but not ended)."),
)
class LiveEventListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = EventSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return LiveEventsQuery.execute()


@extend_schema_view(
    get=extend_schema(tags=["Events - Public"], summary="List upcoming events", description="Retrieve future events that have not started yet."),
)
class UpcomingEventListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = EventSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return UpcomingEventsQuery.execute()


@extend_schema_view(
    get=extend_schema(tags=["Events - Public"], summary="List past events", description="Retrieve events that have already ended."),
)
class PastEventListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = EventSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["start_datetime", "end_datetime", "title"]
    ordering = ["-end_datetime"]

    def get_queryset(self):
        return PastEventsQuery.execute()


@extend_schema_view(
    get=extend_schema(tags=["Events - Admin"], summary="List all events", description="Retrieve all events scoped to the user's branches."),
    post=extend_schema(tags=["Events - Admin"], summary="Create an event", description="Create a new event with branch, title, dates, and configuration."),
)
class AdminEventListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = EventAdminSerializer

    def get_queryset(self):
        user = self.request.user
        branch_ids = None
        if user_is_branch_manager(user) or user_is_secretary(user):
            branch_ids = get_active_branch_ids(user)
        return list_events(branch_ids=branch_ids)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = create_event(serializer.validated_data, actor=request.user)
        return Response(
            EventAdminSerializer(event).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    get=extend_schema(tags=["Events - Admin"], summary="Get event details", description="Retrieve a single event by ID."),
    put=extend_schema(tags=["Events - Admin"], summary="Update an event", description="Fully update an event."),
    patch=extend_schema(tags=["Events - Admin"], summary="Partially update an event", description="Partially update an event."),
    delete=extend_schema(tags=["Events - Admin"], summary="Delete an event", description="Delete an event."),
)
class AdminEventRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = EventAdminSerializer
    lookup_url_kwarg = "pk"

    def get_object(self):
        obj = get_event_or_404(self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

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


@extend_schema_view(
    post=extend_schema(tags=["Events - Admin"], summary="Publish an event", description="Change event status from DRAFT to PUBLISHED."),
)
class AdminEventPublishView(generics.GenericAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = EventAdminSerializer
    lookup_url_kwarg = "pk"

    def post(self, request, *args, **kwargs):
        event = get_event_or_404(self.kwargs["pk"])
        self.check_object_permissions(request, event)
        event = publish_event(event, actor=request.user)
        return Response(EventAdminSerializer(event).data)


@extend_schema_view(
    post=extend_schema(tags=["Events - Admin"], summary="Unpublish an event", description="Change event status from PUBLISHED to DRAFT."),
)
class AdminEventUnpublishView(generics.GenericAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = EventAdminSerializer
    lookup_url_kwarg = "pk"

    def post(self, request, *args, **kwargs):
        event = get_event_or_404(self.kwargs["pk"])
        self.check_object_permissions(request, event)
        event = unpublish_event(event, actor=request.user)
        return Response(EventAdminSerializer(event).data)


@extend_schema_view(
    post=extend_schema(tags=["Events - Admin"], summary="Activate an event", description="Set is_active=True for an event."),
)
class AdminEventActivateView(generics.GenericAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = EventAdminSerializer
    lookup_url_kwarg = "pk"

    def post(self, request, *args, **kwargs):
        event = get_event_or_404(self.kwargs["pk"])
        self.check_object_permissions(request, event)
        event = activate_event(event, actor=request.user)
        return Response(EventAdminSerializer(event).data)


@extend_schema_view(
    post=extend_schema(tags=["Events - Admin"], summary="Deactivate an event", description="Set is_active=False for an event."),
)
class AdminEventDeactivateView(generics.GenericAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = EventAdminSerializer
    lookup_url_kwarg = "pk"

    def post(self, request, *args, **kwargs):
        event = get_event_or_404(self.kwargs["pk"])
        self.check_object_permissions(request, event)
        event = deactivate_event(event, actor=request.user)
        return Response(EventAdminSerializer(event).data)
