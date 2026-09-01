/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14121f',
        cloud: '#f8f7fb',
        pulse: '#7c3aed',
        grape: '#a78bfa',
        lilac: '#ede9fe',
        mint: '#7dd3fc',
        coral: '#fb7185',
      },
      boxShadow: {
        soft: '0 24px 80px rgba(76, 29, 149, 0.14)',
        card: '0 18px 45px rgba(20, 18, 31, 0.08)',
      },
      backgroundImage: {
        aura: 'radial-gradient(circle at 20% 20%, rgba(167, 139, 250, 0.32), transparent 28%), radial-gradient(circle at 82% 12%, rgba(125, 211, 252, 0.26), transparent 30%), linear-gradient(135deg, #fbfbff 0%, #f4f0ff 48%, #eefaff 100%)',
      },
    },
  },
  plugins: [],
}
