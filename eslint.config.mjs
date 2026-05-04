import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      "react/display-name": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "react/no-unstable-nested-components": "warn",
    },
  },
  {
    files: ["scripts/**/*.{js,cjs,mjs}", "*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
