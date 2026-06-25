import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'Pizzería POS - Sistema de Punto de Venta',
    description: 'Sistema de punto de venta para pizzería',
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#FF6B35',
}

export default function RootLayout({ children }) {
    return (
        <html lang="es">
            <head>
                <meta name="theme-color" content="#FF6B35" />
            </head>
            <body className={inter.className}>
                {children}
            </body>
        </html>
    )
}