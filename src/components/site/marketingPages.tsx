import {
  BarChart3, Barcode, BookOpen, Boxes, Building2, Camera, CreditCard, FileSpreadsheet,
  Headphones, Laptop, LockKeyhole, Mail, Package, Printer, Receipt, ScanLine, ShieldCheck,
  ShoppingBag, ShoppingCart, Smartphone, Store, Users, Wallet, WifiOff, Workflow,
} from "lucide-react";
import type { MarketingPage } from "./MarketingInfoPage";

const posImage = "https://images.unsplash.com/photo-1753803990660-2f41ebfc178d?auto=format&fit=crop&fm=jpg&q=82&w=1600";
const shelvesImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=82";
const onlineImage = "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1600&q=82";
const productImage = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=82";
const teamImage = "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=82";
const dashboardImage = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=82";
const paymentImage = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=82";
const securityImage = "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1600&q=82";
const warehouseImage = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=82";
const deskImage = "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=82";

export const marketingPages: Record<string, MarketingPage> = {
  checkout: {
    eyebrow: "POINT OF SALE", title: "A calmer counter starts with", highlight: "a clearer checkout.",
    description: "Bring product search, barcode scanning, cart review, payment recording and receipts into a focused point-of-sale workflow. Strap helps your team keep each sale organised from the first item to the final confirmation.",
    image: posImage, imageAlt: "Modern point of sale terminal on a retail counter", icon: ShoppingCart, note: "A focused checkout flow",
    sections: [
      { icon: ScanLine, title: "Find products quickly", body: "Search the catalogue or use a compatible scanner to bring products into the sale without losing the rhythm of the counter.", bullets: ["Search by product details", "Scan supported barcodes", "Keep the catalogue ready for staff"] },
      { icon: ShoppingBag, title: "Review the basket", body: "Build a cart, adjust quantities and check the transaction details before completing the sale.", bullets: ["Review items and quantities", "Check totals before confirming", "Keep a clear transaction record"] },
      { icon: Receipt, title: "Finish with a record", body: "Record the payment method and produce a receipt that helps both the customer and the business keep track.", bullets: ["Record cash, card or transfer methods", "Keep transaction history accessible", "Use supported receipt and print workflows"] },
    ], steps: ["Find or scan the items", "Review the cart and payment", "Complete the sale and receipt"],
  },
  inventory: {
    eyebrow: "INVENTORY MANAGEMENT", title: "Know what is on the shelf, in the store and", highlight: "ready to sell.",
    description: "Keep products, quantities and stock movements organised in one workspace. Use stock visibility to spot low quantities, make careful adjustments and coordinate inventory across the locations your business operates.",
    image: shelvesImage, imageAlt: "Organised grocery shelves in a retail store", icon: Boxes, note: "A more organised stockroom",
    sections: [
      { icon: Package, title: "Build a reliable catalogue", body: "Product names, categories, SKUs, barcodes, prices and quantities form the foundation of useful inventory records.", bullets: ["Keep identifiers consistent", "Group products into categories", "Review product details before selling"] },
      { icon: BarChart3, title: "Notice stock changes", body: "Use stock levels and low-stock visibility to identify items that may need replenishment before they interrupt a sale.", bullets: ["Review available quantities", "Spot low and out-of-stock items", "Record stock adjustments carefully"] },
      { icon: Building2, title: "Coordinate locations", body: "Where multi-branch stock is enabled, keep branch-level quantities and transfers clear as the business grows.", bullets: ["Keep location records distinct", "Track stock movements", "Reconcile transfers between branches"] },
    ], steps: ["Add and organise products", "Review quantities and exceptions", "Update stock as goods move"],
  },
  customers: {
    eyebrow: "CUSTOMER MANAGEMENT", title: "Make every customer interaction", highlight: "easier to follow.",
    description: "Keep customer records connected to everyday retail activity. A well-maintained customer list helps your team recognise repeat shoppers, find the right record and provide more consistent service.",
    image: teamImage, imageAlt: "Retail team collaborating at a counter", icon: Users, note: "Better customer context",
    sections: [
      { icon: Users, title: "Keep useful customer details", body: "Maintain the customer information your business needs to recognise and serve people consistently. Collect only details that have a clear business purpose.", bullets: ["Keep records accurate and current", "Avoid unnecessary personal data", "Correct duplicates when identified"] },
      { icon: Receipt, title: "Connect records to activity", body: "Where customer association is available, link purchases to the right customer record so staff can understand relevant purchase context.", bullets: ["Find existing customer records", "Associate a sale when appropriate", "Keep transaction references clear"] },
      { icon: ShieldCheck, title: "Respect customer privacy", body: "Customer information deserves careful handling. Limit access to people who need it and follow your privacy obligations.", bullets: ["Use role-appropriate access", "Do not expose customer records publicly", "Follow the Strap privacy guidance"] },
    ], steps: ["Create or find a customer", "Use the record when appropriate", "Keep information accurate and private"],
  },
  teams: {
    eyebrow: "TEAM MANAGEMENT", title: "Give every teammate", highlight: "the right role.",
    description: "Bring owners, managers and cashiers into a shared retail workspace with access organised around their responsibilities. Clear roles make everyday collaboration easier to manage.",
    image: teamImage, imageAlt: "Small business team working together", icon: Users, note: "A team with clear responsibilities",
    sections: [
      { icon: Users, title: "Set responsibilities", body: "Use the roles available in Strap to distinguish owners, managers and cashiers, rather than relying on shared logins.", bullets: ["Use separate staff accounts", "Match roles to real duties", "Review permissions when jobs change"] },
      { icon: LockKeyhole, title: "Keep access appropriate", body: "Give each person only the permissions they need for their work and protect owner-level access carefully.", bullets: ["Avoid shared credentials", "Remove access when staff leave", "Protect passwords and recovery methods"] },
      { icon: Workflow, title: "Build a repeatable routine", body: "Clear team access supports more consistent selling, stock handling and store operations across shifts.", bullets: ["Agree on handover habits", "Keep staff records current", "Review unusual account activity"] },
    ], steps: ["Invite or create staff accounts", "Assign role-appropriate access", "Review access as the team changes"],
  },
  branches: {
    eyebrow: "MULTI-LOCATION RETAIL", title: "Keep every location connected", highlight: "without losing the detail.",
    description: "As a business grows beyond one shop, branch-aware records help keep locations, stock and daily operations organised. Strap supports a clearer view of how locations fit into the wider business.",
    image: shelvesImage, imageAlt: "Retail store shelves arranged by category", icon: Building2, note: "One business, multiple locations",
    sections: [
      { icon: Store, title: "Give each location context", body: "Keep branch details distinct so staff can understand which location they are working in and where operational records belong.", bullets: ["Maintain accurate branch information", "Use the right store context", "Review location access"] },
      { icon: Boxes, title: "Manage stock movement", body: "Branch-aware inventory helps teams keep stock quantities visible and record transfers when goods move between locations.", bullets: ["Check stock by branch", "Record transfers deliberately", "Reconcile receiving quantities"] },
      { icon: BarChart3, title: "Understand the whole business", body: "Use the available reporting views to understand activity across the business while retaining the detail needed at each location.", bullets: ["Compare relevant store activity", "Review exceptions by location", "Keep reporting context clear"] },
    ], steps: ["Set up each location", "Organise stock by branch", "Review activity across the business"],
  },
  insights: {
    eyebrow: "BUSINESS INSIGHTS", title: "Turn everyday activity into", highlight: "a clearer picture.",
    description: "Use sales, payment, product and operational reporting to understand what is happening in your shop. Strap helps bring the signals together so owners can make more informed decisions.",
    image: dashboardImage, imageAlt: "Analytics dashboard on a laptop screen", icon: BarChart3, note: "See the signals behind the day",
    sections: [
      { icon: BarChart3, title: "Understand sales activity", body: "Review the available sales summaries and transaction records to understand activity over the periods that matter to your business.", bullets: ["Review sales summaries", "Check transaction history", "Compare activity over time"] },
      { icon: Package, title: "Spot product patterns", body: "Use product and inventory context to identify items that are moving, slowing down or requiring attention.", bullets: ["Review product performance", "Notice low-stock patterns", "Use evidence before reordering"] },
      { icon: Wallet, title: "Add the operating context", body: "Consider payment methods and recorded expenses alongside sales so the numbers tell a more complete story.", bullets: ["Review payment mix", "Track recorded expenses", "Verify source records before decisions"] },
    ], steps: ["Record activity consistently", "Review reports and exceptions", "Use the findings to plan next actions"],
  },
  expenses: {
    eyebrow: "EXPENSE MANAGEMENT", title: "See more than sales. Understand", highlight: "the cost of running shop.",
    description: "Keep business expenses visible alongside the sales activity you already record. Organised expense records help owners review where money is going and prepare more complete operational summaries.",
    image: dashboardImage, imageAlt: "Business finance and reporting workspace", icon: Wallet, note: "A more complete business picture",
    sections: [
      { icon: Wallet, title: "Record business spending", body: "Capture expenses with useful descriptions and dates so the reason for each entry remains understandable later.", bullets: ["Use clear expense descriptions", "Record the correct date and amount", "Keep supporting records where needed"] },
      { icon: BarChart3, title: "Review costs with sales", body: "Look at expenses in the context of sales and payment activity. This supports better questions about operating costs and business performance.", bullets: ["Review expenses by period", "Compare with sales context", "Avoid treating gross sales as profit"] },
      { icon: ShieldCheck, title: "Keep records dependable", body: "Limit who can change financial records and check entries for accuracy before relying on reports.", bullets: ["Use appropriate account permissions", "Correct mistakes promptly", "Verify important totals independently"] },
    ], steps: ["Enter the expense", "Review it with business activity", "Keep records accurate and accessible"],
  },
  barcode: {
    eyebrow: "BARCODE & QR SCANNING", title: "Move from product to basket", highlight: "with fewer taps.",
    description: "Compatible barcode scanners and camera-based workflows can make product lookup faster at the counter. Strap connects scanning to your catalogue and checkout flow where your device and browser support it.",
    image: posImage, imageAlt: "Point of sale terminal on a shop counter", icon: Barcode, note: "Find the right item faster",
    sections: [
      { icon: Barcode, title: "Keep product codes consistent", body: "A scanner can only find the right item when the product's barcode is recorded accurately in the catalogue.", bullets: ["Enter the correct barcode", "Avoid duplicate identifiers", "Test codes before busy trading hours"] },
      { icon: ScanLine, title: "Choose compatible hardware", body: "USB, Bluetooth and camera scanning support depends on the scanner, browser and device permissions.", bullets: ["Check the connection type", "Allow camera access when needed", "Test the device on your setup"] },
      { icon: ShoppingCart, title: "Use scans in checkout", body: "When a supported scanner is connected, use it to find products and add them to the current sale.", bullets: ["Scan one item at a time", "Confirm the product name", "Review quantity and cart totals"] },
    ], steps: ["Add barcodes to products", "Connect and test the scanner", "Scan items into the sale"],
  },
  receipts: {
    eyebrow: "RECEIPTS & PRINTING", title: "Finish each sale with", highlight: "a useful record.",
    description: "Receipts help customers and shop teams remember what was purchased and when. Strap supports configurable receipt content and browser printing workflows, subject to the connected printer and device.",
    image: posImage, imageAlt: "Retail point of sale terminal and receipt printer", icon: Printer, note: "Clear records after checkout",
    sections: [
      { icon: Receipt, title: "Make receipts readable", body: "Use clear business identity, transaction references, item details and totals so the receipt is useful after the customer leaves.", bullets: ["Keep business details current", "Check item names and totals", "Review tax and invoice requirements"] },
      { icon: Printer, title: "Match your printer setup", body: "Browser printing, paper size and printer behavior depend on the hardware, operating system and browser.", bullets: ["Check printer compatibility", "Choose the right paper size", "Print a test receipt"] },
      { icon: ShieldCheck, title: "Keep transaction history", body: "A printed receipt is a customer-facing copy; the business should also keep its transaction records organised.", bullets: ["Retain transaction references", "Resolve failed print attempts carefully", "Follow record-keeping obligations"] },
    ], steps: ["Configure receipt details", "Connect a compatible printer", "Test and issue receipts"],
  },
  hardware: {
    eyebrow: "RETAIL HARDWARE", title: "Choose devices that fit", highlight: "your counter.",
    description: "A retail setup may include a computer or tablet, barcode scanner, receipt printer and cash drawer. Compatibility varies, so test each device with the browser and operating system used by your team.",
    image: posImage, imageAlt: "Retail point of sale setup on a clean counter", icon: Laptop, note: "A practical counter setup",
    sections: [
      { icon: Laptop, title: "Start with your main device", body: "Choose a reliable computer, tablet or phone that can run a supported modern browser and suit the pace of your shop.", bullets: ["Keep your browser updated", "Use a stable power source", "Protect devices used for staff access"] },
      { icon: Barcode, title: "Connect scanners and printers", body: "USB, Bluetooth, camera and browser printing features depend on the specific device combination.", bullets: ["Confirm connection requirements", "Grant only necessary permissions", "Test before daily operations"] },
      { icon: Settings2, title: "Document your setup", body: "Keep a short record of the devices, cables, paper sizes and settings that work for your shop.", bullets: ["Label shared devices", "Keep spare consumables", "Use the hardware troubleshooting guide"] },
    ], steps: ["Check your device requirements", "Connect one device at a time", "Test the full sale and receipt flow"],
  },
  security: {
    eyebrow: "STORE SECURITY", title: "Protect the workspace behind", highlight: "your business.",
    description: "Business records and customer information deserve careful handling. Strap is designed around authenticated access and role-appropriate permissions; your team also plays an important part in protecting devices and accounts.",
    image: securityImage, imageAlt: "Secure digital access represented by a lock on a laptop", icon: ShieldCheck, note: "Security is part of daily operations",
    sections: [
      { icon: LockKeyhole, title: "Protect account access", body: "Use strong, unique credentials and keep recovery methods private. Avoid sharing one account across an entire team.", bullets: ["Use individual staff accounts", "Protect passwords and recovery options", "Sign out on shared devices"] },
      { icon: Users, title: "Limit access by role", body: "Give team members access appropriate to their responsibilities and remove access when it is no longer needed.", bullets: ["Review staff permissions", "Remove departed staff promptly", "Protect owner-level access"] },
      { icon: ShieldCheck, title: "Respond to suspicious activity", body: "If something looks wrong, secure the affected account and use the support process to report what happened.", bullets: ["Change compromised credentials", "Record the time and affected account", "Contact support with useful details"] },
    ], steps: ["Secure accounts and devices", "Assign only necessary access", "Review and report unusual activity"],
  },
  payments: {
    eyebrow: "PAYMENTS & TRANSACTIONS", title: "Keep payment records", highlight: "clear and consistent.",
    description: "Record how a sale was paid and keep the transaction status easy to understand. Available payment processing depends on the providers and integrations enabled for your account.",
    image: paymentImage, imageAlt: "Contactless payment terminal at a retail checkout", icon: CreditCard, note: "Payment records in context",
    sections: [
      { icon: CreditCard, title: "Record the payment method", body: "Capture whether a transaction was paid by cash, card, transfer or another method supported by your workflow.", bullets: ["Choose the correct method", "Confirm the amount received", "Keep the transaction reference"] },
      { icon: ShieldCheck, title: "Use providers carefully", body: "When a third-party payment provider is connected, its own service terms and privacy notice apply to its processing.", bullets: ["Use only enabled providers", "Never store full card security codes", "Check provider transaction status"] },
      { icon: Receipt, title: "Reconcile the day", body: "Review recorded payments against the records from your payment provider or bank before closing the books.", bullets: ["Compare transaction references", "Investigate mismatches", "Keep supporting statements"] },
    ], steps: ["Choose the payment method", "Confirm transaction status", "Reconcile the records"],
  },
  orders: {
    eyebrow: "ONLINE ORDER MANAGEMENT", title: "Bring online orders into", highlight: "the daily workflow.",
    description: "A customer-facing storefront can extend product discovery beyond the shop floor. Strap helps merchants review incoming orders in the same workspace used for products and everyday operations.",
    image: onlineImage, imageAlt: "Online shopping parcels and ecommerce workspace", icon: ShoppingBag, note: "Orders connected to your shop",
    sections: [
      { icon: ShoppingCart, title: "Receive and review", body: "Check incoming order details, customer information and requested items before taking the next action.", bullets: ["Review item and quantity details", "Confirm customer contact information", "Check product availability"] },
      { icon: Package, title: "Prepare fulfillment", body: "Use a consistent process to pick, pack and prepare orders. Delivery and collection arrangements remain the merchant's responsibility unless separately integrated.", bullets: ["Confirm stock before packing", "Check the order before dispatch", "Communicate delivery expectations"] },
      { icon: Receipt, title: "Keep the customer informed", body: "Maintain clear order references and communicate status changes through the channels available to your business.", bullets: ["Use accurate order references", "Record exceptions", "Handle cancellations and returns fairly"] },
    ], steps: ["Review the new order", "Confirm stock and prepare items", "Update the customer and order record"],
  },
  storefront: {
    eyebrow: "ONLINE STOREFRONT DESIGN", title: "Give your products a", highlight: "beautiful place to live.",
    description: "A useful online storefront makes it easier for customers to understand what you sell. Organise product categories, write clear descriptions and use accurate images so your catalogue feels coherent and trustworthy.",
    image: onlineImage, imageAlt: "Online retail storefront displayed on a laptop", icon: Store, note: "Your catalogue, presented clearly",
    sections: [
      { icon: Camera, title: "Use accurate product images", body: "Show the actual product in clear light and include helpful angles or details where they affect the buying decision.", bullets: ["Use sharp, well-lit photographs", "Keep backgrounds consistent", "Avoid images that misrepresent the item"] },
      { icon: Package, title: "Write useful product details", body: "A good listing answers the questions a shopper would normally ask in person: what it is, what it includes and how it differs.", bullets: ["Use descriptive product names", "Explain size, material or key details", "Keep price and availability accurate"] },
      { icon: Palette, title: "Keep the experience consistent", body: "Use a coherent visual style and clear categories so customers can move through the catalogue without confusion.", bullets: ["Group related products", "Keep category labels simple", "Review the storefront on mobile"] },
    ], steps: ["Prepare the catalogue", "Review the customer-facing layout", "Share the storefront with shoppers"],
  },
  gettingStarted: {
    eyebrow: "GETTING STARTED", title: "Build a strong foundation", highlight: "before the first sale.",
    description: "A smooth start comes from setting up the essentials in the right order. Create your workspace, add a few accurate products, prepare staff access and test the checkout flow before opening to customers.",
    image: deskImage, imageAlt: "Small business team planning at a laptop", icon: BookOpen, note: "A guided start for your shop",
    sections: [
      { icon: Store, title: "Set up the workspace", body: "Complete the business profile and confirm the details your team needs to identify the shop and its locations.", bullets: ["Add your store identity", "Review currency and preferences", "Set up your first branch"] },
      { icon: Package, title: "Prepare the catalogue", body: "Start with the products you sell most often. Accurate names, prices and quantities make testing easier.", bullets: ["Add products and categories", "Check prices and quantities", "Add barcodes where useful"] },
      { icon: Users, title: "Prepare your team", body: "Create the staff access your business needs and walk through a practice sale before relying on the system.", bullets: ["Assign appropriate roles", "Test checkout and receipts", "Review the help guides"] },
    ], steps: ["Set up your shop", "Add products and team members", "Test the workflow and start selling"],
  },
  faq: {
    eyebrow: "FREQUENTLY ASKED QUESTIONS", title: "Clear answers for", highlight: "everyday questions.",
    description: "Find quick context about Strap's retail workflows, supported devices, online selling and account access. For detailed instructions, use the Help Centre and product documentation.",
    image: shelvesImage, imageAlt: "Organised retail store shelves", icon: BookOpen, note: "Answers without the guesswork",
    sections: [
      { icon: Store, title: "What is Strap?", body: "Strap is a retail workspace that brings point of sale, products, inventory, customers, staff, expenses, reporting and online selling together.", bullets: ["For everyday shop operations", "Supports in-store and online workflows", "Features depend on account setup"] },
      { icon: Laptop, title: "Which devices can I use?", body: "Use a modern supported browser on a compatible computer, tablet or phone. Scanning and printing support varies by device.", bullets: ["Keep browsers updated", "Test connected hardware", "Check the hardware guide"] },
      { icon: ShieldCheck, title: "Where can I get help?", body: "Start with the Help Centre and documentation. For an issue, include the page, action and result so the team can investigate.", bullets: ["Browse the support topics", "Include useful reproduction steps", "Never send passwords or secret codes"] },
    ], steps: ["Find the topic", "Open the relevant guide", "Contact support if you still need help"],
  },
  contact: {
    eyebrow: "CONTACT & SUPPORT", title: "A good support request", highlight: "starts with context.",
    description: "If you need help with Strap, share what you were trying to do, which page you were on and what happened. Clear details help the team understand the issue without exposing private account information.",
    image: deskImage, imageAlt: "Team discussing work around a laptop", icon: Headphones, note: "Help that starts with the details",
    sections: [
      { icon: BookOpen, title: "Check the guides first", body: "The Help Centre and product documentation cover setup, products, stock, sales, hardware and online orders.", bullets: ["Search the relevant topic", "Follow the setup steps", "Note where the guide differs"] },
      { icon: Mail, title: "Describe the issue clearly", body: "Use the in-app feedback or support option and explain the expected result alongside what actually happened.", bullets: ["Name the page or feature", "List the steps to reproduce", "Include a screenshot without sensitive data"] },
      { icon: ShieldCheck, title: "Keep your account safe", body: "Support should never need your password, one-time code or full payment credentials to understand a problem.", bullets: ["Do not share passwords", "Hide customer personal information", "Share only the minimum necessary details"] },
    ], steps: ["Check the guide", "Describe the issue and impact", "Send safe, useful details"],
  },
  safety: {
    eyebrow: "MERCHANT SAFETY", title: "Build trust into", highlight: "every transaction.",
    description: "A safer marketplace depends on accurate listings, fair merchant practices and clear ways to raise concerns. Strap provides platform tools, while merchants remain responsible for the products and transactions they offer.",
    image: securityImage, imageAlt: "Secure online shopping on a laptop", icon: ShieldCheck, note: "Trust is part of the customer experience",
    sections: [
      { icon: Package, title: "Publish accurate listings", body: "Describe products honestly, use representative images and keep pricing and availability up to date.", bullets: ["Avoid misleading claims", "Use images you are authorised to publish", "Keep product details current"] },
      { icon: Users, title: "Treat customers fairly", body: "Make material terms clear before an order is confirmed and provide a practical way for customers to ask questions or raise a complaint.", bullets: ["Explain delivery and collection", "Publish return and refund terms", "Respond to complaints responsibly"] },
      { icon: ShieldCheck, title: "Report a concern", body: "If you see suspicious or harmful activity, use the available reporting or support path and provide the relevant public store or order reference.", bullets: ["Describe the concern factually", "Include relevant public references", "Do not publish private information publicly"] },
    ], steps: ["Keep listings and policies accurate", "Communicate clearly with shoppers", "Report suspicious activity responsibly"],
  },
  offline: {
    eyebrow: "OFFLINE SELLING", title: "Keep your workflow ready", highlight: "when connectivity changes.",
    description: "Connectivity can be inconsistent in busy retail environments. Strap may support temporary offline sales queuing on supported workflows, with synchronization after the device reconnects. Offline behavior should always be tested on your actual setup.",
    image: posImage, imageAlt: "Retail checkout counter with point of sale terminal", icon: WifiOff, note: "Plan for changing connectivity",
    sections: [
      { icon: WifiOff, title: "Understand the offline boundary", body: "Offline support can vary by feature and device. Do not assume every screen or integration remains available without a connection.", bullets: ["Test the exact workflows you rely on", "Keep devices charged", "Know which actions require connectivity"] },
      { icon: Receipt, title: "Protect queued transactions", body: "If sales are queued locally, protect the device and reconnect regularly so records can synchronize.", bullets: ["Avoid clearing browser storage", "Keep the device secure", "Check synchronization status"] },
      { icon: Boxes, title: "Reconcile after reconnecting", body: "Multiple devices working offline can create stock conflicts. Review important sales and quantities after synchronization.", bullets: ["Check for failed syncs", "Resolve inventory differences", "Keep a reconciliation routine"] },
    ], steps: ["Prepare and test the device", "Record supported offline activity", "Reconnect and verify synchronization"],
  },
  imports: {
    eyebrow: "PRODUCT IMPORTS", title: "Bring your catalogue in", highlight: "with less repetition.",
    description: "When product data already exists in spreadsheets or files, import workflows can reduce repetitive entry. Review imported names, prices, quantities, barcodes and images before relying on the catalogue.",
    image: productImage, imageAlt: "Product photography and online catalogue on a desk", icon: FileSpreadsheet, note: "A catalogue ready to organise",
    sections: [
      { icon: FileSpreadsheet, title: "Prepare clean source data", body: "Use consistent column headings and check that each row describes one product with the right price and quantity.", bullets: ["Remove duplicate rows", "Check decimal and currency formats", "Keep identifiers consistent"] },
      { icon: Camera, title: "Review extracted content", body: "If image-assisted extraction is available, treat the output as a draft. Automated extraction can misread text, prices or product details.", bullets: ["Verify every important field", "Check product images and variants", "Correct errors before publishing"] },
      { icon: Package, title: "Publish only verified items", body: "Review the final catalogue in the workspace and confirm that the products are accurate before selling or making them visible online.", bullets: ["Check pricing and stock", "Confirm categories and SKUs", "Preview customer-facing listings"] },
    ], steps: ["Prepare the source file", "Import and verify the data", "Publish the corrected catalogue"],
  },
};
