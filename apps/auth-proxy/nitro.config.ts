export default defineNitroConfig({
  preset: "vercel-edge",
  experimental: {
    wasm: true,
  },
});