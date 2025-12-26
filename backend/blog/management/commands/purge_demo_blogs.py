from django.core.management.base import BaseCommand
from django.db.models import Q
from blog.models import BlogPost, BlogCategory


SAMPLE_POST_SLUGS = [
    "huong-dan-ban-hang-online-hieu-qua-tren-nen-tang-e-commerce",
    "top-5-cong-nghe-nong-nghiep-hien-dai-thay-doi-nganh",
    "10-meo-tang-doanh-so-ban-hang-cho-shop-seller",
    "xu-huong-e-commerce-viet-nam-nam-2024",
    "cach-quan-ly-kho-hang-hieu-qua-cho-tieu-thuong",
    "blockchain-va-cong-nghe-web3-tuong-lai-cua-e-commerce",
]

SAMPLE_CATEGORY_SLUGS = [
    "kinh-doanh",
    "cong-nghe",
    "meo-thu-thuat",
    "tin-tuc",
]


class Command(BaseCommand):
    help = "Purge demo/sample blog posts and empty demo categories"

    def handle(self, *args, **options):
        # Delete sample posts by known slugs
        posts_qs = BlogPost.objects.filter(slug__in=SAMPLE_POST_SLUGS)
        post_count = posts_qs.count()
        posts_qs.delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {post_count} demo posts."))

        # Optionally unpublish any remaining posts that look like demo
        # (no author or empty image with typical views pattern)
        heuristics_qs = BlogPost.objects.filter(
            Q(author__isnull=True) | Q(title__icontains="demo") | Q(title__icontains="mẹo")
        )
        # Only unpublish, do not delete
        unpublished = 0
        for p in heuristics_qs:
            if p.is_published:
                p.is_published = False
                p.save(update_fields=["is_published"])
                unpublished += 1
        if unpublished:
            self.stdout.write(self.style.WARNING(f"Unpublished {unpublished} suspected demo posts."))

        # Remove empty demo categories if they have no posts left
        removed_cats = 0
        for cat in BlogCategory.objects.filter(slug__in=SAMPLE_CATEGORY_SLUGS):
            if not BlogPost.objects.filter(category=cat).exists():
                cat.delete()
                removed_cats += 1
        self.stdout.write(self.style.SUCCESS(f"Removed {removed_cats} empty demo categories."))

        self.stdout.write(self.style.SUCCESS("Purge completed."))
