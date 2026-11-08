import { readFileSync } from "node:fs";

const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const packages = packageLock.packages ?? {};
const bunLock = readFileSync("bun.lock", "utf8");
const expected = {
  minimatch: "11.0.5",
  uuid: "11.1.1",
};

for (const [name, version] of Object.entries(expected)) {
  const npmVersion = packages[`node_modules/${name}`]?.version;
  if (npmVersion !== version) {
    throw new Error(
      `package-lock.json resolves ${name}@${npmVersion ?? "missing"}; expected ${version}`,
    );
  }

  if (!bunLock.includes(`"${name}": ["${name}@${version}"`)) {
    throw new Error(`bun.lock does not resolve ${name}@${version}`);
  }
}

console.log("Both lockfiles resolve patched minimatch@11.0.5 and uuid@11.1.1.");
