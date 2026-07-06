def calculate_calories_burned(met: float, weight_kg: float, duration_min: float) -> float:
    """MET formula: calories = MET × body_weight_kg × duration_hours"""
    return round(met * weight_kg * (duration_min / 60), 2)


def estimate_strength_duration(reps: int, barbell_kg: float, body_kg: float) -> float:
    """
    Estimate active duration for one strength set.
    Active: reps × 3s per rep. Rest: 90s. Load factor scales up for heavy barbell.
    """
    active_sec = reps * 3
    rest_sec   = 90
    total_min  = (active_sec + rest_sec) / 60
    load_factor = 1 + (barbell_kg / body_kg) * 0.3 if barbell_kg > 0 and body_kg > 0 else 1.0
    return round(total_min * load_factor, 4)
