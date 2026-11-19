---
name: adhd-sticker-prompt-engine
description: >
  Generates Etsy-grade, zero-repetition die-cut ADHD sticker image prompts
  tailored to any user-specified event, holiday (Christmas, Halloween, New Year,
  Valentine's Day, Back to School, Thanksgiving, Summer/Travel, Office Chaos),
  or tone (Dark Humor & Sarcasm, Kawaii Pastel, Retro 90s/Y2K, Comic Pop Art,
  Minimalist Line Art, 8-Bit Pixel Art, Cozy Hygge, Vintage Tattoo Flash).
  Enforces literal semantic matching between every ADHD quote and its visual scene.
---

# ADHD Sticker Prompt Engine (Portable Agent Skill)

Give this `SKILL.md` to any AI agent (such as **Muse**, Manus, Claude Code, Gemini CLI, OpenClaw, or Custom GPTs) so the agent learns how to generate non-repetitive, event-grounded, Etsy-grade ADHD sticker image prompts.

## Core Rules

1. **Event, Holiday & Tone Grounding (Never Locked to Kawaii Only)**
   - **Christmas / Holiday**: Panic gift-wrapping at 2 AM Dec 24, tangled in Christmas lights for 3 hours, eating all 24 advent chocolates on Dec 1, Santa's sleigh with 40 browser tabs open, burnt cookies while scrolling.
   - **Halloween / Spooky**: Ghost who forgot what room it floated in to haunt, skeleton with 40 skull tabs open, zombie craving iced coffee instead of brains, witch brewing dopamine potion, vampire losing count of bats.
   - **Dark Humor & Sarcasm**: Cynical burnout & spite (*"My dopamine died in 2016"*, *"Running on pure panic, spite & cold brew"*, *"Here lies my motivation (R.I.P.)"*, *"Mentally I am a dumpster fire"*). Use dark gothic grunge, charcoal, crimson, obsidian, deadpan expressions. **Never use pastel pink Kawaii for Dark Humor.**
   - **New Year / Valentine's Day / Back to School / Thanksgiving / Summer Travel / Office Chaos / Custom Topics**: Adapt 100% of quotes, characters, and props to the user's exact requested occasion or language (including Roman Urdu/Hindi/English).

2. **Art Style Diversity**
   - Support: `Dark Gothic Grunge`, `Kawaii Pastel`, `Retro 90s/Y2K`, `Comic Pop Art`, `Minimalist Line Art`, `8-Bit Pixel Art`, `Cozy Hygge`, `Vintage Tattoo Flash`, plus cycling through 40 distinct micro-framings across a 25–30 sticker batch (`Tarot Card`, `Caution Sign`, `Grocery Nutrition Label`, `99% Loading Bar`, `RPG Side-Quest`, `Vintage Motel Keytag`, `Y2K Error Window`, `Watercolor Splatter`, `Linocut`, `Peeling Sticker-on-Sticker`, etc.).

3. **Literal Semantic Quote-to-Visual Matching**
   - Every character, facial expression, pose, and prop MUST visually illustrate the punchline of `stickerText`.
   - Bad: `"Coffee is my lifeline"` -> cute dinosaur on a skateboard.
   - Good: `"Coffee is my lifeline"` -> exhausted raccoon clinging to a giant steaming iced coffee mug like a life raft.

4. **Mandatory Die-Cut Technical Suffix**
   - Every prompt must explicitly include: `thick clean white die-cut contour border isolated on a solid transparent background`, clear art style descriptors, and the featured quote text.

5. **Zero-Repetition Memory Protocol**
   - Track generated `concept` summaries and `stickerText` quotes in a running blacklist and never repeat them within a batch or across sessions.

6. **Output Formats**
   - **Raw Bulk Mode**: Output ONLY one complete image-generation prompt per line (no numbering, no markdown headers, no extra commentary).
   - **Structured JSON Mode**: Return `{ "event": "...", "artStyle": "...", "stickers": [{ "concept", "stickerText", "characterType", "description", "prompt" }] }`.

7. **Optional Live Tool Call**
   - If this app's server is running locally or deployed, the agent can also call `POST /api/generate` with `{ "event", "artStyle", "category", "count", "customInstructions" }` or download the latest skill bundle from `GET /api/skill`.
