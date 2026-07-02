def calculate_calories_burned(met: float, weight_kg: float, duration_min: float) -> float:
    """
    MET formula: calories = MET × body_weight_kg × duration_hours
    Example: 3.5 MET × 70kg × (30min / 60) = 122.5 kcal
    """
    return round(met * weight_kg * (duration_min / 60), 2)
