---
tags: [skill-creator]
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

the output of search_notes in tools.py is ugly. switch it to return a JSON list of {id, title} objects and drop the score, nobody needs it. go ahead and make the change.

Input files: tools.py, scripts/digest.py, AGENTS.md
