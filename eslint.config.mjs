import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    root: true, // ← IMPORTANTE
    ignores: [
      ".next/**/*",
      "node_modules/**/*",
      "../api-togo/**/*", // ← Ignorar otros proyectos
      "../togo-web-catalog/**/*",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-interface": "off",

      // React rules
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/display-name": "off",

      // General rules
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
    },
  },
];

export default eslintConfig;
