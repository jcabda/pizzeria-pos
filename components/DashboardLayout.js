'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }) {
    const [usuario, setUsuario] = useState(null)
    const [menuAbierto, setMenuAbierto] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const userData = localStorage.getItem('usuario')
        if (!userData) {
            router.push('/login')
            return
        }
        setUsuario(JSON.parse(userData))
    }, [router])

    const handleLogout = () => {
        if (confirm('¿Seguro que quieres cerrar sesión?')) {
            localStorage.removeItem('usuario')
            router.push('/login')
        }
    }

    useEffect(() => {
        setMenuAbierto(false)
    }, [pathname])

    if (!usuario) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-4xl mb-4 animate-pulse">🍕</div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        )
    }

    const isActive = (href) => {
        if (href === '/dashboard') return pathname === '/dashboard'
        return pathname.startsWith(href)
    }

    const esAdmin = usuario.rol === 'admin'

    // Pestañas principales (todos los usuarios)
    const pestañasPrincipales = [
        { href: '/dashboard', label: '📊 Inicio' },
        { href: '/pedidos', label: '📝 Pedidos' },
        { href: '/cocina', label: '👨‍🍳 Cocina' },
        { href: '/estadisticas', label: '📊 Estadísticas' },
    ]

    // Admin Tools es una pestaña más (solo admin)
    const adminToolsPestaña = { href: '/admin', label: '🛡️ Admin Tools' }

    // Sub-pestañas de Admin Tools
    const adminSubPestañas = [
        { href: '/productos', label: '🍕 Productos' },
        { href: '/inventario', label: '🧂 Inventario' },
        { href: '/categorias', label: '📂 Categorías' },
        { href: '/usuarios', label: '👥 Usuarios' },
        { href: '/auditoria', label: '📋 Auditoría' },
    ]

    // Determinar si Admin Tools está activo
    const isAdminToolsActive = pathname.startsWith('/admin') || 
                               adminSubPestañas.some(p => pathname.startsWith(p.href))

    // Construir menú completo
    const allLinks = [...pestañasPrincipales]
    if (esAdmin) {
        allLinks.push(adminToolsPestaña)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* HEADER */}
            <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center space-x-3 flex-shrink-0">
                            <div className="bg-orange-600 rounded-lg p-2">
                                <span className="text-xl">🍕</span>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-800">Pizzería POS</h1>
                                <p className="text-xs text-gray-500 hidden sm:block">Sistema de punto de venta</p>
                            </div>
                        </Link>

                        {/* MENÚ PRINCIPAL - ESCRITORIO */}
                        <nav className="hidden lg:flex items-center space-x-1">
                            {pestañasPrincipales.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                        isActive(link.href)
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}

                            {esAdmin && (
                                <Link
                                    href="/admin"
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                        isAdminToolsActive
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                                    }`}
                                >
                                    🛡️ Admin Tools
                                </Link>
                            )}
                        </nav>

                        {/* USER MENU + BOTÓN HAMBURGUESA */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                <span className="text-xl">{usuario.avatar || '👤'}</span>
                                <div className="hidden sm:block">
                                    <p className="text-sm font-medium text-gray-700">{usuario.nombre}</p>
                                    <p className="text-xs text-gray-500 capitalize">{usuario.rol}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                            >
                                Salir
                            </button>

                            {/* BOTÓN HAMBURGUESA - SOLO MÓVIL */}
                            <button
                                onClick={() => setMenuAbierto(!menuAbierto)}
                                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
                            >
                                {menuAbierto ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* SUB-MENÚ DE ADMIN TOOLS */}
            {esAdmin && isAdminToolsActive && (
                <div className="bg-purple-50/80 border-b border-purple-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center space-x-1 py-2 overflow-x-auto">
                            <span className="text-xs font-medium text-purple-600 mr-2 flex items-center gap-1">
                                🛡️ Admin:
                            </span>
                            {adminSubPestañas.map((link) => {
                                const isSubActive = pathname === link.href || pathname.startsWith(link.href)
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                            isSubActive
                                                ? 'bg-purple-600 text-white shadow-sm'
                                                : 'text-purple-700 hover:bg-purple-100'
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* BREADCRUMBS */}
            {pathname !== '/dashboard' && (
                <div className="bg-white border-b border-gray-100 py-2 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
                        <Link href="/dashboard" className="text-gray-400 hover:text-orange-500 transition-colors">
                            🏠
                        </Link>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-600 font-medium capitalize">
                            {pathname.split('/').pop() || 'Inicio'}
                        </span>
                        <span className="ml-auto text-xs text-gray-400">
                            {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            )}

            {/* MENÚ MÓVIL (DESPLEGABLE) */}
            {menuAbierto && (
                <div className="lg:hidden bg-white border-b border-gray-100 shadow-lg animate-fade-in">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <nav className="flex flex-col space-y-1">
                            {allLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMenuAbierto(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                        isActive(link.href)
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <hr className="my-2 border-gray-100" />
                            <button
                                onClick={() => {
                                    setMenuAbierto(false)
                                    handleLogout()
                                }}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-all"
                            >
                                🚪 Salir
                            </button>
                        </nav>
                    </div>
                </div>
            )}

            {/* CONTENIDO PRINCIPAL */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
                {children}
            </main>

            {/* BOTÓN VOLVER ARRIBA */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-6 right-6 bg-orange-600 text-white p-3 rounded-full shadow-lg hover:bg-orange-700 transition-all hover:scale-110 z-50"
                title="Volver arriba"
            >
                ⬆
            </button>
        </div>
    )
}