import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    // Node/CommonJS tool config files (Metro, Babel, Tailwind, Jest) evaluated directly by Node,
    // not bundled — they use `require`/`module.exports` rather than ESM import syntax.
    files: ["**/*.config.js", "**/jest.setup.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        module: "writable",
        require: "readonly",
        __dirname: "readonly",
        process: "readonly",
        jest: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // jest.mock() factories can only reference out-of-scope modules via inline `require()`
    // (see https://jestjs.io/docs/es6-class-mocks#calling-jestmock-with-the-module-factory-parameter).
    files: ["**/__tests__/**", "**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/.plasmo/**",
      "**/node_modules/**",
      "**/android/**",
      "**/ios/**",
      "**/.expo/**",
    ],
  }
);
