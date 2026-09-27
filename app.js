/**
 * FlockBoard — local desk router.
 * Pure heuristics: no network, no paid APIs, no LLM calls.
 *
 * Tie-break when scores tie (stable demos): ops → code → research → marketing
 *
 * Sample messy tasks → expected role (tuned in 5-build):
 *   "Pay the vendor invoice and renew the domain"            → ops
 *   "Draft a launch tweet and newsletter for the new page"   → marketing
 *   "Compare three competitors and summarize findings"       → research
 *   "Fix the login bug and add a unit test for the API"      → code
 *   "Ship inventory count then post social promo"            → ops (ops+marketing; ops wins tie-break priority when scores equal — else highest score)
 *   "Look up papers on prompt routing and write a brief"     → research
 *   "Refactor the router and deploy to staging"              → code
 *   "Book a calendar slot for the client kickoff"            → ops
 */

(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.FlockBoard = api;
  if (typeof document !== "undefined") {
    api.mount(document);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var ROLES = ["ops", "code", "research", "marketing"]; // tie-break order

  var SIGNALS = {
    ops: [
      "invoice", "vendor", "payroll", "expense", "budget", "payment", "pay ",
      "renew", "subscription", "schedule", "calendar", "meeting", "appoint",
      "booking", "book a", "ship ", "shipping", "logistics", "inventory",
      "reorder", "deadline", "admin", "ops", "domain", "renewal", "kickoff",
      "client call", "follow up", "follow-up"
    ],
    marketing: [
      "campaign", "tweet", "newsletter", "social", "brand", "audience",
      "seo", "promo", "promote", "announce", "launch", "landing page",
      "ad copy", "ads", "advert", "content marketing", "blog post",
      "marketing", "copywriting", "press", "outreach"
    ],
    research: [
      "research", "investigate", "compare", "survey", "analyze", "analysis",
      "paper", "papers", "study", "benchmark", "literature", "competitor",
      "findings", "explore", "find out", "look up", "metrics report",
      "data review", "synthesize", "whitepaper"
    ],
    code: [
      "bug", "fix", "deploy", "api", "refactor", "unit test", "typescript",
      "javascript", "python", "endpoint", "compile", "pull request", " pr ",
      "css", "html", "database", "sql", "stack trace", "implement", "code",
      "function", "server", "build error", "ci ", "lint", "staging", "commit"
    ]
  };

  var VERBS = {
    ops: "Handle",
    marketing: "Market",
    research: "Research",
    code: "Implement"
  };

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function scoreRole(normalized, role) {
    var list = SIGNALS[role] || [];
    var score = 0;
    var matched = [];
    for (var i = 0; i < list.length; i++) {
      var phrase = list[i];
      if (normalized.indexOf(phrase) !== -1) {
        score += phrase.indexOf(" ") !== -1 ? 2 : 1;
        matched.push(phrase.trim());
      }
    }
    return { score: score, matched: matched };
  }

  function pickRole(scores) {
    var bestRole = ROLES[0];
    var bestScore = -1;
    for (var i = 0; i < ROLES.length; i++) {
      var role = ROLES[i];
      var s = scores[role] ? scores[role].score : 0;
      if (s > bestScore) {
        bestScore = s;
        bestRole = role;
      }
    }
    return { role: bestRole, score: bestScore };
  }

  function oneLineBrief(role, taskText) {
    var clean = String(taskText || "").replace(/\s+/g, " ").trim();
    var max = 100;
    var snippet = clean.length > max ? clean.slice(0, max - 1).trim() + "…" : clean;
    return VERBS[role] + ": " + snippet;
  }

  /**
   * @param {string} taskText
   * @returns {{ role: string, brief: string, signals: string[] } | null}
   */
  function route(taskText) {
    var raw = String(taskText || "").trim();
    if (!raw) return null;

    var normalized = normalize(raw);
    var scores = {};
    var allSignals = [];
    for (var i = 0; i < ROLES.length; i++) {
      var role = ROLES[i];
      scores[role] = scoreRole(normalized, role);
      allSignals = allSignals.concat(scores[role].matched.map(function (m) {
        return role + ":" + m;
      }));
    }

    var picked = pickRole(scores);
    return {
      role: picked.role,
      brief: oneLineBrief(picked.role, raw),
      signals: allSignals
    };
  }

  function mount(doc) {
    var taskEl = doc.getElementById("task");
    var routeBtn = doc.getElementById("route-btn");
    var formMsg = doc.getElementById("form-msg");
    var card = doc.getElementById("card");
    var cardRole = doc.getElementById("card-role");
    var cardBrief = doc.getElementById("card-brief");
    var cardStatus = doc.getElementById("card-status");
    var yesBtn = doc.getElementById("yes-btn");
    var noBtn = doc.getElementById("no-btn");
    var copyBtn = doc.getElementById("copy-btn");

    if (!taskEl || !routeBtn || !card) return;

    var state = {
      status: "idle",
      result: null,
      task: ""
    };

    function setFormMessage(text, kind) {
      formMsg.textContent = text;
      formMsg.className = kind === "error" ? "error" : "hint";
    }

    function renderCard() {
      if (!state.result || state.status === "idle" || state.status === "rejected") {
        if (state.status === "rejected") {
          card.hidden = false;
          card.className = "card rejected";
          cardRole.textContent = state.result ? state.result.role : "";
          cardBrief.textContent = state.result ? state.result.brief : "";
          cardStatus.hidden = false;
          cardStatus.textContent = "Rejected — edit the task and Route again.";
          yesBtn.disabled = true;
          noBtn.disabled = true;
        } else {
          card.hidden = true;
          card.className = "card";
        }
        return;
      }

      card.hidden = false;
      cardRole.textContent = state.result.role;
      cardBrief.textContent = state.result.brief;
      yesBtn.disabled = false;
      noBtn.disabled = false;

      if (state.status === "accepted") {
        card.className = "card accepted";
        cardStatus.hidden = false;
        cardStatus.textContent = "Accepted.";
        yesBtn.disabled = true;
        noBtn.disabled = true;
      } else {
        card.className = "card";
        cardStatus.hidden = true;
        cardStatus.textContent = "";
      }
    }

    function onRoute() {
      var text = taskEl.value;
      var result = route(text);
      if (!result) {
        state.status = "idle";
        state.result = null;
        state.task = "";
        setFormMessage("Enter a task first — empty input cannot be routed.", "error");
        renderCard();
        return;
      }
      state.task = text.trim();
      state.result = result;
      state.status = "ready";
      setFormMessage("Routing card ready — approve, reject, or copy the brief.", "hint");
      renderCard();
    }

    function onYes() {
      if (!state.result || state.status !== "ready") return;
      state.status = "accepted";
      renderCard();
    }

    function onNo() {
      if (!state.result) return;
      state.status = "rejected";
      renderCard();
      taskEl.focus();
    }

    function onCopy() {
      if (!state.result) return;
      var brief = state.result.brief;
      var done = function (ok) {
        if (ok) {
          setFormMessage("Brief copied.", "hint");
        } else {
          setFormMessage("Clipboard blocked — brief is selected; copy manually.", "error");
          try {
            var range = doc.createRange();
            range.selectNodeContents(cardBrief);
            var sel = root.getSelection ? root.getSelection() : null;
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(range);
            }
          } catch (e) {
            /* ignore */
          }
        }
      };

      if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
        root.navigator.clipboard.writeText(brief).then(
          function () { done(true); },
          function () { done(false); }
        );
      } else {
        done(false);
      }
    }

    routeBtn.addEventListener("click", onRoute);
    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
    copyBtn.addEventListener("click", onCopy);
    taskEl.addEventListener("keydown", function (ev) {
      if ((ev.metaKey || ev.ctrlKey) && ev.key === "Enter") {
        onRoute();
      }
    });
  }

  return {
    ROLES: ROLES,
    SIGNALS: SIGNALS,
    route: route,
    mount: mount
  };
});
