# --- File upload limits (tăng giới hạn để upload video)
DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB
from pathlib import Path
import os
import dj_database_url
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()  # Load biến môi trường từ .env nếu có

# settings.py
USE_TZ = True  # Django dùng timezone chuẩn UTC, nên giữ nguyên True
TIME_ZONE = "Asia/Ho_Chi_Minh"  # Múi giờ Việt Nam

USE_I18N = True
USE_L10N = True

BASE_DIR = Path(__file__).resolve().parent.parent

# ⚠️ Lấy SECRET_KEY từ env để bảo mật khi deploy
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-b9xnxg2$u((7pcjaw)%j($ff*cb3_1*2l_a84pd1apo+ua!9$f"
)

DEBUG = os.environ.get("DEBUG", "True") == "True"

ALLOWED_HOSTS = ['*']
# Lưu ý: Dấu chấm trước ngrok-free.dev là để chấp nhận tất cả tên miền con

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8100",
    "http://127.0.0.1:3000",
    "https://concetta-nonprotective-decisively.ngrok-free.dev",
    "http://192.168.89.159:8000",
    "http://192.168.89.159:8100",
    "http://192.168.167.74:8100",
]
DEBUG = True

# --- Installed apps
INSTALLED_APPS = [
    "daphne",
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_extensions',
    'django_rest_passwordreset',


    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "rest_framework_simplejwt.token_blacklist",
    'channels',

    # Local apps
    "users", "sellers", "products", "reviews",
    "cart", "orders", "payments", "store", "wallet",'complaints', "marketing", "promotions", "delivery", "chat", 'config', 'search', 'blog',  'notifications',

    # Cloudinary

    'cloudinary',
    'cloudinary_storage',

    "dashboard",

    # "system_logs",
    "system",

    'system_settings',


    
]

# --- Email
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'khoahuynhminh2005@gmail.com'
EMAIL_HOST_PASSWORD = 'pmdv ikrs pglq etfh'

# --- Facebook


FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID")
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET")

# --- Middleware
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",

    # Whitenoise để serve static khi deploy
    "whitenoise.middleware.WhiteNoiseMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# --- Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR.parent, "frontend", "public")],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# --- Channels (auto fallback to InMemory when REDIS_URL not set)
# if os.environ.get("REDIS_URL"):
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)], # Dùng port 6379 mặc định của Redis
        },
    },
}

# else:
#     CHANNEL_LAYERS = {
#         "default": {
#             "BACKEND": "channels.layers.InMemoryChannelLayer",
#         }
#     }

# --- Database: local PostgreSQL hoặc Render
if os.environ.get("DATABASE_URL"):
    DATABASES = {
        "default": dj_database_url.config(
            default=os.environ["DATABASE_URL"],
            conn_max_age=600,
            ssl_require=True
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# --- Auth
AUTH_USER_MODEL = "users.CustomUser"
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]

# --- REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
        "rest_framework.filters.SearchFilter",
    ),
}


# --- Static & Media
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Whitenoise storage
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv("CLOUDINARY_CLOUD_NAME", "dwsjnkn9c"),
    'API_KEY': os.getenv("CLOUDINARY_API_KEY", "967357934317834"),
    'API_SECRET': os.getenv("CLOUDINARY_API_SECRET", "t-BweAUOngVkY6GBvMNpc1IYJdg"),
}

## Nếu muốn lưu file về local, hãy comment hoặc xóa dòng dưới:
# DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# --- CORS & CSRF
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative React port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://192.168.68.117:5173",  # External machine access
    "http://192.168.68.117:3000",
    "http://192.168.68.105:3000",
    "http://172.18.96.1:8100",
    "http://192.168.2.9:8100",
    "http://192.168.1.59:8100",
    "http://192.168.2.3:8100",
    "http://192.168.68.117:8100",
    "http://192.168.2.3:3000",
    "http://172.16.144.95:3000",
    "http://192.168.1.130:3000",
    "http://192.168.90.56:3000",
    "http://192.168.89.159:8100",
    "http://192.168.167.74:8100",
    "http://localhost:8100",
]
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'accept',
]


LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Platform wallet owner configuration
# Set this to a specific username to receive platform commission; fallback is the first superuser
PLATFORM_WALLET_USERNAME = os.environ.get('PLATFORM_WALLET_USERNAME', '').strip() or None

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=180),  # access token sống 60 phút
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),     # refresh token sống 7 ngày
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

VNPAY_CONFIG = {
    "TMN_CODE": "6EW69YA0",
    "HASH_SECRET_KEY": "ZF17PDTYTRE7VE2M3TEZWH1YHDGBSTD8",
    "VNPAY_URL": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    "RETURN_URL": "http://localhost:3000/vnpay-return",
}


CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1", # /1 là database số 1 của Redis
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}


# Cấu hình Meilisearch Cloud
MEILI_HOST = 'https://ms-5a732ed64ac6-36761.sgp.meilisearch.io'  # <-- Dán URL của bạn vào đây
MEILI_API_KEY = 'ae12a2d9360ed927ccb1531f175c6f8fe3910e3e'         # <-- Dán Admin API Key vào đây