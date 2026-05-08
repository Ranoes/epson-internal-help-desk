/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ["'Playfair Display'", "serif"],
        lato: ["'Lato'", "sans-serif"],
      },
      colors: {
        primary: "#5B6CF5",
        secondary: "#6E7FFF",
        accent: "#7C8FF8",
        light: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
        },
      },
      backgroundImage: {
        gradient:
          "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 50%, #E5E7EB 100%)",
      },
    },
  },
  plugins: [],
};
