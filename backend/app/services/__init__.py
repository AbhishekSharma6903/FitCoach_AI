from app.services.calculation_engine import (
    calculate_bmr, calculate_tdee, calculate_target_calories,
    calculate_bmi, calculate_macros, compute_milestones, get_next_milestone
)
from app.services.food_service import fuzzy_search_foods
from app.services.ai_coach_stub import get_ai_coaching_response

__all__ = [
    "calculate_bmr", "calculate_tdee", "calculate_target_calories",
    "calculate_bmi", "calculate_macros", "compute_milestones", "get_next_milestone",
    "fuzzy_search_foods",
    "get_ai_coaching_response",
]
