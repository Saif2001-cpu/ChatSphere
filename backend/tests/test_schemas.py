"""Unit tests for the user schemas."""

import pytest
from pydantic import ValidationError

from app.schemas.user_schema import (
    UserBase,
    UserCreate,
    UserLogin,
    UserInDB,
    UserPublic,
    Token,
    TokenData,
)


class TestUserBase:
    """Tests for the UserBase schema."""

    def test_user_base_valid(self):
        """Test creating a valid UserBase."""
        user = UserBase(email="test@example.com", username="testuser")
        assert user.email == "test@example.com"
        assert user.username == "testuser"

    def test_user_base_invalid_email(self):
        """Test that invalid email raises ValidationError."""
        with pytest.raises(ValidationError):
            UserBase(email="invalid-email", username="testuser")

    def test_user_base_username_too_short(self):
        """Test that username shorter than 3 characters raises ValidationError."""
        with pytest.raises(ValidationError):
            UserBase(email="test@example.com", username="ab")

    def test_user_base_username_too_long(self):
        """Test that username longer than 50 characters raises ValidationError."""
        with pytest.raises(ValidationError):
            UserBase(email="test@example.com", username="a" * 51)

    def test_user_base_username_exact_min_length(self):
        """Test username with exactly 3 characters."""
        user = UserBase(email="test@example.com", username="abc")
        assert user.username == "abc"

    def test_user_base_username_exact_max_length(self):
        """Test username with exactly 50 characters."""
        user = UserBase(email="test@example.com", username="a" * 50)
        assert user.username == "a" * 50


class TestUserCreate:
    """Tests for the UserCreate schema."""

    def test_user_create_valid(self):
        """Test creating a valid UserCreate."""
        user = UserCreate(
            email="test@example.com", username="testuser", password="password123"
        )
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.password == "password123"

    def test_user_create_password_too_short(self):
        """Test that password shorter than 6 characters raises ValidationError."""
        with pytest.raises(ValidationError):
            UserCreate(
                email="test@example.com", username="testuser", password="12345"
            )

    def test_user_create_password_exact_min_length(self):
        """Test password with exactly 6 characters."""
        user = UserCreate(
            email="test@example.com", username="testuser", password="123456"
        )
        assert user.password == "123456"

    def test_user_create_missing_password(self):
        """Test that missing password raises ValidationError."""
        with pytest.raises(ValidationError):
            UserCreate(email="test@example.com", username="testuser")


class TestUserLogin:
    """Tests for the UserLogin schema."""

    def test_user_login_valid(self):
        """Test creating a valid UserLogin."""
        login = UserLogin(email="test@example.com", password="password123")
        assert login.email == "test@example.com"
        assert login.password == "password123"

    def test_user_login_invalid_email(self):
        """Test that invalid email raises ValidationError."""
        with pytest.raises(ValidationError):
            UserLogin(email="not-an-email", password="password123")

    def test_user_login_missing_password(self):
        """Test that missing password raises ValidationError."""
        with pytest.raises(ValidationError):
            UserLogin(email="test@example.com")


class TestUserInDB:
    """Tests for the UserInDB schema."""

    def test_user_in_db_valid(self):
        """Test creating a valid UserInDB."""
        user = UserInDB(
            id="507f1f77bcf86cd799439011",
            email="test@example.com",
            username="testuser",
            hashed_password="$argon2id$v=19$m=65536,t=3,p=4$abc123$xyz789",
        )
        assert user.id == "507f1f77bcf86cd799439011"
        assert user.email == "test@example.com"
        assert user.hashed_password == "$argon2id$v=19$m=65536,t=3,p=4$abc123$xyz789"
        assert user.friends == []

    def test_user_in_db_with_friends(self):
        """Test UserInDB with friends list."""
        user = UserInDB(
            id="507f1f77bcf86cd799439011",
            email="test@example.com",
            username="testuser",
            hashed_password="$argon2id$v=19$m=65536,t=3,p=4$abc123$xyz789",
            friends=["friend1", "friend2"],
        )
        assert user.friends == ["friend1", "friend2"]

    def test_user_in_db_with_last_login_salt(self):
        """Test UserInDB with last_login_salt."""
        user = UserInDB(
            id="507f1f77bcf86cd799439011",
            email="test@example.com",
            username="testuser",
            hashed_password="$argon2id$v=19$m=65536,t=3,p=4$abc123$xyz789",
            last_login_salt="507f1f77bcf86cd799439011",
        )
        assert user.last_login_salt == "507f1f77bcf86cd799439011"

    def test_user_in_db_missing_required_fields(self):
        """Test that missing required fields raises ValidationError."""
        with pytest.raises(ValidationError):
            UserInDB(hashed_password="$argon2id$...")


class TestUserPublic:
    """Tests for the UserPublic schema."""

    def test_user_public_valid(self):
        """Test creating a valid UserPublic."""
        user = UserPublic(
            id="507f1f77bcf86cd799439011",
            email="test@example.com",
            username="testuser",
        )
        assert user.id == "507f1f77bcf86cd799439011"
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.friends == []

    def test_user_public_with_friends(self):
        """Test UserPublic with friends list."""
        user = UserPublic(
            id="507f1f77bcf86cd799439011",
            email="test@example.com",
            username="testuser",
            friends=["friend_id_1", "friend_id_2"],
        )
        assert user.friends == ["friend_id_1", "friend_id_2"]

    def test_user_public_no_hashed_password(self):
        """Test that UserPublic doesn't expose hashed_password."""
        user = UserPublic(
            id="507f1f77bcf86cd799439011",
            email="test@example.com",
            username="testuser",
        )
        # hashed_password should not be an attribute of UserPublic
        assert not hasattr(user, "hashed_password") or "hashed_password" not in user.model_fields


class TestToken:
    """Tests for the Token schema."""

    def test_token_valid(self):
        """Test creating a valid Token."""
        token = Token(access_token="eyJhbGciOiJIUzI1NiIs...", token_type="bearer")
        assert token.access_token == "eyJhbGciOiJIUzI1NiIs..."
        assert token.token_type == "bearer"

    def test_token_default_token_type(self):
        """Test that token_type defaults to 'bearer'."""
        token = Token(access_token="eyJhbGciOiJIUzI1NiIs...")
        assert token.token_type == "bearer"

    def test_token_custom_token_type(self):
        """Test creating a token with custom token_type."""
        token = Token(access_token="eyJhbGciOiJIUzI1NiIs...", token_type="custom")
        assert token.token_type == "custom"


class TestTokenData:
    """Tests for the TokenData schema."""

    def test_token_data_with_user_id(self):
        """Test creating TokenData with user_id."""
        data = TokenData(user_id="507f1f77bcf86cd799439011")
        assert data.user_id == "507f1f77bcf86cd799439011"

    def test_token_data_without_user_id(self):
        """Test creating TokenData without user_id."""
        data = TokenData()
        assert data.user_id is None
