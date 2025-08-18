from django import forms
from .models import Post

class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = "__all__"
        widgets = {
            "content": forms.Textarea(attrs={
                "rows": 15,
                "style": "width:100%; font-size:15px; line-height:1.6; padding:12px; background:#f9f9f9; border:1px solid #ccc; border-radius:6px;",
                "class": "content-textarea",  # để mình có thể CSS thêm nếu muốn
            }),
        }
