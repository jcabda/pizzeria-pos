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
    Flame, Sparkles
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
            <div className="min-h-screen flex items-center justify-center bg-[#0A0A12]">
                <div className="text-center">
                    <div className="text-5xl mb-4 animate-fire-pulse">🔥</div>
                    <p className="text-white-40">Cargando...</p>
                </div>
            </div>
        )
    }

    const isActive = (href) => {
        if (href === '/dashboard') return pathname === '/dashboard'
        return pathname.startsWith(href)
    }

    const esAdmin = usuario.rol === 'admin'

    // ✅ FUNCIÓN PARA VERIFICAR PERMISOS (incluye cocina)
    const tienePermiso = (permiso) => {
        if (usuario.rol === 'admin') return true
        return usuario.permisos?.[permiso] === true
    }

    const obtenerPermisos = () => {
        if (usuario.rol === 'admin') {
            return {
                productos: true,
                inventario: true,
                categorias: true,
                usuarios: true,
                auditoria: true,
                tamanios: true,
                tipos: true,
                unidades: true,
                cocina: true // ✅ NUEVO
            }
        }
        return usuario.permisos || {
            productos: false,
            inventario: false,
            categorias: false,
            usuarios: false,
            auditoria: false,
            tamanios: false,
            tipos: false,
            unidades: false,
            cocina: false // ✅ NUEVO
        }
    }

    const permisos = obtenerPermisos()
    const tieneAlgunPermiso = Object.values(permisos).some(v => v === true)

    // ✅ PESTAÑAS PRINCIPALES (Cocina con permiso)
    const pestañasPrincipales = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
        { href: '/comandas', icon: Utensils, label: 'Mesas' },
        // ✅ Cocina SOLO si tiene permiso
        ...(tienePermiso('cocina') ? 
            [{ href: '/cocina', icon: ChefHat, label: 'Cocina' }] : []
        ),
        { href: '/estadisticas', icon: BarChart3, label: 'Estadísticas' },
    ]

    // Admin Tools - SOLO si tiene permisos
    const adminSubPestañas = [
        { href: '/productos', icon: Pizza, label: 'Productos', permiso: 'productos' },
        { href: '/inventario', icon: Package, label: 'Inventario', permiso: 'inventario' },
        { href: '/categorias', icon: FolderOpen, label: 'Categorías', permiso: 'categorias' },
        { href: '/usuarios', icon: Users, label: 'Usuarios', permiso: 'usuarios' },
        { href: '/auditoria', icon: FileText, label: 'Auditoría', permiso: 'auditoria' },
        { href: '/admin/tamanios', icon: Ruler, label: 'Tamaños', permiso: 'tamanios' },
        { href: '/admin/tipos', icon: Tag, label: 'Tipos', permiso: 'tipos' },
        { href: '/admin/unidades', icon: Scale, label: 'Unidades', permiso: 'unidades' },
    ].filter(item => esAdmin || tienePermiso(item.permiso))

    const isAdminToolsActive = pathname.startsWith('/admin') || 
                               adminSubPestañas.some(p => pathname.startsWith(p.href)) ||
                               pathname === '/productos' ||
                               pathname === '/inventario' ||
                               pathname === '/categorias' ||
                               pathname === '/usuarios' ||
                               pathname === '/auditoria'

    const allLinks = [...pestañasPrincipales]
    if (esAdmin || tieneAlgunPermiso) {
        allLinks.push({ href: '/administracion', icon: Shield, label: 'Admin Tools' })
    }

    return (
        <div className="min-h-screen bg-[#0A0A12]">
            {/* Header Glass */}
            <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* LOGO */}
                        <Link href="/comandas" className="flex items-center gap-3 flex-shrink-0">
                            <div className="relative w-10 h-10">
                                <Image
                                    src="/images/logo.png"
                                    alt="Golden on Fire"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 blur-xl opacity-30 animate-pulse"></div>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">
                                    <span className="text-gradient-golden">Golden</span>
                                    <span className="text-white"> on </span>
                                    <span className="text-gradient-fire">Fire</span>
                                </h1>
                                <p className="text-xs text-white-30 hidden sm:block">🔥 Sistema de punto de venta</p>
                            </div>
                        </Link>

                        {/* Menú Desktop */}
                        <nav className="hidden lg:flex items-center space-x-1">
                            {pestañasPrincipales.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                                        isActive(link.href)
                                            ? 'bg-golden/20 text-golden border border-golden/30'
                                            : 'text-white-60 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <link.icon size={18} />
                                    {link.label}
                                </Link>
                            ))}

                            {(esAdmin || tieneAlgunPermiso) && (
                                <Link
                                    href="/administracion"
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                                        isAdminToolsActive
                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                            : 'text-white-60 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <Shield size={18} />
                                    Admin Tools
                                </Link>
                            )}
                        </nav>

                        {/* User Menu */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5 border border-white/10">
                                <span className="text-xl">{usuario.avatar || '👤'}</span>
                                <div className="hidden sm:block">
                                    <p className="text-sm font-medium text-white">{usuario.nombre}</p>
                                    <p className="text-xs text-white-40 capitalize">{usuario.rol}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors"
                            >
                                Salir
                            </button>

                            <button
                                onClick={() => setMenuAbierto(!menuAbierto)}
                                className="lg:hidden p-2 rounded-lg text-white-60 hover:text-white hover:bg-white/5 transition-all"
                            >
                                {menuAbierto ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Sub-menú Admin */}
            {(esAdmin || tieneAlgunPermiso) && isAdminToolsActive && adminSubPestañas.length > 0 && (
                <div className="bg-purple-500/10 border-b border-purple-500/20 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center space-x-1 py-2 overflow-x-auto">
                            <span className="text-xs font-medium text-purple-400 mr-2 flex items-center gap-1">
                                <Shield size={14} />
                                Admin:
                            </span>
                            {adminSubPestañas.map((link) => {
                                const isSubActive = pathname === link.href || pathname.startsWith(link.href)
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                            isSubActive
                                                ? 'bg-purple-500/30 text-purple-400 border border-purple-500/30'
                                                : 'text-purple-300/60 hover:text-purple-300 hover:bg-purple-500/10'
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

            {/* Breadcrumbs */}
            {pathname !== '/dashboard' && (
                <div className="bg-white/5 backdrop-blur-sm border-b border-white/5 py-2 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
                        <Link href="/comandas" className="text-white-30 hover:text-golden transition-colors">
                            🏠
                        </Link>
                        <span className="text-white-20">/</span>
                        <span className="text-white-60 font-medium capitalize">
                            {pathname.split('/').pop() || 'Inicio'}
                        </span>
                        <span className="ml-auto text-xs text-white-20">
                            {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            )}

            {/* Menú móvil */}
            {menuAbierto && (
                <div className="lg:hidden bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-2xl animate-fade-in-up">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <nav className="flex flex-col space-y-1">
                            {allLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMenuAbierto(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                        isActive(link.href)
                                            ? 'bg-golden/20 text-golden border border-golden/30'
                                            : 'text-white-60 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <link.icon size={18} />
                                    {link.label}
                                </Link>
                            ))}
                            <hr className="my-2 border-white/10" />
                            <button
                                onClick={() => {
                                    setMenuAbierto(false)
                                    handleLogout()
                                }}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                            >
                                <LogOut size={18} />
                                Salir
                            </button>
                        </nav>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in-up">
                {children}
            </main>

            {/* Botón volver arriba */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-6 right-6 bg-gradient-golden-fire text-white p-3 rounded-full shadow-lg hover:shadow-2xl transition-all hover:scale-110 z-50"
                title="Volver arriba"
            >
                🔥
            </button>
        </div>
    )
}