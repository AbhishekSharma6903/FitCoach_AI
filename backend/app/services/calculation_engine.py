from datetime import date, timedelta
from typing import List

ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.200,
    "light": 1.375,
    "moderate": 1.550,
    "intense": 1.725,
    "very_intense": 1.900,
}

CALORIE_SAFETY_FLOOR = {"male": 1400.0, "female": 1200.0, "other": 1300.0}


def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    base = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)
    if gender == "male":
        return base + 5
    elif gender == "female":
        return base - 161
    else:
        return ((base + 5) + (base - 161)) / 2


def calculate_tdee(bmr: float, activity_level: str) -> float:
    return bmr * ACTIVITY_MULTIPLIERS[activity_level]


def calculate_target_calories(
    tdee: float,
    current_weight_kg: float,
    goal_weight_kg: float,
    weeks: int,
    gender: str,
) -> float:
    weekly_delta_kg = (goal_weight_kg - current_weight_kg) / weeks
    daily_calorie_delta = (weekly_delta_kg * 7700) / 7
    target = tdee + daily_calorie_delta
    floor = CALORIE_SAFETY_FLOOR.get(gender, 1300.0)
    return max(target, floor)


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    height_m = height_cm / 100
    return weight_kg / (height_m ** 2)


def calculate_macros(
    target_calories: float, diet_type: str, goal_weight_kg: float
) -> dict:
    protein_g = (target_calories * 0.30) / 4
    carbs_g = (target_calories * 0.40) / 4
    fat_g = (target_calories * 0.30) / 9

    # For veg/egg, enforce minimum protein of 1.6g × goal_weight_kg
    if diet_type in ("veg", "egg"):
        min_protein = 1.6 * goal_weight_kg
        if min_protein > protein_g:
            extra_protein_cals = (min_protein - protein_g) * 4
            carbs_g = max(0, carbs_g - extra_protein_cals / 4)
            protein_g = min_protein

    return {
        "protein_g": round(protein_g, 1),
        "carbs_g": round(carbs_g, 1),
        "fat_g": round(fat_g, 1),
    }


def compute_milestones(
    current_weight_kg: float,
    goal_weight_kg: float,
    time_to_reach_goal_weeks: int,
) -> List[dict]:
    total_delta = goal_weight_kg - current_weight_kg
    if total_delta == 0 or time_to_reach_goal_weeks == 0:
        return []

    weekly_delta_kg = total_delta / time_to_reach_goal_weeks
    today = date.today()
    milestone_pcts = [0.05, 0.25, 0.50, 0.75, 1.00]
    milestones = []

    for pct in milestone_pcts:
        milestone_weight = current_weight_kg + (total_delta * pct)
        if weekly_delta_kg != 0:
            weeks_needed = abs((milestone_weight - current_weight_kg) / weekly_delta_kg)
        else:
            weeks_needed = 0
        estimated_date = today + timedelta(weeks=weeks_needed)
        milestones.append(
            {
                "label": f"{int(pct * 100)}% to goal",
                "target_weight_kg": round(milestone_weight, 2),
                "estimated_date": estimated_date.isoformat(),
                "weeks_away": round(weeks_needed, 1),
            }
        )

    return milestones


def get_next_milestone(
    current_logged_weight_kg: float,
    goal_weight_kg: float,
    milestones: List[dict],
) -> dict | None:
    losing = goal_weight_kg < current_logged_weight_kg
    for m in milestones:
        target = m["target_weight_kg"]
        if losing and target < current_logged_weight_kg:
            return m
        elif not losing and target > current_logged_weight_kg:
            return m
    return milestones[-1] if milestones else None
