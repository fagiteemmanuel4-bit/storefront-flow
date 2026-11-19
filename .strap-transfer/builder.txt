import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Download,
  Eye,
  GripVertical,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { resolveBusinessMode } from "@/lib/business-modes";
import { getBusinessModeProfile } from "@/lib/business-mode-profiles";
import { getTemplateSectionDefaults, STRAP_STORE_TEMPLATES } from "@/lib/strap-store-templates";

export const Route = createFileRoute("/_authenticated/online-store/builder")({
  ssr: false,
  component: StoreBuilder,
});

type Template = string;
type Section = { id: string; type: string; enabled: boolean; settings: Record<string, string> };
type Theme = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  buttonRadius: "small" | "medium" | "large";
  fontFamily: string;
  headingFontFamily: string;
  density: "comfortable" | "compact";
};
type Branding = { logoUrl: string; faviconUrl: string; storeName: string; description: string };

const TEMPLATES = STRAP_STORE_TEMPLATES;
const LABELS: Record<string, string> = {
  hero: "Hero",
  "featured-products": "Featured products",
  "product-grid": "Product grid",
  categories: "Categories",
  "promotional-banner": "Promotional banner",
  announcement: "Announcement bar",
  about: "About",
  testimonials: "Testimonials",
  faq: "FAQ",
  contact: "Contact",
  newsletter: "Newsletter",
  "social-proof": "Social proof",
  gallery: "Image gallery",
  footer: "Footer",
};
const SECTION_TYPES = Object.keys(LABELS);
const DEFAULT_TEMPLATE: Template = "fresh";
const DEFAULT_TEMPLATE_SECTIONS = TEMPLATES.find((item) => item.id === DEFAULT_TEMPLATE)!.sections;

const defaultTheme: Theme = {
  primaryColor: "#0a0a0a",
  secondaryColor: "#f5f5f0",
  accentColor: "#e6f53a",
  textColor: "#0a0a0a",
  backgroundColor: "#ffffff",
  buttonRadius: "large",
  fontFamily: "Sora",
  headingFontFamily: "Sora",
  density: "comfortable",
};
const defaultBranding: Branding = { logoUrl: "", faviconUrl: "", storeName: "", description: "" };
const sectionFields: Record<string, Array<{ key: string; label: string; placeholder: string }>> = {
  hero: [
    { key: "headline", label: "Headline", placeholder: "Your brand, beautifully presented." },
    {
      key: "subheadline",
      label: "Supporting text",
      placeholder: "Tell customers what makes your store special.",
    },
    { key: "buttonText", label: "Button text", placeholder: "Shop now" },
  ],
  "featured-products": [{ key: "title", label: "Title", placeholder: "Featured products" }],
  "product-grid": [{ key: "title", label: "Title", placeholder: "Shop our products" }],
  categories: [{ key: "title", label: "Title", placeholder: "Shop by category" }],
  "promotional-banner": [{ key: "headline", label: "Headline", placeholder: "Special offer" }],
  announcement: [
    { key: "text", label: "Announcement", placeholder: "Free delivery on selected orders" },
  ],
  about: [
    { key: "title", label: "Title", placeholder: "About us" },
    { key: "body", label: "Body", placeholder: "Tell your story." },
  ],
  testimonials: [{ key: "title", label: "Title", placeholder: "What customers say" }],
  faq: [{ key: "title", label: "Title", placeholder: "Frequently asked questions" }],
  contact: [{ key: "title", label: "Title", placeholder: "Get in touch" }],
  newsletter: [{ key: "title", label: "Title", placeholder: "Stay in the loop" }],
  "social-proof": [{ key: "title", label: "Title", placeholder: "Trusted by our customers" }],
  gallery: [{ key: "title", label: "Title", placeholder: "Explore the collection" }],
  footer: [{ key: "text", label: "Footer text", placeholder: "Your store name" }],
};

function makeSections(types: string[], prefix = String(Date.now())): Section[] {
  return types.map((type, index) => ({
    id: `${type}-${prefix}-${index}`,
    type,
    enabled: true,
    settings: getTemplateSectionDefaults(type),
  }));
}

function StoreBuilder() {
  const { store } = useStoreContext();
  const businessModeValue =
    (store?.storefront_settings as any)?.businessMode ?? store?.business_type;
  const businessMode = resolveBusinessMode(businessModeValue);
  const profileResult = businessMode ? getBusinessModeProfile(businessMode.key) : null;
  const modeProfile = profileResult?.ok ? profileResult.profile : null;
  const profileTemplates = useMemo(() => modeProfile?.storefront.templates ?? [], [modeProfile]);
  const availableSectionTypes = useMemo(
    () => modeProfile?.storefront.allowedSectionTypes ?? SECTION_TYPES,
    [modeProfile],
  );
  const [template, setTemplate] = useState<Template>(DEFAULT_TEMPLATE);
  const [theme, setTheme] = useState(defaultTheme);
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [sections, setSections] = useState<Section[]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [customCss, setCustomCss] = useState("");
  const [published, setPublished] = useState(false);
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const selectedTemplate = useMemo(() => {
    const builtInTemplate = TEMPLATES.find((item) => item.id === template);
    if (builtInTemplate) return builtInTemplate;
    const profileTemplate = profileTemplates.find((item: any) => item.id === template);
    if (profileTemplate)
      return {
        id: profileTemplate.id,
        name: profileTemplate.name,
        description: profileTemplate.positioning,
        sections: profileTemplate.pages?.home ?? [],
      };
    return TEMPLATES.find((item) => item.id === DEFAULT_TEMPLATE)!;
  }, [template, profileTemplates]);
  const loadConfig = useCallback(async () => {
    if (!store) return;
    setLoading(true);
    const [configResult, storeResult] = await Promise.all([
      onlineSupabase.from("storefront_configs").select("*").eq("store_id", store.id).maybeSingle(),
      onlineSupabase
        .from("online_stores")
        .select("slug,display_name,description,logo_url,is_published,setup_completed")
        .eq("store_id", store.id)
        .maybeSingle(),
    ]);
    if (configResult.error) {
      toast.error(configResult.error.message);
      setLoading(false);
      return;
    }
    if (storeResult.error) {
      toast.error(storeResult.error.message);
      setLoading(false);
      return;
    }
    const existing = configResult.data;
    const onlineStore = storeResult.data;
    setSlug(onlineStore?.slug ?? "");
    setBranding({
      ...defaultBranding,
      storeName: onlineStore?.display_name ?? store.name,
      description: onlineStore?.description ?? "",
      logoUrl: onlineStore?.logo_url ?? "",
    });
    if (existing) {
      setTemplate(existing.template as Template);
      setTheme({ ...defaultTheme, ...(existing.theme as Partial<Theme>) });
      setBranding((current) => ({
        ...current,
        ...((existing.branding ?? {}) as Partial<Branding>),
      }));
      setSections(
        ((existing.sections as Section[]) ?? []).map((s) => ({ ...s, settings: s.settings ?? {} })),
      );
      const seo = existing.seo as { title?: string; description?: string } | null;
      setSeoTitle(seo?.title ?? "");
      setSeoDescription(seo?.description ?? "");
      setCustomCss(existing.custom_css ?? "");
      setPublished(Boolean(existing.is_published || onlineStore?.is_published));
    } else {
      const initialTemplate = TEMPLATES.find((item) => item.id === DEFAULT_TEMPLATE)!;
      setTemplate(initialTemplate.id);
      setSections(
        makeSections(
          initialTemplate.sections.filter((type) => availableSectionTypes.includes(type)),
        ),
      );
      const radius = initialTemplate.theme.radius;
      setTheme((current) => ({
        ...current,
        primaryColor: initialTemplate.theme.ink,
        secondaryColor: initialTemplate.theme.bg,
        accentColor: initialTemplate.theme.accent,
        textColor: initialTemplate.theme.ink,
        backgroundColor: initialTemplate.theme.bg,
        fontFamily: initialTemplate.theme.font,
        headingFontFamily: initialTemplate.theme.font,
        buttonRadius: radius <= 10 ? "small" : radius >= 18 ? "large" : "medium",
        density: "comfortable",
      }));
    }
    setLoading(false);
  }, [store, profileTemplates, availableSectionTypes]);
  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);
  function applyTemplate(next: Template) {
    if (next === template) return;
    setTemplate(next);
    const builtInTemplate = TEMPLATES.find((item) => item.id === next);
    const profileTemplate = builtInTemplate
      ? null
      : (profileTemplates.find((item: any) => item.id === next) as any);
    const templateSections =
      builtInTemplate?.sections ?? profileTemplate?.pages?.home ?? DEFAULT_TEMPLATE_SECTIONS;
    setSections(
      makeSections(templateSections.filter((type: string) => availableSectionTypes.includes(type))),
    );
    if (profileTemplate?.theme) {
      setTheme((current) => ({
        ...current,
        primaryColor: String(profileTemplate.theme.primary ?? current.primaryColor),
        secondaryColor: String(profileTemplate.theme.surface ?? current.secondaryColor),
        accentColor: String(profileTemplate.theme.accent ?? current.accentColor),
        textColor: String(profileTemplate.theme.text ?? current.textColor),
        backgroundColor: String(profileTemplate.theme.background ?? current.backgroundColor),
        fontFamily: String(profileTemplate.theme.fontBody ?? current.fontFamily),
        headingFontFamily: String(profileTemplate.theme.fontHeading ?? current.headingFontFamily),
        density: profileTemplate.theme.density === "compact" ? "compact" : "comfortable",
        buttonRadius:
          Number.parseFloat(String(profileTemplate.theme.radius ?? "14")) <= 10
            ? "small"
            : Number.parseFloat(String(profileTemplate.theme.radius ?? "14")) >= 18
              ? "large"
              : "medium",
      }));
    } else {
      if (builtInTemplate) {
        const radius = builtInTemplate.theme.radius;
        setTheme((current) => ({
          ...current,
          primaryColor: builtInTemplate.theme.ink,
          secondaryColor: builtInTemplate.theme.bg,
          accentColor: builtInTemplate.theme.accent,
          textColor: builtInTemplate.theme.ink,
          backgroundColor: builtInTemplate.theme.bg,
          fontFamily: builtInTemplate.theme.font,
          headingFontFamily: builtInTemplate.theme.font,
          buttonRadius: radius <= 10 ? "small" : radius >= 18 ? "large" : "medium",
          density: "comfortable",
        }));
      }
    }
    setSelectedSection(null);
    toast.message("Template changed", {
      description:
        "Your products, inventory and orders are unchanged. Save when you're happy with the new layout.",
    });
  }
  function exportTemplate(format: "json" | "xml" = "json") {
    const portableType: Record<string, string> = {
      announcement: "announcement",
      hero: "hero",
      "featured-products": "products",
      "product-grid": "products",
      "promotional-banner": "banner",
      about: "about",
      testimonials: "testimonials",
      faq: "faq",
      contact: "contact",
      footer: "footer",
    };
    const config = {
      v: 2,
      template,
      theme: {
        font: theme.fontFamily,
        accent: theme.accentColor,
        bg: theme.backgroundColor,
        ink: theme.textColor,
        radius: theme.buttonRadius === "small" ? 6 : theme.buttonRadius === "large" ? 20 : 14,
      },
      sections: sections
        .filter((section) => section.enabled)
        .map((section) => ({
          type: portableType[section.type] ?? "about",
          title: section.settings.title ?? section.settings.headline ?? LABELS[section.type] ?? "",
          text:
            section.settings.text ??
            section.settings.description ??
            section.settings.subheadline ??
            "",
          cta: section.settings.buttonText ?? "",
          style: section.settings.style ?? "center",
          layout: section.settings.layout ?? "grid",
          image: section.settings.image ?? "",
        })),
    };
    const escapeXml = (value: unknown) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    const node = (key: string, value: any): string => {
      if (Array.isArray(value))
        return (
          "<" + key + ">" + value.map((item) => node("item", item)).join("") + "</" + key + ">"
        );
      if (value && typeof value === "object")
        return (
          "<" +
          key +
          ">" +
          Object.entries(value)
            .map(([childKey, childValue]) => node(childKey, childValue))
            .join("") +
          "</" +
          key +
          ">"
        );
      return "<" + key + ">" + escapeXml(value) + "</" + key + ">";
    };
    const content =
      format === "json"
        ? JSON.stringify(config, null, 2)
        : '<?xml version="1.0" encoding="UTF-8"?>\n<strap-template>' +
          node("config", config) +
          "</strap-template>";
    const blob = new Blob([content], {
      type: format === "json" ? "application/json" : "application/xml",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "strap-store-template." + format;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Template exported as " + format.toUpperCase());
  }

  async function importTemplateFile(file?: File) {
    if (!file) return;
    try {
      const raw = await file.text();
      let config: any;
      if (file.name.toLowerCase().endsWith(".xml")) {
        const documentXml = new DOMParser().parseFromString(raw, "application/xml");
        if (documentXml.querySelector("parsererror"))
          throw new Error("This XML file is not valid.");
        const root = documentXml.querySelector("strap-template > config");
        if (!root) throw new Error("Expected a strap-template/config XML root.");
        const readNode = (element: Element): any => {
          if (!element.children.length) return element.textContent ?? "";
          const children = [...element.children];
          if (children.every((child) => child.tagName === "item")) return children.map(readNode);
          return Object.fromEntries(children.map((child) => [child.tagName, readNode(child)]));
        };
        config = readNode(root);
      } else {
        config = JSON.parse(raw);
      }
      config = config?.config ?? config;
      if (!config || config.v !== 2 || !config.theme || !Array.isArray(config.sections)) {
        throw new Error("Template must contain v: 2, theme and sections.");
      }
      if (config.sections.length > 30)
        throw new Error("A template can contain at most 30 sections.");
      const allowed = new Set([
        "announcement",
        "hero",
        "billboard",
        "banner",
        "products",
        "about",
        "contact",
        "testimonials",
        "faq",
        "policies",
        "footer",
      ]);
      if (config.sections.some((section: any) => !section || !allowed.has(section.type))) {
        throw new Error("The template contains an unsupported section type.");
      }
      if (!["Sora", "Inter", "DM Serif Display", "Space Mono"].includes(config.theme.font)) {
        throw new Error("Theme font must be Sora, Inter, DM Serif Display or Space Mono.");
      }
      for (const key of ["accent", "bg", "ink"]) {
        if (config.theme[key] && !/^#[0-9a-f]{6}$/i.test(config.theme[key])) {
          throw new Error("Theme " + key + " must be a six-digit hex colour.");
        }
      }
      const typeMap: Record<string, string> = {
        announcement: "announcement",
        hero: "hero",
        billboard: "promotional-banner",
        banner: "promotional-banner",
        products: "featured-products",
        about: "about",
        contact: "contact",
        testimonials: "testimonials",
        faq: "faq",
        policies: "faq",
        footer: "footer",
      };
      const importedSections = config.sections.flatMap((item: any, index: number) => {
        const type = typeMap[item.type];
        if (!type || !availableSectionTypes.includes(type)) return [];
        const base = makeSections([type], "import-" + Date.now() + "-" + index)[0];
        return [
          {
            ...base,
            enabled: true,
            settings: {
              ...base.settings,
              title: String(item.title ?? ""),
              headline: String(item.title ?? ""),
              text: String(item.text ?? ""),
              description: String(item.text ?? ""),
              subheadline: String(item.text ?? ""),
              buttonText: String(item.cta ?? ""),
              style: String(item.style ?? "center"),
              layout: String(item.layout ?? "grid"),
              image: String(item.image ?? ""),
            },
          },
        ];
      });
      if (!importedSections.length)
        throw new Error("This template has no sections supported by the current editor.");
      const font = ["Sora", "Inter", "DM Serif Display", "Space Mono"].includes(config.theme.font)
        ? config.theme.font
        : "Sora";
      const radius = Number(config.theme.radius ?? 14);
      setTemplate(String(config.template ?? "custom"));
      setSections(importedSections);
      setTheme((current) => ({
        ...current,
        primaryColor: String(config.theme.ink ?? current.primaryColor),
        secondaryColor: String(config.theme.bg ?? current.secondaryColor),
        accentColor: String(config.theme.accent ?? current.accentColor),
        textColor: String(config.theme.ink ?? current.textColor),
        backgroundColor: String(config.theme.bg ?? current.backgroundColor),
        fontFamily: font,
        headingFontFamily: font,
        buttonRadius: radius <= 10 ? "small" : radius >= 18 ? "large" : "medium",
      }));
      setSelectedSection(null);
      toast.success("Template imported", {
        description:
          "Only the storefront theme and sections were changed. Your products, domain, orders and account remain untouched.",
      });
    } catch (error) {
      toast.error("Could not import template", {
        description: error instanceof Error ? error.message : "Check the file and try again.",
      });
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    setSections((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function addSection(type: string) {
    const section = { id: `${type}-${Date.now()}`, type, enabled: true, settings: {} };
    setSections((current) => [...current, section]);
    setSelectedSection(section.id);
  }
  function updateSection(id: string, changes: Partial<Section>) {
    setSections((current) =>
      current.map((section) => (section.id === id ? { ...section, ...changes } : section)),
    );
  }
  function updateSectionSetting(id: string, key: string, value: string) {
    setSections((current) =>
      current.map((section) =>
        section.id === id
          ? { ...section, settings: { ...section.settings, [key]: value } }
          : section,
      ),
    );
  }
  async function save() {
    if (!store) return;
    setSaving(true);
    try {
      const { data, error } = await onlineSupabase.rpc("upsert_storefront_config", {
        _store_id: store.id,
        _template: template,
        _theme: theme,
        _branding: branding,
        _navigation: { links: [] },
        _sections: sections,
        _seo: {
          title: seoTitle.trim(),
          description: seoDescription.trim(),
          keywords: [],
          noIndex: false,
        },
        _custom_css: customCss,
        _publish: published,
      });
      if (error) throw new Error(error.message);
      if (!data?.id) throw new Error("The storefront was not confirmed as saved.");
      toast.success("Store builder saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save the store builder.");
    } finally {
      setSaving(false);
    }
  }
  if (!store || loading)
    return (
      <main className="min-h-screen bg-background p-8">
        <p className="text-muted-foreground">Loading store builder…</p>
      </main>
    );
  const publicUrl = slug ? "/store/" + slug : "/online-store/setup";
  const safePreviewCss = customCss
    .replace(/@import[^;]*;?/gi, "")
    .replace(/url\s*\([^)]*\)/gi, "none")
    .replace(/expression\s*\([^)]*\)/gi, "none")
    .replace(/javascript\s*:/gi, "")
    .replace(/\x3c\s*\/\s*style/gi, "");
  const safePreviewHeadingFont = /^[a-z0-9 ,'-]{1,60}$/i.test(theme.headingFontFamily)
    ? theme.headingFontFamily
    : theme.fontFamily;
  return (
    <main className="min-h-screen bg-background" data-tour="main-content">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/online-store"
              className="flex size-9 items-center justify-center rounded-lg border border-border"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-ink">
                Store Editor
              </p>
              <p className="font-semibold">{store.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".json,.xml,application/json,application/xml,text/xml"
              className="hidden"
              onChange={(event) => void importTemplateFile(event.target.files?.[0])}
            />
            <Button variant="outline" onClick={() => importInputRef.current?.click()}>
              <Upload className="mr-2 size-4" />
              Import
            </Button>
            <Button variant="outline" onClick={() => exportTemplate("json")}>
              <Download className="mr-2 size-4" />
              JSON
            </Button>
            <Button
              variant="outline"
              className="hidden md:inline-flex"
              onClick={() => exportTemplate("xml")}
            >
              XML
            </Button>
            <span
              className={`hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex ${published ? "bg-emerald-100 text-emerald-800" : "bg-secondary text-muted-foreground"}`}
            >
              {published ? "Published" : "Draft"}
            </span>
            <Link to="/settings/online-store" className="hidden sm:inline-flex">
              <Button variant="outline">Legacy settings</Button>
            </Link>
            <Button
              variant="outline"
              disabled={!slug}
              onClick={() => window.open(publicUrl, "_blank")}
            >
              <Eye className="mr-2 size-4" />
              Preview
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? (
                "Saving…"
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)_340px] sm:px-6">
        <aside className="space-y-4">
          <Panel title="Templates">
            <div className="space-y-2">
              {[
                ...TEMPLATES,
                ...profileTemplates
                  .filter((profile: any) => !TEMPLATES.some((item) => item.id === profile.id))
                  .map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    description: item.positioning,
                  })),
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyTemplate(item.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${template === item.id ? "border-foreground bg-secondary" : "border-border hover:border-accent/50"}`}
                >
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="Add section">
            <div className="grid grid-cols-2 gap-2">
              {availableSectionTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addSection(type)}
                  className="rounded-lg border border-border px-2 py-2 text-xs font-semibold hover:bg-secondary"
                >
                  <Plus className="mx-auto mb-1 size-3" />
                  {LABELS[type] ??
                    type
                      .replace(/[-_]+/g, " ")
                      .replace(/\\b\\w/g, (letter) => letter.toUpperCase())}
                </button>
              ))}
            </div>
          </Panel>
        </aside>
        <section className="min-w-0 rounded-[2rem] border border-border bg-secondary/50 p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Desktop preview</span>
            <span className="lg:hidden">Advanced editing is optimized for desktop.</span>
          </div>
          <div
            className="storefront-shell mx-auto max-w-3xl overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-lift"
            style={{
              color: theme.textColor,
              backgroundColor: theme.backgroundColor,
              fontFamily: theme.fontFamily,
            }}
          >
            <style>
              {".storefront-shell h1,.storefront-shell h2,.storefront-shell h3{font-family:" +
                safePreviewHeadingFont +
                ",sans-serif}" +
                safePreviewCss}
            </style>
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: theme.secondaryColor }}
            >
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.storeName}
                  className="h-8 max-w-32 object-contain"
                />
              ) : (
                <span className="font-bold">{branding.storeName || selectedTemplate.name}</span>
              )}
              <div className="flex gap-2 text-xs">
                <span>Shop</span>
                <span>Products</span>
                <span>Contact</span>
              </div>
            </div>
            {sections.map((section, index) => (
              <div
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={`relative cursor-pointer border-b px-6 py-8 transition ${selectedSection === section.id ? "ring-2 ring-inset" : ""}`}
                style={{ borderColor: theme.secondaryColor, opacity: section.enabled ? 1 : 0.4 }}
              >
                <div className="absolute right-3 top-3 flex gap-1">
                  <button
                    type="button"
                    aria-label="Move section up"
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      move(index, -1);
                    }}
                    className="rounded-md border bg-white p-1"
                  >
                    <ArrowUp className="size-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move section down"
                    disabled={index === sections.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      move(index, 1);
                    }}
                    className="rounded-md border bg-white p-1"
                  >
                    <ArrowDown className="size-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove section"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSections((current) => current.filter((_, i) => i !== index));
                      if (selectedSection === section.id) setSelectedSection(null);
                    }}
                    className="rounded-md border bg-white p-1 text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <GripVertical className="size-3 text-muted-foreground" />
                  <p
                    className="text-[10px] font-bold uppercase tracking-[.18em]"
                    style={{ color: theme.primaryColor }}
                  >
                    {LABELS[section.type] ??
                      section.type
                        .replace(/[-_]+/g, " ")
                        .replace(/\\b\\w/g, (letter) => letter.toUpperCase())}
                  </p>
                </div>
                <h3 className="mt-2 font-display text-2xl font-bold">
                  {section.settings.headline ||
                    section.settings.title ||
                    section.settings.text ||
                    LABELS[section.type]}
                </h3>
                <p className="mt-2 max-w-xl text-sm opacity-65">
                  {section.settings.subheadline ||
                    section.settings.body ||
                    "Live structural preview of this storefront section."}
                </p>
                {section.type === "hero" && (
                  <button
                    type="button"
                    className="mt-5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    {section.settings.buttonText || "Shop now"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
        <aside className="space-y-4">
          <Panel title="Branding">
            <label className="block space-y-1">
              <span className="text-xs font-semibold">Store name</span>
              <input
                className="field"
                value={branding.storeName}
                onChange={(e) =>
                  setBranding((current) => ({ ...current, storeName: e.target.value }))
                }
              />
            </label>
            <label className="mt-3 block space-y-1">
              <span className="text-xs font-semibold">Logo URL</span>
              <input
                className="field"
                value={branding.logoUrl}
                onChange={(e) =>
                  setBranding((current) => ({ ...current, logoUrl: e.target.value }))
                }
                placeholder="https://…"
              />
            </label>
            <label className="mt-3 block space-y-1">
              <span className="text-xs font-semibold">Favicon URL</span>
              <input
                className="field"
                value={branding.faviconUrl}
                onChange={(e) =>
                  setBranding((current) => ({ ...current, faviconUrl: e.target.value }))
                }
                placeholder="https://…"
              />
            </label>
            <label className="mt-3 block space-y-1">
              <span className="text-xs font-semibold">Description</span>
              <textarea
                className="field min-h-20 resize-none"
                value={branding.description}
                onChange={(e) =>
                  setBranding((current) => ({ ...current, description: e.target.value }))
                }
              />
            </label>
          </Panel>
          <Panel title="Theme">
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  "primaryColor",
                  "secondaryColor",
                  "accentColor",
                  "textColor",
                  "backgroundColor",
                ] as const
              ).map((key) => (
                <label key={key} className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {key.replace("Color", "")}
                  </span>
                  <div className="flex items-center gap-2 rounded-lg border border-border p-1">
                    <input
                      type="color"
                      value={theme[key]}
                      onChange={(e) =>
                        setTheme((current) => ({ ...current, [key]: e.target.value }))
                      }
                      className="size-7 cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      value={theme[key]}
                      onChange={(e) =>
                        setTheme((current) => ({ ...current, [key]: e.target.value }))
                      }
                      className="min-w-0 w-full bg-transparent text-xs outline-none"
                    />
                  </div>
                </label>
              ))}
            </div>
            <label className="mt-4 block space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Button radius
              </span>
              <select
                className="field"
                value={theme.buttonRadius}
                onChange={(e) =>
                  setTheme((current) => ({
                    ...current,
                    buttonRadius: e.target.value as Theme["buttonRadius"],
                  }))
                }
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Body font
                </span>
                <input
                  className="field"
                  value={theme.fontFamily}
                  maxLength={60}
                  onChange={(event) =>
                    setTheme((current) => ({ ...current, fontFamily: event.target.value }))
                  }
                  placeholder="Inter"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Heading font
                </span>
                <input
                  className="field"
                  value={theme.headingFontFamily}
                  maxLength={60}
                  onChange={(event) =>
                    setTheme((current) => ({ ...current, headingFontFamily: event.target.value }))
                  }
                  placeholder="Inter"
                />
              </label>
            </div>
            <label className="mt-4 block space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Layout density
              </span>
              <select
                className="field"
                value={theme.density}
                onChange={(event) =>
                  setTheme((current) => ({
                    ...current,
                    density: event.target.value as Theme["density"],
                  }))
                }
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </label>
          </Panel>
          {selectedSection &&
            (() => {
              const section = sections.find((x) => x.id === selectedSection);
              if (!section) return null;
              const fields = sectionFields[section.type] ?? [
                { key: "title", label: "Title", placeholder: "Section title" },
                {
                  key: "body",
                  label: "Description",
                  placeholder: "Add useful details for customers.",
                },
              ];
              return (
                <Panel
                  title={`Edit ${LABELS[section.type] ?? section.type.replace(/[-_]+/g, " ")}`}
                >
                  <label className="mb-4 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">Visible</span>
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={(e) => updateSection(section.id, { enabled: e.target.checked })}
                    />
                  </label>
                  {fields.length === 0 ? (
                    <p className="text-xs leading-5 text-muted-foreground">
                      This section is structurally configurable. More content controls will be added
                      as the section renderer expands.
                    </p>
                  ) : (
                    fields.map((field) => (
                      <label key={field.key} className="mb-3 block space-y-1">
                        <span className="text-xs font-semibold">{field.label}</span>
                        {field.key === "body" || field.key === "subheadline" ? (
                          <textarea
                            className="field min-h-20 resize-none"
                            value={section.settings[field.key] ?? ""}
                            onChange={(e) =>
                              updateSectionSetting(section.id, field.key, e.target.value)
                            }
                            placeholder={field.placeholder}
                          />
                        ) : (
                          <input
                            className="field"
                            value={section.settings[field.key] ?? ""}
                            onChange={(e) =>
                              updateSectionSetting(section.id, field.key, e.target.value)
                            }
                            placeholder={field.placeholder}
                          />
                        )}
                      </label>
                    ))
                  )}
                </Panel>
              );
            })()}
          <Panel title="SEO">
            <label className="block space-y-1">
              <span className="text-xs font-semibold">Page title</span>
              <input
                className="field"
                maxLength={70}
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Your store name"
              />
            </label>
            <label className="mt-3 block space-y-1">
              <span className="text-xs font-semibold">Meta description</span>
              <textarea
                className="field min-h-24 resize-none"
                maxLength={160}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="A clear description of your store."
              />
            </label>
          </Panel>
          <Panel title="Publishing">
            <p className="text-sm font-semibold">
              {published ? "Your storefront is published" : "Your storefront is still a draft"}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Store availability, public terms and privacy acceptance are managed in Store Setup.
              Saving your design here never publishes an incomplete store.
            </p>
            <Link
              to="/online-store/setup"
              className="mt-3 inline-flex text-sm font-semibold underline underline-offset-4"
            >
              Open Store Setup
            </Link>
          </Panel>
          <Panel title="Advanced">
            <label className="block space-y-1">
              <span className="text-xs font-semibold">Custom CSS</span>
              <textarea
                className="field min-h-32 resize-y font-mono text-xs"
                maxLength={20000}
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                placeholder="/* Premium customization */"
              />
            </label>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              CSS only. Scripts and server secrets are never accepted here.
            </p>
          </Panel>
        </aside>
      </div>
    </main>
  );
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  const tourTarget =
    title === "Templates"
      ? "template-list"
      : title === "Add section"
        ? "section-list"
        : title === "Theme"
          ? "theme-controls"
          : undefined;
  return (
    <section data-tour={tourTarget} className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </section>
  );
}
