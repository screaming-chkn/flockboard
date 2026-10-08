# Verification kit

Proves every feature in `FEATURES.md` works in a real browser, with no one checking by hand.

Run from the repo root (needs Node 18+ and a local Chrome or Chromium; set `CHROME=/path/to/chrome` if it isn't found):

```bash
npm --prefix verify install && node verify/verify.js
```

It serves the page on 127.0.0.1, drives it in headless Chromium with `playwright-core` (no browser download), saves one screenshot per feature to `verify/shots/`, runs `eval.js` and `smoke_test.js`, and writes `verify/REPORT.md`. It exits non-zero if any feature fails.

The app itself still needs no install. This folder is only for checking it.
