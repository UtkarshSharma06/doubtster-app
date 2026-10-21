import type { Article } from "@/lib/blog";
import { PRICING as P, usd, usdTrim, perVideo } from "./pricing";

const mo = usd(P.monthly);
const an = usdTrim(P.annual);
const tr = usd(P.trialPrice);
const pvM = usd(+perVideo.monthly.toFixed(2));
const pvA = usd(+perVideo.annual.toFixed(2));
const callout = (kind: "key" | "mistake", title: string, body: string) =>
  `<aside class="callout ${kind}"><strong>${title}</strong><p>${body}</p></aside>`;

const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const DEP_TABLE = (() => {
  let v = 30000;
  const rows = [1, 2, 3, 4, 5, 6].map((y) => {
    const loss = v * 0.15;
    const end = v - loss;
    const r = `<tr><th scope="row">${y}</th><td>${money(v)}</td><td>${money(loss)}</td><td>${money(end)}</td></tr>`;
    v = end;
    return r;
  });
  return `<table><thead><tr><th scope="col">Year</th><th scope="col">Value at start</th><th scope="col">Loss (15%)</th><th scope="col">Value at end</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
})();
const AI = `<p class="aimist">AI explanations can contain mistakes. Check important answers with your teacher.</p>`;

export const ARTICLES: Article[] = [
  {
    slug: "start-here-how-doubtster-works",
    cat: "guides",
    minutes: 5,
    lead: true,
    title: "Start here: how Doubtster works",
    excerpt: "Ask a question, read the answer, and turn it into a short explainer video when you want to see it worked out.",
    tldr: "Chat is always free. Videos use credits. You start with a paid trial, then your chosen plan continues unless you cancel.",
    sections: [
      {
        id: "the-idea",
        heading: "The idea in one minute",
        html: `<p>Doubtster is for the moment you are stuck on a question and the textbook is not helping. You type the question. You get a written answer. If you want to see the steps drawn out and spoken, you can turn that answer into a short video.</p>
<p>That is the whole product. Everything else on this page is detail.</p>`,
      },
      {
        id: "three-steps",
        heading: "Three steps",
        html: `<ol class="steps">
<li><strong>Ask.</strong> Type or paste your question. Chat is free, always.</li>
<li><strong>Read.</strong> You get a step by step written answer you can follow at your own pace.</li>
<li><strong>Watch.</strong> Want it explained visually? Generate a video. Each video uses one credit.</li>
</ol>
${callout("key", "Worth knowing", "You never need a video to get an answer. Videos are an extra way to understand it.")}`,
      },
      {
        id: "what-it-costs",
        heading: "What it costs",
        html: `<table><thead><tr><th scope="col">Plan</th><th scope="col">Price</th><th scope="col">Video credits</th></tr></thead><tbody>
<tr><th scope="row">Trial</th><td>${tr} for ${P.trialDays} days</td><td>${P.trialVideos} videos</td></tr>
<tr><th scope="row">Monthly</th><td>${mo} per month</td><td>${P.monthlyCredits} per month</td></tr>
<tr><th scope="row">Annual</th><td>${an} per year</td><td>${P.monthlyCredits} released each month</td></tr>
</tbody></table>
<p>Need more? You can buy top-ups on a paid plan. Read <a href="/blog/credits-explained">Credits explained</a> for the details, and <a href="/blog/how-the-7-day-trial-works">how the trial works</a> before you start.</p>`,
      },
      {
        id: "accuracy",
        heading: "A word on accuracy",
        html: `<p>AI is good at explaining and sometimes wrong. We say so plainly. Use Doubtster to understand, then check anything that matters, such as exam answers, with your teacher.</p>${AI}`,
      },
    ],
    takeaways: ["Chat is always free.", "Videos cost one credit each.", "Check important answers with your teacher."],
  },
  {
    slug: "how-the-7-day-trial-works",
    cat: "guides",
    minutes: 4,
    calculator: true,
    title: "How the 7 day trial works",
    excerpt: `The trial costs ${tr}, runs for ${P.trialDays} days and includes ${P.trialVideos} videos. Here is what happens on day 7, and how to cancel in time.`,
    tldr: `Pay ${tr} to try for ${P.trialDays} days with ${P.trialVideos} videos. If you do not cancel before the trial ends, your chosen plan starts and is charged.`,
    sections: [
      {
        id: "what-you-get",
        heading: "What you get",
        html: `<p>The trial is ${tr}. It lasts ${P.trialDays} days and includes ${P.trialVideos} video explanations. Chat is free on top of that, as always.</p>
<div class="tiles"><div><small>DAY 1</small><b>Pay ${tr}</b><span>Start asking questions right away.</span></div><div><small>DAYS 1 TO ${P.trialDays}</small><b>Use ${P.trialVideos} videos</b><span>One credit makes one video.</span></div><div><small>DAY ${P.trialDays}</small><b>Plan starts</b><span>Unless you cancel before the trial ends.</span></div></div>`,
      },
      {
        id: "after-the-trial",
        heading: "What happens after",
        html: `<p>When the trial ends, the plan you picked begins automatically: ${mo} per month, or ${an} per year. Unused trial credits expire when the trial ends. They do not carry into your plan.</p>
${callout("mistake", "The common mistake", "Cancelling on the last day. Cancel at least a day early so there is no doubt about timing. A charge that comes from forgetting to cancel is not refundable.")}`,
      },
      {
        id: "calculator",
        heading: "What would you pay?",
        html: `<p>Pick a plan and the day you cancel. The numbers below follow the rules above.</p><div data-calculator></div>`,
      },
      {
        id: "quick-answers",
        heading: "Quick answers",
        html: `<details class="q"><summary>Is chat free during the trial?</summary><p>Yes. Chat is always free, with or without a trial or plan.</p></details>
<details class="q"><summary>What happens to unused trial videos?</summary><p>They expire when the trial ends. They do not roll into your plan.</p></details>
<details class="q"><summary>How many videos does my plan include?</summary><p>Monthly includes ${P.monthlyCredits} credits a month. Annual releases ${P.monthlyCredits} credits each month across the year. Plan credits reset monthly and do not roll over.</p></details>`,
      },
      {
        id: "refunds",
        heading: "Refunds",
        html: `<p>Refunds are limited to cases such as a payment verification failure or an account bug on our side. Forgetting to turn off auto-renewal is not one of them. The full wording is on the <a href="/refund-policy">refund policy</a> page.</p>`,
      },
    ],
    takeaways: [`Trial: ${tr}, ${P.trialDays} days, ${P.trialVideos} videos.`, "Your plan starts automatically after the trial.", "Cancel a day early. Forgotten cancellations are not refunded."],
  },
  {
    slug: "credits-explained",
    cat: "guides",
    minutes: 3,
    title: "Credits explained",
    excerpt: "One credit makes one video. Here is how plan credits, trial credits and top-ups behave.",
    tldr: `One credit equals one video. Plan credits reset monthly and do not roll over. Top-ups last ${P.topupValidDays} days.`,
    sections: [
      {
        id: "basics",
        heading: "The basics",
        html: `<p>Each video explanation uses one credit. Monthly plans include ${P.monthlyCredits} credits each month. Annual plans release ${P.monthlyCredits} credits each month across the year.</p>
<p>That works out to roughly ${pvM} per video on monthly and ${pvA} per video on annual.</p>`,
      },
      {
        id: "resets",
        heading: "Resets and expiry",
        html: `<ul><li>Plan credits reset each month and do not roll over.</li><li>Trial credits expire when the trial ends.</li><li>Chat never uses credits.</li></ul>`,
      },
      {
        id: "topups",
        heading: "Top-ups",
        html: `<table><thead><tr><th scope="col">Pack</th><th scope="col">Price</th><th scope="col">Per video</th></tr></thead><tbody>
${P.topups.map((t) => `<tr><th scope="row">${t.credits} credits</th><td>${usd(t.price)}</td><td>about ${usd(+(t.price / t.credits).toFixed(2))}</td></tr>`).join("")}
</tbody></table>
<p>Top-ups are valid for ${P.topupValidDays} days and are available on paid plans only.</p>`,
      },
    ],
    takeaways: ["1 credit = 1 video.", "Plan credits reset monthly.", `Top-ups last ${P.topupValidDays} days, paid plans only.`],
  },
  {
    slug: "what-we-are-building-next",
    cat: "updates",
    minutes: 3,
    title: "What we are building next",
    excerpt: "An honest look at what works today and what is on the way. No dates, because we would rather ship than promise.",
    tldr: "Text answers and videos work now. Diagrams and exam board matching are coming soon, with no dates promised.",
    sections: [
      {
        id: "today",
        heading: "Working today",
        html: `<ul><li>Free chat with step by step written answers.</li><li>Video explanations from your questions.</li></ul>`,
      },
      {
        id: "soon",
        heading: "Coming soon",
        html: `<ul><li><strong>Richer diagrams</strong> inside answers. <em>Coming soon.</em></li><li><strong>Exam board matching</strong>, so explanations follow your syllabus. <em>Coming soon.</em></li></ul>
<p>We are not giving dates. When something ships, it will appear in this section.</p>`,
      },
    ],
    takeaways: ["Chat and videos work today.", "Diagrams and exam board matching are coming soon."],
  },
  {
    slug: "why-we-build-videos-from-code",
    cat: "behind",
    minutes: 6,
    title: "Why we build videos from code",
    excerpt: "Every explainer is generated from a script, so equations stay exact and the picture matches the words.",
    tldr: "A video is a plan written as data, then drawn by code. That keeps maths precise and lets us fix errors by changing a line, not re-recording.",
    sections: [
      {
        id: "problem",
        heading: "The problem with generated video",
        html: `<p>Image models draw beautiful pictures and terrible equations. A tilted plus sign or a missing exponent makes a maths video worse than useless. So we do not ask a model to paint the frames.</p>`,
      },
      {
        id: "approach",
        heading: "Plan first, draw second",
        html: `<ol class="steps"><li>The model writes a storyboard: scenes, narration and on-screen content.</li><li>Code draws each scene. Equations are typeset, graphs are plotted from real expressions.</li><li>Narration is added and everything is stitched together.</li></ol>
${callout("key", "Why it matters", "Maths is typeset, not painted, so a squared term stays squared.")}`,
      },
      {
        id: "limits",
        heading: "The limits",
        html: `<p>The storyboard still comes from an AI, so the reasoning can be wrong even when the drawing is exact. That is why we keep reminding you to check what matters.</p>${AI}`,
      },
    ],
    takeaways: ["Storyboard first, drawing second.", "Equations are typeset by code.", "Exact drawing does not mean exact reasoning."],
  },
  {
    slug: "reducing-balance-depreciation",
    cat: "examples",
    subject: "Maths",
    minutes: 6,
    title: "Reducing balance depreciation, step by step",
    excerpt: "A $30,000 car loses 15% of its value each year. Work out what it is worth after six years.",
    tldr: "Multiply the starting value by 0.85 for each year. After six years that is 30,000 × 0.85⁶, about $11,314.",
    sections: [
      {
        id: "idea",
        heading: "The idea",
        html: `<p>Reducing balance means the loss each year is a percentage of what is left, not of the original price. So the loss shrinks as the value shrinks.</p>
<p>Losing 15% means keeping 85%. The multiplier each year is <strong>0.85</strong>.</p>`,
      },
      {
        id: "formula",
        heading: "The formula",
        html: `<p class="eq">V = P × (1 − r)ⁿ</p><p>Here P = 30,000, r = 0.15 and n = 6.</p>`,
      },
      {
        id: "table",
        heading: "Year by year",
        html: `${DEP_TABLE}
<p>Check with the formula: 0.85⁶ ≈ 0.3771, and 30,000 × 0.3771 ≈ $11,314.</p>`,
      },
      {
        id: "mistake",
        heading: "The common mistake",
        html: `${callout("mistake", "Straight line thinking", "Taking 15% of $30,000 every year gives $4,500 each year, so $27,000 lost and only $3,000 left after six years. That is straight line depreciation, and it is a different method.")}
<p><strong>Try it:</strong> a $12,000 laptop loses 20% each year. What is it worth after 3 years? <em>Answer: 12,000 × 0.8³ = $6,144.</em></p>${AI}`,
      },
    ],
    takeaways: ["Keep 85% each year, multiply by 0.85.", "Loss shrinks as value shrinks.", "Do not mix it up with straight line depreciation."],
  },
  {
    slug: "turn-a-wrong-answer-into-a-revision-note",
    cat: "tips",
    minutes: 4,
    title: "Turn a wrong answer into a revision note",
    excerpt: "A mistake is the most useful thing on your page. Here is a three line way to keep it.",
    tldr: "Write what you did, what was right, and the one-sentence reason. Review the note, not the whole question.",
    sections: [
      {
        id: "why",
        heading: "Why mistakes beat easy wins",
        html: `<p>Getting something right tells you little. Getting it wrong shows exactly where your understanding breaks. That is worth keeping.</p>`,
      },
      {
        id: "format",
        heading: "The three line note",
        html: `<ol class="steps"><li><strong>What I did:</strong> x = 4.</li><li><strong>What was right:</strong> x = −4.</li><li><strong>Why:</strong> I forgot to flip the sign when moving the term across.</li></ol>
${callout("key", "Keep it short", "If the why takes more than one sentence, you have not found the real cause yet.")}`,
      },
      {
        id: "review",
        heading: "Review it",
        html: `<p>Read your notes the day after, then a week later. Ask Doubtster to explain the step you got wrong if the reason still feels fuzzy.</p>`,
      },
    ],
    takeaways: ["Record what, right answer, and why.", "One sentence for the why.", "Review the note, not the whole question."],
  },
  {
    slug: "how-we-think-about-accuracy",
    cat: "behind",
    minutes: 5,
    title: "How we think about accuracy",
    excerpt: "AI explanations can be wrong. What we do about it, and what we ask you to do.",
    tldr: "We cannot promise every answer is right. Use Doubtster to understand, then verify what matters.",
    sections: [
      {
        id: "honest",
        heading: "The honest version",
        html: `<p>Language models can sound confident while being wrong. Maths and science make that obvious when the final number does not check out.</p>`,
      },
      {
        id: "what-we-do",
        heading: "What we do",
        html: `<ul><li>Show every step, so an error can be spotted.</li><li>Typeset equations by code, so formatting never hides a mistake.</li><li>Label the limit clearly, on every answer.</li></ul>`,
      },
      {
        id: "what-you-do",
        heading: "What you can do",
        html: `<ul><li>Plug your result back into the question.</li><li>Check the units.</li><li>Ask your teacher about anything you will be graded on.</li></ul>${AI}`,
      },
    ],
    takeaways: ["Steps make errors visible.", "Verify what matters.", "Your teacher has the final word."],
  },
  {
    slug: "velocity-and-acceleration",
    cat: "examples",
    subject: "Physics",
    minutes: 7,
    title: "Velocity and acceleration, worked through",
    excerpt: "A car speeds up from rest. Find its acceleration and how far it travels, one step at a time.",
    tldr: "Acceleration is change in velocity over time. Use s = ut + ½at² for distance when it starts from rest or at speed u.",
    sections: [
      {
        id: "ideas",
        heading: "Two ideas",
        html: `<p>Velocity is how fast you are going and in which direction. Acceleration is how quickly your velocity changes.</p><p class="eq">a = Δv / Δt</p>`,
      },
      {
        id: "example",
        heading: "Worked example",
        html: `<p>A car starts from rest and reaches 20 m/s in 5 s. Find its acceleration and the distance covered.</p>
<ol class="steps"><li>Acceleration: a = (20 − 0) / 5 = <strong>4 m/s²</strong>.</li><li>Distance: s = ut + ½at² = 0 + ½ × 4 × 5² = 0 + 2 × 25 = <strong>50 m</strong>.</li></ol>`,
      },
      {
        id: "mistake",
        heading: "The common mistake",
        html: `${callout("mistake", "Squaring the wrong thing", "In ½at², only t is squared. Writing (½at)² gives a very different number.")}
<p><strong>Try it:</strong> a car starts from rest and reaches 12 m/s in 6 s. Find a and the distance. <em>Answer: a = 2 m/s², s = ½ × 2 × 6² = 36 m.</em></p>${AI}`,
      },
    ],
    takeaways: ["a = Δv / Δt.", "s = ut + ½at², square only t.", "Always include units."],
  },
  {
    slug: "ask-a-question-that-gets-a-clearer-explanation",
    cat: "tips",
    minutes: 5,
    title: "Ask a question that gets a clearer explanation",
    excerpt: "A little context in your question makes the answer fit you much better.",
    tldr: "Say what you are studying, what you tried, and where you got stuck. The answer will aim at your gap.",
    sections: [
      {
        id: "vague",
        heading: "Vague in, vague out",
        html: `<p>"Explain derivatives" gets a generic answer. "I understand slope but not why the derivative of x² is 2x" gets one aimed at your gap.</p>`,
      },
      {
        id: "recipe",
        heading: "A simple recipe",
        html: `<ol class="steps"><li><strong>Level:</strong> say what you are studying.</li><li><strong>Attempt:</strong> paste what you tried.</li><li><strong>Stuck point:</strong> name the exact step that loses you.</li></ol>`,
      },
      {
        id: "follow-up",
        heading: "Follow up freely",
        html: `<p>Chat is free, so ask the follow up. "Explain it like I am new to this" and "give me a harder example" both work well.</p>`,
      },
    ],
    takeaways: ["Say your level.", "Show your attempt.", "Name the stuck step."],
  },
  {
    slug: "supply-and-demand-equilibrium",
    cat: "examples",
    subject: "Economics",
    minutes: 5,
    title: "Supply and demand: finding equilibrium",
    excerpt: "Given demand and supply equations, find the price where the market clears.",
    tldr: "Set quantity demanded equal to quantity supplied and solve for price. Here P = 16 and Q = 68.",
    sections: [
      {
        id: "setup",
        heading: "The setup",
        html: `<p>Demand: Qd = 100 − 2P. Supply: Qs = 20 + 3P. Equilibrium is where Qd = Qs.</p>`,
      },
      {
        id: "solve",
        heading: "Solve it",
        html: `<ol class="steps"><li>100 − 2P = 20 + 3P</li><li>80 = 5P</li><li>P = <strong>16</strong></li><li>Q = 100 − 2(16) = <strong>68</strong></li></ol>`,
      },
      {
        id: "check",
        heading: "What if the price is wrong?",
        html: `<table><thead><tr><th scope="col">Price</th><th scope="col">Qd</th><th scope="col">Qs</th><th scope="col">Result</th></tr></thead><tbody>
<tr><th scope="row">10</th><td>80</td><td>50</td><td>Shortage of 30</td></tr>
<tr><th scope="row">16</th><td>68</td><td>68</td><td>Equilibrium</td></tr>
<tr><th scope="row">20</th><td>60</td><td>80</td><td>Surplus of 20</td></tr>
</tbody></table>${AI}`,
      },
    ],
    takeaways: ["Set Qd = Qs.", "Solve for P, then plug in for Q.", "Below equilibrium is a shortage, above is a surplus."],
  },
  {
    slug: "a-simple-weekly-revision-plan",
    cat: "tips",
    minutes: 5,
    title: "A simple weekly revision plan",
    excerpt: "Short and often beats long and rare. A plan you can actually keep.",
    tldr: "Study for short sessions most days, add a weekly review, and leave one day light.",
    sections: [
      {
        id: "rules",
        heading: "Three rules",
        html: `<ul><li>Short sessions, most days.</li><li>One weekly review of last week's mistakes.</li><li>One light day. Rest is part of the plan.</li></ul>`,
      },
      {
        id: "week",
        heading: "A sample week",
        html: `<table><thead><tr><th scope="col">Day</th><th scope="col">Focus</th></tr></thead><tbody>
<tr><th scope="row">Mon</th><td>New topic</td></tr><tr><th scope="row">Tue</th><td>Practice questions</td></tr><tr><th scope="row">Wed</th><td>New topic</td></tr><tr><th scope="row">Thu</th><td>Practice questions</td></tr><tr><th scope="row">Fri</th><td>Mistake notes</td></tr><tr><th scope="row">Sat</th><td>Weekly review</td></tr><tr><th scope="row">Sun</th><td>Rest or light reading</td></tr>
</tbody></table>`,
      },
    ],
    takeaways: ["Short and often.", "Review your mistakes weekly.", "Keep one light day."],
  },
  {
    slug: "big-o-notation-deck-of-cards",
    cat: "examples",
    subject: "Coding",
    minutes: 8,
    title: "Big O notation with a deck of cards",
    excerpt: "Find a card in a deck three ways and see why some methods stop working as the pile grows.",
    tldr: "Big O describes how the work grows with the input. Halving each step is O(log n); comparing every pair is O(n²).",
    sections: [
      {
        id: "cards",
        heading: "The card game",
        html: `<p>You want a card in a sorted deck. Checking from the top is <strong>O(n)</strong>. Cutting the deck in half each time is <strong>O(log n)</strong>. Comparing every card with every other is <strong>O(n²)</strong>.</p>`,
      },
      {
        id: "numbers",
        heading: "The numbers",
        html: `<table><thead><tr><th scope="col">Items</th><th scope="col">O(log n)</th><th scope="col">O(n²)</th></tr></thead><tbody>
<tr><th scope="row">52</th><td>6</td><td>2,704</td></tr>
<tr><th scope="row">1,000</th><td>10</td><td>1,000,000</td></tr>
</tbody></table>
<p>At 52 cards, both feel fine. At 1,000 the difference is enormous.</p>`,
      },
      {
        id: "mistake",
        heading: "The common mistake",
        html: `${callout("mistake", "Big O is not seconds", "It describes growth, not speed. A well written O(n²) code can beat a clumsy O(n) on tiny inputs.")}
<p><strong>Try it:</strong> two nested loops over the same list of n items. What is the Big O? <em>Answer: O(n²).</em></p>${AI}`,
      },
    ],
    takeaways: ["Big O describes growth.", "Halving is O(log n).", "Nested loops are often O(n²)."],
  },
];

export const bySlug = (s: string) => ARTICLES.find((a) => a.slug === s);
