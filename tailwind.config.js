/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        golden: {
          DEFAULT: '#D4AF37',
          light: '#F5D76E',
          dark: '#B8860B',
        },
        fire: {
          DEFAULT: '#E74C3C',
          red: '#C0392B',
          orange: '#F39C12',
        },
        // ✅ AGREGAR OPACIDADES PARA white
        white: {
          90: 'rgba(255,255,255,0.9)',
          80: 'rgba(255,255,255,0.8)',
          70: 'rgba(255,255,255,0.7)',
          60: 'rgba(255,255,255,0.6)',
          50: 'rgba(255,255,255,0.5)',
          40: 'rgba(255,255,255,0.4)',
          30: 'rgba(255,255,255,0.3)',
          20: 'rgba(255,255,255,0.2)',
          10: 'rgba(255,255,255,0.1)',
        },
        // ✅ AGREGAR OPACIDADES PARA golden
        'golden/20': 'rgba(212, 175, 55, 0.2)',
        'golden/10': 'rgba(212, 175, 55, 0.1)',
        'golden/30': 'rgba(212, 175, 55, 0.3)',
        'golden/50': 'rgba(212, 175, 55, 0.5)',
        // ✅ AGREGAR OPACIDADES PARA fire
        'fire/20': 'rgba(231, 76, 60, 0.2)',
        'fire/10': 'rgba(231, 76, 60, 0.1)',
        'fire/30': 'rgba(231, 76, 60, 0.3)',
        // ✅ AGREGAR OPACIDADES PARA purple (para admin tools)
        'purple/20': 'rgba(168, 85, 247, 0.2)',
        'purple/10': 'rgba(168, 85, 247, 0.1)',
        'purple/30': 'rgba(168, 85, 247, 0.3)',
        'purple/50': 'rgba(168, 85, 247, 0.5)',
      },
      borderColor: {
        'golden/30': 'rgba(212, 175, 55, 0.3)',
        'golden/20': 'rgba(212, 175, 55, 0.2)',
        'golden/10': 'rgba(212, 175, 55, 0.1)',
        'fire/30': 'rgba(231, 76, 60, 0.3)',
        'purple/30': 'rgba(168, 85, 247, 0.3)',
      },
      backgroundColor: {
        'golden/20': 'rgba(212, 175, 55, 0.2)',
        'golden/10': 'rgba(212, 175, 55, 0.1)',
        'fire/20': 'rgba(231, 76, 60, 0.2)',
        'fire/10': 'rgba(231, 76, 60, 0.1)',
        'purple/20': 'rgba(168, 85, 247, 0.2)',
        'purple/10': 'rgba(168, 85, 247, 0.1)',
      },
      textColor: {
        'golden/20': 'rgba(212, 175, 55, 0.2)',
        'golden/10': 'rgba(212, 175, 55, 0.1)',
      },
      boxShadow: {
        'golden': '0 0 30px rgba(212, 175, 55, 0.15)',
        'golden-lg': '0 0 50px rgba(212, 175, 55, 0.25)',
        'fire': '0 0 30px rgba(231, 76, 60, 0.15)',
      },
    },
  },
  plugins: [],
}