#!/usr/bin/env node
/**
 * Mechanical verification for FlockBoard PoC (no browser, no network).
 * Run: node smoke_test.js
 */
"use strict";

var fs = require("fs");
var path = require("path");
var assert = require("assert");

var root = __dirname;
var api = require("./app.js");

var failures = 0;
function check(name, cond, detail) {
  if (cond) {
    console.log("  ok  — " + name);
  } else {
    failures += 1;
    console.log("FAIL — " + name + (detail ? ": " + detail : ""));
  }
}

console.log("FlockBoard smoke test\n");

// --- Static file presence ---
["index.html", "app.js", "styles.css", "LICENSE", "README.md"].forEach(function (f) {
  check("file exists: " + f, fs.existsSync(path.join(root, f)));
});

var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
check("index.html links app.js", html.indexOf('src="app.js"') !== -1);
check("index.html links styles.css", html.indexOf("styles.css") !== -1);
check("index.html has task textarea", html.indexOf('id="task"') !== -1);
check("index.html has Route button", html.indexOf('id="route-btn"') !== -1);
check("index.html has card role/brief", html.indexOf('id="card-role"') !== -1 && html.indexOf('id="card-brief"') !== -1);
check("index.html has Yes/No/Copy", html.indexOf('id="yes-btn"') !== -1 && html.indexOf('id="no-btn"') !== -1 && html.indexOf('id="copy-btn"') !== -1);

var license = fs.readFileSync(path.join(root, "LICENSE"), "utf8");
check("LICENSE is MIT", /MIT License/i.test(license));

// --- Router API ---
check("route is a function", typeof api.route === "function");
check("empty returns null", api.route("") === null);
check("whitespace returns null", api.route("   \n  ") === null);

var samples = [
  { input: "Pay the vendor invoice and renew the domain", expect: "ops" },
  { input: "Draft a launch tweet and newsletter for the new page", expect: "marketing" },
  { input: "Compare three competitors and summarize findings", expect: "research" },
  { input: "Fix the login bug and add a unit test for the API", expect: "code" },
  { input: "Look up papers on prompt routing and write a brief", expect: "research" },
  { input: "Refactor the router and deploy to staging", expect: "code" },
  { input: "Book a calendar slot for the client kickoff", expect: "ops" },
  { input: "Write ad copy for the spring campaign", expect: "marketing" }
];

samples.forEach(function (s) {
  var r = api.route(s.input);
  check(
    "sample → " + s.expect + ': "' + s.input.slice(0, 48) + '…"',
    r && r.role === s.expect,
    r ? "got " + r.role + " / " + r.brief : "null"
  );
  if (r) {
    check("brief is one line for: " + s.expect, r.brief.indexOf("\n") === -1 && r.brief.length > 0);
    check("role is one of four", ["ops", "marketing", "research", "code"].indexOf(r.role) !== -1);
  }
});

// Ambiguous still returns one of four
var amb = api.route("do the thing somehow");
check("ambiguous still picks a role", amb && ["ops", "marketing", "research", "code"].indexOf(amb.role) !== -1);

// Privacy: no real-name / employer tokens in public sources we just wrote
// Generic checks are public; personal tokens live in an optional gitignored
// file (.privacy-tokens.local, one token per line) so they never ship.
var localTokens = [];
try {
  localTokens = fs.readFileSync(path.join(root, ".privacy-tokens.local"), "utf8")
    .split("\n").map(function (t) { return t.trim(); }).filter(Boolean);
} catch (e) {}
var bannedRe = new RegExp(
  ["@gmail\\.com"].concat(localTokens.map(function (t) {
    return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s*");
  })).join("|"),
  "i"
);
["index.html", "app.js", "styles.css", "README.md", "LICENSE"].forEach(function (f) {
  var body = fs.readFileSync(path.join(root, f), "utf8");
  check("privacy: no banned tokens in " + f, !bannedRe.test(body));
});

console.log(failures === 0 ? "\nAll checks passed." : "\n" + failures + " check(s) failed.");
process.exit(failures === 0 ? 0 : 1);
