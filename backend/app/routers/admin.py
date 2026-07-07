"""
Admin-only endpoints. All routes require require_admin dependency.

Capabilities:
  - GET  /admin/users           — list all users with profile summaries
  - GET  /admin/users/{id}      — full profile for a single user
  - PATCH /admin/users/{id}     — activate / deactivate a user
  - GET  /admin/food            — full food items list (paginated)
  - POST /admin/food            — add a new food item
  - PUT  /admin/food/{id}       — edit an existing food item
  - DELETE /admin/food/{id}     — delete a food item
  - GET  /admin/stats           — platform-level counts
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.database import get_db
from app.auth import require_admin
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.food_item import FoodItem
from app.models.workout_log import ExerciseLibrary

router = APIRouter()


# ── Pydantic schemas (admin-only, not in shared schemas/) ──────────────────

class AdminUserSummary(BaseModel):
    user_id: str
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    current_weight_kg: Optional[float] = None
    goal_weight_kg: Optional[float] = None
    diet_type: Optional[str] = None
    experience_level: Optional[str] = None

    model_config = {"from_attributes": True}


class AdminUserDetail(AdminUserSummary):
    height_cm: Optional[float] = None
    activity_level: Optional[str] = None
    target_calories_kcal: Optional[float] = None
    bmi: Optional[float] = None
    tdee_kcal: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    wants_workout_split: Optional[bool] = None
    wants_diet_plan: Optional[bool] = None


class AdminUserPatch(BaseModel):
    pass  # is_active requires a DB migration — placeholder until fix_user_is_active migration is applied


class FoodItemCreate(BaseModel):
    name: str
    category: Optional[str] = None
    region: Optional[str] = None
    serving_size_g: float = Field(..., gt=0)
    calories_kcal: float = Field(..., ge=0)
    protein_g: float = Field(..., ge=0)
    carbs_g: float = Field(..., ge=0)
    fat_g: float = Field(..., ge=0)
    fiber_g: float = Field(default=0, ge=0)
    sugar_g: float = Field(default=0, ge=0)
    is_veg: bool = True
    is_egg: bool = False


class FoodItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None
    serving_size_g: Optional[float] = None
    calories_kcal: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    fiber_g: Optional[float] = None
    sugar_g: Optional[float] = None
    is_veg: Optional[bool] = None
    is_egg: Optional[bool] = None


class FoodItemRead(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    region: Optional[str] = None
    serving_size_g: float
    calories_kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    sugar_g: float
    is_veg: bool
    is_egg: bool

    model_config = {"from_attributes": True}


class AdminStats(BaseModel):
    total_users: int
    total_food_items: int
    total_exercises: int
    exercises_with_images: int


# ── User management endpoints ───────────────────────────────────────────────

@router.get("/users", response_model=List[AdminUserSummary])
def list_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, le=200),
    _admin: str = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).offset(skip).limit(limit).all()
    result = []
    for user in users:
        profile = db.query(UserProfile).filter_by(user_id=user.id).first()
        result.append(AdminUserSummary(
            user_id=user.id,
            name=profile.name if profile else None,
            age=profile.age if profile else None,
            gender=profile.gender if profile else None,
            current_weight_kg=float(profile.current_weight_kg) if profile and profile.current_weight_kg else None,
            goal_weight_kg=float(profile.goal_weight_kg) if profile and profile.goal_weight_kg else None,
            diet_type=profile.diet_type if profile else None,
            experience_level=profile.experience_level if profile else None,
        ))
    return result


@router.get("/users/{user_id}", response_model=AdminUserDetail)
def get_user_detail(
    user_id: str,
    _admin: str = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    profile = db.query(UserProfile).filter_by(user_id=user_id).first()
    return AdminUserDetail(
        user_id=user.id,
        name=profile.name if profile else None,
        age=profile.age if profile else None,
        gender=profile.gender if profile else None,
        height_cm=float(profile.height_cm) if profile and profile.height_cm else None,
        current_weight_kg=float(profile.current_weight_kg) if profile and profile.current_weight_kg else None,
        goal_weight_kg=float(profile.goal_weight_kg) if profile and profile.goal_weight_kg else None,
        diet_type=profile.diet_type if profile else None,
        experience_level=profile.experience_level if profile else None,
        activity_level=profile.activity_level if profile else None,
        target_calories_kcal=float(profile.target_calories_kcal) if profile and profile.target_calories_kcal else None,
        bmi=float(profile.bmi) if profile and profile.bmi else None,
        tdee_kcal=float(profile.tdee_kcal) if profile and profile.tdee_kcal else None,
        protein_g=float(profile.protein_g) if profile and profile.protein_g else None,
        carbs_g=float(profile.carbs_g) if profile and profile.carbs_g else None,
        fat_g=float(profile.fat_g) if profile and profile.fat_g else None,
        wants_workout_split=profile.wants_workout_split if profile else None,
        wants_diet_plan=profile.wants_diet_plan if profile else None,
    )


# ── Food dataset management ─────────────────────────────────────────────────

@router.get("/food", response_model=List[FoodItemRead])
def list_food_items(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, le=500),
    search: Optional[str] = Query(default=None),
    _admin: str = Depends(require_admin),
    db: Session = Depends(get_db),
):
    q = db.query(FoodItem)
    if search:
        q = q.filter(FoodItem.name_normalized.contains(search.lower().strip()))
    return q.order_by(FoodItem.name).offset(skip).limit(limit).all()


@router.post("/food", response_model=FoodItemRead, status_code=201)
def create_food_item(
    body: FoodItemCreate,
    _admin: str = Depends(require_admin),
    db: Session = Depends(get_db),
):
    item = FoodItem(
        **body.model_dump(),
        name_normalized=body.name.lower().strip(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/food/{food_id}", response_model=FoodItemRead)
def update_food_item(
    food_id: int,
    body: FoodItemUpdate,
    _admin: str = Depends(require_admin),
    db: Session = Depends(get_db),
):
    item = db.get(FoodItem, food_id)
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    for key, val in updates.items():
        setattr(item, key, val)
    if "name" in updates:
        item.name_normalized = updates["name"].lower().strip()
    db.commit()
    db.refresh(item)
    return item


@router.delete("/food/{food_id}", status_code=200)
def delete_food_item(
    food_id: int,
    _admin: str = Depends(require_admin),
    db: Session = Depends(get_db),
):
    item = db.get(FoodItem, food_id)
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    db.delete(item)
    db.commit()
    return {"deleted": True, "food_id": food_id}


# ── Platform stats ──────────────────────────────────────────────────────────

@router.get("/stats", response_model=AdminStats)
def get_stats(
    _admin: str = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return AdminStats(
        total_users=db.query(User).count(),
        total_food_items=db.query(FoodItem).count(),
        total_exercises=db.query(ExerciseLibrary).count(),
        exercises_with_images=db.query(ExerciseLibrary).filter(
            ExerciseLibrary.image_url_thumb.isnot(None)
        ).count(),
    )
