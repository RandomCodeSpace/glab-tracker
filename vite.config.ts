import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { fileURLToPath } from "node:url";

const entry = fileURLToPath(new URL("./src/index.ts", import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    dts({ tsconfigPath: "./tsconfig.build.json", rollupTypes: true }),
  ],
  build: {
    lib: {
      entry,
      name: "Lane",
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "react/jsx-runtime",
        },
        assetFileNames: (info) => {
          const first = info.names?.[0];
          if (first && first.endsWith(".css")) return "tracker.css";
          return first ?? "[name][extname]";
        },
      },
    },
    sourcemap: true,
    cssCodeSplit: false,
  },
});
