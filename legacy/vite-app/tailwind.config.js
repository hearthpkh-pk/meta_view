/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // สำคัญมาก ต้องชี้มาที่โฟลเดอร์ src ของคุณ
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
