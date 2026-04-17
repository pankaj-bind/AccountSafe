"""
Shared response helpers for lightweight function-based API views.
"""

from rest_framework import status
from rest_framework.response import Response


def error_response(message, status_code, extra=None):
    """
    Keep the legacy `error` key while adding a stable status flag for
    callers that want to distinguish handled failures from success payloads.
    """
    payload = {"status": "error", "error": message}
    if extra:
        payload.update(extra)
    return Response(payload, status=status_code)


def validation_error_response(errors):
    """
    Preserve field-level serializer errors and add a top-level status flag
    without changing the individual field keys the frontend may already use.
    """
    if isinstance(errors, dict):
        payload = {"status": "error"}
        payload.update(errors)
        return Response(payload, status=status.HTTP_400_BAD_REQUEST)

    if isinstance(errors, (list, tuple)):
        return Response({"status": "error", "errors": list(errors)}, status=status.HTTP_400_BAD_REQUEST)

    return error_response(str(errors), status.HTTP_400_BAD_REQUEST)


def normalize_django_validation_error(exc):
    """Convert Django ValidationError objects into API-friendly payloads."""
    if hasattr(exc, "message_dict"):
        return exc.message_dict

    messages = getattr(exc, "messages", None)
    if messages:
        if len(messages) == 1:
            return messages[0]
        return {"errors": messages}

    return "Invalid input."
