"""Unit tests for the hashing utility module."""

import pytest
from app.utils.hashing import hash_password, verify_password


class TestHashPassword:
    """Tests for the hash_password function."""

    def test_hash_password_returns_string(self):
        """Test that hash_password returns a string."""
        result = hash_password("testpassword123")
        assert isinstance(result, str)

    def test_hash_password_different_hashes_for_same_password(self):
        """Test that hashing the same password twice produces different hashes (due to salt)."""
        password = "samepassword"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        # Argon2 uses random salt, so hashes should be different
        assert hash1 != hash2

    def test_hash_password_different_passwords_different_hashes(self):
        """Test that different passwords produce different hashes."""
        hash1 = hash_password("password1")
        hash2 = hash_password("password2")
        assert hash1 != hash2

    def test_hash_password_empty_string(self):
        """Test hashing an empty string."""
        result = hash_password("")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_hash_password_long_password(self):
        """Test hashing a very long password."""
        long_password = "a" * 1000
        result = hash_password(long_password)
        assert isinstance(result, str)


class TestVerifyPassword:
    """Tests for the verify_password function."""

    def test_verify_password_correct_password(self):
        """Test that verify_password returns True for correct password."""
        password = "correctpassword"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True

    def test_verify_password_wrong_password(self):
        """Test that verify_password returns False for wrong password."""
        password = "correctpassword"
        wrong_password = "wrongpassword"
        hashed = hash_password(password)
        assert verify_password(wrong_password, hashed) is False

    def test_verify_password_empty_password(self):
        """Test verifying empty password."""
        password = ""
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True
        assert verify_password("notempty", hashed) is False

    def test_verify_password_case_sensitive(self):
        """Test that password verification is case-sensitive."""
        password = "Password123"
        hashed = hash_password(password)
        # Different cases should fail
        assert verify_password("password123", hashed) is False
        assert verify_password("PASSWORD123", hashed) is False
        assert verify_password("Password123", hashed) is True

    def test_verify_password_invalid_hash(self):
        """Test verifying password against an invalid hash format."""
        with pytest.raises(Exception):
            verify_password("anypassword", "invalid_hash_format")

    def test_verify_password_unicode_password(self):
        """Test verifying password with unicode characters."""
        password = "пароль🔐密码"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True
        assert verify_password("different", hashed) is False
