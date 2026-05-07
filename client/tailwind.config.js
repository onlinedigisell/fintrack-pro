export default {
  content: ['./client/index.html', './client/src/**/*.{js,jsx}', './index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        mint: '#10b981',
        coral: '#4f46e5',
        saffron: '#f59e0b',
        blush: '#eef2ff',
        danger: '#ef4444',
        paper: '#f5f7fb'
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 23, 42, 0.08)',
        phone: '0 24px 70px rgba(15, 23, 42, 0.18)'
      }
    }
  },
  plugins: []
};
