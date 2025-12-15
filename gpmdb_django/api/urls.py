"""
API URL Configuration

All routes will be prefixed with /api/v1/ added in the main urls.py
"""

from django.urls import path
from . import views
 
urlpatterns = [
    # Metadata
    path('metadata/', views.metadata, name='api_metadata'),

    # Combined query (main search)
    path('query/', views.query, name='api_query'),
]