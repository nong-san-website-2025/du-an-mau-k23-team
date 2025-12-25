from django.apps import AppConfig


class ProductsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'products'
    def ready(self):
        # Ensure product signals are registered on app ready
        try:
            import products.signals  # noqa: F401
        except Exception as e:
            print("Error importing products.signals:", e)
    