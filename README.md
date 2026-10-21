# skills

Agent skills I maintain for Claude Code, Codex, Cursor and other harnesses that read `SKILL.md` folders.

| Skill | What it does |
|---|---|
| [`hyrums-law`](skills/hyrums-law/SKILL.md) | Before changing or exposing anything other code, agents or users can observe, inventory what is observable, find who depends on it, and migrate them. Also audits settings screens: cut, infer or hide knobs, and keep data controls visible. |

## Install

- **Cicada:** add `rorosaga/skills` on the Skills page and choose which agents get each skill.
- **skills CLI:** `npx skills add rorosaga/skills`
- **By hand:** copy or symlink `skills/<name>` into `~/.claude/skills/` (all projects) or `<repo>/.claude/skills/` (one project).

## Tests

Each skill keeps its test cases in `evals/`, in the layout `claude plugin eval` reads. From a skill's folder:

```
claude plugin eval . --allow-tools Write,Edit,Bash --scaffold
```

These are real model runs and count against your plan.
