'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'
import { Calendar, Users, TrendingUp, Coffee, Pizza, Clock, Filter, X } from 'lucide-react'

export default function EstadisticasPage() {
    const [cargando, setCargando] = useState(true)
    const [usuario, setUsuario] = useState(null)
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
    const [historial, setHistorial] = useState([])
    const [filtroFecha, setFiltroFecha] = useState('mes')
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')
    const [mostrarHistorial, setMostrarHistorial] = useState(false)

    useEffect(() => {
        const userData = localStorage.getItem('usuario')
        if (userData) {
            setUsuario(JSON.parse(userData))
        }
        cargarEstadisticas()
        cargarHistorial()
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

            // ✅ FILTRO POR USUARIO (si no es admin)
            let queryPedidos = supabase
                .from('pedidos')
                .select('*', { count: 'exact', head: true })

            if (usuario && usuario.rol !== 'admin') {
                queryPedidos = queryPedidos.eq('empleado_id', usuario.id)
            }

            const { count: totalPedidos } = await queryPedidos

            // Ventas con filtro de usuario
            let queryVentas = supabase
                .from('pedidos')
                .select('total')
                .neq('estado', 'cancelado')
                .gte('fecha', fechaInicioQuery.toISOString())
                .lte('fecha', fechaFinQuery.toISOString())

            if (usuario && usuario.rol !== 'admin') {
                queryVentas = queryVentas.eq('empleado_id', usuario.id)
            }

            const { data: ventasData } = await queryVentas

            // Pedidos hoy con filtro de usuario
            let queryHoy = supabase
                .from('pedidos')
                .select('total')
                .neq('estado', 'cancelado')
                .gte('fecha', fechaInicioQuery.toISOString())

            if (usuario && usuario.rol !== 'admin') {
                queryHoy = queryHoy.eq('empleado_id', usuario.id)
            }

            const { data: pedidosHoy } = await queryHoy

            // Detalles de pizzas con filtro de usuario
            let queryPizzas = supabase
                .from('pedido_detalles')
                .select(`
                    cantidad,
                    tamanio_nombre,
                    nombre_producto,
                    pedidos (fecha, empleado_id)
                `)
                .not('tamanio_nombre', 'is', null)
                .gte('pedidos.fecha', fechaInicioQuery.toISOString())
                .lte('pedidos.fecha', fechaFinQuery.toISOString())

            if (usuario && usuario.rol !== 'admin') {
                queryPizzas = queryPizzas.eq('pedidos.empleado_id', usuario.id)
            }

            const { data: detallesPizzas } = await queryPizzas

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

    // ✅ NUEVO: Cargar historial de pedidos del usuario
    const cargarHistorial = async () => {
        try {
            let query = supabase
                .from('pedidos')
                .select(`
                    *,
                    usuarios (nombre, avatar)
                `)
                .order('fecha', { ascending: false })
                .limit(50)

            // Si no es admin, solo sus pedidos
            if (usuario && usuario.rol !== 'admin') {
                query = query.eq('empleado_id', usuario.id)
            }

            const { data } = await query
            setHistorial(data || [])
        } catch (error) {
            console.error('Error cargando historial:', error)
        }
    }

    const getEstadoColor = (estado) => {
        const colores = {
            pendiente: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
            preparando: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
            listo: 'border-green-500/30 bg-green-500/10 text-green-400',
            entregado: 'border-gray-500/30 bg-gray-500/10 text-gray-400',
            cancelado: 'border-red-500/30 bg-red-500/10 text-red-400'
        }
        return colores[estado] || 'border-white/10 bg-white/5 text-white-40'
    }

    const getEstadoEmoji = (estado) => {
        const emojis = {
            pendiente: '⏳',
            preparando: '🔪',
            listo: '✅',
            entregado: '📦',
            cancelado: '❌'
        }
        return emojis[estado] || '❓'
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
                            <span className="text-white-60"> - Estadísticas</span>
                        </h2>
                        <p className="text-sm text-white-40">
                            {usuario?.rol === 'admin' ? '📊 Todas las ventas del sistema' : `📊 Mis ventas - ${usuario?.nombre || ''}`}
                        </p>
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
                                <span className="text-white-40">-</span>
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
                        <button
                            onClick={() => setMostrarHistorial(!mostrarHistorial)}
                            className={`btn-secondary text-sm flex items-center gap-2 ${mostrarHistorial ? 'border-golden text-golden' : ''}`}
                        >
                            <Clock size={16} />
                            {mostrarHistorial ? 'Ocultar historial' : 'Ver historial'}
                        </button>
                    </div>
                </div>

                {cargando ? (
                    <div className="text-center py-12 text-white-40">
                        <div className="animate-pulse">
                            <div className="text-4xl mb-4">📊</div>
                            <p>Cargando estadísticas...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="glass rounded-xl p-4 border-l-4 border-blue-500">
                                <p className="text-xs text-white-40 uppercase tracking-wider">Total Pedidos</p>
                                <p className="text-2xl font-bold text-white">{stats.totalPedidos}</p>
                            </div>
                            <div className="glass rounded-xl p-4 border-l-4 border-green-500">
                                <p className="text-xs text-white-40 uppercase tracking-wider">Total Ventas</p>
                                <p className="text-2xl font-bold text-golden">{formatPrice(stats.totalVentas)}</p>
                            </div>
                            <div className="glass rounded-xl p-4 border-l-4 border-yellow-500">
                                <p className="text-xs text-white-40 uppercase tracking-wider">Pedidos Hoy</p>
                                <p className="text-2xl font-bold text-white">{stats.pedidosHoy}</p>
                            </div>
                            <div className="glass rounded-xl p-4 border-l-4 border-purple-500">
                                <p className="text-xs text-white-40 uppercase tracking-wider">Ventas Hoy</p>
                                <p className="text-2xl font-bold text-golden">{formatPrice(stats.ventasHoy)}</p>
                            </div>
                        </div>

                        {/* Pizzas vendidas */}
                        <div className="glass rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-semibold mb-4 text-white">🍕 Pizzas vendidas por categoría</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-orange-500/10 rounded-xl p-4 text-center border border-orange-500/20">
                                    <p className="text-3xl font-bold text-orange-400">{stats.pizzasPersonal}</p>
                                    <p className="text-sm text-white-40">Personal</p>
                                </div>
                                <div className="bg-blue-500/10 rounded-xl p-4 text-center border border-blue-500/20">
                                    <p className="text-3xl font-bold text-blue-400">{stats.pizzasMediana}</p>
                                    <p className="text-sm text-white-40">Mediana</p>
                                </div>
                                <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
                                    <p className="text-3xl font-bold text-green-400">{stats.pizzasFamiliar}</p>
                                    <p className="text-sm text-white-40">Familiar</p>
                                </div>
                                <div className="bg-purple-500/10 rounded-xl p-4 text-center border border-purple-500/20">
                                    <p className="text-3xl font-bold text-purple-400">{stats.pizzasPorcion}</p>
                                    <p className="text-sm text-white-40">Porciones</p>
                                </div>
                            </div>
                        </div>

                        {/* Resumen */}
                        <div className="glass rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-semibold mb-4 text-white">📊 Resumen de ventas</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-xl p-4">
                                    <p className="text-sm text-white-40">Total de pedidos en el período</p>
                                    <p className="text-2xl font-bold text-white">{stats.totalPedidos}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4">
                                    <p className="text-sm text-white-40">Total de ventas en el período</p>
                                    <p className="text-2xl font-bold text-golden">{formatPrice(stats.totalVentas)}</p>
                                </div>
                            </div>
                        </div>

                        {/* ✅ NUEVO: Historial de pedidos */}
                        {mostrarHistorial && (
                            <div className="glass-golden rounded-xl p-6 border border-golden/30 animate-fade-in-up">
                                <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                                    <Clock size={20} className="text-golden" />
                                    {usuario?.rol === 'admin' ? '📋 Todos los pedidos' : '📋 Mis pedidos'}
                                    <span className="text-xs text-white-40 font-normal">
                                        ({historial.length} registros)
                                    </span>
                                </h3>
                                
                                {historial.length === 0 ? (
                                    <p className="text-center text-white-40 py-4">No hay pedidos registrados</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="border-b border-white/10">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-white-40 uppercase">Fecha</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-white-40 uppercase">Cliente</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-white-40 uppercase">Empleado</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-white-40 uppercase">Mesa</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-white-40 uppercase">Total</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-white-40 uppercase">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {historial.map((pedido) => (
                                                    <tr key={pedido.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-2 text-sm text-white-60">
                                                            {new Date(pedido.fecha).toLocaleString('es-ES', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-white">{pedido.cliente || 'Cliente'}</td>
                                                        <td className="px-4 py-2 text-sm text-white-60">
                                                            {pedido.usuarios?.nombre || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-white-60">
                                                            {pedido.mesa_id ? `Mesa ${pedido.mesa_numero || 'N/A'}` : 'Domicilio'}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm font-bold text-golden">
                                                            {formatPrice(pedido.total)}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <span className={`px-2 py-1 rounded-full text-xs border ${getEstadoColor(pedido.estado)}`}>
                                                                {getEstadoEmoji(pedido.estado)} {pedido.estado}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}