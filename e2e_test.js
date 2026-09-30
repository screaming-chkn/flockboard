// Browser end-to-end check: headless Chrome via the DevTools protocol.
// No dependencies. Usage: node e2e_test.js   (needs Node 22+ and Chrome/Chromium)
"use strict";
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const CHROME = process.env.CHROME ||
  ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => fs.existsSync(p));
if (!CHROME) { console.log("skip — no Chrome found (set CHROME=/path)"); process.exit(0); }

const url = "file://" + path.join(__dirname, "index.html");
const port = 9300 + Math.floor(Math.random() * 500);
const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "fb-e2e-"));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run",
  "--remote-debugging-port=" + port, "--user-data-dir=" + tmp, "about:blank"], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (name, ok, detail) => {
  console.log((ok ? "  ok  — " : "  FAIL — ") + name + (ok || !detail ? "" : " (" + detail + ")"));
  if (!ok) failures++;
};

(async () => {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); }
    catch (e) { await sleep(100); }
  }
  if (!target) throw new Error("Chrome did not start");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0; const pending = new Map(); const errors = [];
  ws.addEventListener("message", (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails.text);
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.result.value;

  await send("Runtime.enable");
  await send("Page.navigate", { url });
  await sleep(800);

  check("page loads with title", (await ev("document.title")).includes("FlockBoard"));
  check("card hidden before routing", await ev("document.getElementById('card').hidden === true"));

  await ev("document.getElementById('route-btn').click()");
  check("empty input keeps card hidden", await ev("document.getElementById('card').hidden === true"));

  const cases = [
    ["vendor invoice is late and I still need to renew the domain", "ops"],
    ["draft a launch tweet and a newsletter for the new page", "marketing"],
    ["compare three competitors and summarize what they charge", "research"],
    ["fix the login bug and add a unit test", "code"],
  ];
  for (const [text, role] of cases) {
    await ev(`(()=>{const t=document.getElementById('task');t.value=${JSON.stringify(text)};t.dispatchEvent(new Event('input'));document.getElementById('route-btn').click();})()`);
    await sleep(150);
    const got = await ev("document.getElementById('card-role').textContent.trim()");
    const brief = await ev("document.getElementById('card-brief').textContent.trim()");
    check(`routes to ${role}`, !(await ev("document.getElementById('card').hidden")) && got === role, "got " + got);
    check(`brief is one non-empty line (${role})`, brief.length > 0 && !brief.includes("\n"));
  }

  await ev("document.getElementById('yes-btn').click()");
  await sleep(100);
  const yes = await ev("(()=>{const s=document.getElementById('card-status');return s.hidden?'':s.textContent})()");
  check("Yes shows an accepted status", /accept|approv/i.test(yes), yes);
  check("Yes locks the card", await ev("document.getElementById('yes-btn').disabled && document.getElementById('no-btn').disabled"));

  // Fresh card, then reject it
  await ev("document.getElementById('route-btn').click()");
  await sleep(100);

  await ev("document.getElementById('no-btn').click()");
  await sleep(100);
  const no = await ev("(()=>{const s=document.getElementById('card-status');return s.hidden?'':s.textContent})()");
  check("No shows a rejected status", /reject/i.test(no), no);

  await ev("document.getElementById('route-btn').click()");
  await sleep(100);
  await ev("document.getElementById('copy-btn').click()");
  await sleep(300);
  const msg = await ev("document.getElementById('form-msg').textContent");
  check("Copy brief gives feedback without errors", errors.length === 0 && /cop/i.test(msg), msg + " " + errors.join("; "));

  await ev(`(()=>{const t=document.getElementById('task');t.value='do the thing somehow';document.getElementById('route-btn').click();})()`);
  await sleep(100);
  check("ambiguous task still gets a role", ["ops","marketing","research","code"].includes(await ev("document.getElementById('card-role').textContent.trim()")));

  const why = await ev("document.getElementById('card-why').textContent");
  check("unclear task says it's not sure", /not sure|close call/i.test(why), why);
  await ev("document.querySelector('#role-chips [data-role=research]').click()");
  await sleep(100);
  check("role chip switches the card", (await ev("document.getElementById('card-role').textContent.trim()")) === "research");
  check("switched brief uses the new role", /^Research:/.test(await ev("document.getElementById('card-brief').textContent")));
  check("chosen chip is marked pressed", await ev("document.querySelector('#role-chips [data-role=research]').getAttribute('aria-pressed') === 'true'"));

  await ev(`(()=>{const t=document.getElementById('task');t.value='fix the login bug and add a unit test';document.getElementById('route-btn').click();})()`);
  await sleep(100);
  check("clear task shows why it matched", /^Why: matched/.test(await ev("document.getElementById('card-why').textContent")));

  await send("Emulation.setDeviceMetricsOverride", { width: 1100, height: 900, deviceScaleFactor: 1, mobile: false });
  const shot = await send("Page.captureScreenshot", { format: "png" });
  if (process.env.SHOT) fs.writeFileSync(process.env.SHOT, Buffer.from(shot.result.data, "base64"));

  check("no page errors", errors.length === 0, errors.join("; "));
  ws.close();
})().catch((e) => { console.log("  FAIL — " + e.message); failures++; })
  .finally(() => {
    chrome.kill();
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
    console.log(failures === 0 ? "\nAll browser checks passed." : "\n" + failures + " browser check(s) failed.");
    process.exit(failures === 0 ? 0 : 1);
  });
