import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const modesDir = join(root, "modes");
const modeKeys = [
  "general-retail",
  "grocery-provision",
  "fashion",
  "electronics",
  "food-service",
  "pharmacy",
  "beauty-personal-care",
  "services",
];

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const profileDirs = (await readdir(modesDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

assert.deepEqual(profileDirs, [...modeKeys.filter((key) => key !== "general-retail"), "normal-business"].sort());

const profiles = [];
for (const directory of profileDirs) {
  const profile = await readJson(join(modesDir, directory, "mode.json"));
  assert.equal(profile.schemaVersion, 1, directory + ": unsupported schema version");
  assert.equal(profile.status, "draft", directory + ": profile must remain draft until reviewed");
  assert.equal(profile.runtimeReady, false, directory + ": runtimeReady must remain false");
  assert.equal(profile.featureFlags.default, "off", directory + ": default feature flag must be off");
  assert.ok(Object.values(profile.featureFlags.flags).every((enabled) => enabled === false), directory + ": every flag must be off");
  assert.equal(new Set(profile.product.fields.map((field) => field.id)).size, profile.product.fields.length, directory + ": duplicate product field IDs");
  const statuses = new Set(profile.orders.statuses.map((status) => status.id));
  const terminal = new Set(profile.orders.terminalStatuses);
  for (const transition of profile.orders.transitions) {
    assert.ok(statuses.has(transition.from), directory + ": unknown transition source " + transition.from);
    assert.ok(transition.to.every((target) => statuses.has(target)), directory + ": unknown transition target");
    if (terminal.has(transition.from)) assert.equal(transition.to.length, 0, directory + ": terminal status has outgoing transition");
  }
  const allowed = new Set(profile.storefront.allowedSectionTypes);
  for (const template of profile.storefront.templates) {
    for (const sections of Object.values(template.pages)) {
      assert.ok(sections.every((section) => allowed.has(section)), directory + ": template references an unregistered section");
    }
  }
  profiles.push(profile);
}

assert.equal(profiles.length, 8, "expected eight mode profiles");
const applicability = await readJson(join(modesDir, "feature-applicability.json"));
assert.deepEqual(applicability.modeKeys, modeKeys);
const catalogFeatureIds = Object.keys(applicability.features).sort();
for (const profile of profiles) {
  assert.deepEqual(Object.keys(profile.featureFlags.flags).sort(), catalogFeatureIds, profile.id + ": flags must match the complete feature catalog");
}
assert.ok(Object.values(applicability.features).every((feature) =>
  feature.availability === "all-modes"
    ? feature.applicableModeKeys.length === modeKeys.length
    : feature.applicableModeKeys.length === 0
));
console.log("Business-mode profile checks passed: 8 profiles, " + Object.keys(applicability.features).length + " feature mappings; all flags OFF.");
