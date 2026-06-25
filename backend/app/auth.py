"""
Clerk JWT verification and FastAPI auth dependencies.

Flow:
  1. User logs in on frontend via Clerk → gets a session JWT
  2. Frontend sends: Authorization: Bearer <clerk_session_token>
  3. Backend verifies the token against Clerk's JWKS (public keys)
  4. Extracts user_id from JWT `sub` claim (e.g. "user_2abc123")
  5. Auto-creates a DB User row on first login (upsert)
"""

import logging
import time
from functools import lru_cache
from typing import Optional

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)

# ── JWKS cache (refresh every 60 min) ──────────────────────────────────────

_jwks_cache: dict = {}
_jwks_fetched_at: float = 0
_JWKS_TTL = 3600  # seconds


def _get_jwks() -> dict:
    global _jwks_cache, _jwks_fetched_at
    if time.time() - _jwks_fetched_at < _JWKS_TTL and _jwks_cache:
        return _jwks_cache
    try:
        response = httpx.get(settings.CLERK_JWKS_URL, timeout=5.0)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_fetched_at = time.time()
        return _jwks_cache
    except Exception as e:
        logger.error("Failed to fetch Clerk JWKS: %s", e)
        if _jwks_cache:
            return _jwks_cache  # serve stale cache rather than crashing
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service unavailable. Could not fetch signing keys.",
        )


def _verify_clerk_token(token: str) -> dict:
    """Verify a Clerk JWT and return its payload."""
    if not settings.CLERK_JWKS_URL or "REPLACE_ME" in settings.CLERK_JWKS_URL:
        # Dev mode: accept any token whose `sub` is DEV_USER_ID
        # Remove this branch after Clerk keys are configured
        return {"sub": settings.DEV_USER_ID, "dev_mode": True}

    try:
        jwks = _get_jwks()
        # Decode without verification first to get the kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Find matching key
        signing_key = None
        for key_data in jwks.get("keys", []):
            if key_data.get("kid") == kid:
                signing_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)
                break

        if signing_key is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: signing key not found.",
            )

        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            options={"verify_aud": False},  # Clerk tokens may not have aud claim
        )
        return payload

    except jwt.ExpiredSignatureError:
        logger.warning("AUTH: token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
        )
    except jwt.InvalidTokenError as e:
        logger.warning("AUTH: invalid token: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )


def _upsert_user(user_id: str, db: Session) -> User:
    """Create a DB User row if this is the first login."""
    user = db.get(User, user_id)
    if not user:
        user = User(id=user_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


# ── FastAPI dependencies ────────────────────────────────────────────────────

def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> str:
    """
    Dependency: extracts and verifies the Clerk JWT, returns the user_id (sub).
    Auto-creates a DB User row on first login.
    """
    if credentials is None:
        logger.warning("AUTH: no credentials provided (credentials is None)")
        # Dev fallback — only active when Clerk keys not configured
        if not settings.CLERK_JWKS_URL or "REPLACE_ME" in settings.CLERK_JWKS_URL:
            _upsert_user(settings.DEV_USER_ID, db)
            return settings.DEV_USER_ID
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Provide a Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    logger.info("AUTH: got token (first 20 chars): %s...", credentials.credentials[:20])
    payload = _verify_clerk_token(credentials.credentials)
    user_id: str = payload.get("sub", "")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim.",
        )

    _upsert_user(user_id, db)
    return user_id


def require_admin(
    user_id: str = Depends(get_current_user_id),
) -> str:
    """
    Dependency: same as get_current_user_id but also asserts admin role.
    Admin IDs are configured via ADMIN_USER_IDS in .env.
    """
    admin_ids = settings.get_admin_ids()
    if user_id not in admin_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return user_id
