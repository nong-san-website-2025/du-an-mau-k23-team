from django.db import models

class SystemConfig(models.Model):
    site_name = models.CharField(max_length=255, default="My Website")
    support_email = models.EmailField(default="support@example.com")
    maintenance_mode = models.BooleanField(default=False)

    def __str__(self):
        return self.site_name

class SystemLog(models.Model):
    action = models.CharField(max_length=255)
    user = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} - {self.user}"


class StaticPage(models.Model):
    SECTION_CHOICES = [
        ("about", "Về GreenFarm"),
        ("policy", "Chính sách"),
        ("help", "Trung tâm trợ giúp"),
    ]

    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=255)
    section = models.CharField(max_length=32, choices=SECTION_CHOICES, default="help")
    content_html = models.TextField(blank=True, null=True)
    banner_image = models.ImageField(upload_to="pages/banners/", blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["slug"]

    def __str__(self):
        return f"{self.title} ({self.slug})"


class StaticPageBlock(models.Model):
    """Structured content blocks linked to a StaticPage.
    Allows up to 6 sections with heading, HTML body and optional image.
    """
    page = models.ForeignKey(StaticPage, related_name="blocks", on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=1)
    heading = models.CharField(max_length=255, blank=True, null=True)
    body_html = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to="pages/blocks/", blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Block #{self.order} of {self.page.slug}"
