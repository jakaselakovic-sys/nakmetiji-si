# ChatGPT skills

ChatGPT versions of Claude skills kept in `.claude/skills/`.

| ChatGPT skill | links to Claude skill(s) |
|---|---|
| `skills/molinae-video-production/` | `.claude/skills/molinae-visual-production/`, `.claude/skills/procedural-set-video/` |

Files in each skill's `references/` are symlinks to the Claude `SKILL.md`
files, so editing the Claude skill updates the ChatGPT one.

## Upload to ChatGPT

`zip` follows symlinks by default, so the archive contains the real reference
content:

```bash
cd chatgpt/skills
zip -r molinae-video-production.zip molinae-video-production
```

Upload the zip in ChatGPT under Skills. On Windows, where git may check
symlinks out as plain text files, copy the two Claude `SKILL.md` files into
`references/` with the same names before zipping.
