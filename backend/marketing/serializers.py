# apps/marketing/serializers.py
from rest_framework import serializers
from .models import Banner, AdSlot

class AdSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdSlot
        fields = "__all__"

class BannerSerializer(serializers.ModelSerializer):
    slot = AdSlotSerializer(read_only=True)
    slot_id = serializers.PrimaryKeyRelatedField(
        queryset=AdSlot.objects.all(),
        source="slot",
        write_only=True
    )

    class Meta:
        model = Banner
        fields = "__all__"
