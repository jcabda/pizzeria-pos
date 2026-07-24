'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'
import Link from 'next/link'
import { 
    Plus, Users, Coffee, Utensils, X, Check, Trash2, 
    Eye, ShoppingCart, Home, Truck 
} from 'lucide-react'

export default function ComandasPage() {
    const [mesas, setMesas] = useState([])
    const [comandas, setComandas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
    const [mostrarModal, setMostrarModal] = useState(false)
    const [clienteNombre, setClienteNombre] = useState('')
    const [tipoCliente, setTipoCliente] = useState('local')
    const [meseroId, setMeseroId] = useState('')
    const [meseros, setMeseros] = useState([])
    const [itemsComanda, setItemsComanda] = useState({})
    const [mostrarDetalle, setMostrarDetalle] = useState(null)
    const [mostrarCuenta, setMostrarCuenta] = useState(null)
    const [servicioPorcentaje, setServicioPorcentaje] = useState(10)

    useEffect(() => {
        cargarDatos()
        cargarMeseros()
    }, [])

    const cargarMeseros = async () => {
        try {
            const { data } = await supabase
                .from('usuarios')
                .select('id, nombre, avatar')
                .eq('activo', true)
                .eq('rol', 'empleado')
                .order('nombre')
            setMeseros(data || [])
        } catch (error) {
            console.error('Error cargando meseros:', error)
        }
    }

    const cargarDatos = async () => {
        try {
            // Cargar mesas
            const { data: mesasData } = await supabase
                .from('mesas')
                .select('*')
                .eq('activo', true)
                .order('numero')
            setMesas(mesasData || [])
            console.log('📊 Mesas cargadas:', mesasData)
            // Cargar comandas abiertas
            const { data: comandasData } = await supabase
                .from('comandas')
                .select(`
                    *,
                    mesas (numero),
                    usuarios (nombre, avatar)
                `)
                .eq('estado', 'abierta')
                .order('created_at', { ascending: false })
            setComandas(comandasData || [])

            // Cargar items de cada comanda
            for (const comanda of comandasData || []) {
                const { data: items } = await supabase
                    .from('comanda_items')
                    .select(`
                        *,
                        productos_menu (nombre)
                    `)
                    .eq('comanda_id', comanda.id)
                setItemsComanda(prev => ({ ...prev, [comanda.id]: items || [] }))
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setCargando(false)
        }
    }

    const abrirMesa = async (mesaId) => {
        const mesa = mesas.find(m => m.id === mesaId)
        if (!mesa) return

        if (mesa.estado === 'ocupada') {
            alert('⚠️ Esta mesa ya tiene una comanda abierta')
            return
        }

        setMesaSeleccionada(mesa)
        setMostrarModal(true)
    }

    const crearComanda = async () => {
        if (!mesaSeleccionada) return
        if (!meseroId) {
            alert('❌ Selecciona un mesero')
            return
        }

        try {
            const { data, error } = await supabase
                .from('comandas')
                .insert({
                    mesa_id: mesaSeleccionada.id,
                    mesero_id: meseroId,
                    cliente_nombre: clienteNombre || 'Cliente',
                    tipo_cliente: tipoCliente,
                    estado: 'abierta',
                    subtotal: 0,
                    servicio: 0,
                    total: 0
                })
                .select()
                .single()

            if (error) throw error

            await supabase
                .from('mesas')
                .update({ estado: 'ocupada' })
                .eq('id', mesaSeleccionada.id)

            setMostrarModal(false)
            resetModal()
            cargarDatos()
            
            alert(`✅ Comanda #${data.id.slice(0, 8)} abierta para Mesa ${mesaSeleccionada.numero}`)
        } catch (error) {
            console.error('Error:', error)
            alert('❌ Error al abrir la comanda: ' + error.message)
        }
    }

    const resetModal = () => {
        setMesaSeleccionada(null)
        setClienteNombre('')
        setTipoCliente('local')
        setMeseroId('')
    }

    const verCuenta = async (comandaId) => {
        setMostrarCuenta(comandaId)
        // Recargar items para la cuenta
        const { data: items } = await supabase
            .from('comanda_items')
            .select(`
                *,
                productos_menu (nombre)
            `)
            .eq('comanda_id', comandaId)
        setItemsComanda(prev => ({ ...prev, [comandaId]: items || [] }))
    }

    const cerrarComanda = async (comandaId, mesaId) => {
        if (!confirm('¿Cerrar esta comanda y liberar la mesa?')) return

        try {
            const comanda = comandas.find(c => c.id === comandaId)
            if (!comanda) return

            const servicioAplicado = comanda.subtotal * (servicioPorcentaje / 100)
            const totalConServicio = comanda.subtotal + servicioAplicado

            await supabase
                .from('comandas')
                .update({
                    estado: 'cerrada',
                    servicio: servicioAplicado,
                    total: totalConServicio,
                    updated_at: new Date().toISOString()
                })
                .eq('id', comandaId)

            await supabase
                .from('mesas')
                .update({ estado: 'disponible' })
                .eq('id', mesaId)

            setMostrarCuenta(null)
            cargarDatos()
            alert(`✅ Comanda cerrada. Total: ${formatPrice(totalConServicio)}`)
        } catch (error) {
            console.error('Error:', error)
            alert('❌ Error al cerrar la comanda: ' + error.message)
        }
    }

    const eliminarItem = async (itemId, comandaId) => {
        if (!confirm('¿Eliminar este item de la comanda?')) return

        try {
            const { error } = await supabase
                .from('comanda_items')
                .delete()
                .eq('id', itemId)

            if (error) throw error

            // Recalcular subtotal
            const { data: items } = await supabase
                .from('comanda_items')
                .select('subtotal')
                .eq('comanda_id', comandaId)

            const nuevoSubtotal = items?.reduce((sum, i) => sum + (i.subtotal || 0), 0) || 0

            await supabase
                .from('comandas')
                .update({ subtotal: nuevoSubtotal })
                .eq('id', comandaId)

            // Actualizar items local
            setItemsComanda(prev => ({
                ...prev,
                [comandaId]: prev[comandaId]?.filter(item => item.id !== itemId) || []
            }))

            cargarDatos()
        } catch (error) {
            console.error('Error:', error)
            alert('❌ Error al eliminar el item')
        }
    }

    const getEstadoColor = (estado) => {
        const colores = {
            disponible: 'bg-green-100 border-green-500 text-green-700',
            ocupada: 'bg-yellow-100 border-yellow-500 text-yellow-700',
            reservada: 'bg-blue-100 border-blue-500 text-blue-700',
        }
        return colores[estado] || 'bg-gray-100 border-gray-500'
    }

    const getEstadoEmoji = (estado) => {
        const emojis = {
            disponible: '🪑',
            ocupada: '🍽️',
            reservada: '🔵',
        }
        return emojis[estado] || '❓'
    }

    const getTipoCliente = (tipo) => {
        const tipos = {
            local: '🏠 Local',
            domicilio: '🏍️ Domicilio',
            nuevo: '🆕 Nuevo'
        }
        return tipos[tipo] || tipo
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">
                            <span className="text-golden">Golden</span>
                            <span className="text-fire"> on </span>
                            <span className="text-fire-orange">Fire</span>
                            <span className="text-gray-800"> - Mesas</span>
                        </h2>
                        <p className="text-sm text-gray-500">Gestiona las mesas y comandas abiertas</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={cargarDatos} className="btn-secondary text-sm">
                            🔄 Actualizar
                        </button>
                    </div>
                </div>

                {/* Grid de Mesas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {cargando ? (
                        <div className="col-span-full text-center py-12 text-gray-500">Cargando...</div>
                    ) : mesas.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <p className="text-4xl mb-2">🍽️</p>
                            <p>No hay mesas registradas</p>
                        </div>
                    ) : (
                        mesas.map((mesa) => {
                            const comanda = comandas.find(c => c.mesa_id === mesa.id)
                            const items = itemsComanda[comanda?.id] || []
                            return (
                                <div
                                    key={mesa.id}
                                    className={`bg-white rounded-xl shadow-sm p-4 border-2 transition-all ${getEstadoColor(mesa.estado)}`}
                                >
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">
                                            {getEstadoEmoji(mesa.estado)}
                                        </div>
                                        <p className="font-bold text-lg">Mesa {mesa.numero}</p>
                                        <p className="text-xs font-medium">
                                            {mesa.estado.charAt(0).toUpperCase() + mesa.estado.slice(1)}
                                        </p>
                                        {comanda && (
                                            <div className="mt-2 text-sm">
                                                <p className="font-medium text-orange-600">
                                                    {formatPrice(comanda.subtotal)}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {comanda.usuarios?.nombre}
                                                </p>
                                                <div className="flex justify-center gap-2 mt-1">
                                                    <button
                                                        onClick={() => verCuenta(comanda.id)}
                                                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                    >
                                                        <Eye size={12} /> Ver cuenta
                                                    </button>
                                                    <button
                                                        onClick={() => setMostrarDetalle(mostrarDetalle === comanda.id ? null : comanda.id)}
                                                        className="text-xs text-gray-500 hover:text-gray-700"
                                                    >
                                                        {mostrarDetalle === comanda.id ? 'Ocultar' : 'Ver items'} ({items.length})
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <div className="mt-2 flex flex-col gap-1">
                                            {mesa.estado === 'disponible' ? (
                                                <button
                                                    onClick={() => abrirMesa(mesa.id)}
                                                    className="btn-golden text-xs py-1 px-3 w-full"
                                                >
                                                    <Users size={14} className="inline mr-1" />
                                                    Abrir mesa
                                                </button>
                                            ) : (
                                                <>
                                                    <Link
                                                        href={`/pedidos?comanda=${comanda?.id}`}
                                                        className="btn-primary text-xs py-1 px-3 w-full"
                                                    >
                                                        Agregar items
                                                    </Link>
                                                    <button
                                                        onClick={() => cerrarComanda(comanda?.id, mesa.id)}
                                                        className="btn-fire text-xs py-1 px-3 w-full"
                                                    >
                                                        Cerrar cuenta
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {mostrarDetalle === comanda?.id && (
                                        <div className="mt-3 pt-3 border-t border-gray-200 max-h-32 overflow-y-auto">
                                            {items.length === 0 ? (
                                                <p className="text-xs text-gray-400 text-center">Sin items</p>
                                            ) : (
                                                items.map((item, i) => (
                                                    <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                                                        <span className="truncate max-w-[100px]">{item.nombre_producto}</span>
                                                        <span className="text-orange-600 font-medium">{formatPrice(item.subtotal)}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Comandas abiertas resumen */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="px-4 py-3 bg-gray-50 border-b">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Coffee size={18} />
                            Comandas abiertas
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full ml-2">
                                {comandas.length}
                            </span>
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {comandas.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-4xl mb-2">📭</p>
                                <p>No hay comandas abiertas</p>
                            </div>
                        ) : (
                            comandas.map((comanda) => (
                                <div key={comanda.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-mono text-sm font-medium">
                                                #{comanda.id.slice(0, 8)}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Mesa {comanda.mesas?.numero} - {comanda.usuarios?.avatar} {comanda.usuarios?.nombre}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {getTipoCliente(comanda.tipo_cliente)} - {comanda.cliente_nombre}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-orange-600">
                                                {formatPrice(comanda.subtotal)}
                                            </p>
                                            <span className="text-xs badge badge-warning">Abierta</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal para abrir mesa */}
            {mostrarModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">🔥 Abrir mesa</h3>
                            <button onClick={() => setMostrarModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="input-label">Mesa {mesaSeleccionada?.numero}</label>
                                <p className="text-sm text-gray-500">Capacidad: {mesaSeleccionada?.capacidad || 4} personas</p>
                            </div>

                            <div>
                                <label className="input-label">👨‍🍳 Mesero</label>
                                <select
                                    value={meseroId}
                                    onChange={(e) => setMeseroId(e.target.value)}
                                    className="input-field"
                                    required
                                >
                                    <option value="">Seleccionar mesero</option>
                                    {meseros.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.avatar || '👤'} {m.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="input-label">👤 Tipo de cliente</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTipoCliente('local')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ${
                                            tipoCliente === 'local'
                                                ? 'bg-orange-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        🏠 Local
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTipoCliente('domicilio')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ${
                                            tipoCliente === 'domicilio'
                                                ? 'bg-orange-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        🏍️ Domicilio
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTipoCliente('nuevo')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ${
                                            tipoCliente === 'nuevo'
                                                ? 'bg-orange-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        🆕 Nuevo
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="input-label">📝 Nombre del cliente</label>
                                <input
                                    type="text"
                                    value={clienteNombre}
                                    onChange={(e) => setClienteNombre(e.target.value)}
                                    className="input-field"
                                    placeholder="Nombre del cliente"
                                />
                            </div>

                            <button
                                onClick={crearComanda}
                                className="btn-golden w-full justify-center"
                            >
                                <Users size={18} />
                                Abrir mesa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para ver cuenta */}
            {mostrarCuenta && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">📋 Cuenta</h3>
                            <button onClick={() => setMostrarCuenta(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        {(() => {
                            const comanda = comandas.find(c => c.id === mostrarCuenta)
                            const items = itemsComanda[mostrarCuenta] || []
                            const subtotal = items.reduce((sum, i) => sum + (i.subtotal || 0), 0)
                            const servicio = subtotal * (servicioPorcentaje / 100)
                            const total = subtotal + servicio

                            if (!comanda) return <p className="text-gray-500">Comanda no encontrada</p>

                            return (
                                <div className="space-y-4">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-sm text-gray-500">Mesa {comanda.mesas?.numero}</p>
                                        <p className="font-medium">{comanda.cliente_nombre}</p>
                                        <p className="text-xs text-gray-400">{getTipoCliente(comanda.tipo_cliente)}</p>
                                    </div>

                                    <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                                        {items.map((item, i) => (
                                            <div key={i} className="flex justify-between py-2">
                                                <div>
                                                    <p className="font-medium text-sm">{item.nombre_producto}</p>
                                                    {item.tamanio_nombre && (
                                                        <p className="text-xs text-gray-500">{item.tamanio_nombre}</p>
                                                    )}
                                                    {item.sabor_nombre && (
                                                        <p className="text-xs text-gray-500">Sabor: {item.sabor_nombre}</p>
                                                    )}
                                                    <p className="text-xs text-gray-400">
                                                        {item.cantidad}x {item.multiplicador > 1 && `x${item.multiplicador}`}
                                                    </p>
                                                </div>
                                                <p className="font-bold text-orange-600">{formatPrice(item.subtotal)}</p>
                                            </div>
                                        ))}
                                        {items.length === 0 && (
                                            <p className="text-center py-4 text-gray-500">Sin items</p>
                                        )}
                                    </div>

                                    <div className="border-t border-gray-200 pt-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Subtotal</span>
                                            <span>{formatPrice(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Servicio ({servicioPorcentaje}%)</span>
                                            <span>{formatPrice(servicio)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                                            <span>Total</span>
                                            <span className="text-golden">{formatPrice(total)}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                const nuevo = prompt('Porcentaje de servicio (0-20):', servicioPorcentaje)
                                                if (nuevo !== null) {
                                                    setServicioPorcentaje(parseFloat(nuevo) || 0)
                                                }
                                            }}
                                            className="btn-secondary text-sm flex-1"
                                        >
                                            Ajustar servicio
                                        </button>
                                        <button
                                            onClick={() => {
                                                cerrarComanda(comanda.id, comanda.mesa_id)
                                            }}
                                            className="btn-golden text-sm flex-1"
                                        >
                                            Cerrar cuenta
                                        </button>
                                    </div>
                                </div>
                            )
                        })()}
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}