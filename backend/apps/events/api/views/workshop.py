from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.permissions.roles import (
    get_active_branch_ids,
    user_is_branch_manager,
    user_is_secretary,
)
from apps.events.api.permissions import (
    IsEventStaffOrInstructor,
)
from apps.events.api.serializers import WorkshopAdminSerializer, WorkshopSerializer
from apps.events.models import Workshop
from apps.events.services.workshop_service import (
    create_workshop,
    delete_workshop,
    get_workshop_or_404,
    list_workshops,
    update_workshop,
)


@extend_schema_view(
    get=extend_schema(tags=["Events - Public"], summary="List public workshops", description="Retrieve all published, active workshops."),
)
class PublicWorkshopListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = WorkshopSerializer

    def get_queryset(self):
        return Workshop.objects.filter(
            event__status="PUBLISHED",
            event__is_active=True,
        ).select_related("event", "instructor").order_by("-created_at")


@extend_schema_view(
    get=extend_schema(tags=["Events - Public"], summary="Get workshop details", description="Retrieve a single workshop by ID."),
)
class PublicWorkshopDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = WorkshopSerializer
    lookup_url_kwarg = "pk"

    def get_object(self):
        return get_workshop_or_404(self.kwargs["pk"])


@extend_schema_view(
    get=extend_schema(tags=["Events - Admin - Workshops"], summary="List workshops", description="Retrieve all workshops scoped to user's branches or assigned instructor."),
    post=extend_schema(tags=["Events - Admin - Workshops"], summary="Create a workshop", description="Create a new workshop linked to an event."),
)
class AdminWorkshopListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsEventStaffOrInstructor]
    serializer_class = WorkshopAdminSerializer

    def get_queryset(self):
        user = self.request.user
        branch_ids = None
        if user_is_branch_manager(user) or user_is_secretary(user):
            branch_ids = get_active_branch_ids(user)
        return list_workshops(user=user, branch_ids=branch_ids)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        workshop = create_workshop(serializer.validated_data, actor=request.user)
        return Response(
            WorkshopAdminSerializer(workshop).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    get=extend_schema(tags=["Events - Admin - Workshops"], summary="Get workshop details", description="Retrieve a single workshop by ID."),
    put=extend_schema(tags=["Events - Admin - Workshops"], summary="Update a workshop", description="Fully update a workshop."),
    patch=extend_schema(tags=["Events - Admin - Workshops"], summary="Partially update a workshop", description="Partially update a workshop."),
    delete=extend_schema(tags=["Events - Admin - Workshops"], summary="Delete a workshop", description="Delete a workshop."),
)
class AdminWorkshopRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsEventStaffOrInstructor]
    serializer_class = WorkshopAdminSerializer
    lookup_url_kwarg = "pk"

    def get_object(self):
        workshop = get_workshop_or_404(self.kwargs["pk"])
        self.check_object_permissions(self.request, workshop)
        return workshop

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        workshop = self.get_object()
        serializer = self.get_serializer(workshop, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        workshop = update_workshop(workshop, serializer.validated_data, actor=request.user)
        return Response(WorkshopAdminSerializer(workshop).data)

    def destroy(self, request, *args, **kwargs):
        workshop = self.get_object()
        delete_workshop(workshop, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
