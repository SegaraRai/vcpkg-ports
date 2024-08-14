declare module "eslint-plugin-vue" {
  import type { Linter } from "eslint";

  const object: {
    configs: Record<"flat/recommended", Linter.Config[]>;
  };

  export default object;
}
