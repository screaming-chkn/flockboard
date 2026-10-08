# FlockBoard feature list

Every user-visible feature, with the behavior `verify/verify.js` checks in a real headless browser.
Sources: `index.html`, `app.js`, `README.md`, `devpost/spec.md`, `devpost/prd.md`.
Each feature gets one screenshot in `verify/shots/<ID>-<slug>.png` and a PASS/FAIL line in `verify/REPORT.md`.

| ID | Feature | Expected behavior |
|---|---|---|
| F01 | Page shell and empty state | Title and heading say FlockBoard; tagline says "paste a messy task, get a role + brief + yes/no"; task box with an "e.g." placeholder; Route button; hint "Paste a messy task to get a routing card."; no card yet; footer "Local only · four roles · no cloud · MIT". |
| F02 | Empty input is blocked | Route with an empty or whitespace-only box shows "Enter a task first — empty input cannot be routed." in error style and shows no card. |
| F03 | Routes a clear task to ops | "pay the vendor invoice and renew the domain" gives role `ops`, brief starting "Handle:", the ops chip pressed, Yes/No enabled, and "Routing card ready". |
| F04 | Routes a clear task to marketing | "draft a launch tweet and a newsletter for the new page" gives role `marketing`, brief starting "Market:". |
| F05 | Routes a clear task to research | "compare three competitors and summarize what they charge" gives role `research`, brief starting "Research:". |
| F06 | Routes a clear task to code | "fix the login bug and add a unit test" gives role `code`, brief starting "Implement:". |
| F07 | One-line brief with a done-when line | Brief is one line: role verb, the task trimmed to 80 characters (ellipsis when longer), then the role's "done when" line (ops: paid, booked, or sent and logged; marketing: a draft is ready for your yes; research: a 5-bullet summary with sources; code: fixed, tested, and live). The task box accepts multi-line text. |
| F08 | Clear pick shows why | A clear pick shows "Why: matched …" with the matched words, each listed once, in normal style. |
| F09 | Close call is flagged | When two roles are within one point ("pay for the blog post"), the line reads "Close call (matched: …). Switch below if needed." in the unsure (amber) style. |
| F10 | Not sure, still one of four | With no signal ("do the thing somehow") the line reads "Not sure — no clear signal. Best guess: …". It still picks one of the four roles, and there are only four chips. |
| F11 | Role chips switch the role | Clicking a chip sets that role, rewrites the brief with the new verb and done-when line, says "You picked <role>.", marks only that chip pressed, and shows "Role switched to <role>". It can switch again, and the card stays open for Yes/No. Chips only work on an open card. |
| F12 | Yes accepts and locks | Yes shows "Accepted." on the card, the line under Route says "Approved — brief locked.", and the card turns green. Yes, No and the chips lock (a chip click changes nothing), and locked Yes/No look faded. Copy still works. |
| F13 | No rejects for editing | No shows "Rejected — edit the task and Route again." on the card, the line under Route says "Rejected — edit and Route again.", and the card turns orange. Yes, No and the chips lock (a chip click does not reopen the card), locked Yes/No look faded, the task text stays, and focus goes back to the task box. |
| F14 | Edit and Route again | After No (or Yes), routing new text gives a fresh ready card with the new role, Yes/No and chips enabled, and "Routing card ready" under Route. Route again is the only way to change a decided card. |
| F15 | Copy brief | Copy puts the exact brief on the clipboard and shows "Brief copied." |
| F16 | Copy fallback | If the clipboard API is blocked, a legacy copy still says "Brief copied." If that is blocked too, it shows "Clipboard blocked — brief is selected; copy manually." and selects the brief text. |
| F17 | Keyboard route | Ctrl+Enter or Cmd+Enter in the task box routes. Plain Enter adds a new line. |
| F18 | Works opened from disk | Opening `index.html` directly (file://, no server) still routes, and Copy and Yes still respond. |
| F19 | Local only | During the whole run no request leaves localhost. `app.js` has no fetch, XHR, WebSocket or beacon, and `index.html` loads only local files. |

Also run by the kit: `node eval.js` (router accuracy, tuned vs blind) and `node smoke_test.js` (router plus privacy checks). Both results go into `REPORT.md`.
