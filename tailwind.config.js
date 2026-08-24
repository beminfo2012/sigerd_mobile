/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            screens: {
                '3xl': '1920px',
                '4xl': '2560px',
                'tv': '3840px',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Manrope', 'sans-serif'],
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                success: {
                    DEFAULT: "hsl(var(--success))",
                    foreground: "hsl(var(--success-foreground))",
                },
                warning: {
                    DEFAULT: "hsl(var(--warning))",
                    foreground: "hsl(var(--warning-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                navy: {
                    950: '#0a1330',
                    900: '#0e1a3d',
                    800: '#152a56',
                },
                'orange-mobile': {
                    DEFAULT: '#ff5722',
                    soft: '#ffece4',
                    light: '#ff7a45',
                },
                'blue-mobile': {
                    DEFAULT: '#2f5fdb',
                    soft: '#e8eefd',
                },
                'mobile-bg': '#f2f4f9',
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                xl: "var(--radius)",
                "2xl": "var(--radius)",
                "3xl": "var(--radius)",
            },
            boxShadow: {
                premium: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                "premium-hover": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                "mobile-card": "0 3px 14px -4px rgba(15,30,70,0.10), 0 1px 3px rgba(15,30,70,0.05)",
                "mobile-login": "0 40px 100px -20px rgba(0,0,0,0.7), 0 0 0 8px #0a0a0a, 0 0 0 9px #2a2a2a",
                "mobile-btn": "0 10px 24px -6px rgba(255,87,34,0.55)",
                "mobile-fab": "0 10px 22px -6px rgba(47,95,219,0.55), 0 0 0 6px #f2f4f9",
            }
        },
    },
    plugins: [],
}

