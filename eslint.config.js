import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import astroPlugin from "eslint-plugin-astro";
import globals from "globals";

export default [
  {
    ignores: [
      "dist/**",
      ".astro/**",
      "node_modules/**",
      "public/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      "data/normalized/**",
      "data/reports/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-unused-vars": "off",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },
  ...astroPlugin.configs.recommended,
  {
    files: ["**/*.astro"],
    rules: {
      "no-unused-vars": "off",
    },
  },
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // CLI scripts talk to the person running them via stdout — console.log is the point.
    files: ["scripts/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
