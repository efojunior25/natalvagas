# File: tailwind.config.js
- **Original Path:** `frontend/tailwind.config.js`
- **Language / Type:** `javascript`
- **Lines of Code:** 38

---

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8', // Cyan vibrante do logo e PruPru
          500: '#0ea5e9',
          600: '#0284c7', // Azul Royal do logo "Natal"
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        surface: {
          dark: '#1E293B',
          darker: '#0F172A',
          border: '#334155',
          light: '#FFFFFF',
          lightBg: '#F8FAFC',
          lightBorder: '#E2E8F0'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

```
