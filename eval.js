// Router accuracy report. "tuned" cases shaped the keyword lists; "blind" cases
// were written afterward and never tuned on, so blind accuracy is the honest number.
// Usage: node eval.js
"use strict";
const api = require("./app.js");
const TUNED = [
[
"ugh the stripe payout didn't land and taxes are due friday",
"ops"
],
[
"need to reschedule the dentist and cancel the gym membership",
"ops"
],
[
"hire a contractor to clean up the books",
"ops"
],
[
"order more shipping boxes, we're out",
"ops"
],
[
"reply to the customer who wants a refund",
"ops"
],
[
"post something on instagram about the sale this weekend",
"marketing"
],
[
"write a blog post announcing the new feature",
"marketing"
],
[
"the landing page headline sucks, punch it up",
"marketing"
],
[
"make a promo video for tiktok",
"marketing"
],
[
"email my list about the black friday discount",
"marketing"
],
[
"what are people saying about us on reddit",
"research"
],
[
"find out how much similar apps charge",
"research"
],
[
"is there a grant for small businesses I qualify for",
"research"
],
[
"read up on GDPR rules for newsletters",
"research"
],
[
"figure out which CRM is best for one person",
"research"
],
[
"site is down again, 500 errors on checkout",
"code"
],
[
"add dark mode to the dashboard",
"code"
],
[
"the python script that exports orders crashes",
"code"
],
[
"set up a github action to run tests",
"code"
],
[
"migrate the database to postgres",
"code"
],
[
"invoice is late and the website's contact form is broken",
"code"
],
[
"write a tweet thread about why our checkout keeps crashing lol",
"marketing"
],
[
"gotta pay the electric bill and sort receipts for my accountant",
"ops"
],
[
"set up a call with the new supplier next tuesday",
"ops"
],
[
"send the w-9 to the client",
"ops"
],
[
"track down the missing package from ups",
"ops"
],
[
"update the linkedin banner and bio",
"marketing"
],
[
"come up with a name for the podcast",
"marketing"
],
[
"draft a cold email to local coffee shops",
"marketing"
],
[
"write product descriptions for the etsy listings",
"marketing"
],
[
"how do other solo founders price consulting",
"research"
],
[
"dig into why signups dropped last month",
"research"
],
[
"check what the law says about selling candles online",
"research"
],
[
"gather some examples of good onboarding flows",
"research"
],
[
"the checkout button does nothing on mobile",
"code"
],
[
"make the page load faster",
"code"
],
[
"hook up the contact form to send me an email",
"code"
],
[
"write a script to rename all my photos",
"code"
],
[
"upgrade node and fix whatever breaks",
"code"
],
[
"schedule the newsletter to go out friday",
"marketing"
]
];
const BLIND = [
[
"renew my business license before it expires",
"ops"
],
[
"the printer ink ran out, get more",
"ops"
],
[
"pay the freelance designer for last month",
"ops"
],
[
"organize the shared drive folders",
"ops"
],
[
"book flights for the trade show",
"ops"
],
[
"chase the client who hasn't paid in 60 days",
"ops"
],
[
"write a thank-you post for our first 100 customers",
"marketing"
],
[
"make three thumbnail ideas for the youtube video",
"marketing"
],
[
"draft a press release about the partnership",
"marketing"
],
[
"plan next month's content calendar",
"marketing"
],
[
"get some reviews on google from happy clients",
"marketing"
],
[
"write the welcome email for new subscribers",
"marketing"
],
[
"find a cheaper email provider than mailchimp",
"research"
],
[
"what's the average open rate for newsletters",
"research"
],
[
"compare shopify and squarespace fees",
"research"
],
[
"research whether I need an LLC",
"research"
],
[
"summarize the feedback survey results",
"research"
],
[
"see what hashtags competitors use",
"research"
],
[
"the images on the homepage are broken",
"code"
],
[
"add a search bar to the blog",
"code"
],
[
"users can't reset their password",
"code"
],
[
"set up automatic backups for the database",
"code"
],
[
"the app crashes when I upload a big file",
"code"
],
[
"put a cookie banner on the site",
"code"
]
];
function run(name, cases) {
  let ok = 0, unsure = 0;
  const misses = [];
  for (const [text, want] of cases) {
    const r = api.route(text);
    if (r.role === want) ok++;
    else misses.push(`  miss: want ${want}, got ${r.role} (${r.confidence}) — ${text}`);
    if (r.confidence !== "high") unsure++;
  }
  console.log(`${name}: ${ok}/${cases.length} correct (${Math.round((100 * ok) / cases.length)}%), ${unsure} flagged unsure`);
  misses.forEach((m) => console.log(m));
}
run("tuned", TUNED);
run("blind", BLIND);
