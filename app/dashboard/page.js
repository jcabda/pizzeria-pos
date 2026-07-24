'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'
import { RefreshCw } from 'lucide-react'
import { 
    LayoutDashboard, Users, Pizza, Package, 
    TrendingUp, TrendingDown, Clock, DollarSign,
    ShoppingBag, ChefHat, Utensils, Calendar,
    ArrowUp, ArrowDown, Flame, Sparkles
} from 'lucide-react'

export default function DashboardPage() {
    const [cargando, setCargando] = useState(true)
    const [usuario, setUsuario] = useState(null)
    const [stats, setStats] = useState({
        totalPedidos: 0,
        totalVentas: 0,
        pedidosHoy: 0,
        ventasHoy: 0,
        mesasOcupadas: 0,
        mesasTotales: 0,
        pedidosPendientes: 0,
        productosPopulares: []
    })

    useEffect(() => {
        const userData = localStorage.getItem('usuario')
        if (userData) {
            setUsuario(JSON.parse(userData))
        }
        cargarDashboard()
    }, [])

    const cargarDashboard = async () => {
        setCargando(true)
        try {
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

            // Pedidos hoy
            const hoy = new Date()
            hoy.setHours(0, 0, 0, 0)
            const { data: pedidosHoy } = await supabase
                .from('pedidos')
                .select('total')
                .neq('estado', 'cancelado')
                .gte('fecha', hoy.toISOString())

            const ventasHoy = pedidosHoy?.reduce((sum, p) => sum + (p.total || 0), 0) || 0

            // Mesas
            const { data: mesasData } = await supabase
                .from('mesas')
                .select('estado')
                .eq('activo', true)

            const mesasOcupadas = mesasData?.filter(m => m.estado === 'ocupada').length || 0
            const mesasTotales = mesasData?.length || 0

            // Pedidos pendientes
            const { count: pedidosPendientes } = await supabase
                .from('pedidos')
                .select('*', { count: 'exact', head: true })
                .in('estado', ['pendiente', 'preparando'])

            // Productos más populares
            const { data: populares } = await supabase
                .from('pedido_detalles')
                .select('nombre_producto, cantidad')
                .order('cantidad', { ascending: false })
                .limit(5)

            setStats({
                totalPedidos: totalPedidos || 0,
                totalVentas: totalVentas,
                pedidosHoy: pedidosHoy?.length || 0,
                ventasHoy: ventasHoy,
                mesasOcupadas: mesasOcupadas,
                mesasTotales: mesasTotales,
                pedidosPendientes: pedidosPendientes || 0,
                productosPopulares: populares || []
            })

        } catch (error) {
            console.error('Error cargando dashboard:', error)
        } finally {
            setCargando(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">
                            <span className="text-gradient-golden">Golden</span>
                            <span className="text-white"> on </span>
                            <span className="text-gradient-fire">Fire</span>
                            <span className="text-white/60"> - Dashboard</span>
                        </h2>
                        <p className="text-sm text-white/40">
                            {usuario ? `👋 Bienvenido, ${usuario.nombre}` : 'Panel de control'}
                        </p>
                    </div>
                    <button onClick={cargarDashboard} className="btn-secondary text-sm flex items-center gap-2">
                        <RefreshCw size={16} /> Actualizar
                    </button>
                </div>

                {cargando ? (
                    <div className="text-center py-12 text-white/40">
                        <div className="animate-pulse">
                            <div className="text-4xl mb-4">📊</div>
                            <p>Cargando dashboard...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="glass rounded-xl p-4 border-l-4 border-golden">
                                <p className="text-xs text-white/40 uppercase tracking-wider">Total Ventas</p>
                                <p className="text-2xl font-bold text-golden">{formatPrice(stats.totalVentas)}</p>
                                <p className="text-xs text-white/30 mt-1">Total de pedidos: {stats.totalPedidos}</p>
                            </div>
                            <div className="glass rounded-xl p-4 border-l-4 border-green-500">
                                <p className="text-xs text-white/40 uppercase tracking-wider">Ventas Hoy</p>
                                <p className="text-2xl font-bold text-green-400">{formatPrice(stats.ventasHoy)}</p>
                                <p className="text-xs text-white/30 mt-1">{stats.pedidosHoy} pedidos hoy</p>
                            </div>
                            <div className="glass rounded-xl p-4 border-l-4 border-blue-500">
                                <p className="text-xs text-white/40 uppercase tracking-wider">Mesas</p>
                                <p className="text-2xl font-bold text-white">{stats.mesasOcupadas} / {stats.mesasTotales}</p>
                                <p className="text-xs text-white/30 mt-1">Ocupadas / Totales</p>
                            </div>
                            <div className="glass rounded-xl p-4 border-l-4 border-yellow-500">
                                <p className="text-xs text-white/40 uppercase tracking-wider">Pendientes</p>
                                <p className="text-2xl font-bold text-yellow-400">{stats.pedidosPendientes}</p>
                                <p className="text-xs text-white/30 mt-1">Pedidos en cocina</p>
                            </div>
                        </div>

                        {/* Productos populares */}
                        <div className="glass rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                                <TrendingUp size={20} className="text-golden" />
                                Productos más vendidos
                            </h3>
                            {stats.productosPopulares.length === 0 ? (
                                <p className="text-white/40 text-sm">Sin datos de productos</p>
                            ) : (
                                <div className="space-y-3">
                                    {stats.productosPopulares.map((producto, index) => (
                                        <div key={index} className="flex items-center justify-between border-b border-white/5 pb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-golden">#{index + 1}</span>
                                                <span className="text-white">{producto.nombre_producto || 'Producto'}</span>
                                            </div>
                                            <span className="text-white/60 text-sm">{producto.cantidad}x vendidos</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}