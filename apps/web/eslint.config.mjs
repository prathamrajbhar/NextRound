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
    "public/mediapipe/**",
  ]),
  {
    settings: {
      react: {
        
        
        version: "19.2.8",
      },
    },
    rules: {
      "@next/next/no-img-element": "off",
      "@next/next/google-font-display": "off",
      "@next/next/no-page-custom-font": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    }
  }
]);

export default eslintConfig;
