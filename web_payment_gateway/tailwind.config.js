// tailwind.config.js (File baru yang Anda buat di root direktori)

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Ini mengcover SEMUA file di dalam folder src yang berisikan Tailwind Class
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Warna Kustom Anda ---
        lavender: "#BBB7E5", // Primary/Accent
        "snow-bg": "#DAE9FA", // Light Background/Border
        "light-rose": "#F7DFDF",
        pistachio: "#B6C687",
        "baby-pink": "#EFBDBD",
        "pale-yellow": "#F3EDBD",
      },
      backgroundColor: {
        "snow-bg": "#f9fafb", // sesuai dengan background di layout
      },
      // Anda juga dapat menambah/mengubah konfigurasi lain di sini
    },
  },
  plugins: [],
};
