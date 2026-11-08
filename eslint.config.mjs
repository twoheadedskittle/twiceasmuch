import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The 3D scene mutates three.js objects every frame inside useFrame, which is
  // how React Three Fiber is meant to be used; the React Compiler purity rules
  // (not enabled in this project) misread that as render-time mutation.
  {
    files: ["src/scene/**/*.{ts,tsx}"],
    rules: { "react-hooks/immutability": "off", "react-hooks/refs": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".claude/**",
    ".agents/**",
    ".aider-desk/**",
    ".impeccable/**",
    ".taste-skill/**",
  ]),
]);

export default eslintConfig;
