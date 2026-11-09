module.exports = {
  content: ["./dashboard.html", "./dashboard.js", "./leaderboard.html"],
  theme: {
      extend: {
          fontFamily: { sans: ['Inter', 'sans-serif'] },
          colors: {
              background: '#1a1d24',
              surface: '#252a34',
              primary: '#00F0FF',
              secondary: '#9D00FF',
              silver: '#b0b5c0'
          },
          keyframes: {
              shimmer: { '100%': { transform: 'translateX(100%)' } },
              slideIn: { '0%': { transform: 'translateY(-20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } }
          }
      }
  }
}
