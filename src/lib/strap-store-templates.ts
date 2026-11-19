export type TemplateTheme = {
  font: string;
  accent: string;
  bg: string;
  ink: string;
  radius: number;
};
export type StrapStoreTemplate = {
  id: string;
  name: string;
  description: string;
  sections: string[];
  theme: TemplateTheme;
};

export const STRAP_STORE_TEMPLATES: StrapStoreTemplate[] = [
  {
    id: "fresh",
    name: "Fresh",
    description: "Clean and bright. Great for most shops.",
    theme: { font: "Sora", accent: "#e6f53a", bg: "#ffffff", ink: "#0a0a0a", radius: 18 },
    sections: ["hero", "featured-products", "about", "footer"],
  },
  {
    id: "noir",
    name: "Noir",
    description: "Dark and bold. Makes products pop.",
    theme: { font: "Inter", accent: "#e6f53a", bg: "#0a0a0a", ink: "#ffffff", radius: 10 },
    sections: ["announcement", "hero", "featured-products", "about", "footer"],
  },
  {
    id: "market",
    name: "Market",
    description: "Warm and editorial, with a product list.",
    theme: {
      font: "DM Serif Display",
      accent: "#d9480f",
      bg: "#faf6ee",
      ink: "#2a2118",
      radius: 4,
    },
    sections: ["hero", "promotional-banner", "featured-products", "about", "footer"],
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Quiet, simple product-first layout.",
    theme: { font: "Inter", accent: "#16a34a", bg: "#ffffff", ink: "#111111", radius: 4 },
    sections: ["hero", "featured-products", "contact", "footer"],
  },
  {
    id: "studio",
    name: "Studio",
    description: "Creative brand story with a featured banner.",
    theme: {
      font: "DM Serif Display",
      accent: "#a855f7",
      bg: "#faf8ff",
      ink: "#21152b",
      radius: 20,
    },
    sections: [
      "announcement",
      "hero",
      "promotional-banner",
      "featured-products",
      "testimonials",
      "footer",
    ],
  },
  {
    id: "restaurant",
    name: "Restaurant",
    description: "Warm menu-led dining and takeaway storefront.",
    theme: {
      font: "DM Serif Display",
      accent: "#b64b2a",
      bg: "#fff8ef",
      ink: "#2a2118",
      radius: 12,
    },
    sections: [
      "announcement",
      "promotional-banner",
      "featured-products",
      "about",
      "contact",
      "footer",
    ],
  },
  {
    id: "bistro",
    name: "Bistro",
    description: "Elegant restaurant and reservation-style menu.",
    theme: {
      font: "DM Serif Display",
      accent: "#8b5e3c",
      bg: "#f8f4ed",
      ink: "#211b16",
      radius: 8,
    },
    sections: ["hero", "promotional-banner", "featured-products", "testimonials", "footer"],
  },
  {
    id: "takeaway",
    name: "Takeaway",
    description: "Fast ordering for quick-service food businesses.",
    theme: { font: "Sora", accent: "#ef5b35", bg: "#ffffff", ink: "#171717", radius: 18 },
    sections: ["announcement", "promotional-banner", "featured-products", "faq", "footer"],
  },
  {
    id: "fashion",
    name: "Fashion",
    description: "Editorial collection layout for clothing and accessories.",
    theme: {
      font: "DM Serif Display",
      accent: "#c4a27b",
      bg: "#f8f6f2",
      ink: "#171717",
      radius: 4,
    },
    sections: ["announcement", "hero", "featured-products", "about", "footer"],
  },
  {
    id: "beauty",
    name: "Beauty",
    description: "Soft product storytelling for skincare and beauty.",
    theme: { font: "Inter", accent: "#d98ba5", bg: "#fff7f8", ink: "#35252b", radius: 20 },
    sections: ["hero", "promotional-banner", "featured-products", "testimonials", "footer"],
  },
  {
    id: "electronics",
    name: "Electronics",
    description: "Clean specification-led product catalogue.",
    theme: { font: "Inter", accent: "#2878d0", bg: "#f5f8fc", ink: "#101820", radius: 10 },
    sections: ["announcement", "hero", "featured-products", "faq", "footer"],
  },
  {
    id: "grocery",
    name: "Grocery",
    description: "Fresh market catalogue for everyday essentials.",
    theme: { font: "Sora", accent: "#27834b", bg: "#f6fbf5", ink: "#15251a", radius: 14 },
    sections: ["promotional-banner", "featured-products", "about", "footer"],
  },
  {
    id: "furniture",
    name: "Furniture",
    description: "Calm, spacious home and furniture catalogue.",
    theme: {
      font: "DM Serif Display",
      accent: "#a77c55",
      bg: "#f7f4ef",
      ink: "#28231e",
      radius: 6,
    },
    sections: ["hero", "featured-products", "promotional-banner", "footer"],
  },
  {
    id: "digital",
    name: "Digital",
    description: "Sell downloads, courses and digital resources.",
    theme: { font: "Inter", accent: "#6555d9", bg: "#f7f6ff", ink: "#19162c", radius: 16 },
    sections: ["hero", "featured-products", "faq", "footer"],
  },
  {
    id: "services",
    name: "Services",
    description: "Service menu and enquiry-focused business page.",
    theme: { font: "Inter", accent: "#168b86", bg: "#f3faf9", ink: "#142625", radius: 14 },
    sections: ["hero", "featured-products", "testimonials", "contact", "footer"],
  },
  {
    id: "bakery",
    name: "Bakery",
    description: "Sweet, welcoming shop for cakes and baked goods.",
    theme: {
      font: "DM Serif Display",
      accent: "#bd754b",
      bg: "#fff8f0",
      ink: "#33251d",
      radius: 16,
    },
    sections: ["promotional-banner", "featured-products", "about", "footer"],
  },
  {
    id: "fitness",
    name: "Fitness",
    description: "Energetic store for activewear and training gear.",
    theme: { font: "Sora", accent: "#c5f044", bg: "#111714", ink: "#f7faf6", radius: 12 },
    sections: ["hero", "featured-products", "promotional-banner", "footer"],
  },
  {
    id: "books",
    name: "Books",
    description: "A thoughtful catalogue for books and stationery.",
    theme: {
      font: "DM Serif Display",
      accent: "#9b6c45",
      bg: "#faf6ef",
      ink: "#30251d",
      radius: 5,
    },
    sections: ["hero", "featured-products", "about", "footer"],
  },
  {
    id: "jewellery",
    name: "Jewellery",
    description: "Premium, minimal product showcase for accessories.",
    theme: {
      font: "DM Serif Display",
      accent: "#b79a55",
      bg: "#fbfaf6",
      ink: "#24211b",
      radius: 4,
    },
    sections: ["hero", "featured-products", "testimonials", "footer"],
  },
  {
    id: "pets",
    name: "Pets",
    description: "Friendly shop for pets, treats and supplies.",
    theme: { font: "Sora", accent: "#e59a46", bg: "#fffaf2", ink: "#30271e", radius: 18 },
    sections: ["promotional-banner", "featured-products", "about", "footer"],
  },
  {
    id: "general",
    name: "General store",
    description: "Flexible storefront for mixed product catalogues.",
    theme: { font: "Inter", accent: "#e6f53a", bg: "#ffffff", ink: "#111111", radius: 14 },
    sections: ["announcement", "hero", "featured-products", "contact", "footer"],
  },
];

export const TEMPLATE_SECTION_DEFAULTS: Record<string, Record<string, string>> = {
  hero: {
    headline: "Your brand, beautifully presented.",
    subheadline: "Tell customers what makes your store special.",
    buttonText: "Shop now",
  },
  "featured-products": { title: "Featured products" },
  "product-grid": { title: "Browse everything" },
  "promotional-banner": {
    headline: "A little something special",
    body: "Discover our latest collection and find something you will love.",
  },
  announcement: { text: "Welcome to our store" },
  about: {
    title: "About us",
    body: "Tell customers what makes your business special and why they should shop with you.",
  },
  testimonials: { title: "What customers say" },
  faq: { title: "Frequently asked questions" },
  contact: { title: "Get in touch" },
  newsletter: { title: "Stay in the loop" },
  "social-proof": { title: "Trusted by our customers" },
  gallery: { title: "Explore the collection" },
  footer: { text: "Your store · Powered by Strap" },
};

export function getTemplateSectionDefaults(type: string): Record<string, string> {
  return { ...(TEMPLATE_SECTION_DEFAULTS[type] ?? {}) };
}
