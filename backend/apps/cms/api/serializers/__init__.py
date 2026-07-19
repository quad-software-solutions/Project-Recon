from .hero_banner import HeroBannerSerializer, HeroBannerAdminSerializer
from .news import NewsArticleSerializer, NewsArticleAdminSerializer
from .partner import PartnerSerializer, PartnerAdminSerializer
from .about import AboutUsSerializer, AboutUsAdminSerializer
from .contact_request import (
    ContactRequestSerializer,
    ContactRequestCreateSerializer,
    ContactRequestResponseSerializer,
    ContactRequestAdminSerializer,
)
from .faq import FAQSerializer, FAQAdminSerializer
from .map_node import MapNodeSerializer, MapNodeAdminSerializer
from .gallery import GallerySerializer, GalleryAdminSerializer
from .testimonial import TestimonialSerializer, TestimonialAdminSerializer
from .homepage_statistic import HomepageStatisticSerializer, HomepageStatisticAdminSerializer

__all__ = [
    "HeroBannerSerializer",
    "HeroBannerAdminSerializer",
    "NewsArticleSerializer",
    "NewsArticleAdminSerializer",
    "PartnerSerializer",
    "PartnerAdminSerializer",
    "AboutUsSerializer",
    "AboutUsAdminSerializer",
    "ContactRequestSerializer",
    "ContactRequestCreateSerializer",
    "ContactRequestResponseSerializer",
    "ContactRequestAdminSerializer",
    "FAQSerializer",
    "FAQAdminSerializer",
    "MapNodeSerializer",
    "MapNodeAdminSerializer",
    "GallerySerializer",
    "GalleryAdminSerializer",
    "TestimonialSerializer",
    "TestimonialAdminSerializer",
    "HomepageStatisticSerializer",
    "HomepageStatisticAdminSerializer",
]
