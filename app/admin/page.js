'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { 
    Shield, Pizza, Package, FolderOpen, Users, 
    FileText, Ruler, Tag, Scale, Utensils, ChefHat,
    LayoutDashboard, Settings, Plus, Edit2, Trash2,
    RefreshCw, Search, X, Check, ArrowRight, 
    TrendingUp, Clock, Calendar, DollarSign,
    Home, ClipboardList, BarChart3
} from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
    const router = useRouter()
    const pathname = usePathname()
    const [usuario, setUsuario] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)
    const [stats, setStats] = useState({
        totalProductos: 0,
        totalUsuarios: 0,
        totalCategorias: 0,
        totalPedidos: 0,
        totalVentas: 0,
        mesasActivas: 0
    })

    useEffect(() => {
        const userData = localStorage.getItem('usuario')
        if (!userData) {
            router.push('/login')
            return
        }
        
        const usuario = JSON.parse(userData)
        if (usuario.rol !== 'admin') {
            router.push('/dashboard')
            return
        }
        
        setUsuario(usuario)
        cargarEstadisticas()
        setCargando(false)
    }, [router])

    const cargarEstadisticas = async () => {
        try {
            // Total productos
            const { count: totalProductos } = await supabase
                .from('productos_menu')
                .select('*', { count: 'exact', head: true })
                .eq('activo', true)

            // Total usuarios
            const { count: totalUsuarios } = await supabase
                .from('usuarios')
                .select('*', { count: 'exact', head: true })
                .eq('activo', true)

            // Total categorías
            const { count: totalCategorias } = await supabase
                .from('categorias')
                .select('*', { count: 'exact', head: true })
                .eq('activo', true)

            // Total pedidos
            const { count: totalPedidos } = await supabase
                .from('pedidos')
                .select('*', { count: 'exact', head: true })

            // Total ventas
            const { data: ventasData } = await supabase
                .from('pedidos')
                .select('total')
                .neq('estado', 'cancelado')

            const totalVentas = ventasData?.reduce((sum, p) => sum + (p.total || 0), 0) || 0

            // Mesas activas
            const { count: mesasActivas } = await supabase
                .from('mesas')
                .select('*', { count: 'exact', head: true })
                .eq('activo', true)

            setStats({
                totalProductos: totalProductos || 0,
                totalUsuarios: totalUsuarios || 0,
                totalCategorias: totalCategorias || 0,
                totalPedidos: totalPedidos || 0,
                totalVentas: totalVentas,
                mesasActivas: mesasActivas || 0
            })

        } catch (error) {
            console.error('Error cargando estadísticas:', error)
        }
    }

    const adminModules = [
        { 
            href: '/productos', 
            icon: Pizza, 
            label: 'Productos', 
            desc: 'Gestionar productos del menú',
            color: 'text-orange-400',
            border: 'border-orange-500/30',
            bg: 'bg-orange-500/10',
            iconBg: 'bg-orange-500/20',
            count: stats.totalProductos
        },
        { 
            href: '/inventario', 
            icon: Package, 
            label: 'Inventario', 
            desc: 'Control de ingredientes y stock',
            color: 'text-blue-400',
            border: 'border-blue-500/30',
            bg: 'bg-blue-500/10',
            iconBg: 'bg-blue-500/20',
            count: null
        },
        { 
            href: '/categorias', 
            icon: FolderOpen, 
            label: 'Categorías', 
            desc: 'Gestionar categorías de productos',
            color: 'text-purple-400',
            border: 'border-purple-500/30',
            bg: 'bg-purple-500/10',
            iconBg: 'bg-purple-500/20',
            count: stats.totalCategorias
        },
        { 
            href: '/usuarios', 
            icon: Users, 
            label: 'Usuarios', 
            desc: 'Gestionar empleados y permisos',
            color: 'text-green-400',
            border: 'border-green-500/30',
            bg: 'bg-green-500/10',
            iconBg: 'bg-green-500/20',
            count: stats.totalUsuarios
        },
        { 
            href: '/auditoria', 
            icon: FileText, 
            label: 'Auditoría', 
            desc: 'Ver historial de acciones del sistema',
            color: 'text-red-400',
            border: 'border-red-500/30',
            bg: 'bg-red-500/10',
            iconBg: 'bg-red-500/20',
            count: null
        },
        { 
            href: '/mesas', 
            icon: Utensils, 
            label: 'Mesas', 
            desc: 'Gestionar mesas del restaurante',
            color: 'text-yellow-400',
            border: 'border-yellow-500/30',
            bg: 'bg-yellow-500/10',
            iconBg: 'bg-yellow-500/20',
            count: stats.mesasActivas
        },
        { 
            href: '/admin/tamanios', 
            icon: Ruler, 
            label: 'Tamaños', 
            desc: 'Modificar tamaños de pizza (max_sabores)',
            color: 'text-indigo-400',
            border: 'border-indigo-500/30',
            bg: 'bg-indigo-500/10',
            iconBg: 'bg-indigo-500/20',
            count: null
        },
        { 
            href: '/admin/tipos', 
            icon: Tag, 
            label: 'Tipos', 
            desc: 'Gestionar tipos de productos',
            color: 'text-pink-400',
            border: 'border-pink-500/30',
            bg: 'bg-pink-500/10',
            iconBg: 'bg-pink-500/20',
            count: null
        },
        { 
            href: '/admin/unidades', 
            icon: Scale, 
            label: 'Unidades', 
            desc: 'Gestionar unidades de medida',
            color: 'text-teal-400',
            border: 'border-teal-500/30',
            bg: 'bg-teal-500/10',
            iconBg: 'bg-teal-500/20',
            count: null
        },
        { 
            href: '/cocina', 
            icon: ChefHat, 
            label: 'Cocina', 
            desc: 'Panel de cocina (con permisos)',
            color: 'text-amber-400',
            border: 'border-amber-500/30',
            bg: 'bg-amber-500/10',
            iconBg: 'bg-amber-500/20',
            count: null
        },
        { 
            href: '/dashboard', 
            icon: LayoutDashboard, 
            label: 'Dashboard', 
            desc: 'Volver al panel de control',
            color: 'text-gray-400',
            border: 'border-gray-500/30',
            bg: 'bg-gray-500/10',
            iconBg: 'bg-gray-500/20',
            count: null
        },
        { 
            href: '/estadisticas', 
            icon: BarChart3, 
            label: 'Estadísticas', 
            desc: 'Ver reportes y análisis de ventas',
            color: 'text-cyan-400',
            border: 'border-cyan-500/30',
            bg: 'bg-cyan-500/10',
            iconBg: 'bg-cyan-500/20',
            count: null
        },
    ]

    if (cargando) {
        return (
            <DashboardLayout>
                <div className="text-center py-12 text-white/40">
                    <div className="animate-pulse">
                        <div className="text-4xl mb-4">🛡️</div>
                        <p>Verificando permisos...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <div className="text-4xl mb-4">❌</div>
                    <p className="text-red-400">{error}</p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-golden/10 border border-golden/20">
                            <Shield size={32} className="text-golden" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">
                                <span className="text-gradient-golden">Golden</span>
                                <span className="text-white"> on </span>
                                <span className="text-gradient-fire">Fire</span>
                                <span className="text-white/60"> - Admin Tools</span>
                            </h2>
                            <p className="text-sm text-white/40">
                                {usuario ? `👋 Bienvenido, ${usuario.nombre} (${usuario.rol})` : 'Panel de administración'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button 
                            onClick={() => window.location.reload()} 
                            className="btn-secondary text-sm flex items-center gap-1"
                        >
                            <RefreshCw size={16} /> Actualizar
                        </button>
                        <Link 
                            href="/dashboard" 
                            className="btn-secondary text-sm flex items-center gap-1"
                        >
                            <Home size={16} /> Dashboard
                        </Link>
                    </div>
                </div>

                {/* Stats rápidos */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="glass rounded-xl p-3 text-center border border-white/10">
                        <p className="text-xs text-white/40 uppercase tracking-wider">Productos</p>
                        <p className="text-xl font-bold text-orange-400">{stats.totalProductos}</p>
                    </div>
                    <div className="glass rounded-xl p-3 text-center border border-white/10">
                        <p className="text-xs text-white/40 uppercase tracking-wider">Usuarios</p>
                        <p className="text-xl font-bold text-green-400">{stats.totalUsuarios}</p>
                    </div>
                    <div className="glass rounded-xl p-3 text-center border border-white/10">
                        <p className="text-xs text-white/40 uppercase tracking-wider">Categorías</p>
                        <p className="text-xl font-bold text-purple-400">{stats.totalCategorias}</p>
                    </div>
                    <div className="glass rounded-xl p-3 text-center border border-white/10">
                        <p className="text-xs text-white/40 uppercase tracking-wider">Pedidos</p>
                        <p className="text-xl font-bold text-blue-400">{stats.totalPedidos}</p>
                    </div>
                    <div className="glass rounded-xl p-3 text-center border border-white/10">
                        <p className="text-xs text-white/40 uppercase tracking-wider">Ventas</p>
                        <p className="text-xl font-bold text-golden">${stats.totalVentas.toLocaleString()}</p>
                    </div>
                    <div className="glass rounded-xl p-3 text-center border border-white/10">
                        <p className="text-xs text-white/40 uppercase tracking-wider">Mesas</p>
                        <p className="text-xl font-bold text-yellow-400">{stats.mesasActivas}</p>
                    </div>
                </div>

                {/* Panel de control rápido */}
                <div className="glass-golden rounded-xl p-4 border border-golden/20 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Settings size={18} className="text-golden" />
                        <p className="text-sm text-white/60">
                            <span className="text-golden font-medium">Panel de control:</span> 
                            {adminModules.length} módulos disponibles
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/30">
                        <span>🛡️ Admin v2.0</span>
                        <span>|</span>
                        <span className="text-golden/50">Golden on Fire 🔥</span>
                    </div>
                </div>

                {/* Grid de módulos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {adminModules.map((mod) => {
                        const Icon = mod.icon
                        return (
                            <Link
                                key={mod.href}
                                href={mod.href}
                                className={`glass rounded-xl p-5 border ${mod.border} hover:border-golden/40 hover:shadow-golden transition-all group hover:-translate-y-1`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl border ${mod.iconBg} ${mod.border}`}>
                                        <Icon size={22} className={mod.color} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-white text-sm truncate">{mod.label}</h3>
                                            {mod.count !== null && mod.count > 0 && (
                                                <span className="text-xs text-golden bg-golden/10 px-2 py-0.5 rounded-full">
                                                    {mod.count}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{mod.desc}</p>
                                        <span className="text-xs text-golden opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 mt-1">
                                            Gestionar <ArrowRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {/* Footer informativo */}
                <div className="glass-golden rounded-xl p-4 border border-golden/20 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Shield size={18} className="text-golden" />
                        <p className="text-sm text-golden/80">
                            Estas herramientas solo están disponibles para administradores
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/30">
                        <span>🛡️ Admin Tools v2.0</span>
                        <span>|</span>
                        <span>{adminModules.length} módulos</span>
                        <span>|</span>
                        <span className="text-golden/50">Golden on Fire 🔥</span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}