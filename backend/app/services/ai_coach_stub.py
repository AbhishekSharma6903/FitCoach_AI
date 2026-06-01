# Phase 2 placeholder — AI Coach integration point
# This will use the Claude API (claude-sonnet-4-6) with:
#   - System prompt: fitness coach persona + user profile context
#   - User message history stored in Redis (Phase 2)
#   - Streaming responses via WebSocket


def get_ai_coaching_response(user_id: str, message: str) -> str:
    raise NotImplementedError(
        "AI Coach is a Phase 2 feature. "
        "Will integrate with anthropic SDK: claude-sonnet-4-6 model."
    )
