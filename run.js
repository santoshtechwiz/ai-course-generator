const SummarizerManager = require("node-summarizer").SummarizerManager;

const text = "Redesign a quiz card UI to make it modern and visually appealing. Use dynamic backgrounds, subtle shadows, and interactive animations. Add color-coded badges, enhanced typography with multiple weights and sizes, and a glowing hover effect on the 'Start Quiz' button. Incorporate gradient overlays or subtle patterns in the background and ensure that the design aligns with a dark/light mode theme. Avoid introducing new components.";
const summarizer = new SummarizerManager(text, 1); // 5 sentences
const summary = summarizer.getSummaryByFrequency();
console.log(summary);