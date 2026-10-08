#!/usr/bin/env node
// FlockBoard verification kit: drives the real page in headless Chromium,
// checks every feature in FEATURES.md, saves one screenshot per feature to
// verify/shots/, runs eval.js, and writes verify/REPORT.md.
// Run from the repo root:  npm --prefix verify install && node verify/verify.js
// Uses playwright-core + a local Chrome/Chromium (set CHROME=/path if needed).
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const { execFileSync } = require("child_process");

let chromium;
try { ({ chromium } = require("playwright-core")); }
catch (e) {
  try { ({ chromium } = require("playwright")); }
  catch (e2) {
    console.error("playwright-core not found. Run: npm --prefix verify install");
    process.exit(2);
  }
}

const VERIFY = __dirname;
const ROOT = path.resolve(VERIFY, "..");
const SHOTS = path.join(VERIFY, "shots");
const ROLES = ["ops", "marketing", "research", "code"];

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  return ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium"].find((p) => fs.existsSync(p));
}

// Tiny static server for the repo root (localhost only).
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png" };
function serve() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    // Browsers ask for /favicon.ico on their own; the app has none, so answer empty.
    if (urlPath === "/favicon.ico") { res.writeHead(204); return res.end(); }
    const file = path.join(ROOT, urlPath === "/" ? "index.html" : urlPath);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); return res.end("not found");
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r(server)));
}

function git(args) {
  try { return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim(); } catch (e) { return "unknown"; }
}

function runEval() {
  const out = execFileSync(process.execPath, [path.join(ROOT, "eval.js")], { cwd: ROOT, encoding: "utf8" });
  const t = out.match(/tuned: (\d+)\/(\d+) correct \((\d+)%\), (\d+) flagged unsure/);
  const b = out.match(/blind: (\d+)\/(\d+) correct \((\d+)%\), (\d+) flagged unsure/);
  const misses = out.split("\n").filter((l) => /^\s+miss:/.test(l)).map((l) => l.trim());
  const confidentlyWrong = misses.filter((l) => /\((high|low)\)/.test(l)).length;
  const missesFlaggedNotSure = misses.filter((l) => /\(none\)/.test(l)).length;
  return { out, tuned: t, blind: b, misses, confidentlyWrong, missesFlaggedNotSure };
}

function runSmoke() {
  try {
    const out = execFileSync(process.execPath, [path.join(ROOT, "smoke_test.js")], { cwd: ROOT, encoding: "utf8" });
    return { ok: true, checks: (out.match(/^\s+ok\s/gm) || []).length, out };
  } catch (e) {
    return { ok: false, checks: 0, out: String(e.stdout || e.message) };
  }
}

(async () => {
  const chromePath = findChrome();
  if (!chromePath) { console.error("No Chrome/Chromium found. Set CHROME=/path/to/chrome"); process.exit(2); }

  fs.mkdirSync(SHOTS, { recursive: true });
  for (const f of fs.readdirSync(SHOTS)) if (f.endsWith(".png")) fs.unlinkSync(path.join(SHOTS, f));

  const server = await serve();
  const origin = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const browserVersion = browser.version();
  const context = await browser.newContext({ viewport: { width: 900, height: 820 }, deviceScaleFactor: 1 });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });

  // Track every request and every page error across the whole run.
  const foreignRequests = [];
  const pageErrors = [];
  context.on("request", (req) => {
    const u = req.url();
    if (!u.startsWith(origin) && !u.startsWith("file://") && !u.startsWith("data:") && !u.startsWith("about:")) foreignRequests.push(u);
  });
  const watch = (p) => {
    p.on("pageerror", (e) => pageErrors.push(e.message));
    p.on("console", (m) => { if (m.type() === "error") pageErrors.push("console: " + m.text()); });
    return p;
  };

  const results = [];
  let page;

  async function fresh(url) {
    if (page) await page.close();
    page = watch(await context.newPage());
    await page.goto(url || origin + "/");
    return page;
  }
  const text = (sel) => page.locator(sel).evaluate((el) => el.textContent.trim());
  const hidden = (sel) => page.locator(sel).evaluate((el) => el.hidden);
  async function routeText(t) {
    await page.fill("#task", t);
    await page.click("#route-btn");
  }

  async function feature(id, slug, title, fn) {
    const checks = [];
    const errorsBefore = pageErrors.length;
    const expect = (name, ok, detail) => checks.push({ name, ok: !!ok, detail: ok ? "" : String(detail === undefined ? "" : detail) });
    const notes = [];
    try {
      await fn(expect, notes);
    } catch (e) {
      checks.push({ name: "ran without throwing", ok: false, detail: e.message.split("\n")[0] });
    }
    const newErrors = pageErrors.slice(errorsBefore);
    expect("no page errors", newErrors.length === 0, newErrors.join("; "));
    const shot = `shots/${id}-${slug}.png`;
    try { if (page) await page.screenshot({ path: path.join(VERIFY, shot), fullPage: true }); }
    catch (e) { checks.push({ name: "screenshot saved", ok: false, detail: e.message }); }
    const pass = checks.every((c) => c.ok);
    results.push({ id, slug, title, pass, checks, notes, shot });
    console.log(`${pass ? "PASS" : "FAIL"}  ${id} ${title}`);
    for (const c of checks) if (!c.ok) console.log(`      x ${c.name}${c.detail ? " — " + c.detail : ""}`);
  }

  // F01
  await feature("F01", "page-shell", "Page shell and empty state", async (expect) => {
    await fresh();
    expect("title says FlockBoard", (await page.title()).includes("FlockBoard"), await page.title());
    expect("heading is FlockBoard", (await text("h1")) === "FlockBoard");
    expect("tagline explains role + brief + yes/no", /role \+ brief \+ yes\/no/.test(await text(".tag")));
    expect("task textarea visible", await page.isVisible("#task"));
    expect("textarea has example placeholder", ((await page.getAttribute("#task", "placeholder")) || "").startsWith("e.g."));
    expect("Route button visible", await page.isVisible("#route-btn"));
    expect("empty-state hint shown", (await text("#form-msg")) === "Paste a messy task to get a routing card.");
    expect("card hidden before routing", await hidden("#card"));
    expect("footer says local only, four roles, MIT", /Local only.*four roles.*no cloud.*MIT/.test(await text("footer")));
  });

  // F02
  await feature("F02", "empty-guard", "Empty input is blocked", async (expect) => {
    await fresh();
    await page.click("#route-btn");
    expect("empty Route shows inline error", (await text("#form-msg")).startsWith("Enter a task first"), await text("#form-msg"));
    expect("error styling applied", (await page.getAttribute("#form-msg", "class")) === "error");
    expect("no card for empty input", await hidden("#card"));
    await routeText("   \n   ");
    expect("whitespace-only is also blocked", (await hidden("#card")) && (await text("#form-msg")).startsWith("Enter a task first"));
  });

  // F03-F06
  const roleCases = {
    ops: "pay the vendor invoice and renew the domain",
    marketing: "draft a launch tweet and a newsletter for the new page",
    research: "compare three competitors and summarize what they charge",
    code: "fix the login bug and add a unit test"
  };
  const verbs = { ops: "Handle", marketing: "Market", research: "Research", code: "Implement" };
  let n = 3;
  for (const role of ROLES) {
    const id = "F0" + n++;
    await feature(id, "route-" + role, `Routes a clear task to ${role}`, async (expect) => {
      await fresh();
      await routeText(roleCases[role]);
      expect("card shown", !(await hidden("#card")));
      expect(`role is ${role}`, (await text("#card-role")) === role, await text("#card-role"));
      expect(`brief starts with "${verbs[role]}:"`, (await text("#card-brief")).startsWith(verbs[role] + ":"), await text("#card-brief"));
      expect("ready message shown", (await text("#form-msg")).startsWith("Routing card ready"));
      expect(`${role} chip marked pressed`, (await page.getAttribute(`#role-chips [data-role=${role}]`, "aria-pressed")) === "true");
      expect("Yes and No enabled", !(await page.isDisabled("#yes-btn")) && !(await page.isDisabled("#no-btn")));
    });
  }

  // F07
  await feature("F07", "brief-format", "One-line brief with a done-when line, long input trimmed", async (expect, notes) => {
    await fresh();
    const long = "Ship inventory count then post social promo and check the client call notes\ntomorrow morning before the kickoff starts at nine, plus the boxes.";
    await routeText(long);
    const brief = await text("#card-brief");
    notes.push("Brief: " + brief);
    expect("textarea accepts multi-line text", (await page.inputValue("#task")).includes("\n"));
    expect("brief is one line", !brief.includes("\n"));
    expect("long task trimmed with an ellipsis", brief.includes("…"), brief);
    expect("snippet is at most 80 characters", brief.split(" — ")[0].replace(/^\w+: /, "").length <= 80);
    expect("brief ends with a role done-when line", / — done when .+\.$/.test(brief), brief);
    const done = {
      ops: "done when it's paid, booked, or sent and logged.",
      marketing: "done when a draft is ready for your yes.",
      research: "done when you get a 5-bullet summary with sources.",
      code: "done when it's fixed, tested, and live."
    };
    for (const role of ROLES) {
      await routeText(roleCases[role]);
      expect(`${role} brief uses its done-when line`, (await text("#card-brief")).endsWith(done[role]), await text("#card-brief"));
    }
    await routeText(long);
  });

  // F08
  await feature("F08", "why-sure", "Clear pick shows why (matched words)", async (expect, notes) => {
    await fresh();
    await routeText("fix the login bug and add a unit test");
    const why = await text("#card-why");
    notes.push("Why line: " + why);
    expect('why line starts "Why: matched"', why.startsWith("Why: matched"), why);
    expect("why lists the matched words", /bug|login|fix|unit test/.test(why), why);
    expect("not styled as unsure", !(await page.getAttribute("#card-why", "class")).includes("unsure"));
    await routeText("vendor invoice is late and I still need to ship the newsletter draft");
    const why2 = await text("#card-why");
    notes.push("Placeholder example why line: " + why2);
    const words = why2.replace(/^Why: matched /, "").replace(/\.$/, "").split(", ");
    expect("why words are not repeated", new Set(words).size === words.length, why2);
  });

  // F09
  await feature("F09", "why-close-call", "Close call is flagged", async (expect, notes) => {
    await fresh();
    await routeText("pay for the blog post");
    const why = await text("#card-why");
    notes.push("Task: \"pay for the blog post\" → " + (await text("#card-role")) + ". Why line: " + why);
    expect('why line starts "Close call"', why.startsWith("Close call (matched:"), why);
    expect("suggests switching", /Switch below/.test(why));
    expect("styled as unsure", (await page.getAttribute("#card-why", "class")).includes("unsure"));
  });

  // F10
  await feature("F10", "why-not-sure", "No clear signal says not sure, still picks one of four", async (expect, notes) => {
    await fresh();
    await routeText("do the thing somehow");
    const why = await text("#card-why");
    notes.push("Why line: " + why);
    expect("still picks one of four roles", ROLES.includes(await text("#card-role")));
    expect('why line says "Not sure"', why.startsWith("Not sure — no clear signal. Best guess:"), why);
    expect("styled as unsure", (await page.getAttribute("#card-why", "class")).includes("unsure"));
    expect("never invents a fifth role", (await page.locator("#role-chips button").count()) === 4);
  });

  // F11
  await feature("F11", "role-switch", "Role chips switch the role and rewrite the brief", async (expect) => {
    await fresh();
    await routeText("do the thing somehow");
    await page.click("#role-chips [data-role=research]");
    expect("role switched to research", (await text("#card-role")) === "research");
    expect("brief rewritten for research", (await text("#card-brief")).startsWith("Research: do the thing somehow"), await text("#card-brief"));
    expect('why says "You picked research."', (await text("#card-why")) === "You picked research.");
    expect("research chip pressed, others not", (await page.getAttribute("#role-chips [data-role=research]", "aria-pressed")) === "true" &&
      (await page.getAttribute("#role-chips [data-role=ops]", "aria-pressed")) === "false");
    expect("form message confirms switch", (await text("#form-msg")).startsWith("Role switched to research"));
    await page.click("#role-chips [data-role=code]");
    expect("can switch again (code)", (await text("#card-role")) === "code" && (await text("#card-brief")).startsWith("Implement:"));
    await page.click("#role-chips [data-role=marketing]");
    expect("switched card stays open (Yes/No enabled)", !(await page.isDisabled("#yes-btn")) && !(await page.isDisabled("#no-btn")));
  });

  // F12
  await feature("F12", "approve-yes", "Yes accepts and locks the card", async (expect) => {
    await fresh();
    await routeText("pay the vendor invoice and renew the domain");
    await page.click("#yes-btn");
    expect('status says "Accepted."', !(await hidden("#card-status")) && (await text("#card-status")) === "Accepted.");
    expect("card turns accepted (green)", (await page.getAttribute("#card", "class")).includes("accepted"));
    expect("Yes and No locked", (await page.isDisabled("#yes-btn")) && (await page.isDisabled("#no-btn")));
    expect("locked Yes/No look locked (faded)", await page.evaluate(() => getComputedStyle(document.getElementById("yes-btn")).opacity < 1));
    expect("role chips locked", (await page.locator("#role-chips button:disabled").count()) === 4);
    expect('status line under Route says "Approved — brief locked."', (await text("#form-msg")) === "Approved — brief locked.", await text("#form-msg"));
    await page.evaluate(() => document.querySelector("#role-chips [data-role=code]").click());
    expect("chip click on accepted card changes nothing", (await text("#card-role")) === "ops" && (await text("#card-status")) === "Accepted.");
    expect("Copy still available after accept", !(await page.isDisabled("#copy-btn")));
  });

  // F13
  await feature("F13", "reject-no", "No rejects so the task can be edited", async (expect, notes) => {
    await fresh();
    await routeText("compare three competitors and summarize what they charge");
    await page.click("#no-btn");
    expect('status says "Rejected — edit the task and Route again."', (await text("#card-status")) === "Rejected — edit the task and Route again.", await text("#card-status"));
    expect("card turns rejected (orange)", (await page.getAttribute("#card", "class")).includes("rejected"));
    expect("Yes and No locked", (await page.isDisabled("#yes-btn")) && (await page.isDisabled("#no-btn")));
    expect("locked Yes/No look locked (faded)", await page.evaluate(() => getComputedStyle(document.getElementById("no-btn")).opacity < 1));
    expect("task text kept for editing", (await page.inputValue("#task")) === "compare three competitors and summarize what they charge");
    expect("focus returns to the task box", await page.evaluate(() => document.activeElement && document.activeElement.id === "task"));
    expect('status line under Route says "Rejected — edit and Route again."', (await text("#form-msg")) === "Rejected — edit and Route again.", await text("#form-msg"));
    expect("role chips locked on a rejected card", (await page.locator("#role-chips button:disabled").count()) === 4);
    await page.evaluate(() => document.querySelector("#role-chips [data-role=code]").click());
    expect("chip click does not reopen a rejected card", (await text("#card-role")) === "research" &&
      (await page.getAttribute("#card", "class")).includes("rejected") && (await page.isDisabled("#yes-btn")) && (await page.isDisabled("#no-btn")));
    await page.focus("#task");
  });

  // F14
  await feature("F14", "reroute", "Edit and Route again gives a fresh card", async (expect) => {
    await fresh();
    await routeText("compare three competitors and summarize what they charge");
    await page.click("#no-btn");
    await routeText("fix the login bug and add a unit test");
    expect("fresh card is ready (not rejected)", (await page.getAttribute("#card", "class")) === "card" && (await hidden("#card-status")));
    expect("new role is code", (await text("#card-role")) === "code");
    expect("Yes and No enabled again", !(await page.isDisabled("#yes-btn")) && !(await page.isDisabled("#no-btn")));
    expect("role chips enabled again", (await page.locator("#role-chips button:enabled").count()) === 4);
    expect("status line back to ready", (await text("#form-msg")).startsWith("Routing card ready"));
    await page.click("#yes-btn");
    await routeText("draft a launch tweet and a newsletter for the new page");
    expect("routing after Yes also resets the card", (await text("#card-role")) === "marketing" && !(await page.isDisabled("#yes-btn")));
  });

  // F15
  await feature("F15", "copy-brief", "Copy brief puts the brief on the clipboard", async (expect, notes) => {
    await fresh();
    await routeText("draft a launch tweet and a newsletter for the new page");
    const brief = await text("#card-brief");
    await page.click("#copy-btn");
    await page.waitForFunction(() => /copied|blocked/i.test(document.getElementById("form-msg").textContent));
    expect('message says "Brief copied."', (await text("#form-msg")) === "Brief copied.", await text("#form-msg"));
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect("clipboard holds the exact brief", clip === brief, clip);
  });

  // F16
  await feature("F16", "copy-fallback", "Copy falls back when the clipboard is blocked", async (expect) => {
    // (a) async clipboard rejected, legacy copy works
    await fresh();
    await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error("blocked")); });
    await routeText("fix the login bug and add a unit test");
    await page.click("#copy-btn");
    await page.waitForFunction(() => /copied|blocked/i.test(document.getElementById("form-msg").textContent));
    expect("legacy copy path still says copied", (await text("#form-msg")) === "Brief copied.", await text("#form-msg"));
    // (b) both blocked: brief gets selected with a plain manual-copy note
    await page.evaluate(() => { document.execCommand = () => false; });
    await page.click("#copy-btn");
    await page.waitForFunction(() => /blocked/i.test(document.getElementById("form-msg").textContent));
    expect('message says "Clipboard blocked — brief is selected; copy manually."', (await text("#form-msg")) === "Clipboard blocked — brief is selected; copy manually.", await text("#form-msg"));
    expect("error styling applied", (await page.getAttribute("#form-msg", "class")) === "error");
    const sel = await page.evaluate(() => window.getSelection().toString().trim());
    expect("brief text is selected for manual copy", sel === (await text("#card-brief")), sel);
  });

  // F17
  await feature("F17", "keyboard-route", "Ctrl/Cmd+Enter routes from the task box", async (expect) => {
    await fresh();
    await page.fill("#task", "compare three competitors and summarize what they charge");
    await page.press("#task", "Control+Enter");
    expect("Ctrl+Enter routes (research)", !(await hidden("#card")) && (await text("#card-role")) === "research");
    await page.fill("#task", "fix the login bug and add a unit test");
    await page.press("#task", "Meta+Enter");
    expect("Cmd+Enter routes (code)", (await text("#card-role")) === "code");
    await page.fill("#task", "pay the vendor invoice");
    await page.press("#task", "Enter");
    expect("plain Enter adds a new line, does not route", (await text("#card-role")) === "code" && (await page.inputValue("#task")).includes("\n"));
  });

  // F18
  await feature("F18", "open-from-file", "Works opened straight from disk (file://)", async (expect) => {
    await fresh("file://" + path.join(ROOT, "index.html"));
    await routeText("pay the vendor invoice and renew the domain");
    expect("routes from file:// with no server", (await text("#card-role")) === "ops");
    await page.click("#copy-btn");
    await page.waitForFunction(() => /copied|blocked/i.test(document.getElementById("form-msg").textContent));
    expect("Copy gives feedback on file://", /Brief copied\.|Clipboard blocked/.test(await text("#form-msg")), await text("#form-msg"));
    await page.click("#yes-btn");
  });

  // F19
  await feature("F19", "local-only", "Local only: no network calls beyond its own files", async (expect, notes) => {
    await fresh();
    await routeText("draft a launch tweet and a newsletter for the new page");
    await page.click("#yes-btn");
    expect("no requests left localhost during the whole run", foreignRequests.length === 0, foreignRequests.join(", "));
    const src = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
    expect("app.js has no fetch/XHR/WebSocket/sendBeacon", !/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/.test(src));
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    expect("index.html loads only local files", !/(src|href)="https?:/.test(html));
    notes.push("Requests outside localhost: " + foreignRequests.length);
  });

  await browser.close();
  server.close();

  // eval.js + smoke_test.js
  const ev = runEval();
  const smoke = runSmoke();
  const head = git(["rev-parse", "--short", "HEAD"]);
  const dirty = git(["status", "--porcelain", "--", ".", ":!verify"]) ? " (with uncommitted changes)" : "";
  const passed = results.filter((r) => r.pass).length;
  const shotBytes = fs.readdirSync(SHOTS).filter((f) => f.endsWith(".png")).reduce((s, f) => s + fs.statSync(path.join(SHOTS, f)).size, 0);
  const now = new Date();
  const stamp = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" }) + " PT";

  const lines = [];
  lines.push("# FlockBoard verification report", "");
  lines.push(`Run: ${stamp} · commit \`${head}\`${dirty} · headless Chromium ${browserVersion} · generated by \`node verify/verify.js\``, "");
  lines.push(`**Result: ${passed}/${results.length} features PASS**${passed === results.length ? "" : " — see failures below"}`, "");
  lines.push("| ID | Feature | Result | Checks | Screenshot |", "|---|---|---|---|---|");
  for (const r of results) {
    const ok = r.checks.filter((c) => c.ok).length;
    lines.push(`| ${r.id} | ${r.title} | ${r.pass ? "PASS" : "**FAIL**"} | ${ok}/${r.checks.length} | \`${r.shot}\` |`);
  }
  lines.push("", "## Details", "");
  for (const r of results) {
    lines.push(`### ${r.id} ${r.title}: ${r.pass ? "PASS" : "FAIL"}`);
    for (const c of r.checks) lines.push(`- ${c.ok ? "[x]" : "[ ] **FAIL**"} ${c.name}${c.detail ? ` — got: ${c.detail}` : ""}`);
    for (const note of r.notes) lines.push(`- Note: ${note}`);
    lines.push("");
  }
  lines.push("## Router accuracy (`node eval.js`)", "");
  if (ev.tuned && ev.blind) {
    lines.push(`- Tuned cases: **${ev.tuned[1]}/${ev.tuned[2]}** (${ev.tuned[3]}%), ${ev.tuned[4]} flagged unsure`);
    lines.push(`- Blind cases (never tuned on): **${ev.blind[1]}/${ev.blind[2]}** (${ev.blind[3]}%), ${ev.blind[4]} flagged unsure overall`);
    lines.push(`- Blind misses: ${ev.misses.length}; ${ev.missesFlaggedNotSure} of them say "not sure", so **${ev.confidentlyWrong}/${ev.blind[2]} are confidently wrong**`);
  } else {
    lines.push("- Could not parse eval.js output");
  }
  lines.push("", "```", ev.out.trim(), "```", "");
  lines.push("## Node smoke test (`node smoke_test.js`)", "");
  lines.push(`- ${smoke.ok ? "PASS" : "**FAIL**"}: ${smoke.checks} checks ok`, "");
  lines.push(`Screenshots: ${results.length} PNGs, ${(shotBytes / 1024).toFixed(0)} KB total, in \`verify/shots/\`.`, "");
  fs.writeFileSync(path.join(VERIFY, "REPORT.md"), lines.join("\n"));

  console.log(`\n${passed}/${results.length} features PASS · eval tuned ${ev.tuned && ev.tuned[1]}/${ev.tuned && ev.tuned[2]}, blind ${ev.blind && ev.blind[1]}/${ev.blind && ev.blind[2]}, ${ev.confidentlyWrong} confidently wrong · smoke ${smoke.ok ? "PASS" : "FAIL"}`);
  console.log("Report: verify/REPORT.md");
  process.exit(passed === results.length && smoke.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
