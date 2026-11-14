import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { businessModeProfileSchema } from "../src/lib/business-mode-profile.schema";
import { resolveBusinessMode } from "../src/lib/business-modes";

const profilePaths = [
  "../modes/normal-business/mode.json",
  "../modes/grocery-provision/mode.json",
  "../modes/fashion/mode.json",
  "../modes/electronics/mode.json",
  "../modes/food-service/mode.json",
  "../modes/pharmacy/mode.json",
  "../modes/beauty-personal-care/mode.json",
  "../modes/services/mode.json",
];

async function readProfile(path: string) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
}

describe("business-mode profile activation safety", () => {
  test("all eight authored profiles validate while remaining draft and default-off", async () => {
    for (const path of profilePaths) {
      const profile = await readProfile(path);
      expect(businessModeProfileSchema.safeParse(profile).success).toBe(true);
      expect(profile.status).toBe("draft");
      expect(profile.runtimeReady).toBe(false);
      expect(Object.values(profile.featureFlags.flags).every((enabled) => enabled === false)).toBe(true);
      expect(profile.product.fields.filter((field: { runtimeReady?: boolean }) => field.runtimeReady === true).every((field: { source?: string }) => field.source === "product_mode_details.details")).toBe(true);
    }
  });

  test("every profile storefront template is accepted by the database save function", async () => {
    const migration = await readFile(
      new URL("../supabase/migrations/20261114084229_allow_profile_storefront_templates.sql", import.meta.url),
      "utf8",
    );
    for (const path of profilePaths) {
      const profile = await readProfile(path);
      for (const template of profile.storefront.templates) {
        expect(migration.includes(`'${template.id}'`)).toBe(true);
      }
    }
  });

  test("activation is rejected when a product field has no persistence mapping", async () => {
    const profile = await readProfile(profilePaths[3]!);
    profile.status = "active";
    profile.runtimeReady = true;
    for (const field of profile.product.fields) field.runtimeReady = true;
    delete profile.product.fields[0].column;
    delete profile.product.fields[0].source;

    const result = businessModeProfileSchema.safeParse(profile);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "product" && issue.path[1] === "fields")).toBe(true);
    }
  });

  test("activation is rejected until every mapped field is individually verified", async () => {
    const profile = await readProfile(profilePaths[0]!);
    profile.status = "active";
    profile.runtimeReady = true;
    for (const field of profile.product.fields) {
      if (!field.column && !field.source) field.column = "test_persistence_column";
    }

    const result = businessModeProfileSchema.safeParse(profile);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "product" && issue.path[1] === "fields" && issue.path[3] === "runtimeReady")).toBe(true);
    }
  });

  test("activation succeeds only when all fields have a mapping and explicit readiness", async () => {
    const profile = await readProfile(profilePaths[0]!);
    profile.status = "active";
    profile.runtimeReady = true;
    for (const field of profile.product.fields) {
      if (!field.column && !field.source) field.column = "test_persistence_column";
      field.runtimeReady = true;
    }

    expect(businessModeProfileSchema.safeParse(profile).success).toBe(true);
  });
});

describe("strict business-mode resolution", () => {
  test("supports current keys and legacy aliases", () => {
    expect(resolveBusinessMode("fashion")?.key).toBe("fashion");
    expect(resolveBusinessMode("boutique")?.key).toBe("fashion");
    expect(resolveBusinessMode("grocery and provision")?.key).toBe("grocery-provision");
    expect(resolveBusinessMode("women’s clothing boutique")?.key).toBe("fashion");
    expect(resolveBusinessMode("phone accessories")?.key).toBe("electronics");
    expect(resolveBusinessMode("foodstuff shop")?.key).toBe("grocery-provision");
  });

  test("does not turn an unknown business name into General Retail", () => {
    expect(resolveBusinessMode("Kenny Store")).toBeNull();
    expect(resolveBusinessMode("unrecognised-mode")).toBeNull();
    expect(resolveBusinessMode(null)).toBeNull();
  });
});
