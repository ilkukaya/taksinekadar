import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { SITE, FORBIDDEN_LEGACY_BRAND_TERMS, canonicalUrl } from "../src/config/site";
import { PROJECT_ROOT } from "../src/lib/utils/paths";

describe("SITE config", () => {
  it("has the exact brand name including the question mark", () => {
    expect(SITE.name).toBe("Taksi Ne Kadar?");
  });

  it("uses the apex domain, no www", () => {
    expect(SITE.domain).toBe("taksinekadar.com");
    expect(SITE.url).toBe("https://taksinekadar.com");
    expect(SITE.url).not.toContain("www.");
  });

  it("uses tr-TR locale", () => {
    expect(SITE.locale).toBe("tr-TR");
  });
});

describe("canonicalUrl", () => {
  it("builds an absolute URL from a root-relative path", () => {
    expect(canonicalUrl("/istanbul-taksi-ucreti/")).toBe(
      "https://taksinekadar.com/istanbul-taksi-ucreti/",
    );
  });

  it("adds a leading slash if missing", () => {
    expect(canonicalUrl("iller/")).toBe("https://taksinekadar.com/iller/");
  });
});

function walkSourceFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".astro" || entry === ".git")
      continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) files.push(...walkSourceFiles(fullPath, extensions));
    else if (extensions.some((ext) => entry.endsWith(ext))) files.push(fullPath);
  }
  return files;
}

describe("legacy brand scan", () => {
  it("never references a forbidden legacy/competitor brand term in src/ or data/", () => {
    // site.ts is the registry that DECLARES these strings so the build can scan for them —
    // excluding it, not the rule, is what's being tested here.
    const registryFile = join(PROJECT_ROOT, "src/config/site.ts");
    const files = [
      ...walkSourceFiles(join(PROJECT_ROOT, "src"), [".astro", ".ts", ".tsx", ".md"]),
      ...walkSourceFiles(join(PROJECT_ROOT, "data"), [".csv"]),
    ].filter((file) => file !== registryFile);

    const offenders: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      for (const term of FORBIDDEN_LEGACY_BRAND_TERMS) {
        if (content.includes(term)) offenders.push(`${file} contains "${term}"`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
