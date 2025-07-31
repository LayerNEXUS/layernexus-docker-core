/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        nexus: {
          purple: "#765cfe",
          blue:"#468fbe",
        },
      },
    },
  },
  variants: {
    scrollbar: ['rounded', 'dark'],
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}
