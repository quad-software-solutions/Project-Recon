from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from apps.academic.models import Student
from apps.accounts.permissions.roles import (
    get_active_branch_ids,
    user_is_super_admin,
)
from apps.events.api.permissions import IsEventRegistrationStaff, IsEventStaff
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
    verify_registration_email,
)


@extend_schema_view(
    post=extend_schema(tags=["Events - Registration"], summary="Register for an event", description="Register as a student (authenticated) or public participant for an event."),
)
class EventRegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]
    throttle_scope = "events_register"
    serializer_class = PublicRegistrationSerializer

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
        registration = register_for_event(
            event_id,
            serializer.validated_data,
            actor=request.user if request.user.is_authenticated else None,
        )
        return Response(
            RegistrationAdminSerializer(registration).data,
            status=status.HTTP_201_CREATED,
        )

    def _student_registration(self, event_id, request):
        student = Student.objects.get(user=request.user)
        data = {"student": str(student.id)}
        payment_data = request.data.get("payment")
        if payment_data:
            data["payment"] = payment_data
        registration = register_for_event(event_id, data, actor=request.user)
        return Response(
            RegistrationAdminSerializer(registration).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    post=extend_schema(
        tags=["Events - Registration"],
        summary="Verify registration email",
        description="Verify a public registration's email using the 6-digit OTP sent to their email.",
    ),
)
class RegistrationVerifyEmailView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    throttle_scope = "events_register"
    serializer_class = PublicRegistrationSerializer

    def post(self, request, pk):
        otp = request.data.get("otp")
        if not otp:
            return Response(
                {"otp": "Verification code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        registration = verify_registration_email(pk, otp)
        return Response(
            RegistrationAdminSerializer(registration).data,
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    get=extend_schema(tags=["Events - Registration"], summary="My registrations", description="Retrieve the current user's event registrations."),
)
class MyRegistrationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MyRegistrationSerializer

    def get_queryset(self):
        try:
            student = Student.objects.get(user=self.request.user)
        except Student.DoesNotExist:
            return []
        return list_registrations(student_id=student.id)


@extend_schema_view(
    post=extend_schema(tags=["Events - Registration"], summary="Cancel my registration", description="Cancel one of the current user's registrations."),
)
class MyRegistrationCancelView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

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


@extend_schema_view(
    get=extend_schema(
        tags=["Events - Admin - Registrations"],
        summary="List registrations",
        description="Retrieve registrations, optionally filtered by event and status.",
        parameters=[
            OpenApiParameter(name="event", description="Filter by event ID", required=False, type=str),
            OpenApiParameter(name="status", description="Filter by registration status", required=False, type=str),
        ],
    ),
)
class AdminRegistrationListView(generics.ListAPIView):
    permission_classes = [IsEventRegistrationStaff]
    throttle_scope = "events_admin"
    serializer_class = RegistrationAdminSerializer

    def get_queryset(self):
        event_id = self.request.query_params.get("event")
        status_filter = self.request.query_params.get("status")
        user = self.request.user
        branch_ids = None
        if not user_is_super_admin(user):
            branch_ids = get_active_branch_ids(user)
        return list_registrations(event_id=event_id, status=status_filter, branch_ids=branch_ids)


@extend_schema_view(
    get=extend_schema(tags=["Events - Admin - Registrations"], summary="Get registration details", description="Retrieve a single registration by ID."),
)
class AdminRegistrationDetailView(generics.RetrieveAPIView):
    permission_classes = [IsEventRegistrationStaff]
    throttle_scope = "events_admin"
    serializer_class = RegistrationAdminSerializer
    lookup_url_kwarg = "pk"

    def get_object(self):
        obj = get_registration_or_404(self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj


@extend_schema_view(
    post=extend_schema(tags=["Events - Admin - Registrations"], summary="Approve registration", description="Approve a pending registration."),
)
class AdminRegistrationApproveView(generics.CreateAPIView):
    permission_classes = [IsEventRegistrationStaff]
    throttle_scope = "events_admin"

    def create(self, request, *args, **kwargs):
        registration = get_registration_or_404(kwargs["pk"])
        self.check_object_permissions(request, registration)
        registration = approve_registration(registration, actor=request.user)
        return Response(RegistrationAdminSerializer(registration).data)


@extend_schema_view(
    post=extend_schema(tags=["Events - Admin - Registrations"], summary="Reject registration", description="Reject a pending registration."),
)
class AdminRegistrationRejectView(generics.CreateAPIView):
    permission_classes = [IsEventRegistrationStaff]
    throttle_scope = "events_admin"

    def create(self, request, *args, **kwargs):
        registration = get_registration_or_404(kwargs["pk"])
        self.check_object_permissions(request, registration)
        registration = reject_registration(registration, actor=request.user)
        return Response(RegistrationAdminSerializer(registration).data)


@extend_schema_view(
    post=extend_schema(tags=["Events - Admin - Registrations"], summary="Cancel registration", description="Cancel any registration."),
)
class AdminRegistrationCancelView(generics.CreateAPIView):
    permission_classes = [IsEventRegistrationStaff]
    throttle_scope = "events_admin"

    def create(self, request, *args, **kwargs):
        registration = get_registration_or_404(kwargs["pk"])
        self.check_object_permissions(request, registration)
        registration = cancel_registration(registration, actor=request.user)
        return Response(RegistrationAdminSerializer(registration).data)


@extend_schema_view(
    post=extend_schema(tags=["Events - Admin - Registrations"], summary="Convert registration to team", description="Convert an approved tournament registration into a tournament team."),
)
class AdminRegistrationConvertTeamView(generics.CreateAPIView):
    permission_classes = [IsEventRegistrationStaff]
    throttle_scope = "events_admin"

    def create(self, request, *args, **kwargs):
        registration = get_registration_or_404(kwargs["pk"])
        self.check_object_permissions(request, registration)
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
