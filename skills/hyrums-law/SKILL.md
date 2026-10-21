---
name: hyrums-law
description: Apply Hyrum's Law before changing or exposing anything that other code, agents, or users can observe, and when simplifying a settings screen. Use it whenever you rename, reformat, remove, or reorder an API response, MCP or tool output, CLI flag or output, ID or slug format, file or folder layout, config key, error message, or default; whenever you are about to add a new option, flag, field, or setting; and whenever someone says a settings or preferences page is overwhelming, has too many knobs, or should be friendlier. Use it even if the user never says "Hyrum" and the change looks like harmless cleanup. Cleanup of observable behavior is exactly where silent breakage comes from.
---

# Hyrum's Law

> With a sufficient number of users of an API, it does not matter what you promise in the contract: all observable behaviors of your system will be depended on by somebody. (Hyrum Wright)

The contract is what you meant to promise. The real interface is everything anyone can see: field order, whitespace, ID shape, error wording, timing, defaults. Someone builds on each of these, usually without telling you.

## Why this matters more with agents

An agent reads every byte of every output and pattern-matches on it. Several harnesses (Claude Code, Codex, Cursor, scripts, other agents' skills) may read the same surface. Instructions and skill files often quote exact formats. So "a sufficient number of users" can be one human plus a handful of agents. Treat any surface an agent reads as public.

## When not to use it

Hyrum's Law is about surfaces with consumers you don't control or can't see. A private helper with one caller in the same change is not that. Rename it and move on. Applying this ceremony everywhere slows work down and buries the cases that matter. If you can find and update every consumer in the same change, the inventory below can be a single sentence.

## Pick the mode

- **Mode A (interface change):** something observable is being changed, removed, or newly exposed.
- **Mode B (settings audit):** a UI's user-facing settings need simplifying, or someone proposes a new setting.

Both can apply. A settings key is also an interface if scripts or agents read the config file.

---

## Mode A: changing an observable interface

### 1. Inventory what is observable

List what a consumer can see of the thing you are changing, not just what you intend to change. Check these categories:

- **Shape:** field names, nesting, order, optional vs always present, null vs missing.
- **Formatting:** line layout, separators, casing, whitespace, number and date formats, units.
- **Identifiers:** ID and slug shape (characters allowed, length, stability across runs).
- **Errors:** messages, codes, exit statuses, what fails loudly vs silently.
- **Behavior:** ordering of results, defaults, side effects, timing, idempotency.
- **Location:** file paths, folder layout, URLs, env var and config key names.
- **Teaching material:** docs, READMEs, MCP server instructions, skill files, and prompts that describe or quote the surface. These are consumers too: they teach agents what to expect.

### 2. Find who observes it

Search before deciding anything. Grep the repo for the field names, literal strings, and regexes that match the format. Check tests, scripts, docs, agent instructions, skills, and prompts. Check sibling repos and hooks if you know them. Say what you could not search (other people's scripts, installed copies, external agents). Unknown consumers are the whole point of the law, so name the gap instead of assuming it is empty.

### 3. Classify each observable behavior

| Class | Meaning | Default action |
|---|---|---|
| **Contract** | Promised: documented, tested, or relied on by design. | Keep stable, or version it. |
| **De facto contract** | Not promised, but you found a consumer. | Migrate the consumers in the same change, or promote it to contract (document and test it). |
| **Incidental** | No consumer found. | Safe to change now. Decide whether to hide it so nobody starts depending on it. |

### 4. Make the change safely

- **Migrate callers, then delete.** Update every consumer you found in the same change, including docs and agent instructions, then remove the old behavior. Avoid long-lived compatibility shims. They become the next thing people depend on.
- **When you can't reach every consumer** (published API, installed clients, other people's agents), keep the old form working alongside the new one for a stated period, mark it deprecated where consumers will see it, and record when it can go.
- **Prefer a smaller surface.** If a field or format detail exists only by accident, consider removing or hiding it now, while removal is cheap.

### 5. Before exposing something new

Every field, flag, or option you add is a promise you will have to keep. Before adding one, answer three questions: who needs this, what would break if it changed later, and could it stay internal. Expose the minimum, and say in the docs which parts are stable and which are not.

### Mode A output

End with a short report:

```
## Hyrum check: <what changed>
| Observable behavior | Class | Consumers found | Action |
|---|---|---|---|
| ... | ... | ... | ... |

Not searched: <places you could not check>
Follow-ups: <deprecations to remove later, docs to confirm>
```

---

## Mode B: auditing a settings UI

Every control on a settings screen costs the user attention and costs the team a promise. Once someone relies on a setting, removing it means migrating their value. So cut settings early, before people depend on them.

### 1. List every control

For each: what it does, its default, and the options it offers.

### 2. Question each one

- **Who changes this, and how often?** Most people never touch most settings.
- **Is there a default that serves about 90% of users?** If so, the setting may only exist because nobody picked one.
- **Can it be inferred** from context, behavior, or the system instead of asked?
- **What does keeping it cost?** Screen clutter, explanation, support, and the promise to keep honoring every value forever.

### 3. Give a verdict

- **Cut:** pick the default and remove the control.
- **Infer:** decide it automatically. Consider showing the result where it matters.
- **Move to advanced:** keep it for the few who need it, behind a clearly secondary section.
- **Keep:** it is a real, frequent choice.
- **Merge:** several knobs that express one decision become one choice.

### What never gets cut

Controls over the user's own data and trust are rights, not knobs. Keep editing, correcting, deleting, exporting, privacy, and consent controls visible and easy to reach. Simplify the configuration around them, never the user's control.

### Migration for existing users

If people already use the product, a cut changes behavior for anyone who picked a non-default value. Map each old value to the new behavior, decide whether to keep honoring it silently or reset it, and tell affected users once if behavior visibly changes. Before launch, this step is free. That is why early is the best time to cut.

### Mode B output

```
## Settings audit: <screen or app>
| Setting | Who uses it | Verdict | Default or inferred value | Migration note |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

Proposed layout: <what the simplified screen shows, and what moves to advanced>
Kept on purpose: <data and trust controls>
```

Rank by impact: the biggest simplification first.
