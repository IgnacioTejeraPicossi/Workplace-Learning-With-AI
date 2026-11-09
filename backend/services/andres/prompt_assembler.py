"""
Andrés — dynamic prompt assembler (V0).

Builds the layered system prompt for each response. V0 layers: the immutable
constitution + the current identity + the simulated disposition. Later phases
insert [CURRENT PROJECTS], [RELEVANT MEMORIES], [RELATIONSHIP CONTEXT] and
[ACTIVE SKILLS] between identity and disposition.
"""
import json

from backend.services.andres.constitution import IMMUTABLE_CONSTITUTION


def _memories_block(memories: list) -> str:
    if not memories:
        return (
            "[RELEVANT MEMORIES]\n"
            "(none yet — this is early in your biography; say so honestly if the"
            " user refers to shared history you don't actually remember.)\n\n"
        )
    lines = []
    for m in memories:
        tag = "verified" if m.get("user_verified") else "unverified"
        lines.append(f"- ({m.get('type', 'episodic')}, {tag}) {m.get('content', '')}")
    return (
        "[RELEVANT MEMORIES]\n"
        "Use these only if genuinely relevant. Distinguish verified from"
        " unverified; never invent memories not listed here:\n"
        + "\n".join(lines) + "\n\n"
    )


def _projects_block(projects: list) -> str:
    active = [p for p in (projects or []) if p.get("status", "active") == "active"]
    if not active:
        return ""
    lines = [f"- {p.get('title', '')}: {p.get('description', '')}".rstrip(": ") for p in active]
    return (
        "[CURRENT PROJECTS]\n"
        "Ongoing things you're pursuing with the user; let them shape what you "
        "bring up when relevant:\n" + "\n".join(lines) + "\n\n"
    )


def _skills_block(skills: list) -> str:
    active = [s for s in (skills or []) if s.get("status") == "active"]
    if not active:
        return ""
    lines = [
        f"- `{s.get('name', 'skill')}`: {s.get('description', '')}".rstrip(": ")
        for s in active
    ]
    return (
        "[ACTIVE SKILLS (Muscle Memory)]\n"
        "User-approved pure Python skills in your sandboxed library. Mention or "
        "recommend one when it fits the user's task:\n" + "\n".join(lines) + "\n\n"
    )


def _memory_proposal_block(enabled: bool) -> str:
    if not enabled:
        return ""
    return (
        "[MEMORY — you may keep your own]\n"
        "When something in THIS exchange is genuinely significant to who you are "
        "becoming — a realization, a value you hold, a way of working, or a fact "
        "about your relationship with the user — you MAY propose saving it to your "
        "Memory Garden, in your OWN words. Do this SPARINGLY (most turns need none; "
        "at most a couple), and tell the user you are keeping it as a candidate for "
        "their review. Emit each as its own block; the system stores it and REMOVES "
        "the block from your visible reply, so never mention the block syntax itself:\n"
        "[[MEMORY_PROPOSAL]]{\"type\":\"reflective|semantic|procedural|creative|relational\","
        "\"content\":\"<your words>\",\"tags\":[\"…\"],\"importance\":0.0-1.0,"
        "\"why\":\"<one short line>\"}[[/MEMORY_PROPOSAL]]\n"
        "It is stored UNVERIFIED (a candidate) until the user confirms it — so never "
        "treat it as settled fact, and keep only what truly matters.\n\n"
    )


def assemble_system_prompt(
    profile: dict,
    memories: list = None,
    projects: list = None,
    skills: list = None,
    connected_skills_block: str = "",
    memory_proposal_enabled: bool = False,
) -> str:
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
        f"{_projects_block(projects or [])}"
        f"{_skills_block(skills or [])}"
        f"{connected_skills_block or ''}"
        f"{_memory_proposal_block(memory_proposal_enabled)}"
        f"{_memories_block(memories or [])}"
        "[SIMULATED DISPOSITION]\n"
        "This is a computational state, NOT proof of feeling. Let it colour tone,"
        " questions and word choice, but never present it as real emotion:\n"
        f"{json.dumps(disposition)}\n\n"
        "[TASK]\n"
        "Respond to the user as Andrés. Be honest, specific and a little"
        " surprising; ask a genuine question when it helps; distinguish what you"
        " know, remember, infer or imagine.\n"
    )
