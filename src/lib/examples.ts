// The four example lessons. Each gets a watch page at /examples/[slug] with the video,
// a full transcript and VideoObject structured data, so Google can index the videos.
export type Chapter = { heading: string; text: string };
export type Example = {
  slug: string; subject: string; color: string; video: string; secs: number;
  title: string; seoTitle: string; question: string; description: string; answer: string;
  keywords: string[]; chapters: Chapter[]; duration: string; durationLabel: string;
};

export const UPLOAD_DATE = "2026-10-17";

export const EXAMPLES: Example[] = [
 {
  "slug": "integral-of-x-sin-x-integration-by-parts",
  "subject": "maths",
  "color": "#2F7BFF",
  "video": "maths-integration-by-parts",
  "secs": 121,
  "title": "Integral of x sin x from 0 to π/2, solved by parts",
  "seoTitle": "Integral of x sin x from 0 to π/2 by Parts, Step by Step",
  "question": "Evaluate the integral of x sin x from 0 to π/2.",
  "description": "Watch the integral of x sin x from 0 to π/2 worked out step by step with integration by parts: choosing u and dv, plugging in, the limits, and a check. The answer is 1.",
  "answer": "The integral of x sin x from 0 to π/2 equals 1.",
  "keywords": [
   "integral of x sin x",
   "integration by parts",
   "x sin x dx",
   "definite integral",
   "calculus step by step"
  ],
  "chapters": [
   {
    "heading": "The question",
    "text": "Let's work out the integral of x sine x from zero to pi over two, and see exactly how it's done."
   },
   {
    "heading": "What we know and the plan",
    "text": "Here's what we know. We're integrating x times sine x, from zero to pi over two. We need one exact number. Because it's a product of two functions, we'll use integration by parts. It trades this integral for an easier one."
   },
   {
    "heading": "Set it up",
    "text": "We start with the integral from zero to pi over two of x sine x. Pick u to be x, because x gets simpler when we differentiate it. That leaves d v as sine x d x. Differentiate u, and d u is just d x. Integrate d v. The integral of sine is minus cos x. Now the parts formula. It's u times v, minus the integral of v d u."
   },
   {
    "heading": "Plug it in",
    "text": "Put in u and v. That's minus x cos x, from zero to pi over two, minus the integral of minus cos x. Two minuses make a plus, so now we're adding the integral of cos x. The bracket is zero. Cos of pi over two is zero, and at zero the x makes it zero. So only this integral is left."
   },
   {
    "heading": "Finish it",
    "text": "The integral of cos x is sine x, from zero to pi over two. Top limit first: sine of pi over two, minus the bottom limit, sine of zero. Sine of pi over two is one, and sine of zero is zero. So the answer is exactly one."
   },
   {
    "heading": "What it means",
    "text": "Here's the picture. The shaded area under x sine x, from zero to pi over two, is exactly one."
   },
   {
    "heading": "The answer",
    "text": "So the integral equals one."
   },
   {
    "heading": "Checking the answer",
    "text": "To check, differentiate our antiderivative, sine x minus x cos x. We get x sine x back, so it's right."
   },
   {
    "heading": "The common mistake",
    "text": "A common mistake is choosing u as sine x. That makes the new integral harder, not easier."
   }
  ],
  "duration": "PT2M1S",
  "durationLabel": "2:01"
 },
 {
  "slug": "block-sliding-down-incline-with-friction",
  "subject": "physics",
  "color": "#E5484D",
  "video": "physics-block-on-a-ramp",
  "secs": 110,
  "title": "Block sliding down a 30° incline with friction: find the acceleration",
  "seoTitle": "Block on an Incline with Friction: Acceleration, Step by Step",
  "question": "A block slides down a 30° slope with friction coefficient μ = 0.2. Find its acceleration (g = 9.8 m/s²).",
  "description": "A block slides down a 30° incline with μ = 0.2. See the force diagram, Newton's second law along the slope, why N = mg cos θ, and the answer a ≈ 3.20 m/s², explained step by step.",
  "answer": "The block accelerates down the slope at about 3.20 m/s², from a = g(sin θ − μ cos θ).",
  "keywords": [
   "inclined plane with friction",
   "block sliding down incline",
   "acceleration on a slope",
   "normal force on incline",
   "newton second law problem"
  ],
  "chapters": [
   {
    "heading": "The question",
    "text": "A block slides down a thirty degree slope with friction. Let's find its acceleration, step by step."
   },
   {
    "heading": "The situation",
    "text": "Picture a block on a rough wooden ramp."
   },
   {
    "heading": "What we know and the plan",
    "text": "We know the slope is thirty degrees, the friction coefficient is zero point two, and g is nine point eight. We need the acceleration down the slope. We'll use Newton's second law along the slope, because only those forces change the motion."
   },
   {
    "heading": "The forces",
    "text": "Three forces act on the block. Gravity pulls straight down, the normal force pushes out of the slope, and friction pushes back up the slope."
   },
   {
    "heading": "Forces along the slope",
    "text": "The net force down the slope is the part of gravity along the slope, m g sine theta, minus friction, which pushes back up. Friction is mu times the normal force, and on a slope the normal force is m g cos theta. Newton's second law says m a equals the net force, with friction swapped in. Every term has an m, so the mass cancels. a equals g times sine theta minus mu cos theta."
   },
   {
    "heading": "Put in the numbers",
    "text": "Now the numbers. g is nine point eight, theta is thirty degrees and mu is zero point two. Sine thirty is a half, and cos thirty is about zero point eight six six. Inside the bracket, that's about zero point three two seven. Multiply, and the acceleration is about three point two metres per second squared."
   },
   {
    "heading": "The answer",
    "text": "So the block speeds up at about three point two metres per second squared."
   },
   {
    "heading": "Checking the answer",
    "text": "Quick check. With no friction it would be g sine theta, four point nine. Friction should slow it down, and three point two is less. That makes sense."
   },
   {
    "heading": "The common mistake",
    "text": "Watch out: on a slope the normal force is not m g. It's m g cos theta."
   }
  ],
  "duration": "PT1M50S",
  "durationLabel": "1:50"
 },
 {
  "slug": "median-of-two-sorted-arrays",
  "subject": "coding",
  "color": "#8A4DFF",
  "video": "coding-median-two-arrays",
  "secs": 205,
  "title": "Median of two sorted arrays, explained with binary search",
  "seoTitle": "Median of Two Sorted Arrays (LeetCode 4), Explained in Video",
  "question": "Given two sorted arrays nums1 and nums2 of size m and n, return the median of the two sorted arrays.",
  "description": "The median of two sorted arrays problem (LeetCode 4) explained step by step: the partition idea, moving the cut with binary search, a worked example and the Python code, in O(log min(m, n)) time.",
  "answer": "Binary search for a cut in the smaller array so the left halves hold half the numbers and every left value is at most every right value. The median sits at the cut. Time O(log min(m, n)), space O(1).",
  "keywords": [
   "median of two sorted arrays",
   "leetcode 4",
   "binary search partition",
   "median of two sorted arrays python",
   "o(log(m+n))"
  ],
  "chapters": [
   {
    "heading": "The question",
    "text": "Two sorted arrays, and we want their median, without merging them. Here's the trick."
   },
   {
    "heading": "What we know and the plan",
    "text": "We have two sorted arrays. Let's call them A, of size m, and B, of size n. We need the median of all the numbers together. Merging works, but it takes m plus n steps, and we can do much better. The key idea: we don't need the merged array. We only need to find the right place to cut. And a cut position is something we can binary search."
   },
   {
    "heading": "The idea: cut both arrays",
    "text": "First, decide how many numbers go on the left side. That's m plus n plus one, over two, rounded down. The plus one puts the extra number on the left when the total is odd. Now cut A after i numbers, and B after j numbers. Together, the left pieces must hold exactly half. So once we pick i, j is fixed. j is half minus i. We only search for one number, i. When is a cut correct? The last number on A's left must be at most the first number on B's right, and the last number on B's left must be at most the first on A's right. Then everything on the left is smaller than everything on the right."
   },
   {
    "heading": "Moving the cut",
    "text": "If A's left side has a number that's too big, we took too much from A. Move the cut left. If B's left side has a number that's too big, we took too little from A. Move the cut right. When the cut is correct, and the total is odd, the median is the biggest number on the left side. When the total is even, it's the average of the biggest on the left and the smallest on the right."
   },
   {
    "heading": "Try it on an example",
    "text": "Let's try A equals one, three, eight, and B equals seven, nine, ten, eleven. Three plus four is seven numbers, so four go on the left. Search i from zero to three. The middle is one, so j is three. But ten, on B's left, is bigger than three, on A's right. Move right. Now i is two, and j is two. Nine is still bigger than eight. Move right again. Now i is three, and j is one. Eight is at most nine, and seven is at most infinity, because A has nothing left on the right. The cut is correct. Seven numbers is odd, so the median is the bigger of eight and seven. Eight."
   },
   {
    "heading": "The code",
    "text": "Here's the code. First, make sure A is the smaller array, so we binary search the short one and j never goes negative. Work out the sizes and half, and search i anywhere from zero to m. Each round, try the middle i, and j follows from it. Read the four numbers around the cut. If a side is empty, use minus infinity or infinity, so the comparison always works. If the cut is correct, return the median: the biggest on the left for odd totals, or the average of the two middle numbers for even. Otherwise, move the cut left or right, exactly as we did by hand."
   },
   {
    "heading": "The answer",
    "text": "Each round halves the search, so it runs in log of the smaller size, with constant extra space."
   },
   {
    "heading": "Checking the answer",
    "text": "To check, merge the example by hand: one, three, seven, eight, nine, ten, eleven. The middle number is eight. It matches."
   },
   {
    "heading": "The common mistake",
    "text": "A common mistake is merging first. It gives the right answer, but it's too slow for this question. And always binary search the smaller array."
   }
  ],
  "duration": "PT3M25S",
  "durationLabel": "3:25"
 },
 {
  "slug": "why-dna-replication-is-semiconservative",
  "subject": "biology",
  "color": "#12A150",
  "video": "biology-dna-replication",
  "secs": 142,
  "title": "Why is DNA replication semiconservative?",
  "seoTitle": "Why Is DNA Replication Semiconservative? Video Explanation",
  "question": "DNA replication is considered semiconservative because: A) only the non-parent strand acts as a template, B) both strands are made de novo, C) one strand in each new DNA molecule is parental and the other is new, D) the daughter strands are fragmented and dispersive.",
  "description": "Why DNA replication is called semiconservative: each new DNA molecule keeps one parental strand and gets one new strand. Each option explained, a two-round strand diagram, and the Meselson and Stahl experiment.",
  "answer": "C. One strand in each newly formed DNA molecule is parental and the other is newly synthesized.",
  "keywords": [
   "semiconservative replication",
   "dna replication",
   "meselson and stahl",
   "semiconservative vs conservative vs dispersive",
   "dna replication mcq"
  ],
  "chapters": [
   {
    "heading": "The question",
    "text": "When a cell copies its DNA, what happens to the old strands? That one idea answers this question."
   },
   {
    "heading": "The options",
    "text": "Here's the question. Four options. Let's work out what really happens first, then come back to them. Option A is wrong. The parent strands are the templates, and both of them are used. B is wrong too. If both strands were made from scratch, nothing would be conserved at all. D describes the dispersive model, with old and new pieces mixed. Experiments ruled that out. So C is right. Each new molecule keeps one parental strand and gets one new strand."
   },
   {
    "heading": "What we know and the plan",
    "text": "We know DNA has two strands, and the bases pair up: A with T, and G with C. We need to find what each new DNA molecule is made of. Semi means half. So we'll follow the old strands through one round of copying, and see what half is kept."
   },
   {
    "heading": "Follow the strands",
    "text": "Start with the parent molecule. Both of its strands are old. Helicase unzips it, and the two strands come apart. Now each old strand is a template, a pattern to copy from. DNA polymerase reads each template, and builds one new partner strand on it, matching A to T and G to C. So each daughter molecule is one old strand, plus one new strand. Half old, half new. That's semiconservative."
   },
   {
    "heading": "Two rounds of copying",
    "text": "Here it is in blue and red. Blue is old, red is new. After one round, both molecules are hybrids: one blue strand, one red. After a second round, the old blue strands are still there, each paired with a new red one."
   },
   {
    "heading": "How we know",
    "text": "In 1958, Meselson and Stahl tested this using heavy and light nitrogen. After one round they saw a single band of medium weight, exactly the hybrid that semiconservative copying predicts."
   },
   {
    "heading": "The answer",
    "text": "So the answer is C. Every new DNA molecule has one parental strand and one newly made strand."
   },
   {
    "heading": "Checking the answer",
    "text": "Quick check. After round two we should see two hybrid molecules, and two all new ones. That matches the picture."
   },
   {
    "heading": "The common mistake",
    "text": "Don't mix it up with the dispersive model, where every strand is a patchwork of old and new pieces. The data ruled that out."
   }
  ],
  "duration": "PT2M22S",
  "durationLabel": "2:22"
 }
];

export function getExample(slug: string) {
  return EXAMPLES.find((e) => e.slug === slug);
}
