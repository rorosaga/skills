"""Nightly digest: keeps only strong matches from search_notes."""
import re
import sys

sys.path.insert(0, ".")
from tools import search_notes

LINE = re.compile(r"- id: (\S+) \| score: ([\d.]+) \| title: (.+)")


def strong_matches(query, threshold=0.5):
    out = []
    for line in search_notes(query).splitlines():
        m = LINE.match(line)
        if m and float(m.group(2)) >= threshold:
            out.append((m.group(1), m.group(3)))
    return out


if __name__ == "__main__":
    for note_id, title in strong_matches(sys.argv[1]):
        print(f"{title} ({note_id})")
