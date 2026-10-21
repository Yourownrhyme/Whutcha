module.exports = {
  content: ["./index.html", "./viewer.html", "./overlay.html", "./app.js"],
  theme: {
      extend: {
          fontFamily: { sans: ['Inter', 'sans-serif'] },
          colors: { background: '#0B0D12', surface: '#151822', primary: '#00F0FF', silver: '#8B949E', secondary: '#9D00FF' },
          keyframes: {
              shimmer: { '100%': { transform: 'translateX(100%)' } },
              slideIn: { '0%': { transform: 'translateY(-20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
              shake: {
                  '0%, 100%': { transform: 'translateX(0)' },
                  '25%': { transform: 'translateX(-10px)' },
                  '75%': { transform: 'translateX(10px)' }
              }
          }
      }
  }
}
