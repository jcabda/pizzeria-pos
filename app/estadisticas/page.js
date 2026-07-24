'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'

export default function EstadisticasPage() {
    const [cargando, setCargando] = useState(true)
    const [stats, setStats] = useState({
        totalPedidos: 0,
        totalVentas: 0,
        pedidosHoy: 0,
        ventasHoy: 0,
        pizzasPersonal: 0,
        pizzasFamiliar: 0,
        pizzasMediana: 0,
        pizzasPorcion: 0,
    })
    const [filtroFecha, setFiltroFecha] = useState('mes')
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')

    useEffect(() => {
        cargarEstadisticas()
    }, [filtroFecha, fechaInicio, fechaFin])

    const cargarEstadisticas = async () => {
        try {
            setCargando(true)
            
            let fechaInicioQuery = new Date()
            let fechaFinQuery = new Date()

            switch(filtroFecha) {
                case 'dia':
                    fechaInicioQuery.setHours(0, 0, 0, 0)
                    fechaFinQuery.setHours(23, 59, 59, 999)
                    break
                case 'mes':
                    fechaInicioQuery = new Date(fechaInicioQuery.getFullYear(), fechaInicioQuery.getMonth(), 1)
                    fechaFinQuery = new Date(fechaInicioQuery.getFullYear(), fechaInicioQuery.getMonth() + 1, 0)
                    fechaFinQuery.setHours(23, 59, 59, 999)
                    break
                case 'ano':
                    fechaInicioQuery = new Date(fechaInicioQuery.getFullYear(), 0, 1)
                    fechaFinQuery = new Date(fechaInicioQuery.getFullYear(), 11, 31)
                    fechaFinQuery.setHours(23, 59, 59, 999)
                    break
                default:
                    break
            }

            if (fechaInicio) {
                fechaInicioQuery = new Date(fechaInicio)
                fechaInicioQuery.setHours(0, 0, 0, 0)
            }
            if (fechaFin) {
                fechaFinQuery = new Date(fechaFin)
                fechaFinQuery.setHours(23, 59, 59, 999)
            }

            const { count: totalPedidos } = await supabase
                .from('pedidos')
                .select('*', { count: 'exact', head: true })

            const { data: ventasData } = await supabase
                .from('pedidos')
                .select('total')
                .neq('estado', 'cancelado')
                .gte('fecha', fechaInicioQuery.toISOString())
                .lte('fecha', fechaFinQuery.toISOString())

            const { data: pedidosHoy } = await supabase
                .from('pedidos')
                .select('total')
                .neq('estado', 'cancelado')
                .gte('fecha', fechaInicioQuery.toISOString())

            const { data: detallesPizzas } = await supabase
                .from('pedido_detalles')
                .select(`
                    cantidad,
                    tamanio_nombre,
                    nombre_producto,
                    pedidos (fecha)
                `)
                .not('tamanio_nombre', 'is', null)
                .gte('pedidos.fecha', fechaInicioQuery.toISOString())
                .lte('pedidos.fecha', fechaFinQuery.toISOString())

            let pizzasPersonal = 0
            let pizzasFamiliar = 0
            let pizzasMediana = 0
            let pizzasPorcion = 0

            if (detallesPizzas) {
                detallesPizzas.forEach(d => {
                    const nombre = d.nombre_producto || ''
                    const cantidad = d.cantidad || 1
                    if (nombre.includes('Personal') || d.tamanio_nombre === 'Pequeña') {
                        pizzasPersonal += cantidad
                    } else if (nombre.includes('Familiar') || d.tamanio_nombre === 'Grande') {
                        pizzasFamiliar += cantidad
                    } else if (d.tamanio_nombre === 'Mediana') {
                        pizzasMediana += cantidad
                    } else if (d.es_porcion) {
                        pizzasPorcion += cantidad
                    }
                })
            }

            const totalVentas = ventasData?.reduce((sum, p) => sum + (p.total || 0), 0) || 0
            const ventasHoyTotal = pedidosHoy?.reduce((sum, p) => sum + (p.total || 0), 0) || 0

            setStats({
                totalPedidos: totalPedidos || 0,
                totalVentas: totalVentas,
                pedidosHoy: pedidosHoy?.length || 0,
                ventasHoy: ventasHoyTotal,
                pizzasPersonal,
                pizzasFamiliar,
                pizzasMediana,
                pizzasPorcion,
            })
        } catch (error) {
            console.error('Error cargando estadísticas:', error)
        } finally {
            setCargando(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">📊 Estadísticas</h2>
                        <p className="text-sm text-gray-500">Análisis de ventas y pedidos</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={filtroFecha}
                            onChange={(e) => setFiltroFecha(e.target.value)}
                            className="input-field w-36 text-sm"
                        >
                            <option value="dia">📅 Hoy</option>
                            <option value="mes">📆 Este mes</option>
                            <option value="ano">📅 Este año</option>
                            <option value="personalizado">📅 Personalizado</option>
                        </select>
                        {filtroFecha === 'personalizado' && (
                            <>
                                <input
                                    type="date"
                                    value={fechaInicio}
                                    onChange={(e) => setFechaInicio(e.target.value)}
                                    className="input-field w-36 text-sm"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="date"
                                    value={fechaFin}
                                    onChange={(e) => setFechaFin(e.target.value)}
                                    className="input-field w-36 text-sm"
                                />
                            </>
                        )}
                        <button onClick={() => window.location.reload()} className="btn-secondary text-sm">
                            🔄 Actualizar
                        </button>
                    </div>
                </div>

                {cargando ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="animate-pulse">
                            <div className="text-4xl mb-4">📊</div>
                            <p>Cargando estadísticas...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Total Pedidos</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.totalPedidos}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Total Ventas</p>
                                <p className="text-2xl font-bold text-gray-800">{formatPrice(stats.totalVentas)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Pedidos Hoy</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.pedidosHoy}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Ventas Hoy</p>
                                <p className="text-2xl font-bold text-gray-800">{formatPrice(stats.ventasHoy)}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4">🍕 Pizzas vendidas por categoría</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-orange-50 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-orange-600">{stats.pizzasPersonal}</p>
                                    <p className="text-sm text-gray-500">Personal</p>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-blue-600">{stats.pizzasMediana}</p>
                                    <p className="text-sm text-gray-500">Mediana</p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-green-600">{stats.pizzasFamiliar}</p>
                                    <p className="text-sm text-gray-500">Familiar</p>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-purple-600">{stats.pizzasPorcion}</p>
                                    <p className="text-sm text-gray-500">Porciones</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4">📊 Resumen de ventas</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-sm text-gray-500">Total de pedidos en el período</p>
                                    <p className="text-2xl font-bold text-gray-800">{stats.totalPedidos}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-sm text-gray-500">Total de ventas en el período</p>
                                    <p className="text-2xl font-bold text-gray-800">{formatPrice(stats.totalVentas)}</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}