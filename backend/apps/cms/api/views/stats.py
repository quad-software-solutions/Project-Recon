from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework.throttling import AnonRateThrottle

from apps.academic.models import Student, Program
from apps.cms.models import Partner, MapNode

class PublicPlatformStatsView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def get(self, request, *args, **kwargs):
        students_trained = Student.objects.count()
        program_tracks = Program.objects.filter(is_active=True).count()
        partner_schools = Partner.objects.filter(is_active=True).count()
        countries_reached = MapNode.objects.filter(is_active=True).values('country').distinct().count()

        return Response({
            "students_trained": students_trained,
            "program_tracks": program_tracks,
            "partner_schools": partner_schools,
            "countries_reached": countries_reached
        })
