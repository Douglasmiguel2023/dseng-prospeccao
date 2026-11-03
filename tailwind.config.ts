import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0714",
        panel: "#17102B",
        violet: "#7C3AED",
        magenta: "#D946EF",
        lilac: "#C4B5FD",
        mist: "#EDE9FE",
      },
    },
  },
  plugins: [],
} satisfies Config;
