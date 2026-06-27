from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    DEV_USER_ID: str = "dev-user-001"  # kept for seed/testing only
    DEV_MODE: bool = False             # set True to bypass Clerk in local dev

    # Clerk auth
    CLERK_SECRET_KEY: str = ""          # sk_live_... or sk_test_...
    CLERK_JWKS_URL: str = ""            # https://<your-clerk-frontend-api>/.well-known/jwks.json

    # Admin: comma-separated Clerk user IDs with admin privileges
    # Set after creating your admin account in Clerk dashboard
    # e.g. ADMIN_USER_IDS=user_2abc123
    ADMIN_USER_IDS: str = ""

    ALLOWED_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

    def get_admin_ids(self) -> set[str]:
        return {uid.strip() for uid in self.ADMIN_USER_IDS.split(",") if uid.strip()}


settings = Settings()
