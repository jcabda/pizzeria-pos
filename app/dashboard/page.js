'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalPedidos: 0,
        totalProductos: 0,
        pedidosPendientes: 0,
        totalVentas: 0,
        pedidosHoy: 0,
        ingredientesCriticos: 0
    })
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        try {
            const hoy = new Date()
            hoy.setHours(0, 0, 0, 0)

            const { count: totalPedidos } = await supabase
                .from('pedidos')
                .select('*', { count: 'exact', head: true })

            const { count: totalProductos } = await supabase
                .from('productos_menu')
                .select('*', { count: 'exact', head: true })
                .eq('activo', true)

            const { count: pedidosPendientes } = await supabase
                .from('pedidos')
                .select('*', { count: 'exact', head: true })
                .eq('estado', 'pendiente')

            const { data: ventas } = await supabase
                .from('pedidos')
                .select('total')
                .neq('estado', 'cancelado')

            const { count: pedidosHoy } = await supabase
                .from('pedidos')
                .select('*', { count: 'exact', head: true })
                .gte('fecha', hoy.toISOString())

            const { count: ingredientesCriticos } = await supabase
                .from('ingredientes')
                .select('*', { count: 'exact', head: true })
                .lt('stock_actual', 'stock_minimo')

            const totalVentas = ventas?.reduce((sum, p) => sum + (p.total || 0), 0) || 0

            setStats({
                totalPedidos: totalPedidos || 0,
                totalProductos: totalProductos || 0,
                pedidosPendientes: pedidosPendientes || 0,
                totalVentas: totalVentas,
                pedidosHoy: pedidosHoy || 0,
                ingredientesCriticos: ingredientesCriticos || 0
            })
        } catch (error) {
            console.error('Error cargando datos:', error)
        } finally {
            setCargando(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">📊 Panel de Control</h2>

                {cargando ? (
                    <div className="text-center py-12 text-gray-400">Cargando estadísticas...</div>
                ) : (
                    <>
                        {/* 🔹 TARJETAS RESPONSIVE */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            <Link href="/pedidos" className="block group">
                                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 group-hover:shadow-md group-hover:border-orange-200 transition-all">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="bg-blue-100 rounded-xl p-2.5 sm:p-3 text-2xl sm:text-3xl">📋</div>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm text-gray-500 truncate">Total Pedidos</p>
                                            <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.totalPedidos}</p>
                                            <p className="text-[10px] sm:text-xs text-orange-500 group-hover:underline truncate">Ver pedidos →</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/cocina" className="block group">
                                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 group-hover:shadow-md group-hover:border-orange-200 transition-all">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="bg-yellow-100 rounded-xl p-2.5 sm:p-3 text-2xl sm:text-3xl">⏳</div>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm text-gray-500 truncate">Pendientes</p>
                                            <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.pedidosPendientes}</p>
                                            <p className="text-[10px] sm:text-xs text-orange-500 group-hover:underline truncate">Ver en cocina →</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/inventario" className="block group">
                                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 group-hover:shadow-md group-hover:border-orange-200 transition-all">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="bg-red-100 rounded-xl p-2.5 sm:p-3 text-2xl sm:text-3xl">⚠️</div>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm text-gray-500 truncate">Stock Crítico</p>
                                            <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.ingredientesCriticos}</p>
                                            <p className="text-[10px] sm:text-xs text-orange-500 group-hover:underline truncate">Ver inventario →</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/auditoria" className="block group">
                                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 group-hover:shadow-md group-hover:border-orange-200 transition-all">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="bg-green-100 rounded-xl p-2.5 sm:p-3 text-2xl sm:text-3xl">💰</div>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm text-gray-500 truncate">Ventas Totales</p>
                                            <p className="text-lg sm:text-2xl font-bold text-gray-800">${stats.totalVentas.toFixed(2)}</p>
                                            <p className="text-[10px] sm:text-xs text-orange-500 group-hover:underline truncate">Ver auditoría →</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* 🔹 ACCESOS RÁPIDOS - RESPONSIVE */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Link href="/pedidos" className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 sm:p-6 text-white hover:shadow-lg hover:scale-[1.02] transition-all">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <span className="text-3xl sm:text-4xl">📝</span>
                                    <div>
                                        <h4 className="font-bold text-base sm:text-lg">Tomar Pedido</h4>
                                        <p className="text-xs sm:text-sm opacity-90">Nuevo pedido para cliente</p>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/cocina" className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white hover:shadow-lg hover:scale-[1.02] transition-all">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <span className="text-3xl sm:text-4xl">👨‍🍳</span>
                                    <div>
                                        <h4 className="font-bold text-base sm:text-lg">Cocina</h4>
                                        <p className="text-xs sm:text-sm opacity-90">Ver pedidos activos</p>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/inventario" className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white hover:shadow-lg hover:scale-[1.02] transition-all">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <span className="text-3xl sm:text-4xl">🧂</span>
                                    <div>
                                        <h4 className="font-bold text-base sm:text-lg">Inventario</h4>
                                        <p className="text-xs sm:text-sm opacity-90">Gestionar ingredientes</p>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* 🔹 PEDIDOS DEL DÍA - RESPONSIVE */}
                        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <span className="text-2xl sm:text-3xl">📆</span>
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-500">Pedidos de hoy</p>
                                    <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.pedidosHoy}</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}