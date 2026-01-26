# api/utils/concurrency.py
"""
Concurrency Utilities

Fire-and-forget task execution for non-blocking operations.
Used for sending alerts without blocking HTTP responses.
"""

import threading
import logging
from typing import Callable, Any, Tuple, Dict, Optional

logger = logging.getLogger(__name__)


class FireAndForget(threading.Thread):
    """
    Execute a function in a background thread without blocking.
    
    This is a lightweight alternative to Celery for simple fire-and-forget tasks
    like sending alert emails. The caller doesn't wait for completion.
    
    Features:
    - Daemon thread (won't prevent process shutdown)
    - Exception logging (errors don't crash the main thread)
    - Optional callback on completion
    
    Usage:
        # Simple fire-and-forget
        FireAndForget(send_email, args=(recipient, subject, body)).start()
        
        # With completion callback
        def on_done(success, result, error):
            if success:
                logger.info(f"Email sent: {result}")
            else:
                logger.error(f"Email failed: {error}")
        
        FireAndForget(
            send_email, 
            args=(recipient, subject, body),
            on_complete=on_done
        ).start()
    
    Security Note:
        This is intentionally simple. For production workloads requiring
        guaranteed delivery, persistence, or retries, use Celery with Redis/RabbitMQ.
    """
    
    def __init__(
        self,
        target: Callable,
        args: Tuple = (),
        kwargs: Optional[Dict[str, Any]] = None,
        on_complete: Optional[Callable[[bool, Any, Optional[Exception]], None]] = None,
        task_name: str = "unnamed_task"
    ):
        """
        Initialize the fire-and-forget task.
        
        Args:
            target: The function to execute
            args: Positional arguments for the function
            kwargs: Keyword arguments for the function
            on_complete: Optional callback(success: bool, result: Any, error: Exception | None)
            task_name: Human-readable name for logging
        """
        super().__init__(daemon=True)  # Daemon = won't block process exit
        self._target = target
        self._args = args
        self._kwargs = kwargs or {}
        self._on_complete = on_complete
        self._task_name = task_name
    
    def run(self):
        """Execute the task in background."""
        result = None
        error = None
        success = False
        
        try:
            result = self._target(*self._args, **self._kwargs)
            success = True
            logger.debug(f"[FireAndForget] Task '{self._task_name}' completed successfully")
        except Exception as e:
            error = e
            logger.error(f"[FireAndForget] Task '{self._task_name}' failed: {e}")
        
        # Call completion callback if provided
        if self._on_complete:
            try:
                self._on_complete(success, result, error)
            except Exception as callback_error:
                logger.error(f"[FireAndForget] Callback for '{self._task_name}' failed: {callback_error}")


def fire_and_forget(
    target: Callable,
    args: Tuple = (),
    kwargs: Optional[Dict[str, Any]] = None,
    task_name: str = "unnamed_task"
) -> FireAndForget:
    """
    Convenience function to start a fire-and-forget task.
    
    Usage:
        fire_and_forget(send_email, args=(to, subject, body), task_name="send_alert")
    
    Returns:
        The started thread (for reference, though typically not needed)
    """
    task = FireAndForget(target=target, args=args, kwargs=kwargs, task_name=task_name)
    task.start()
    return task
