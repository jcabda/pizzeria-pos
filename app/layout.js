import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'Pizzería POS - Sistema de Punto de Venta',
    description: 'Sistema de punto de venta para pizzería',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
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