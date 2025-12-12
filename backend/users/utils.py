from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

token_generator = PasswordResetTokenGenerator()

def generate_reset_link(user):
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = token_generator.make_token(user)
    return uidb64, token
