"""Trusted device API views."""

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound

from apps.accounts.models import TrustedDevice
from apps.accounts.serializers.device import RevokeAllDevicesSerializer, TrustedDeviceSerializer
from apps.accounts.api.throttles import AdminUserThrottle
from apps.accounts.services.device_service import (
    list_devices,
    remove_device,
    remove_all_devices_except_current,

)
from rest_framework import generics, status
from rest_framework.response import Response

class DeviceListView(generics.ListAPIView):
    """List trusted devices for the authenticated user."""

    serializer_class = TrustedDeviceSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [AdminUserThrottle]

    def get_queryset(self):
        return list_devices(self.request.user)

    @extend_schema(tags=["Devices"], responses=TrustedDeviceSerializer(many=True))
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class DeviceDetailView(generics.RetrieveDestroyAPIView):
    """Retrieve or revoke a trusted device."""

    permission_classes = [IsAuthenticated]
    serializer_class = TrustedDeviceSerializer
    throttle_classes = [AdminUserThrottle]

    def get_object(self):
        try:
            return TrustedDevice.objects.get(
                id=self.kwargs["pk"],
                user=self.request.user,
            )
        except TrustedDevice.DoesNotExist:
            raise NotFound("Device not found.")

    @extend_schema(tags=["Devices"], responses=TrustedDeviceSerializer)
    def retrieve(self, request, *args, **kwargs):
        device = self.get_object()
        serializer = self.get_serializer(device)
        return Response(serializer.data)

    @extend_schema(tags=["Devices"], responses={204: None})
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        remove_device(
            request.user,
            instance.fingerprint,
        )

        return Response(status=204)

class DeviceRevokeAllView(generics.GenericAPIView):
    """Revoke all trusted devices except the current one."""

    permission_classes = [IsAuthenticated]
    serializer_class = RevokeAllDevicesSerializer
    throttle_classes = [AdminUserThrottle]

    @extend_schema(
        tags=["Devices"],
        request=RevokeAllDevicesSerializer,
        responses={204: None},
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        remove_all_devices_except_current(
            request.user,
            serializer.validated_data["current_fingerprint"],
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
