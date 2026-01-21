/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tealDark: "#0F3D3E",    // Dark teal
        tealLight: "#1C5D5F",   // Medium teal
        gold: "#DAA520",        // Changed to a more standard gold
        goldSoft: "#F4C542",    // Softer gold
        // Additional colors you might find useful
        tealMedium: "#2D8F8D",  // Brighter teal for better visibility
        goldDark: "#B8860B",    // Darker gold for contrast
      },
      backdropBlur: {
        xs: "2px",
      },
      // Custom box shadows for your cards
      boxShadow: {
        'card': '0 30px 80px rgba(0, 0, 0, 0.45)',
        'gold-glow': '0 12px 30px rgba(218, 165, 32, 0.6)',
        'price-pill': '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      // Custom animations
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(218, 165, 32, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(218, 165, 32, 0.6)' },
        },
        fadeIn: {
          from: {
            opacity: 0,
            transform: 'translateY(-10px)',
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      },
      // Custom border radius
      borderRadius: {
        'xl-2': '28px', // For your card rounded corners
        'xxl': '32px',
      },
      // Background images
      backgroundImage: {
        'gold-gradient': 'linear-gradient(to bottom right, #DAA520, #F4C542)',
        'teal-gradient': 'linear-gradient(to bottom right, #0F3D3E, #1C5D5F)',
      },
    },
  },
  plugins: [],
}