'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { descontarIngredientesPorPedido } from '@/lib/recetas'
import Link from 'next/link'
import { Clock, CheckCircle, X, Bell, BellRing } from 'lucide-react'

export default function CocinaPage() {
    const [pedidos, setPedidos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [filtro, setFiltro] = useState('activos')
    const [tiempos, setTiempos] = useState({})
    const [nuevosPedidos, setNuevosPedidos] = useState([])
    const [sonidoActivo, setSonidoActivo] = useState(true)
    const intervalRef = useRef(null)
    const audioRef = useRef(null)

    // ============================================
    // REPRODUCIR SONIDO DE NUEVO PEDIDO
    // ============================================
    const reproducirSonido = () => {
        if (!sonidoActivo) return
        try {
            // Crear un sonido simple con Web Audio API
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
            const oscillator = audioCtx.createOscillator()
            const gainNode = audioCtx.createGain()
            
            oscillator.connect(gainNode)
            gainNode.connect(audioCtx.destination)
            
            oscillator.frequency.value = 800
            oscillator.type = 'sine'
            
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3)
            
            oscillator.start(audioCtx.currentTime)
            oscillator.stop(audioCtx.currentTime + 0.3)
            
            // Segundo tono
            setTimeout(() => {
                const osc2 = audioCtx.createOscillator()
                const gain2 = audioCtx.createGain()
                osc2.connect(gain2)
                gain2.connect(audioCtx.destination)
                osc2.frequency.value = 1000
                osc2.type = 'sine'
                gain2.gain.setValueAtTime(0.3, audioCtx.currentTime)
                gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2)
                osc2.start(audioCtx.currentTime)
                osc2.stop(audioCtx.currentTime + 0.2)
            }, 150)
        } catch (e) {
            console.log('Sonido no disponible')
        }
    }

    // ============================================
    // SUSCRIPCIÓN EN TIEMPO REAL
    // ============================================
    useEffect(() => {
        // Suscribirse a cambios en la tabla pedidos
        const subscription = supabase
            .channel('pedidos-cocina')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'pedidos'
                },
                (payload) => {
                    const nuevoPedido = payload.new
                    console.log('🆕 Nuevo pedido recibido:', nuevoPedido.id)
                    
                    // Agregar a la lista de nuevos pedidos
                    setNuevosPedidos(prev => [...prev, nuevoPedido.id])
                    
                    // Reproducir sonido
                    reproducirSonido()
                    
                    // Recargar pedidos
                    cargarPedidos()
                    
                    // Mostrar notificación
                    if (Notification.permission === 'granted') {
                        new Notification('🍕 Nuevo pedido!', {
                            body: `Pedido #${nuevoPedido.id.slice(0, 8)} - ${nuevoPedido.cliente || 'Cliente general'}`,
                            icon: '🍕'
                        })
                    }
                }
            )
            .subscribe()

        // Solicitar permiso para notificaciones
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    // ============================================
    // TEMPORIZADOR
    // ============================================

    useEffect(() => {
        cargarPedidos()
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [filtro])

    useEffect(() => {
        const hayActivos = pedidos.some(p => ['pendiente', 'preparando'].includes(p.estado))
        
        if (hayActivos) {
            if (!intervalRef.current) {
                intervalRef.current = setInterval(() => {
                    actualizarTiempos()
                }, 1000)
            }
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            setTiempos({})
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [pedidos])

    const actualizarTiempos = () => {
        if (!pedidos || pedidos.length === 0) return

        const ahora = new Date()
        const nuevosTiempos = {}
        
        pedidos.forEach(p => {
            if (!['pendiente', 'preparando', 'listo'].includes(p.estado)) {
                nuevosTiempos[p.id] = 0
                return
            }

            if (!p.tiempos) {
                nuevosTiempos[p.id] = 0
                return
            }

            let totalSegundos = 0
            const estados = ['pendiente', 'preparando', 'listo']
            let enEstadoActual = false
            
            for (const estado of estados) {
                const inicio = p.tiempos[`${estado}_inicio`]
                const fin = p.tiempos[`${estado}_fin`]
                
                if (inicio) {
                    const inicioDate = new Date(inicio)
                    
                    if (fin) {
                        const finDate = new Date(fin)
                        totalSegundos += Math.floor((finDate - inicioDate) / 1000)
                    } else {
                        totalSegundos += Math.floor((ahora - inicioDate) / 1000)
                        enEstadoActual = true
                        break
                    }
                }
            }
            
            nuevosTiempos[p.id] = totalSegundos
        })
        
        setTiempos(nuevosTiempos)
    }

    // ============================================
    // CARGAR PEDIDOS
    // ============================================

    const cargarPedidos = async () => {
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .select('*')
                .order('fecha', { ascending: false })

            if (error) {
                console.error('Error en consulta:', error)
                setPedidos([])
                return
            }

            if (!data) {
                setPedidos([])
                return
            }

            const pedidosConDetalles = []
            for (const pedido of data) {
                const { data: usuarioData } = await supabase
                    .from('usuarios')
                    .select('nombre, avatar')
                    .eq('id', pedido.empleado_id)
                    .single()

                const { data: detallesData } = await supabase
                    .from('pedido_detalles')
                    .select(`
                        cantidad,
                        precio_unitario,
                        tamanio_nombre,
                        sabor_nombre,
                        toppings_seleccionados,
                        producto_menu_id,
                        nombre_producto,
                        es_porcion
                    `)
                    .eq('pedido_id', pedido.id)

                const detallesConProductos = []
                if (detallesData) {
                    for (const detalle of detallesData) {
                        let productoNombre = detalle.nombre_producto || 'Producto'
                        if (!productoNombre && detalle.producto_menu_id) {
                            const { data: productoData } = await supabase
                                .from('productos_menu')
                                .select('nombre')
                                .eq('id', detalle.producto_menu_id)
                                .single()
                            if (productoData) {
                                productoNombre = productoData.nombre
                            }
                        }
                        detallesConProductos.push({
                            ...detalle,
                            productos_menu: { nombre: productoNombre }
                        })
                    }
                }

                pedidosConDetalles.push({
                    ...pedido,
                    usuarios: usuarioData || { nombre: 'Sin empleado', avatar: '👤' },
                    pedido_detalles: detallesConProductos
                })
            }

            // Aplicar filtro
            let pedidosFiltrados = pedidosConDetalles
            if (filtro === 'activos') {
                pedidosFiltrados = pedidosConDetalles.filter(p => 
                    ['pendiente', 'preparando'].includes(p.estado)
                )
            } else if (filtro === 'completados') {
                pedidosFiltrados = pedidosConDetalles.filter(p => 
                    ['entregado'].includes(p.estado)
                )
            } else if (filtro !== 'todos') {
                pedidosFiltrados = pedidosConDetalles.filter(p => p.estado === filtro)
            }

            pedidosFiltrados.sort((a, b) => {
                const aActivo = ['pendiente', 'preparando'].includes(a.estado)
                const bActivo = ['pendiente', 'preparando'].includes(b.estado)
                if (aActivo && !bActivo) return -1
                if (!aActivo && bActivo) return 1
                return 0
            })

            setPedidos(pedidosFiltrados)

            // Limpiar notificaciones de nuevos pedidos
            setNuevosPedidos([])

            setTimeout(() => {
                actualizarTiempos()
            }, 100)

        } catch (error) {
            console.error('Error cargando pedidos:', error)
            setPedidos([])
        } finally {
            setCargando(false)
        }
    }

    // ============================================
    // ACTUALIZAR ESTADO
    // ============================================

    const actualizarEstado = async (pedidoId, nuevoEstado) => {
        try {
            const { data: pedido } = await supabase
                .from('pedidos')
                .select('tiempos')
                .eq('id', pedidoId)
                .single()

            let tiempos = pedido?.tiempos || {}
            const ahora = new Date().toISOString()

            if (nuevoEstado === 'preparando') {
                tiempos.pendiente_fin = ahora
                tiempos.preparando_inicio = ahora
            } else if (nuevoEstado === 'listo') {
                tiempos.preparando_fin = ahora
                tiempos.listo_inicio = ahora
            } else if (nuevoEstado === 'entregado') {
                tiempos.listo_fin = ahora
                tiempos.entregado_inicio = ahora
                
                const userData = localStorage.getItem('usuario')
                if (userData) {
                    const usuario = JSON.parse(userData)
                    await descontarIngredientesPorPedido(pedidoId, usuario.id)
                }
            } else if (nuevoEstado === 'cancelado') {
                tiempos.pendiente_fin = ahora
            }

            const { error } = await supabase
                .from('pedidos')
                .update({ 
                    estado: nuevoEstado,
                    tiempos: tiempos
                })
                .eq('id', pedidoId)

            if (error) throw error

            const userData = localStorage.getItem('usuario')
            if (userData) {
                const usuario = JSON.parse(userData)
                await supabase
                    .from('auditoria')
                    .insert({
                        usuario_id: usuario.id,
                        accion: `Cambió estado pedido #${pedidoId.slice(0, 8)} a ${nuevoEstado} (cocina)`
                    })
            }

            cargarPedidos()
            
        } catch (error) {
            console.error('Error actualizando estado:', error)
            alert('Error al actualizar el estado')
        }
    }

    // ============================================
    // UTILIDADES
    // ============================================

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

    const getEstadoBadgeColor = (estado) => {
        const colores = {
            pendiente: 'badge-warning',
            preparando: 'badge-info',
            listo: 'badge-success',
            entregado: 'badge-neutral',
            cancelado: 'badge-danger'
        }
        return colores[estado] || 'badge-neutral'
    }

    const formatearTiempo = (segundos) => {
        if (!segundos || segundos === 0) return '0s'
        const mins = Math.floor(segundos / 60)
        const secs = segundos % 60
        if (mins > 0) {
            return `${mins}m ${secs}s`
        }
        return `${secs}s`
    }

    const getTiempoColor = (segundos) => {
        if (!segundos || segundos < 60) return 'text-green-600'
        if (segundos < 180) return 'text-yellow-600'
        if (segundos < 300) return 'text-orange-600'
        return 'text-red-600 font-bold animate-pulse'
    }

    const getTiempoProgreso = (segundos) => {
        const max = 600
        const progreso = Math.min((segundos / max) * 100, 100)
        return progreso
    }

    const getContadorEstados = () => {
        const conteo = { 
            todos: pedidos.length, 
            activos: 0,
            completados: 0
        }
        pedidos.forEach(p => {
            if (['pendiente', 'preparando'].includes(p.estado)) {
                conteo.activos++
            }
            if (p.estado === 'entregado') {
                conteo.completados++
            }
            conteo[p.estado] = (conteo[p.estado] || 0) + 1
        })
        return conteo
    }

    const conteo = getContadorEstados()

    const pedidosOrdenados = [...pedidos].sort((a, b) => {
        const aActivo = ['pendiente', 'preparando'].includes(a.estado)
        const bActivo = ['pendiente', 'preparando'].includes(b.estado)
        if (aActivo && !bActivo) return -1
        if (!aActivo && bActivo) return 1
        return (tiempos[b.id] || 0) - (tiempos[a.id] || 0)
    })

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header con notificaciones */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold">👨‍🍳 Panel de Cocina</h2>
                        {/* Indicador de nuevos pedidos */}
                        {nuevosPedidos.length > 0 && (
                            <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                                <BellRing size={16} />
                                {nuevosPedidos.length} nuevo(s)
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setSonidoActivo(!sonidoActivo)}
                            className={`btn-secondary text-sm py-1 px-3 flex items-center gap-1 ${
                                sonidoActivo ? 'bg-green-600 text-white' : ''
                            }`}
                        >
                            {sonidoActivo ? <Bell size={16} /> : <Bell size={16} className="text-gray-400" />}
                            {sonidoActivo ? 'Sonido ON' : 'Sonido OFF'}
                        </button>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock size={14} className="text-green-500 animate-pulse" />
                            Tiempo real
                        </span>
                        <button
                            onClick={cargarPedidos}
                            className="btn-secondary text-sm py-1 px-3"
                        >
                            🔄 Actualizar
                        </button>
                    </div>
                </div>

                {/* Filtros simplificados */}
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
                            {conteo.activos}
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
                            {conteo.todos}
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
                            {conteo.completados}
                        </span>
                    </button>
                </div>

                {cargando ? (
                    <div className="text-center py-12 text-gray-500">Cargando pedidos...</div>
                ) : pedidos.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-6xl mb-4">🍕</p>
                        <p className="text-lg font-medium">No hay pedidos {filtro === 'activos' ? 'activos' : ''}</p>
                        <p className="text-sm text-gray-400">Los pedidos aparecerán aquí automáticamente</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {pedidosOrdenados.map((pedido) => {
                            const tiempoActual = tiempos[pedido.id] || 0
                            const tiempoColor = getTiempoColor(tiempoActual)
                            const progreso = getTiempoProgreso(tiempoActual)
                            const esActivo = ['pendiente', 'preparando'].includes(pedido.estado)
                            const esNuevo = nuevosPedidos.includes(pedido.id)

                            return (
                                <div
                                    key={pedido.id}
                                    className={`bg-white rounded-xl shadow-md p-4 border-l-4 ${getEstadoColor(pedido.estado)} hover:shadow-lg transition-shadow ${!esActivo ? 'opacity-75' : ''} ${esNuevo ? 'ring-2 ring-orange-400 animate-pulse-soft' : ''}`}
                                >
                                    {/* Encabezado con badge de nuevo */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-mono text-sm font-bold text-gray-600 flex items-center gap-2">
                                                #{pedido.id.slice(0, 8)}
                                                <span className={`badge ${getEstadoBadgeColor(pedido.estado)} text-xs`}>
                                                    {pedido.estado}
                                                </span>
                                                {esNuevo && (
                                                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                                                        NUEVO
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

                                    {esActivo && (
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3 overflow-hidden">
                                            <div
                                                className={`h-1.5 rounded-full transition-all duration-1000 ${
                                                    tiempoActual > 300 ? 'bg-red-500' :
                                                    tiempoActual > 180 ? 'bg-orange-500' :
                                                    tiempoActual > 60 ? 'bg-yellow-500' :
                                                    'bg-green-500'
                                                }`}
                                                style={{ width: `${Math.min(progreso, 100)}%` }}
                                            />
                                        </div>
                                    )}

                                    <div className="mb-3 space-y-1">
                                        <p className="text-sm text-gray-600">
                                            👨‍🍳 {pedido.usuarios?.nombre || 'Sin empleado'}
                                        </p>
                                        <p className="text-sm font-medium text-gray-700">
                                            👤 {pedido.cliente || 'Cliente general'}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-3 mb-3 max-h-24 overflow-y-auto">
                                        <p className="text-xs font-medium text-gray-500 mb-2">📦 Productos:</p>
                                        {pedido.pedido_detalles?.map((detalle, index) => (
                                            <div key={index} className="flex justify-between text-sm">
                                                <span>
                                                    {detalle.cantidad}x {detalle.productos_menu?.nombre || 'Producto'}
                                                    {detalle.tamanio_nombre && ` (${detalle.tamanio_nombre})`}
                                                    {detalle.sabor_nombre && ` - ${detalle.sabor_nombre}`}
                                                    {detalle.es_porcion && ' 🍕 Porción'}
                                                </span>
                                                <span className="text-gray-600">
                                                    ${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                        <span className="font-bold text-lg text-orange-600">
                                            ${pedido.total}
                                        </span>
                                        <div className="flex gap-1 flex-wrap justify-end">
                                            {pedido.estado === 'pendiente' && (
                                                <>
                                                    <button
                                                        onClick={() => actualizarEstado(pedido.id, 'preparando')}
                                                        className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                                    >
                                                        🔪 Cocinar
                                                    </button>
                                                    <button
                                                        onClick={() => actualizarEstado(pedido.id, 'cancelado')}
                                                        className="bg-red-500 text-white text-sm px-3 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            )}
                                            {pedido.estado === 'preparando' && (
                                                <>
                                                    <button
                                                        onClick={() => actualizarEstado(pedido.id, 'listo')}
                                                        className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                                                    >
                                                        ✅ Listo
                                                    </button>
                                                    <button
                                                        onClick={() => actualizarEstado(pedido.id, 'cancelado')}
                                                        className="bg-red-500 text-white text-sm px-3 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            )}
                                            {pedido.estado === 'listo' && (
                                                <button
                                                    onClick={() => actualizarEstado(pedido.id, 'entregado')}
                                                    className="bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                                                >
                                                    📦 Entregar
                                                </button>
                                            )}
                                            {pedido.estado === 'entregado' && (
                                                <span className="text-xs text-green-600 font-medium flex items-center gap-1 bg-green-50 px-3 py-2 rounded-lg">
                                                    <CheckCircle size={16} /> Completado
                                                </span>
                                            )}
                                            {pedido.estado === 'cancelado' && (
                                                <span className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">
                                                    ❌ Cancelado
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                <div className="flex gap-4 mt-4">
                    <Link href="/pedidos" className="btn-primary text-sm">
                        📝 Tomar Pedido
                    </Link>
                    <Link href="/dashboard" className="btn-ghost text-sm">
                        📊 Dashboard
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    )
}