'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'
import { Clock, CheckCircle, X, Bell, BellRing, ChefHat } from 'lucide-react'

export default function CocinaPage() {
    const [pedidos, setPedidos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [filtro, setFiltro] = useState('activos')
    const [tiempos, setTiempos] = useState({})
    const [nuevosPedidos, setNuevosPedidos] = useState([])

    useEffect(() => {
        cargarPedidos()
        const interval = setInterval(() => {
            cargarPedidos()
            actualizarTiempos()
        }, 5000)
        return () => clearInterval(interval)
    }, [filtro])

    const cargarPedidos = async () => {
        try {
            // Cargar pedidos de la tabla pedidos
            const { data, error } = await supabase
                .from('pedidos')
                .select(`
                    *,
                    usuarios (nombre, avatar)
                `)
                .order('fecha', { ascending: false })

            if (error) throw error

            // También cargar comandas con estado "en_cocina"
            const { data: comandasData } = await supabase
                .from('comandas')
                .select(`
                    *,
                    mesas (numero),
                    usuarios (nombre, avatar)
                `)
                .eq('estado_pedido', 'en_cocina')

            // Combinar pedidos y comandas
            const pedidosFormateados = data?.map(p => ({
                ...p,
                es_comanda: false,
                mesa_numero: null
            })) || []

            const comandasFormateadas = comandasData?.map(c => ({
                id: c.id,
                empleado_id: c.mesero_id,
                cliente: c.cliente_nombre,
                total: c.subtotal,
                estado: 'preparando',
                fecha: c.created_at,
                tiempos: { preparando_inicio: c.created_at },
                usuarios: c.usuarios,
                es_comanda: true,
                mesa_numero: c.mesas?.numero
            })) || []

            const todos = [...pedidosFormateados, ...comandasFormateadas]

            // Aplicar filtro
            let filtrados = todos
            if (filtro === 'activos') {
                filtrados = todos.filter(p => 
                    ['pendiente', 'preparando'].includes(p.estado)
                )
            } else if (filtro === 'completados') {
                filtrados = todos.filter(p => 
                    ['entregado'].includes(p.estado)
                )
            } else if (filtro !== 'todos') {
                filtrados = todos.filter(p => p.estado === filtro)
            }

            setPedidos(filtrados)

        } catch (error) {
            console.error('Error cargando pedidos:', error)
        } finally {
            setCargando(false)
        }
    }

    const actualizarTiempos = () => {
        const ahora = new Date()
        const nuevosTiempos = {}
        pedidos.forEach(p => {
            if (p.tiempos?.preparando_inicio) {
                const inicio = new Date(p.tiempos.preparando_inicio)
                nuevosTiempos[p.id] = Math.floor((ahora - inicio) / 1000)
            } else {
                nuevosTiempos[p.id] = 0
            }
        })
        setTiempos(nuevosTiempos)
    }

    const actualizarEstado = async (pedidoId, nuevoEstado, esComanda) => {
        try {
            if (esComanda) {
                // Actualizar comanda
                await supabase
                    .from('comandas')
                    .update({ 
                        estado_pedido: nuevoEstado === 'entregado' ? 'entregado' : nuevoEstado
                    })
                    .eq('id', pedidoId)
            } else {
                // Actualizar pedido normal
                await supabase
                    .from('pedidos')
                    .update({ estado: nuevoEstado })
                    .eq('id', pedidoId)
            }
            cargarPedidos()
        } catch (error) {
            console.error('Error actualizando estado:', error)
        }
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

    const getEstadoColor = (estado) => {
        const colores = {
            pendiente: 'border-yellow-500 bg-yellow-50',
            preparando: 'border-blue-500 bg-blue-50',
            listo: 'border-green-500 bg-green-50',
            entregado: 'border-gray-500 bg-gray-50',
            cancelado: 'border-red-500 bg-red-50'
        }
        return colores[estado] || 'border-gray-300 bg-gray-50'
    }

    const formatearTiempo = (segundos) => {
        if (!segundos) return '0s'
        const mins = Math.floor(segundos / 60)
        const secs = segundos % 60
        if (mins > 0) return `${mins}m ${secs}s`
        return `${secs}s`
    }

    const getTiempoColor = (segundos) => {
        if (!segundos || segundos < 60) return 'text-green-600'
        if (segundos < 180) return 'text-yellow-600'
        if (segundos < 300) return 'text-orange-600'
        return 'text-red-600 font-bold animate-pulse'
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold">👨‍🍳 Panel de Cocina</h2>
                        {nuevosPedidos.length > 0 && (
                            <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                                <BellRing size={16} />
                                {nuevosPedidos.length} nuevo(s)
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock size={14} className="text-green-500 animate-pulse" />
                            Tiempo real
                        </span>
                        <button onClick={cargarPedidos} className="btn-secondary text-sm py-1 px-3">
                            🔄 Actualizar
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFiltro('activos')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                            filtro === 'activos'
                                ? 'bg-orange-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        🔥 Activos
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            filtro === 'activos' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                            {pedidos.filter(p => ['pendiente', 'preparando'].includes(p.estado)).length}
                        </span>
                    </button>
                    <button
                        onClick={() => setFiltro('todos')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                            filtro === 'todos'
                                ? 'bg-orange-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        📋 Todos
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            filtro === 'todos' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                            {pedidos.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setFiltro('completados')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                            filtro === 'completados'
                                ? 'bg-orange-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        ✅ Completados
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            filtro === 'completados' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                            {pedidos.filter(p => p.estado === 'entregado').length}
                        </span>
                    </button>
                </div>

                {cargando ? (
                    <div className="text-center py-12 text-gray-500">Cargando pedidos...</div>
                ) : pedidos.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-6xl mb-4">🍕</p>
                        <p className="text-lg font-medium">No hay pedidos activos</p>
                        <p className="text-sm text-gray-400">Los pedidos aparecerán aquí</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {pedidos.map((pedido) => {
                            const tiempoActual = tiempos[pedido.id] || 0
                            const tiempoColor = getTiempoColor(tiempoActual)
                            const esActivo = ['pendiente', 'preparando'].includes(pedido.estado)

                            return (
                                <div
                                    key={pedido.id}
                                    className={`bg-white rounded-xl shadow-md p-4 border-l-4 ${getEstadoColor(pedido.estado)} hover:shadow-lg transition-shadow ${!esActivo ? 'opacity-75' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-mono text-sm font-bold text-gray-600">
                                                #{pedido.id.slice(0, 8)}
                                                {pedido.es_comanda && (
                                                    <span className="text-xs bg-purple-100 text-purple-700 ml-1 px-1.5 py-0.5 rounded">
                                                        Mesa {pedido.mesa_numero}
                                                    </span>
                                                )}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Clock size={14} className={tiempoColor} />
                                                <span className={`text-sm font-mono ${tiempoColor}`}>
                                                    {formatearTiempo(tiempoActual)}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-2xl">
                                            {getEstadoEmoji(pedido.estado)}
                                        </span>
                                    </div>

                                    <div className="mb-3 space-y-1">
                                        <p className="text-sm text-gray-600">
                                            👨‍🍳 {pedido.usuarios?.nombre || 'Sin empleado'}
                                        </p>
                                        <p className="text-sm font-medium text-gray-700">
                                            👤 {pedido.cliente || 'Cliente general'}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-3 mb-3 max-h-20 overflow-y-auto">
                                        <p className="text-xs font-medium text-gray-500 mb-1">📦 Items:</p>
                                        <p className="text-sm text-gray-600">
                                            {pedido.es_comanda ? 'Comanda de mesa' : 'Pedido regular'}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Total: {formatPrice(pedido.total)}
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                        <span className="font-bold text-lg text-orange-600">
                                            {formatPrice(pedido.total)}
                                        </span>
                                        <div className="flex gap-1 flex-wrap justify-end">
                                            {pedido.estado === 'pendiente' && (
                                                <button
                                                    onClick={() => actualizarEstado(pedido.id, 'preparando', pedido.es_comanda)}
                                                    className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                                                >
                                                    🔪 Cocinar
                                                </button>
                                            )}
                                            {pedido.estado === 'preparando' && (
                                                <button
                                                    onClick={() => actualizarEstado(pedido.id, 'listo', pedido.es_comanda)}
                                                    className="bg-green-600 text-white text-sm px-3 py-1 rounded hover:bg-green-700 transition-colors"
                                                >
                                                    ✅ Listo
                                                </button>
                                            )}
                                            {pedido.estado === 'listo' && (
                                                <button
                                                    onClick={() => actualizarEstado(pedido.id, 'entregado', pedido.es_comanda)}
                                                    className="bg-purple-600 text-white text-sm px-3 py-1 rounded hover:bg-purple-700 transition-colors"
                                                >
                                                    📦 Entregar
                                                </button>
                                            )}
                                            {pedido.estado === 'entregado' && (
                                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                    <CheckCircle size={14} /> Completado
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}