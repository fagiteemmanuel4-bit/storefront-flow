import { z } from "zod";

const uniqueIds = (values: string[]) => new Set(values).size === values.length;

const fieldSchema = z.looseObject({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean(),
  surfaces: z.array(z.enum(["physical", "online"])).min(1),
});

const statusSchema = z.looseObject({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(["open", "fulfillment", "terminal"]),
  initial: z.boolean().optional(),
});

const transitionSchema = z.looseObject({
  from: z.string().min(1),
  to: z.array(z.string()),
});

const templateSchema = z.looseObject({
  id: z.string().min(1),
  name: z.string().min(1),
  family: z.string().min(1),
  positioning: z.string().min(1),
  recommendedFor: z.array(z.string()).optional(),
  styleTags: z.array(z.string()),
  version: z.number().int().positive(),
  preview: z.record(z.string(), z.unknown()).optional(),
  theme: z.record(z.string(), z.unknown()),
  pages: z.record(z.string(), z.array(z.string())),
});

export const businessModeProfileSchema = z.strictObject({
  $schema: z.string().optional(),
  description: z.string().optional(),
  principles: z.array(z.string()).optional(),
  compatibility: z.record(z.string(), z.unknown()).optional(),
  schemaVersion: z.literal(1),
  profileVersion: z.number().int().positive(),
  id: z.string().regex(/^[a-z][a-z0-9-]+$/),
  name: z.string().min(2),
  status: z.enum(["draft", "active", "deprecated"]),
  runtimeReady: z.boolean().default(false),
  baseCatalog: z.string().min(1),
  businessModeKeys: z.array(z.string().min(1)).min(1),
  product: z.looseObject({
    entity: z.string().min(1),
    inventoryEntity: z.string().min(1),
    fields: z.array(fieldSchema).min(1),
    variants: z.looseObject({ enabled: z.boolean(), strategy: z.string().min(1) }),
    inventory: z.looseObject({
      sourceOfTruth: z.string().min(1),
      oversellPolicy: z.enum(["deny", "allow", "backorder"]),
    }),
  }),
  orders: z.looseObject({
    statuses: z.array(statusSchema).min(1),
    transitions: z.array(transitionSchema),
    terminalStatuses: z.array(z.string()),
  }),
  dashboard: z.looseObject({ cards: z.array(z.looseObject({ id: z.string(), label: z.string(), source: z.string(), metric: z.string() })) }),
  storefront: z.looseObject({
    allowedSectionTypes: z.array(z.string()),
    sectionRegistry: z.array(z.looseObject({ id: z.string(), label: z.string(), category: z.string(), settings: z.record(z.string(), z.unknown()) })),
    templates: z.array(templateSchema),
    templateIds: z.array(z.string()).optional(),
    productDiscovery: z.record(z.string(), z.unknown()),
    productPage: z.record(z.string(), z.unknown()),
    pages: z.array(z.string()),
    preview: z.record(z.string(), z.unknown()),
  }),
  checkout: z.looseObject({
    fields: z.array(z.looseObject({ id: z.string(), label: z.string(), type: z.string(), required: z.boolean() })),
    fulfillmentModes: z.array(z.looseObject({ id: z.string(), label: z.string(), enabled: z.boolean() })),
    paymentMethods: z.array(z.looseObject({ id: z.string(), label: z.string(), enabled: z.boolean() })),
  }),
  featureFlags: z.looseObject({
    default: z.literal("off"),
    flags: z.record(z.string(), z.boolean()),
    rule: z.string().min(1),
  }),
  workspaces: z.looseObject({
    physicalStore: z.record(z.string(), z.unknown()),
    onlineStore: z.record(z.string(), z.unknown()),
    shared: z.array(z.string()),
    syncContract: z.record(z.string(), z.unknown()),
  }),
}).superRefine((profile, ctx) => {
  const checkUnique = (items: string[], path: (string | number)[], label: string) => {
    if (!uniqueIds(items)) ctx.addIssue({ code: "custom", path, message: `${label} must be unique.` });
  };

  checkUnique(profile.businessModeKeys, ["businessModeKeys"], "Business mode keys");
  checkUnique(profile.product.fields.map((field) => field.id), ["product", "fields"], "Product field IDs");

  const statusIds = profile.orders.statuses.map((status) => status.id);
  checkUnique(statusIds, ["orders", "statuses"], "Order status IDs");
  checkUnique(profile.orders.terminalStatuses, ["orders", "terminalStatuses"], "Terminal status IDs");

  const statusSet = new Set(statusIds);
  const terminalSet = new Set(profile.orders.terminalStatuses);
  const initialStatuses = profile.orders.statuses.filter((status) => status.initial);
  if (initialStatuses.length > 1) {
    ctx.addIssue({ code: "custom", path: ["orders", "statuses"], message: "Only one initial order status may be declared." });
  }
  for (const status of profile.orders.statuses) {
    if (terminalSet.has(status.id) && status.kind !== "terminal") {
      ctx.addIssue({ code: "custom", path: ["orders", "terminalStatuses"], message: `Terminal status "${status.id}" must have kind "terminal".` });
    }
  }
  for (const statusId of terminalSet) {
    if (!statusSet.has(statusId)) {
      ctx.addIssue({ code: "custom", path: ["orders", "terminalStatuses"], message: `Unknown terminal status "${statusId}".` });
    }
  }
  for (const transition of profile.orders.transitions) {
    if (!statusSet.has(transition.from)) {
      ctx.addIssue({ code: "custom", path: ["orders", "transitions"], message: `Unknown transition source "${transition.from}".` });
    }
    if (terminalSet.has(transition.from) && transition.to.length > 0) {
      ctx.addIssue({ code: "custom", path: ["orders", "transitions"], message: `Terminal status "${transition.from}" cannot have outgoing transitions.` });
    }
    for (const target of transition.to) {
      if (!statusSet.has(target)) {
        ctx.addIssue({ code: "custom", path: ["orders", "transitions"], message: `Unknown transition target "${target}".` });
      }
    }
  }

  const allowedSections = new Set(profile.storefront.allowedSectionTypes);
  const registeredSections = profile.storefront.sectionRegistry.map((section) => section.id);
  checkUnique(registeredSections, ["storefront", "sectionRegistry"], "Section registry IDs");
  for (const section of registeredSections) {
    if (!allowedSections.has(section)) {
      ctx.addIssue({ code: "custom", path: ["storefront", "sectionRegistry"], message: `Registered section "${section}" is not in allowedSectionTypes.` });
    }
  }
  const templateIds = profile.storefront.templates.map((template) => template.id);
  checkUnique(templateIds, ["storefront", "templates"], "Template IDs");
  if (profile.storefront.templateIds) {
    checkUnique(profile.storefront.templateIds, ["storefront", "templateIds"], "Template index IDs");
    if (profile.storefront.templateIds.some((id) => !templateIds.includes(id))) {
      ctx.addIssue({ code: "custom", path: ["storefront", "templateIds"], message: "templateIds must reference registered templates." });
    }
  }
  for (const template of profile.storefront.templates) {
    for (const [page, sections] of Object.entries(template.pages)) {
      for (const section of sections) {
        if (!allowedSections.has(section)) {
          ctx.addIssue({ code: "custom", path: ["storefront", "templates", template.id, "pages", page], message: `Template uses unregistered section "${section}".` });
        }
      }
    }
  }

  if (!profile.runtimeReady || profile.status !== "active") {
    const enabledFlags = Object.entries(profile.featureFlags.flags).filter(([, enabled]) => enabled);
    if (enabledFlags.length) {
      ctx.addIssue({ code: "custom", path: ["featureFlags", "flags"], message: "Feature flags must remain OFF until the profile is active and runtimeReady." });
    }
  }
  if (profile.status === "active" && !profile.runtimeReady) {
    ctx.addIssue({ code: "custom", path: ["runtimeReady"], message: "An active profile must be runtimeReady." });
  }
});

export type BusinessModeProfile = z.infer<typeof businessModeProfileSchema>;
