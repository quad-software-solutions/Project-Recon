from drf_spectacular.utils import extend_schema
from rest_framework import filters, generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.cms.api.pagination import AdminPagination, PublicPagination
from apps.cms.api.permissions import IsCMSStaff
from apps.cms.api.serializers import NewsArticleSerializer, NewsArticleAdminSerializer
from apps.cms.services.news_service import (
    list_active_news_articles,
    list_news_articles,
    create_news_article,
    update_news_article,
    delete_news_article,
    get_news_article_or_404,
    get_news_article_by_slug_or_404,
)


class PublicNewsArticleListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = NewsArticleSerializer
    pagination_class = PublicPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "summary", "content"]
    ordering_fields = ["title", "published_at", "created_at", "type"]

    @extend_schema(tags=["CMS - News"])
    def get_queryset(self):
        return list_active_news_articles()


class PublicNewsArticleDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = NewsArticleSerializer
    lookup_url_kwarg = "slug"
    lookup_field = "slug"

    @extend_schema(tags=["CMS - News"])
    def get_object(self):
        return get_news_article_by_slug_or_404(self.kwargs["slug"])


class AdminNewsArticleListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsCMSStaff]
    serializer_class = NewsArticleAdminSerializer
    pagination_class = AdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "summary", "content"]
    ordering_fields = ["title", "published_at", "created_at", "type"]

    @extend_schema(tags=["CMS - Admin - News"])
    def get_queryset(self):
        return list_news_articles()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        article = create_news_article(serializer.validated_data, actor=request.user)
        return Response(
            NewsArticleAdminSerializer(article).data,
            status=status.HTTP_201_CREATED,
        )


class AdminNewsArticleRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsCMSStaff]
    serializer_class = NewsArticleAdminSerializer
    lookup_url_kwarg = "pk"

    @extend_schema(tags=["CMS - Admin - News"])
    def get_object(self):
        return get_news_article_or_404(self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        article = self.get_object()
        serializer = self.get_serializer(article, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        article = update_news_article(article, serializer.validated_data, actor=request.user)
        return Response(NewsArticleAdminSerializer(article).data)

    def destroy(self, request, *args, **kwargs):
        article = self.get_object()
        delete_news_article(article, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
