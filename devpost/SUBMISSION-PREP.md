# FlockBoard: Devpost Submission Prep

Contest: Build With AI: Basics (Devpost) · deadline **Mon Oct 26, 2:00 PM PT** (5:00 PM ET)
Repo: https://github.com/screaming-chkn/flockboard (public, MIT) · last pushed `bcf494c`; newer local commits (this prep file, the `verify/` kit) **must be pushed before submit**
Prep owner: Grok Build · prep due Fri Oct 9, 5:00 PM PT
**Hook QC: PASS 2026-10-07 (Hook QC notes kept off-repo)**

Copy rules for everything below: say "SI", not "AI", in our own words (the contest name stays as is). No hashtags. Clean language. Screaming Chicken / Screaming_Chkn branding only. No real name, employer, city, or family.

## Contest rules that matter (checked Oct 7, learn-ai-basics.devpost.com and /rules)
- New project started from an empty folder during Sept 22 – Oct 26, built with the Devpost Learn Skill Pack. ✅
- Public repo with all source, setup steps, an open source license (shown in the About section), and the generated `scope.md`, `prd.md`, `spec.md`. ✅ They're in `devpost/`.
- Demo video **1–3 minutes**, posted publicly on YouTube or Vimeo, showing the project working end to end. Judges won't clone or run the code, so the video carries the demo. No third-party trademarks or copyrighted music.
- Text description: what it does, who it's for, what you learned.
- Judging: Design (a complete product experience), Innovation, Presentation (the video shows it working end to end, and the pitch covers the problem, who it's for, and why it matters).
- The contest minimum is 1 minute and our cap is 90 seconds, so **the target is 60–90 seconds**.

## Draft field notes (the maker rewrites these in their own words)

**Project name:** FlockBoard

**Tagline:** Paste a messy task. Get the right desk, a one-line brief, and a yes/no.

**Inspiration:** Tasks show up as one messy sentence ("write a tweet about the crash and also check the logs"). Sorting them takes longer than doing them. I wanted a tiny desk router that sorts the flock in one click.

**What it does:** You paste a task and click Route. FlockBoard returns one card with a role (ops, marketing, research, or code), a one-line brief with a "done when" line, the words that drove the pick, and whether it's sure, a close call, or not sure. Yes accepts it, No rejects it so you can edit and Route again, and Copy puts the brief on the clipboard. When it isn't sure, it says so and offers one-tap role chips.

**Who it's for:** Solo builders and small crews who handle many kinds of tasks and want to triage them fast.

**How we built it:** It's a single page of HTML, CSS, and vanilla JS. Routing uses local keyword rules: word-boundary patterns, heavier weight for phrases, and a bonus for the leading verb. There's no network, no accounts, and no paid APIs. I planned it with the Devpost Learn Skill Pack (scope, PRD, spec, checklist) and built it with an SI coding agent in small slices. Tests are a Node smoke test, a headless Chrome end-to-end test, and a blind eval.

**Challenges:** Close calls between roles. "Write a tweet about the crash" looks like ops but is really marketing. The browser test also caught a Copy crash that the Node test missed.

**Accomplishments:** It works fully offline. On cases it was tuned on it scores 40/40. On 24 blind cases it never saw, it gets 16 right (67%), and most of the misses say "not sure" instead of guessing. Only 3 of 24 are confidently wrong.

**What we learned:** Planning first (scope, then PRD, then spec) kept the build small. Being honest about uncertainty beats false confidence. A real browser test finds bugs that unit checks miss.

**What's next:** Learn from the role switches people make, add custom roles, and offer an optional SI brief writer that stays opt-in and local-first.

**Built with:** HTML, CSS, JavaScript, Node.js, headless Chrome, Devpost Learn Skill Pack

**Repo URL:** https://github.com/screaming-chkn/flockboard

**Demo video URL:** _TBD: the maker uploads to YouTube or Vimeo (public or unlisted-public) and pastes the link_

## Demo video plan (target 75s, hard cap 90s, contest minimum 60s)
Source: `../demo/flockboard-demo-silent.mp4` (ffprobe: h264, 1280×860, **28.0 s**, silent, scripted). That's too short alone, so pad it to 60s or more with a title card, a slowed replay or freeze-frames, and a closing card. Or the maker records a live run (preferred, because it reads as real).

| Time | Shot | On screen / voice line (maker's own words) |
|---|---|---|
| 0:00–0:08 | Title card (`flockboard-card.png`) | "FlockBoard: paste a messy task, get the right desk." |
| 0:08–0:18 | Problem: messy sentence typed into the box (source 0:00–0:06) | "Tasks show up as one messy sentence. Sorting them is the slow part." |
| 0:18–0:35 | Route → card appears (source ~0:06–0:14, slowed or held) | Point out the role, the one-line brief, the "why" words, and the confidence. |
| 0:35–0:48 | Yes, then Copy brief (source ~0:14–0:22) | "Yes accepts it. Copy hands the brief off." |
| 0:48–1:02 | Close-call task → "not sure" → role chip switch (source ~0:22–0:28, or a live shot) | "When it's unsure, it says so, and one tap switches the role." |
| 1:02–1:12 | Honest numbers card | "Offline and free. 67% on blind tests, and it flags most of its own misses." |
| 1:12–1:18 | End card | Repo URL plus "Screaming Chicken". |

Audio: the maker's voice or captions only. No copyrighted music.
Assemble (local, free): `ffmpeg` with `-vf setpts` for slowdowns and `tpad=stop_mode=clone` for holds, then concat with the image cards. Grok Build can make a captioned silent cut if wanted. Check the source timestamps against the clip before cutting.

## Top 3 flop risks and guards
1. **Video under 1 minute or fails to show the app end to end** (it's the only thing judges see). *Guard:* run ffprobe on the final cut and confirm 60–90s; it has to show paste → Route → card → Yes → Copy → role switch. Watch the YouTube link once in a signed-out/incognito window before submitting.
2. **Repo fails the checks** (license not shown in About, planning docs missing, setup steps unclear). *Guard:* before submit, open the repo page and confirm MIT shows in About, `devpost/scope.md`, `prd.md`, `spec.md` are there, and the README run steps work.
3. **Late submit or a privacy slip in the form or video** (real name, a file path, or a browser tab leaking personal info; "AI" in our own copy). *Guard:* submit by **Fri Oct 23**, not on deadline day. Before recording, use a clean browser profile with no tabs and no bookmarks bar. Do a final read of the form for SI wording, handle-only branding, and no hashtags.

## Maker's remaining taps (one batch)
- [ ] **Video:** record a live 60–90s run with the shot list above, *or* OK a padded cut from the silent clip. Then upload it to YouTube or Vimeo as public and paste the link.
- [ ] **Form:** rewrite the draft fields above in your own words and paste them into the Devpost form, including what it does, who it's for, and what you learned.
- [ ] **Submit:** check the three flop-risk guards, then click Submit on Devpost (target Oct 23, hard deadline Oct 26 2 PM PT). Complete the exit survey if it's asked for.
