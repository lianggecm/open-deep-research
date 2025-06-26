"""
Service for emitting research progress events to a Redis stream.

This module defines `AdkEventService`, which is responsible for taking
StreamEvent Pydantic models, serializing them to JSON, and adding them
to a Redis stream specific to a research session. This allows the frontend
to listen to these streams and display real-time progress updates.

The service connects to Redis using configuration provided in `config.py`
or passed during instantiation. It replicates the functionality of the
original `streamStorage.addEvent` from the TypeScript implementation.
"""
import json
import time
import redis # Using the official redis-py client
from typing import Optional

from .schemas import StreamEvent # Pydantic models for various event types
from .config import REDIS_URL, REDIS_TOKEN # Redis connection details

class AdkEventService:
    """
    Handles the emission of research events to a Redis stream.

    Each research session has its own stream, identified by the session ID.
    Events are serialized Pydantic models.

    Attributes:
        session_id: The unique identifier for the current research session.
        redis_client: An instance of the Redis client.
    """
    def __init__(self, session_id: str, redis_url: Optional[str] = None, redis_token: Optional[str] = None):
        """
        Initializes the AdkEventService and connects to Redis.

        Args:
            session_id: The ID of the research session for which events will be emitted.
            redis_url: Optional Redis URL. Defaults to value from `config.py`.
                       For Upstash, this is the full connection string.
            redis_token: Optional Redis token (password). Defaults to value from `config.py`.
                         Note: For Upstash, token is often part of the URL.

        Raises:
            ValueError: If Redis URL is not configured or provided.
            redis.exceptions.RedisError: If connection to Redis fails.
        """
        self.session_id = session_id
        _redis_url = redis_url or REDIS_URL
        # _redis_token = redis_token or REDIS_TOKEN # Token might be embedded in Upstash URL

        if not _redis_url:
            raise ValueError("Redis URL must be provided either directly or via config.REDIS_URL.")

        try:
            # Using Redis.from_url is generally recommended for simplicity, especially with Upstash URLs.
            # It handles parsing of 'redis://user:password@host:port/db'.
            # For Upstash, ensure the URL includes `rediss://` for SSL.
            self.redis_client = redis.Redis.from_url(_redis_url, decode_responses=False)
            self.redis_client.ping() # Verify connection
            print(f"AdkEventService connected to Redis for session {session_id}")
        except redis.exceptions.RedisError as e:
            print(f"Failed to connect to Redis at {_redis_url}: {e}")
            # Depending on desired behavior, either raise e or handle (e.g. mock client for local dev without Redis)
            raise  # Re-raise the exception if Redis is critical
        except ValueError as e: # from_url can raise ValueError for bad URL format
            print(f"Redis URL format error for '{_redis_url}': {e}")
            raise


    def _generate_key(self) -> str:
        """Generates the Redis stream key for the current session."""
        return f"research:{self.session_id}:stream"

    def add_event(self, event_data: StreamEvent, current_iteration: Optional[int] = None) -> None:
        """
        Adds a structured event to the Redis stream for the current session.

        The event data is a Pydantic model which gets serialized to JSON.
        Timestamps are automatically set if not provided. Iteration numbers
        can also be defaulted.

        Args:
            event_data: A Pydantic model instance representing the event.
            current_iteration: Optional current iteration number to set on the event
                               if not already present.
        """
        if not hasattr(event_data, 'timestamp') or event_data.timestamp is None or event_data.timestamp == 0:
            event_data.timestamp = int(time.time() * 1000)

        if current_iteration is not None and hasattr(event_data, 'iteration') and event_data.iteration is None:
            event_data.iteration = current_iteration

        key = self._generate_key()
        # The stream field will be 'event', and its value is the JSON string of the event_data.
        event_payload = {"event": event_data.model_dump_json()}

        try:
            # XADD key * field1 value1 [field2 value2 ...]
            self.redis_client.xadd(key, event_payload, id='*')
            # Set expiration on the stream (e.g., 24 hours)
            self.redis_client.expire(key, 86400)
            print(f"Event '{event_data.type}' added to stream {key}")
        except Exception as e:
            print(f"Error adding event to Redis stream {key}: {e}")
            # Handle error appropriately (e.g., log, raise)

# Example Usage (for testing this file directly)
if __name__ == '__main__':
    # Mock StreamEvent for testing
    class MockPlanningStartedEvent(StreamEvent):
        type: Literal["planning_started"] = "planning_started"
        topic: str
        timestamp: int = int(time.time()*1000)

    # This requires a running Redis instance accessible with the provided URL and Token
    # For local testing, you might use a local Redis and adjust REDIS_URL/TOKEN in config.py
    # or pass them directly:
    # test_redis_url = "redis://localhost:6379"
    # test_event_service = AdkEventService(session_id="test_session_001", redis_url=test_redis_url, redis_token=None)

    # Ensure your config.py has valid REDIS_URL and REDIS_TOKEN for this to run
    # or provide them directly to AdkEventService constructor.
    print(f"Attempting to connect to Redis at {REDIS_URL}")
    if not REDIS_URL or not REDIS_TOKEN or "YOUR_REDIS_URL" in REDIS_URL:
        print("Skipping AdkEventService example: REDIS_URL or REDIS_TOKEN not configured in config.py")
    else:
        try:
            event_service = AdkEventService(session_id="test_session_123")
            test_event = MockPlanningStartedEvent(topic="Test Research Topic")
            event_service.add_event(test_event)
            print(f"Test event sent. Check Redis stream 'research:test_session_123:stream'")
        except Exception as e:
            print(f"Could not run AdkEventService example: {e}")

    # To verify, you can use redis-cli:
    # XRANGE research:test_session_123:stream - +
    # Or check your Upstash console.
    pass
