"""
Custom CORS middleware for Django 2.2+

This allows the Next.js frontend to make API requests to the Django backend.
"""

from django.conf import settings


class CorsMiddleware:
    """
    Simple CORS middleware that adds appropriate headers for cross-origin requests.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Handle preflight OPTIONS requests
        if request.method == 'OPTIONS':
            response = self.make_preflight_response()
        else:
            response = self.get_response(request)
        
        # Add CORS headers to all responses
        response = self.add_cors_headers(request, response)
        return response
    
    def make_preflight_response(self):
        """Create a response for OPTIONS preflight requests."""
        from django.http import HttpResponse
        return HttpResponse()
    
    def add_cors_headers(self, request, response):
        """Add CORS headers to the response."""
        origin = request.META.get('HTTP_ORIGIN', '')
        
        # Get allowed origins from settings
        allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        allow_all = getattr(settings, 'DEBUG', False)
        
        # Check if origin is allowed
        if allow_all or origin in allowed_origins:
            response['Access-Control-Allow-Origin'] = origin if origin else '*'
        elif not origin:
            # Allow same-origin requests
            response['Access-Control-Allow-Origin'] = '*'
        
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Max-Age'] = '86400'  # 24 hours
        
        return response
