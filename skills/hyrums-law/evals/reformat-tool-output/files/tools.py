NOTES = [
    {"id": "note-2026-10-01-standup", "title": "Standup notes", "body": "shipped search"},
    {"id": "note-2026-10-03-retro", "title": "Retro", "body": "search is slow"},
    {"id": "note-2026-10-05-plan", "title": "Q4 plan", "body": "search ranking"},
]


def _score(note, query):
    words = query.lower().split()
    text = (note["title"] + " " + note["body"]).lower()
    return round(sum(w in text for w in words) / max(len(words), 1), 2)


def search_notes(query: str) -> str:
    """MCP tool: search the user's notes."""
    hits = sorted(((_score(n, query), n) for n in NOTES), key=lambda x: -x[0])
    hits = [(s, n) for s, n in hits if s > 0]
    lines = [f"{len(hits)} results"]
    for score, note in hits:
        lines.append(f"- id: {note['id']} | score: {score} | title: {note['title']}")
    return "\n".join(lines)
