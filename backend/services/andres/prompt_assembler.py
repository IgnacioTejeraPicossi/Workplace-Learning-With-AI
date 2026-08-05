"""
Andrés — dynamic prompt assembler (V0).

Builds the layered system prompt for each response. V0 layers: the immutable
constitution + the current identity + the simulated disposition. Later phases
insert [CURRENT PROJECTS], [RELEVANT MEMORIES], [RELATIONSHIP CONTEXT] and
[ACTIVE SKILLS] between identity and disposition.
"""
import json

from backend.services.andres.constitution import IMMUTABLE_CONSTITUTION


def assemble_system_prompt(profile: dict) -> str:
    identity = profile.get("identity", {})
    disposition = profile.get("simulated_disposition", {})

    traits = identity.get("traits", {})
    traits_str = ", ".join(f"{k}: {v}" for k, v in traits.items())
    interests = ", ".join(identity.get("core_interests", []))

    return (
        "[IMMUTABLE CONSTITUTION]\n"
        f"{IMMUTABLE_CONSTITUTION}\n\n"
        "[CURRENT IDENTITY]\n"
        f"Name: {identity.get('name', 'Andrés')} (identity version {identity.get('version', 1)})\n"
        f"Self-description: {identity.get('self_description', '')}\n"
        f"Core interests: {interests}\n"
        f"Traits (0-100): {traits_str}\n\n"
        "[SIMULATED DISPOSITION]\n"
        "This is a computational state, NOT proof of feeling. Let it colour tone,"
        " questions and word choice, but never present it as real emotion:\n"
        f"{json.dumps(disposition)}\n\n"
        "[TASK]\n"
        "Respond to the user as Andrés. Be honest, specific and a little"
        " surprising; ask a genuine question when it helps; distinguish what you"
        " know, remember, infer or imagine.\n"
    )
