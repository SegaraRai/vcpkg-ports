import { env } from "node:process";
import {
  defineConfig,
  presetIcons,
  presetWind,
  transformerCompileClass,
  transformerDirectives,
} from "unocss";

export default defineConfig({
  presets: [
    presetWind({
      dark: {
        dark: ".theme-dark",
        light: ".theme-light",
      },
    }),
    presetIcons({
      scale: 1,
      warn: true,
    }),
  ],
  transformers: [
    transformerCompileClass({
      classPrefix: "u_",
      trigger:
        env.CI || env.NODE_ENV === "production" ? ":uno:" : ":uno: :dev:",
    }),
    transformerDirectives(),
  ],
});
