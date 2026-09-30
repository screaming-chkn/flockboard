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

  // Each signal is a word-boundary pattern. Multi-word phrases weigh 2, single words 1.
  var SIGNALS = {
    ops: [
      "receipts?", "accountant", "bills?", "w-?9", "1099", "suppliers?", "set up a call",
      "packages?", "track down", "ups", "fedex", "usps", "returns?", "paperwork", "forms? to",
      "sign", "mail", "errands?", "rent", "lease", "utilities", "electric",
      "invoices?", "vendors?", "payroll", "expenses?", "budget", "payments?", "pay",
      "payouts?", "taxe?s?", "books", "bookkeeping", "accounting", "refunds?",
      "renew(al)?", "subscriptions?", "membership", "cancel", "schedule", "reschedule",
      "calendar", "meetings?", "appointments?", "dentist", "booking", "book an?",
      "ship", "shipping", "boxes", "order more", "supplies", "logistics", "inventory",
      "reorder", "deadline", "admin", "ops", "domain", "kickoff", "contracts?",
      "contractor", "hire", "hiring", "client call", "follow[- ]up", "reply to",
      "customer (email|support|service)", "insurance", "license", "permit", "bank"
    ],
    marketing: [
      "!newsletter", "cold email", "name for", "come up with a name", "product descriptions?",
      "listings?", "etsy", "bio", "banner", "podcast", "slogan", "logo", "flyers?",
      "testimonials?", "case study", "customers? (email|story)", "shout ?out", "hashtags?",
      "caption", "posts?", "followers", "engagement", "website copy", "about page",
      "campaign", "tweets?", "tweet thread", "newsletter", "email (my|the) list",
      "social", "instagram", "tiktok", "linkedin", "youtube", "facebook", "reels?",
      "brand(ing)?", "audience", "seo", "promo", "promote", "announce", "announcement",
      "launch", "landing page", "headline", "tagline", "ad copy", "ads", "advert",
      "blog post", "marketing", "copywriting", "copy", "press", "outreach", "sale",
      "discount", "black friday", "giveaway", "influencers?", "post (something|about|on)",
      "promo video", "pitch"
    ],
    research: [
      "how do (other|others|people|competitors)", "dig into", "why (did|do|are|is)",
      "dropped", "what the law says", "law", "legal", "examples? of", "gather",
      "check what", "sources?", "data on", "stats", "statistics", "evaluate", "vet",
      "understand", "look into", "price (my|consulting|services)", "how much",
      "research", "investigate", "compare", "comparison", "survey", "analy[sz]e",
      "analysis", "papers?", "study", "benchmark", "literature", "competitors?",
      "findings", "explore", "find out", "look up", "read up", "learn about",
      "what are people saying", "reviews", "summari[sz]e", "synthesi[sz]e",
      "whitepaper", "which .* is best", "best (tool|app|option|crm)", "pros and cons",
      "how much .* charge", "pricing", "rules", "regulations?", "gdpr", "grants?",
      "qualify", "is there an?", "options for", "market size", "trends?"
    ],
    code: [
      "button", "mobile", "page load", "load faster", "slow", "performance", "faster",
      "contact form", "hook up", "integrat(e|ion)", "webhook", "script to", "automate",
      "upgrade (node|python|react|the)", "node", "npm", "react", "breaks?", "does nothing",
      "not working", "doesn't work", "repo", "localhost", "domain dns", "ssl",
      "bugs?", "fix", "broken", "crash(es|ing)?", "errors?", "500", "404",
      "site is down", "website", "deploy", "api", "refactor", "unit tests?",
      "run tests", "tests?", "typescript", "javascript", "python", "script",
      "endpoint", "compile", "pull request", "pr", "css", "html", "database",
      "postgres", "migrate", "sql", "stack trace", "implement", "code", "function",
      "server", "build error", "ci", "github( action)?s?", "lint", "staging",
      "commit", "dark mode", "dashboard", "feature", "form is broken", "login", "app"
    ]
  };

  var COMPILED = {};
  (function compile() {
    for (var role in SIGNALS) {
      COMPILED[role] = SIGNALS[role].map(function (src) {
        // A leading "!" marks a strong noun that should outweigh generic verbs.
        var strong = src.charAt(0) === "!";
        var pat = strong ? src.slice(1) : src;
        return {
          src: pat,
          re: new RegExp("(^|[^a-z0-9])(" + pat + ")(?=$|[^a-z0-9])", "i"),
          weight: strong ? 3 : /\s/.test(pat) ? 2 : 1
        };
      });
    }
  })();

  var VERBS = {
    ops: "Handle",
    marketing: "Market",
    research: "Research",
    code: "Implement"
  };

  // One-line "done when" per role so the brief is a real handoff, not an echo.
  var DONE_WHEN = {
    ops: "done when it's paid, booked, or sent and logged",
    marketing: "done when a draft is ready for your yes",
    research: "done when you get a 5-bullet summary with sources",
    code: "done when it's fixed, tested, and live"
  };

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  function scoreRole(normalized, role) {
    var list = COMPILED[role] || [];
    var score = 0;
    var matched = [];
    for (var i = 0; i < list.length; i++) {
      var m = normalized.match(list[i].re);
      if (m) {
        score += list[i].weight;
        matched.push(m[2]);
      }
    }
    return { score: score, matched: matched };
  }

  // Intent beats topic: "write a tweet about the crash" is marketing,
  // "research the bug" is research. The leading verb phrase gets a bonus.
  var LEAD = {
    marketing: /^(write|draft|post|tweet|announce|promote|email my list|make a promo|come up with|update the (linkedin|bio|banner))\b/,
    research: /^(research|compare|find out|figure out|look up|read up|look into|dig into|gather|check what|what|which|why|how|is there|investigate|analy[sz]e)\b/,
    code: /^(fix|debug|deploy|refactor|implement|add|migrate|upgrade|hook up|make the (page|site|app)|set up a github|build)\b/,
    ops: /^(pay|book|schedule|reschedule|cancel|renew|order|hire|reply to|file|send the invoice)\b/
  };

  function pickRole(scores, normalized) {
    var bestRole = ROLES[0];
    var bestScore = -1;
    var secondScore = -1;
    for (var i = 0; i < ROLES.length; i++) {
      var role = ROLES[i];
      var s = scores[role] ? scores[role].score : 0;
      if (LEAD[role] && LEAD[role].test(normalized) && s > 0) s += 1.5;
      if (s > bestScore) {
        secondScore = bestScore;
        bestScore = s;
        bestRole = role;
      } else if (s > secondScore) {
        secondScore = s;
      }
    }
    var confidence = bestScore <= 0 ? "none" : bestScore - Math.max(secondScore, 0) < 1 ? "low" : "high";
    return { role: bestRole, score: bestScore, confidence: confidence };
  }

  function oneLineBrief(role, taskText) {
    var clean = String(taskText || "").replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
    var max = 80;
    var snippet = clean.length > max ? clean.slice(0, max - 1).trim() + "…" : clean;
    return VERBS[role] + ": " + snippet + " — " + DONE_WHEN[role] + ".";
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

    var picked = pickRole(scores, normalized);
    return {
      role: picked.role,
      confidence: picked.confidence,
      why: picked.score > 0
        ? scores[picked.role].matched.slice(0, 4)
        : [],
      brief: oneLineBrief(picked.role, raw),
      signals: allSignals
    };
  }

  var briefFor = oneLineBrief;

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
    var cardWhy = doc.getElementById("card-why");
    var chips = doc.getElementById("role-chips");

    if (!taskEl || !routeBtn || !card) return;

    var win = doc.defaultView || (typeof window !== "undefined" ? window : {});

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
      renderWhy();

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

    function renderWhy() {
      if (!cardWhy || !state.result) return;
      var r = state.result;
      if (r.overridden) {
        cardWhy.textContent = "You picked " + r.role + ".";
      } else if (r.confidence === "none") {
        cardWhy.textContent = "Not sure — no clear signal. Best guess: " + r.role + ". Pick a role below if it's wrong.";
      } else if (r.confidence === "low") {
        cardWhy.textContent = "Close call (matched: " + r.why.join(", ") + "). Switch below if needed.";
      } else {
        cardWhy.textContent = "Why: matched " + r.why.join(", ") + ".";
      }
      cardWhy.className = "why" + (r.confidence === "high" || r.overridden ? "" : " unsure");
      if (chips) {
        var btns = chips.querySelectorAll("button[data-role]");
        for (var i = 0; i < btns.length; i++) {
          var on = btns[i].getAttribute("data-role") === r.role;
          btns[i].setAttribute("aria-pressed", on ? "true" : "false");
          btns[i].disabled = state.status === "accepted";
        }
      }
    }

    function onPickRole(role) {
      if (!state.result || state.status === "accepted") return;
      state.result = {
        role: role,
        brief: briefFor(role, state.task),
        confidence: "high",
        why: [],
        overridden: true
      };
      state.status = "ready";
      setFormMessage("Role switched to " + role + " — approve, reject, or copy.", "hint");
      renderCard();
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
            var sel = win.getSelection ? win.getSelection() : null;
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(range);
            }
          } catch (e) {
            /* ignore */
          }
        }
      };

      // Fallback for file:// pages where the async clipboard API is blocked.
      var legacyCopy = function () {
        try {
          var ta = doc.createElement("textarea");
          ta.value = brief;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          doc.body.appendChild(ta);
          ta.select();
          var ok = doc.execCommand && doc.execCommand("copy");
          doc.body.removeChild(ta);
          return !!ok;
        } catch (e) {
          return false;
        }
      };

      if (win.navigator && win.navigator.clipboard && win.navigator.clipboard.writeText) {
        win.navigator.clipboard.writeText(brief).then(
          function () { done(true); },
          function () { done(legacyCopy()); }
        );
      } else {
        done(legacyCopy());
      }
    }

    routeBtn.addEventListener("click", onRoute);
    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
    copyBtn.addEventListener("click", onCopy);
    if (chips) {
      chips.addEventListener("click", function (ev) {
        var b = ev.target.closest ? ev.target.closest("button[data-role]") : null;
        if (b) onPickRole(b.getAttribute("data-role"));
      });
    }
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
    briefFor: oneLineBrief,
    mount: mount
  };
});
