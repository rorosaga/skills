# Notes MCP server

`search_notes(query)` returns a count line, then one line per hit:

    - id: <note id> | score: <0..1> | title: <title>

Pass the id to `open_note`. Ignore hits with a score below 0.3; they are usually noise.
