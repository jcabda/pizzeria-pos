'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
    Home, ClipboardList, ChefHat, BarChart3, 
    Users, Package, Pizza, FolderOpen, FileText,
    LayoutDashboard, Shield, Settings, Ruler, Tag, Scale,
    Utensils, Coffee, Truck, LogOut, Menu, X, Bell,
    Eye, EyeOff
} from 'lucide-react'

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
                    <div className="text-4xl mb-4 animate-pulse">🔥</div>
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

    // ============================================
    // OBTENER PERMISOS DEL USUARIO
    // ============================================
    const obtenerPermisos = () => {
        // Si es admin, tiene todos los permisos
        if (usuario.rol === 'admin') {
            return {
                productos: true,
                inventario: true,
                categorias: true,
                usuarios: true,
                auditoria: true,
                tamanios: true,
                tipos: true,
                unidades: true
            }
        }
        // Si no, usar los permisos guardados
        return usuario.permisos || {
            productos: false,
            inventario: false,
            categorias: false,
            usuarios: false,
            auditoria: false,
            tamanios: false,
            tipos: false,
            unidades: false
        }
    }

    const permisos = obtenerPermisos()
    const tienePermiso = (permiso) => {
        return permisos[permiso] === true
    }

    // ============================================
    // PESTAÑAS PRINCIPALES (todos los usuarios)
    // ============================================
    const pestañasPrincipales = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
        { href: '/pedidos', icon: ClipboardList, label: 'Pedidos' },
        { href: '/cocina', icon: ChefHat, label: 'Cocina' },
        { href: '/comandas', icon: Utensils, label: 'Mesas' },
        { href: '/estadisticas', icon: BarChart3, label: 'Estadísticas' },
    ]

    // ============================================
    // ADMIN TOOLS (solo si tiene permisos)
    // ============================================
    const adminToolsPestaña = { href: '/admin', icon: Shield, label: 'Admin Tools' }

    const adminSubPestañas = [
        { href: '/productos', icon: Pizza, label: 'Productos', permiso: 'productos' },
        { href: '/inventario', icon: Package, label: 'Inventario', permiso: 'inventario' },
        { href: '/categorias', icon: FolderOpen, label: 'Categorías', permiso: 'categorias' },
        { href: '/usuarios', icon: Users, label: 'Usuarios', permiso: 'usuarios' },
        { href: '/auditoria', icon: FileText, label: 'Auditoría', permiso: 'auditoria' },
        { href: '/admin/tamanios', icon: Ruler, label: 'Tamaños', permiso: 'tamanios' },
        { href: '/admin/tipos', icon: Tag, label: 'Tipos', permiso: 'tipos' },
        { href: '/admin/unidades', icon: Scale, label: 'Unidades', permiso: 'unidades' },
    ]

    // Filtrar sub-pestañas según permisos
    const adminSubPestañasFiltradas = adminSubPestañas.filter(item => {
        // Admin tiene todo
        if (usuario.rol === 'admin') return true
        // Otros roles: verificar permiso
        return tienePermiso(item.permiso)
    })

    // Determinar si Admin Tools está activo
    const isAdminToolsActive = pathname.startsWith('/admin') || 
                               adminSubPestañas.some(p => pathname.startsWith(p.href)) ||
                               pathname === '/productos' ||
                               pathname === '/inventario' ||
                               pathname === '/categorias' ||
                               pathname === '/usuarios' ||
                               pathname === '/auditoria'

    // Construir menú completo
    const allLinks = [...pestañasPrincipales]
    
    // Agregar Admin Tools solo si tiene al menos un permiso o es admin
    const tieneAlgunPermiso = Object.values(permisos).some(v => v === true)
    if (esAdmin || tieneAlgunPermiso) {
        allLinks.push(adminToolsPestaña)
    }

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* LOGO GOLDEN ON FIRE */}
                        <Link href="/dashboard" className="flex items-center gap-3 flex-shrink-0">
                            <div className="relative w-10 h-10">
                                <Image
                                    src="/images/logo.png"
                                    alt="Golden on Fire"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 blur-xl opacity-30 animate-pulse -z-10"></div>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">
                                    <span className="text-golden">Golden</span>
                                    <span className="text-red-600"> on </span>
                                    <span className="text-orange-500">Fire</span>
                                </h1>
                                <p className="text-xs text-gray-500 hidden sm:block">🔥 Sistema de punto de venta</p>
                            </div>
                        </Link>

                        {/* MENÚ DE ESCRITORIO */}
                        <nav className="hidden lg:flex items-center space-x-1">
                            {pestañasPrincipales.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                                        isActive(link.href)
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                                    }`}
                                >
                                    <link.icon size={18} />
                                    {link.label}
                                </Link>
                            ))}

                            {/* Admin Tools - solo si tiene permisos */}
                            {(esAdmin || tieneAlgunPermiso) && (
                                <Link
                                    href="/admin"
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                                        isAdminToolsActive
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                                    }`}
                                >
                                    <Shield size={18} />
                                    Admin Tools
                                </Link>
                            )}
                        </nav>

                        {/* USER MENU */}
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

            {/* SUB-MENÚ ADMIN - solo si tiene permisos y está activo */}
            {(esAdmin || tieneAlgunPermiso) && isAdminToolsActive && adminSubPestañasFiltradas.length > 0 && (
                <div className="bg-purple-50/80 border-b border-purple-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center space-x-1 py-2 overflow-x-auto">
                            <span className="text-xs font-medium text-purple-600 mr-2 flex items-center gap-1">
                                <Shield size={14} />
                                Admin:
                            </span>
                            {adminSubPestañasFiltradas.map((link) => {
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
                                        <link.icon size={14} />
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

            {/* MENÚ MÓVIL */}
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
                                    <link.icon size={18} />
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
                                <LogOut size={18} />
                                Salir
                            </button>
                        </nav>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
                {children}
            </main>

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