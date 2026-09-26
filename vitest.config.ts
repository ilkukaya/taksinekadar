import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // src/config/site.ts derives the canonical origin from SITE_URL / Netlify's URL build
    // variable. Blank them so unit tests always assert against the production default,
    // whatever environment (e.g. a Netlify build) runs them.
    env: { SITE_URL: "", URL: "" },
  },
});
