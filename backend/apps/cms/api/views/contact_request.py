from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from apps.cms.api.permissions import IsCMSStaff
from apps.cms.api.serializers import (
    ContactRequestCreateSerializer,
    ContactRequestSerializer,
    ContactRequestAdminSerializer,
)
from apps.cms.services.contact_request_service import (
    create_contact_request,
    list_contact_requests,
    get_contact_request_or_404,
    update_contact_request,
    delete_contact_request,
)


class PublicCreateContactRequestView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]
    serializer_class = ContactRequestCreateSerializer

    @extend_schema(
        tags=["CMS - Contact Requests"],
        request=ContactRequestCreateSerializer,
        responses={201: ContactRequestSerializer},
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contact_request = create_contact_request(serializer.validated_data)
        return Response(
            ContactRequestSerializer(contact_request).data,
            status=status.HTTP_201_CREATED,
        )


class AdminContactRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsCMSStaff]
    serializer_class = ContactRequestAdminSerializer

    @extend_schema(tags=["CMS - Admin - Contact Requests"])
    def get_queryset(self):
        return list_contact_requests()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contact_request = create_contact_request(serializer.validated_data)
        return Response(
            ContactRequestAdminSerializer(contact_request).data,
            status=status.HTTP_201_CREATED,
        )


class AdminContactRequestRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsCMSStaff]
    serializer_class = ContactRequestAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["CMS - Admin - Contact Requests"])
    def get_object(self):
        return get_contact_request_or_404(self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        contact_request = self.get_object()
        serializer = self.get_serializer(contact_request, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        contact_request = update_contact_request(
            contact_request, serializer.validated_data, actor=request.user
        )
        return Response(ContactRequestAdminSerializer(contact_request).data)

    def destroy(self, request, *args, **kwargs):
        contact_request = self.get_object()
        delete_contact_request(contact_request, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
