import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: { js },
    rules: {},
    extends: [js.configs.recommended, prettier],
  },
  // Override for CommonJS files
  {
    files: ["**/*.cjs"],
    languageOptions: { sourceType: "commonjs" },
  },
  // Optional: browser globals for frontend files (if any)
  {
    files: ["public/**/*.{js,mjs}"], // You can adjust this pattern
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
]);