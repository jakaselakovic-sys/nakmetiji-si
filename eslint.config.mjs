import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
    rules: {
      // These are valid Next.js patterns — downgrade to warnings
      "react/display-name": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      // setState in useEffect is intentional in some cases
      "react-hooks/exhaustive-deps": "warn",
      // Internal <a> links in global-error.tsx (no Next.js context)
      "@next/next/no-html-link-for-pages": "warn",
      "react/no-unstable-nested-components": "warn",
      // React Compiler hooks rules — existing patterns, downgrade to warnings
      "react-hooks/static-components": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
