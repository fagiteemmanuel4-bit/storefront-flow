export const FAQ_ITEMS = [
  {
    question: "What is Strap?",
    answer: "Strap is a retail operations platform that connects point of sale, products, inventory, customers, staff, branches, expenses, reports and online selling in one workspace.",
  },
  {
    question: "Can I use Strap on a phone and a computer?",
    answer: "Yes. Strap is designed for use across mobile, tablet and desktop screens. Device and browser capabilities can vary for hardware workflows.",
  },
  {
    question: "Can I scan products at the counter?",
    answer: "Strap supports camera scanning on compatible devices and compatible USB or Bluetooth keyboard-wedge barcode scanners.",
  },
  {
    question: "Can I manage more than one branch?",
    answer: "Yes. Branch management is available on eligible plans, with branch limits depending on the selected plan.",
  },
  {
    question: "Can I sell online with Strap?",
    answer: "Yes. Business and Pro plans include an online storefront and catalogue workflow for publishing products and managing incoming orders.",
  },
  {
    question: "Does Strap process online card payments?",
    answer: "Merchant payment processing is not currently enabled as a production feature. Strap can record configured payment methods for in-store sales.",
  },
  {
    question: "How do I get help?",
    answer: "Visit the Help Centre for setup instructions and product guides, or sign in and use the in-app feedback option to report an issue.",
  },
  {
    question: "Can I invite staff to use Strap?",
    answer: "Yes. Strap supports owner, manager and cashier roles. Staff limits depend on the plan selected for the workspace.",
  },
] as const;

export const FAQ_PAGE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};
