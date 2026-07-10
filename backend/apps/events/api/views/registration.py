from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.academic.models import Student
from apps.events.api.permissions import IsEventStaff
from apps.events.api.serializers import (
    MyRegistrationSerializer,
    PublicRegistrationSerializer,
    RegistrationAdminSerializer,
)
from apps.events.services.registration_service import (
    approve_registration,
    cancel_registration,
    convert_registration_to_team,
    get_registration_or_404,
    list_registrations,
    register_for_event,
    reject_registration,
)


class EventRegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = PublicRegistrationSerializer

    @extend_schema(tags=["Events - Registration"])
    def create(self, request, *args, **kwargs):
        event_id = kwargs.get("pk")
        is_authenticated_student = (
            request.user.is_authenticated
            and Student.objects.filter(user=request.user).exists()
        )

        if is_authenticated_student:
            return self._student_registration(event_id, request)

        return self._public_registration(event_id, request)

    def _public_registration(self, event_id, request):
        serializer = PublicRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        registration = register_for_event(event_id, serializer.validated_data, actor=request.user if request.user.is_authenticated else None)
        return Response(
            RegistrationAdminSerializer(registration).data,
            status=status.HTTP_201_CREATED,
        )

    def _student_registration(self, event_id, request):
        student = Student.objects.get(user=request.user)
        data = {"student": str(student.id)}
        registration = register_for_event(event_id, data, actor=request.user)
        return Response(
            RegistrationAdminSerializer(registration).data,
            status=status.HTTP_201_CREATED,
        )


class MyRegistrationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MyRegistrationSerializer

    @extend_schema(tags=["Events - Registration"])
    def get_queryset(self):
        try:
            student = Student.objects.get(user=self.request.user)
        except Student.DoesNotExist:
            return []
        return list_registrations(student_id=student.id)


class MyRegistrationCancelView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Events - Registration"])
    def create(self, request, *args, **kwargs):
        registration = get_registration_or_404(kwargs["pk"])

        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response(
                {"detail": "Only students can cancel registrations."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if registration.student_id != student.id:
            return Response(
                {"detail": "You can only cancel your own registrations."},
                status=status.HTTP_403_FORBIDDEN,
            )

        registration = cancel_registration(registration, actor=request.user)
        return Response(RegistrationAdminSerializer(registration).data)


class AdminRegistrationListView(generics.ListAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = RegistrationAdminSerializer

    @extend_schema(tags=["Events - Admin - Registrations"])
    def get_queryset(self):
        event_id = self.request.query_params.get("event")
        status_filter = self.request.query_params.get("status")
        return list_registrations(event_id=event_id, status=status_filter)


class AdminRegistrationDetailView(generics.RetrieveAPIView):
    permission_classes = [IsEventStaff]
    serializer_class = RegistrationAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["Events - Admin - Registrations"])
    def get_object(self):
        return get_registration_or_404(self.kwargs["pk"])


class AdminRegistrationApproveView(generics.CreateAPIView):
    permission_classes = [IsEventStaff]

    @extend_schema(tags=["Events - Admin - Registrations"])
    def create(self, request, *args, **kwargs):
        registration = get_registration_or_404(kwargs["pk"])
        registration = approve_registration(registration, actor=request.user)
        return Response(RegistrationAdminSerializer(registration).data)


class AdminRegistrationRejectView(generics.CreateAPIView):
    permission_classes = [IsEventStaff]

    @extend_schema(tags=["Events - Admin - Registrations"])
    def create(self, request, *args, **kwargs):
        registration = get_registration_or_404(kwargs["pk"])
        registration = reject_registration(registration, actor=request.user)
        return Response(RegistrationAdminSerializer(registration).data)


class AdminRegistrationCancelView(generics.CreateAPIView):
    permission_classes = [IsEventStaff]

    @extend_schema(tags=["Events - Admin - Registrations"])
    def create(self, request, *args, **kwargs):
        registration = get_registration_or_404(kwargs["pk"])
        registration = cancel_registration(registration, actor=request.user)
        return Response(RegistrationAdminSerializer(registration).data)


class AdminRegistrationConvertTeamView(generics.CreateAPIView):
    permission_classes = [IsEventStaff]

    @extend_schema(tags=["Events - Admin - Registrations"])
    def create(self, request, *args, **kwargs):
        registration = get_registration_or_404(kwargs["pk"])
        team_name = request.data.get("team_name")
        if not team_name:
            return Response(
                {"team_name": "Team name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        team = convert_registration_to_team(
            registration, team_name, actor=request.user
        )
        from apps.events.api.serializers import TournamentTeamAdminSerializer
        return Response(
            TournamentTeamAdminSerializer(team).data,
            status=status.HTTP_201_CREATED,
        )
