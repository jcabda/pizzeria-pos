import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'Golden on Fire - Pizzería POS',
    description: 'Sistema de punto de venta para pizzería',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
    themeColor: '#D4AF37',
    icons: {
        icon: [
            { url: '/favicon.png', type: 'image/png' },
            { url: '/favicon.ico', sizes: 'any' },
        ],
        apple: '/favicon.png',
    },
}

export default function RootLayout({ children }) {
    return (
        <html lang="es">
            <head>
                <meta name="theme-color" content="#D4AF37" />
                <link rel="icon" href="/favicon.png" type="image/png" />
                <link rel="apple-touch-icon" href="/favicon.png" />
            </head>
            <body className={inter.className}>
                {children}
            </body>
        </html>
    )
}