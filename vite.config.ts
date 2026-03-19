import { defineConfig } from "vite-plus";

export default defineConfig({
  server: {
    forwardConsole: true,
  },
  staged: {
    "*": "vp check --fix",
  },
  test: {
    environment: "jsdom",
  },
  pack: {
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
