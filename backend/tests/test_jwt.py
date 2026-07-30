"""Unit tests for the JWT utility module."""

import os
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch

# Set environment variables before importing app modules that depend on settings
os.environ["JWT_SECRET_KEY"] = "test_secret_key_for_testing_only"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
os.environ["MONGO_URI"] = "mongodb://localhost:27017"
os.environ["MONGO_DB_NAME"] = "test_db"
os.environ["CLOUDINARY_CLOUD_NAME"] = "test_cloud"
os.environ["CLOUDINARY_API_KEY"] = "test_key"
os.environ["CLOUDINARY_API_SECRET"] = "test_secret"

from app.utils.jwt import create_access_token, decode_token


class TestCreateAccessToken:
    """Tests for the create_access_token function."""

    def test_create_access_token_returns_string(self):
        """Test that create_access_token returns a string."""
        data = {"sub": "user123"}
        result = create_access_token(data)
        assert isinstance(result, str)

    def test_create_access_token_with_custom_expiry(self):
        """Test creating token with custom expiration time."""
        data = {"sub": "user123"}
        expires_delta = timedelta(hours=2)
        result = create_access_token(data, expires_delta=expires_delta)
        assert isinstance(result, str)

    def test_create_access_token_contains_payload_data(self):
        """Test that the token contains the payload data."""
        data = {"sub": "user123", "custom_field": "custom_value"}
        token = create_access_token(data)
        
        # Decode to verify content (using same secret)
        from jose import jwt
        decoded = jwt.decode(token, os.environ["JWT_SECRET_KEY"], algorithms=[os.environ["JWT_ALGORITHM"]])
        assert decoded["sub"] == "user123"
        assert decoded["custom_field"] == "custom_value"
        assert "exp" in decoded

    def test_create_access_token_has_expiration(self):
        """Test that created token has expiration claim."""
        data = {"sub": "user123"}
        token = create_access_token(data)
        
        from jose import jwt
        decoded = jwt.decode(token, os.environ["JWT_SECRET_KEY"], algorithms=[os.environ["JWT_ALGORITHM"]])
        assert "exp" in decoded
        exp_timestamp = decoded["exp"]
        # Expiration should be in the future
        assert exp_timestamp > datetime.utcnow().timestamp()


class TestDecodeToken:
    """Tests for the decode_token function."""

    def test_decode_valid_token(self):
        """Test decoding a valid token."""
        # Create a token first
        data = {"sub": "user123", "username": "testuser"}
        token = create_access_token(data)
        
        # Decode it
        result = decode_token(token)
        assert result is not None
        assert result["sub"] == "user123"
        assert result["username"] == "testuser"

    def test_decode_invalid_token(self):
        """Test decoding an invalid token returns None."""
        result = decode_token("invalid.token.here")
        assert result is None

    def test_decode_empty_string(self):
        """Test decoding an empty string returns None."""
        result = decode_token("")
        assert result is None

    def test_decode_tampered_token(self):
        """Test decoding a tampered token returns None."""
        # Create a valid token
        data = {"sub": "user123"}
        token = create_access_token(data)
        
        # Tamper with the token
        parts = token.split(".")
        tampered_token = parts[0] + "." + "tampered" + "." + parts[2]
        
        result = decode_token(tampered_token)
        assert result is None

    def test_decode_wrong_secret(self):
        """Test decoding token with wrong secret returns None."""
        # Create token with one secret
        from jose import jwt
        data = {"sub": "user123"}
        token = jwt.encode(data, "different_secret", algorithm="HS256")
        
        # Try to decode with different secret (via decode_token which uses settings)
        result = decode_token(token)
        assert result is None
