import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import vue from "eslint-plugin-vue";
import ts from "typescript-eslint";

// TODO: add eslint-plugin-astro when it supports latest typescript-eslint

export default ts.config(
  js.configs.recommended,
  ...ts.configs.strictTypeChecked,
  ...vue.configs["flat/recommended"],
  prettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.{cjs,cts}"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
  {
    files: ["*.vue", "**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: "@typescript-eslint/parser",
      },
    },
    // Couldn't activate project service for Vue files
    extends: [ts.configs.disableTypeChecked],
  },
  {
    rules: {
      "@typescript-eslint/no-base-to-string": "off", // Causes max stack size exceeded error
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
        },
      ],
      "no-console": "warn",
    },
  },
  {
    files: ["scripts/**/*"],
    rules: {
      "no-console": "off",
    },
  },
  {
    ignores: ["dist", "node_modules", ".astro", ".vcpkg"],
  }
);
