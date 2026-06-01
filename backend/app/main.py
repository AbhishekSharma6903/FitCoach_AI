from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.routers import profile, food, weight, dashboard, water, admin
from app.auth import get_current_user_id
from app.config import settings

app = FastAPI(title="FitCoach AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router, prefix="/api/v1/profile", tags=["profile"])
app.include_router(food.router, prefix="/api/v1/food", tags=["food"])
app.include_router(weight.router, prefix="/api/v1/weight", tags=["weight"])
app.include_router(water.router, prefix="/api/v1/water", tags=["water"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/api/v1/me")
def whoami(user_id: str = Depends(get_current_user_id)):
    """Returns the authenticated user's Clerk ID and whether they are admin."""
    return {
        "user_id": user_id,
        "is_admin": user_id in settings.get_admin_ids(),
        "admin_ids_configured": list(settings.get_admin_ids()),
    }
