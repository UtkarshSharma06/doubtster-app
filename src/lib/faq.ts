// FAQ content. Used for the visible FAQ section and for FAQPage structured data.
// Answers lead with the direct answer, which is what AI Overviews and assistants quote.
export const FAQ: { q: string; a: string; link?: { href: string; text: string } }[] = [
  { q: "what is doubtster?", a: "Doubtster is an AI homework helper. You ask a question, get a free step-by-step answer in chat, and can turn it into a short explainer video when you want to see it worked out on a board." },
  { q: "is chat really free?", a: "Yes. Text answers are free and never use credits. Only generating a video uses a credit." },
  { q: "which subjects can I ask about?", a: "Maths (algebra, calculus, statistics, trigonometry), physics, chemistry, biology, economics, accounting, finance and coding, plus most school and university subjects. You can ask in English, French, Spanish or Hindi." },
  { q: "how do the explainer videos work?", a: "Doubtster turns an answer into a narrated video, usually one to three minutes long. A voice explains each step and why it works while the working is written on a board, with diagrams, graphs and code drawn in." },
  { q: "is using an AI homework helper cheating?", a: "Doubtster is built for understanding, not copying: every answer shows the steps and the reason for each one, so you can do the next question yourself. Check your school's rules on AI tools for graded work." },
  { q: "how is doubtster different from Photomath or Chegg?", a: "Photomath focuses on maths from a photo, and Chegg is known for textbook solutions and expert Q&A. Doubtster covers every subject in chat for free and can turn any answer into a narrated board video." },
  { q: "what happens after the $1.99 trial?", a: "The trial lasts 7 days and includes 3 videos. If you don't cancel before day 7, it continues as a paid plan. Trial credits expire when the trial ends." },
  { q: "do unused credits roll over?", a: "No. Plan credits reset every month. Top-up credits last 90 days and need an active paid plan." },
  { q: "can I get a refund if I forget to cancel?", a: "No. Refunds only apply to payment verification failures or account bugs on our side.", link: { href: "/refund-policy", text: "Read the refund policy" } },
  { q: "can the answers be wrong?", a: "Yes. AI explanations can contain mistakes, so check important answers with your teacher. Doubtster checks maths steps with a computer algebra system before a video is made, which catches many errors but not all." },
];
