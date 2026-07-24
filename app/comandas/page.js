'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'
import Link from 'next/link'
import { Plus, X, Check, ShoppingCart, Utensils, Users, Trash2 } from 'lucide-react'

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
            const { data: mesasData } = await supabase
                .from('mesas')
                .select('*')
                .order('numero')
            setMesas(mesasData || [])

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

            // Cargar items para cada comanda
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

    const abrirComanda = async (mesaId) => {
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
            cargarDatos()
            
            alert(`✅ Comanda #${data.id.slice(0, 8)} abierta para Mesa ${mesaSeleccionada.numero}`)
        } catch (error) {
            console.error('Error:', error)
            alert('❌ Error al abrir la comanda: ' + error.message)
        }
    }

    const cerrarComanda = async (comandaId, mesaId) => {
        if (!confirm('¿Cerrar esta comanda y liberar la mesa?')) return

        try {
            const comanda = comandas.find(c => c.id === comandaId)
            if (!comanda) return

            const servicio = prompt('Ingrese el porcentaje de servicio (0-20):', '10')
            const servicioPorcentaje = parseFloat(servicio) || 0
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
            const comanda = comandas.find(c => c.id === comandaId)
            const { data: items } = await supabase
                .from('comanda_items')
                .select('subtotal')
                .eq('comanda_id', comandaId)

            const nuevoSubtotal = items?.reduce((sum, i) => sum + (i.subtotal || 0), 0) || 0

            await supabase
                .from('comandas')
                .update({ subtotal: nuevoSubtotal })
                .eq('id', comandaId)

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
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">🔥 Comandas</h2>
                        <p className="text-sm text-gray-500">Mesas y cuentas abiertas</p>
                    </div>
                    <Link href="/pedidos" className="btn-golden text-sm flex items-center gap-2">
                        <Plus size={18} />
                        Nuevo Pedido
                    </Link>
                </div>

                {/* Grid de Mesas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {cargando ? (
                        <div className="col-span-full text-center py-12 text-gray-500">Cargando...</div>
                    ) : mesas.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <p className="text-4xl mb-2">🍽️</p>
                            <p>No hay mesas registradas</p>
                            <p className="text-sm text-gray-400">Agrega mesas desde el panel de administración</p>
                        </div>
                    ) : (
                        mesas.map((mesa) => {
                            const comanda = comandas.find(c => c.mesa_id === mesa.id)
                            return (
                                <div
                                    key={mesa.id}
                                    className={`bg-white rounded-xl shadow-sm p-4 border-2 transition-all ${getEstadoColor(mesa.estado)}`}
                                >
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">
                                            {mesa.estado === 'disponible' ? '🪑' : '🍽️'}
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
                                            </div>
                                        )}
                                        <div className="mt-2 flex flex-col gap-1">
                                            {mesa.estado === 'disponible' ? (
                                                <button
                                                    onClick={() => abrirComanda(mesa.id)}
                                                    className="btn-success text-xs py-1 px-3"
                                                >
                                                    Abrir comanda
                                                </button>
                                            ) : (
                                                <>
                                                    <Link
                                                        href={`/pedidos?comanda=${comanda?.id}`}
                                                        className="btn-primary text-xs py-1 px-3"
                                                    >
                                                        Agregar items
                                                    </Link>
                                                    <button
                                                        onClick={() => cerrarComanda(comanda?.id, mesa.id)}
                                                        className="btn-danger text-xs py-1 px-3"
                                                    >
                                                        Cerrar cuenta
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Comandas abiertas con detalles */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="px-4 py-3 bg-gray-50 border-b">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Utensils size={18} />
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
                                            <span className="text-xs badge badge-warning">
                                                Abierta
                                            </span>
                                        </div>
                                    </div>
                                    {/* Items de la comanda */}
                                    {(itemsComanda[comanda.id] || []).length > 0 && (
                                        <div className="mt-2 pl-4 border-l-2 border-gray-200">
                                            {(itemsComanda[comanda.id] || []).map((item) => (
                                                <div key={item.id} className="flex justify-between items-center text-sm py-1">
                                                    <span>
                                                        {item.cantidad}x {item.productos_menu?.nombre || 'Producto'}
                                                        {item.multiplicador > 1 && ` x${item.multiplicador}`}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-600">{formatPrice(item.subtotal)}</span>
                                                        <button
                                                            onClick={() => eliminarItem(item.id, comanda.id)}
                                                            className="text-red-400 hover:text-red-600"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal para abrir comanda */}
            {mostrarModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">🔥 Abrir comanda</h3>
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
                                Abrir comanda
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}