'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'
import { Clock, CheckCircle, X, Bell, BellRing, ChefHat, Filter, List, Check } from 'lucide-react'

export default function CocinaPage() {
    const [pedidos, setPedidos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [filtro, setFiltro] = useState('activos')
    const [tiempos, setTiempos] = useState({})
    const [nuevosPedidos, setNuevosPedidos] = useState([])
    const [pedidosVistos, setPedidosVistos] = useState(new Set())

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

            // Cargar items de comandas
            const comandasConItems = await Promise.all(
                (comandasData || []).map(async (c) => {
                    const { data: items } = await supabase
                        .from('comanda_items')
                        .select('*')
                        .eq('comanda_id', c.id)
                        .eq('enviado_a_cocina', true)
                    return { ...c, items: items || [] }
                })
            )

            // Combinar pedidos y comandas
            const pedidosFormateados = data?.map(p => ({
                ...p,
                es_comanda: false,
                mesa_numero: null,
                items: p.items || []
            })) || []

            const comandasFormateadas = comandasConItems.map(c => ({
                id: c.id,
                empleado_id: c.mesero_id,
                cliente: c.cliente_nombre,
                total: c.subtotal,
                estado: 'preparando',
                fecha: c.created_at,
                tiempos: { preparando_inicio: c.created_at },
                usuarios: c.usuarios,
                es_comanda: true,
                mesa_numero: c.mesas?.numero,
                items: c.items || []
            }))

            const todos = [...pedidosFormateados, ...comandasFormateadas]

            // Detectar nuevos pedidos
            const nuevosIds = todos
                .filter(p => ['pendiente', 'preparando'].includes(p.estado))
                .map(p => p.id)
            
            const nuevos = nuevosIds.filter(id => !pedidosVistos.has(id))
            if (nuevos.length > 0) {
                setNuevosPedidos(prev => [...prev, ...nuevos])
                nuevos.forEach(id => pedidosVistos.add(id))
            }

            // Aplicar filtro
            let filtrados = todos
            if (filtro === 'activos') {
                filtrados = todos.filter(p => 
                    ['pendiente', 'preparando'].includes(p.estado)
                )
            } else if (filtro === 'completados') {
                filtrados = todos.filter(p => 
                    ['entregado', 'cancelado'].includes(p.estado)
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
                await supabase
                    .from('comandas')
                    .update({ 
                        estado_pedido: nuevoEstado === 'entregado' ? 'entregado' : nuevoEstado
                    })
                    .eq('id', pedidoId)
            } else {
                await supabase
                    .from('pedidos')
                    .update({ estado: nuevoEstado })
                    .eq('id', pedidoId)
            }
            // Marcar como visto al cambiar estado
            pedidosVistos.add(pedidoId)
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
            pendiente: 'border-yellow-500/30 bg-yellow-500/10',
            preparando: 'border-blue-500/30 bg-blue-500/10',
            listo: 'border-green-500/30 bg-green-500/10',
            entregado: 'border-gray-500/30 bg-gray-500/10',
            cancelado: 'border-red-500/30 bg-red-500/10'
        }
        return colores[estado] || 'border-white/10 bg-white/5'
    }

    const getEstadoText = (estado) => {
        const textos = {
            pendiente: 'text-yellow-400',
            preparando: 'text-blue-400',
            listo: 'text-green-400',
            entregado: 'text-gray-400',
            cancelado: 'text-red-400'
        }
        return textos[estado] || 'text-white-40'
    }

    const formatearTiempo = (segundos) => {
        if (!segundos) return '0s'
        const mins = Math.floor(segundos / 60)
        const secs = segundos % 60
        if (mins > 0) return `${mins}m ${secs}s`
        return `${secs}s`
    }

    const getTiempoColor = (segundos) => {
        if (!segundos || segundos < 60) return 'text-green-400'
        if (segundos < 180) return 'text-yellow-400'
        if (segundos < 300) return 'text-orange-400'
        return 'text-red-400 font-bold animate-pulse'
    }

    // ✅ NUEVO: Obtener contadores
    const getContadores = () => {
        const activos = pedidos.filter(p => ['pendiente', 'preparando'].includes(p.estado)).length
        const total = pedidos.length
        const completados = pedidos.filter(p => ['entregado', 'cancelado'].includes(p.estado)).length
        return { activos, total, completados }
    }

    const contadores = getContadores()

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold">
                            <span className="text-gradient-golden">Golden</span>
                            <span className="text-white"> on </span>
                            <span className="text-gradient-fire">Fire</span>
                            <span className="text-white-60"> - Cocina</span>
                        </h2>
                        {nuevosPedidos.length > 0 && (
                            <span className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium border border-red-500/30 animate-pulse">
                                <BellRing size={16} />
                                {nuevosPedidos.length} nuevo(s)
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm text-white-40 flex items-center gap-1">
                            <Clock size={14} className="text-green-400 animate-pulse" />
                            Tiempo real
                        </span>
                        <button onClick={cargarPedidos} className="btn-secondary text-sm py-1 px-3">
                            🔄 Actualizar
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFiltro('activos')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                            filtro === 'activos'
                                ? 'bg-golden/20 text-golden border border-golden/30'
                                : 'glass text-white-60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        🔥 Activos
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            filtro === 'activos' 
                                ? 'bg-golden/20 text-golden' 
                                : 'bg-white/10 text-white-40'
                        }`}>
                            {contadores.activos}
                        </span>
                    </button>
                    <button
                        onClick={() => setFiltro('todos')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                            filtro === 'todos'
                                ? 'bg-golden/20 text-golden border border-golden/30'
                                : 'glass text-white-60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        📋 Todos
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            filtro === 'todos' 
                                ? 'bg-golden/20 text-golden' 
                                : 'bg-white/10 text-white-40'
                        }`}>
                            {contadores.total}
                        </span>
                    </button>
                    <button
                        onClick={() => setFiltro('completados')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                            filtro === 'completados'
                                ? 'bg-golden/20 text-golden border border-golden/30'
                                : 'glass text-white-60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        ✅ Completados
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            filtro === 'completados' 
                                ? 'bg-golden/20 text-golden' 
                                : 'bg-white/10 text-white-40'
                        }`}>
                            {contadores.completados}
                        </span>
                    </button>
                </div>

                {cargando ? (
                    <div className="text-center py-12 text-white-40">
                        <div className="animate-pulse">
                            <div className="text-4xl mb-4">👨‍🍳</div>
                            <p>Cargando pedidos...</p>
                        </div>
                    </div>
                ) : pedidos.length === 0 ? (
                    <div className="text-center py-12 text-white-40">
                        <p className="text-6xl mb-4">🍕</p>
                        <p className="text-lg font-medium">No hay pedidos {filtro === 'activos' ? 'activos' : ''}</p>
                        <p className="text-sm text-white-30">Los pedidos aparecerán aquí cuando lleguen</p>
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
                                    className={`glass rounded-xl p-4 border-l-4 ${getEstadoColor(pedido.estado)} hover:shadow-golden transition-all ${!esActivo ? 'opacity-60' : 'animate-fade-in-up'}`}
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-mono text-sm font-bold text-white-60">
                                                #{pedido.id.slice(0, 8)}
                                                {pedido.es_comanda && (
                                                    <span className="text-xs bg-purple-500/20 text-purple-400 ml-1 px-1.5 py-0.5 rounded border border-purple-500/30">
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

                                    {/* Info */}
                                    <div className="mb-3 space-y-1">
                                        <p className="text-sm text-white-60 flex items-center gap-1">
                                            👨‍🍳 {pedido.usuarios?.nombre || 'Sin empleado'}
                                        </p>
                                        <p className="text-sm font-medium text-white flex items-center gap-1">
                                            👤 {pedido.cliente || 'Cliente general'}
                                        </p>
                                    </div>

                                    {/* ✅ NUEVO: Items detallados */}
                                    <div className="bg-white/5 rounded-lg p-3 mb-3 max-h-32 overflow-y-auto scrollbar-golden">
                                        <p className="text-xs font-medium text-white-40 mb-1">📦 Items:</p>
                                        {pedido.items && pedido.items.length > 0 ? (
                                            <div className="space-y-0.5">
                                                {pedido.items.map((item, idx) => (
                                                    <div key={idx} className="text-sm text-white-60 flex justify-between">
                                                        <span className="truncate flex-1">
                                                            {item.nombre_producto || item.nombre || 'Item'}
                                                        </span>
                                                        <span className="font-medium text-white-40">
                                                            {item.cantidad || 1}x
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-white-30">Sin items detallados</p>
                                        )}
                                        <p className="text-xs text-white-40 mt-1">
                                            Total: {formatPrice(pedido.total)}
                                        </p>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                        <span className="font-bold text-lg text-golden">
                                            {formatPrice(pedido.total)}
                                        </span>
                                        <div className="flex gap-1 flex-wrap justify-end">
                                            {pedido.estado === 'pendiente' && (
                                                <button
                                                    onClick={() => actualizarEstado(pedido.id, 'preparando', pedido.es_comanda)}
                                                    className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm px-3 py-1 rounded hover:bg-blue-500/30 transition-colors"
                                                >
                                                    🔪 Cocinar
                                                </button>
                                            )}
                                            {pedido.estado === 'preparando' && (
                                                <button
                                                    onClick={() => actualizarEstado(pedido.id, 'listo', pedido.es_comanda)}
                                                    className="bg-green-500/20 text-green-400 border border-green-500/30 text-sm px-3 py-1 rounded hover:bg-green-500/30 transition-colors"
                                                >
                                                    ✅ Listo
                                                </button>
                                            )}
                                            {pedido.estado === 'listo' && (
                                                <button
                                                    onClick={() => actualizarEstado(pedido.id, 'entregado', pedido.es_comanda)}
                                                    className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-sm px-3 py-1 rounded hover:bg-purple-500/30 transition-colors"
                                                >
                                                    📦 Entregar
                                                </button>
                                            )}
                                            {pedido.estado === 'entregado' && (
                                                <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                                                    <CheckCircle size={14} /> Completado
                                                </span>
                                            )}
                                            {pedido.estado === 'cancelado' && (
                                                <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                                                    <X size={14} /> Cancelado
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