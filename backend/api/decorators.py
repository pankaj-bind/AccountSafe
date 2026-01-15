# api/decorators.py

from functools import wraps
from django.utils.decorators import decorator_from_middleware


def no_store(view_func):
    """
    Decorator to enforce Cache-Control: no-store on responses.
    Prevents browsers and proxies from caching sensitive data.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        response = view_func(request, *args, **kwargs)
        response['Cache-Control'] = 'no-store, no-cache, must-revalidate, private, max-age=0'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response
    return wrapper
