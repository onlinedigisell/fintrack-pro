export default {
  content: ['./client/index.html', './client/src/**/*.{js,jsx}', './index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#25262b',
        mint: '#36b7a0',
        coral: '#ff4f45',
        saffron: '#f5b84b',
        blush: '#fff3f2',
        paper: '#f6f6f6'
      },
      boxShadow: {
        soft: '0 18px 45px rgba(37, 38, 43, 0.08)',
        phone: '0 24px 70px rgba(37, 38, 43, 0.18)'
      }
    }
  },
  plugins: []
};
