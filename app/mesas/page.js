'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Plus, Users, CheckCircle, Clock, Pizza } from 'lucide-react'
import ClienteSelector from '@/components/pedido/ClienteSelector'
import MeseroSelector from '@/components/pedido/MeseroSelector'
import { formatPrice } from '@/lib/currency'

export default function MesasPage() {
    const [mesas, setMesas] = useState([])
    const [pedidosActivos, setPedidosActivos] = useState([])
    const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [cliente, setCliente] = useState('Cliente Local')
    const [mesero, setMesero] = useState('')
    const [nuevoPedido, setNuevoPedido] = useState([])

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        try {
            // Cargar mesas
            const { data: mesasData } = await supabase
                .from('mesas')
                .select('*')
                .order('numero')

            setMesas(mesasData || [])

            // Cargar pedidos activos
            const { data: pedidosData } = await supabase
                .from('pedidos')
                .select('*, usuarios (nombre, avatar)')
                .in('estado', ['pendiente', 'preparando'])
                .order('fecha', { ascending: false })

            setPedidosActivos(pedidosData || [])
        } catch (error) {
            console.error('Error cargando datos:', error)
        } finally {
            setCargando(false)
        }
    }

    const crearMesa = async () => {
        const numero = mesas.length + 1
        const { data, error } = await supabase
            .from('mesas')
            .insert({ numero, estado: 'disponible' })
            .select()
            .single()

        if (error) {
            console.error('Error creando mesa:', error)
            return
        }

        setMesas([...mesas, data])
    }

    const toggleMesa = async (mesaId) => {
        const mesa = mesas.find(m => m.id === mesaId)
        const nuevoEstado = mesa.estado === 'disponible' ? 'ocupada' : 'disponible'

        const { error } = await supabase
            .from('mesas')
            .update({ estado: nuevoEstado })
            .eq('id', mesaId)

        if (!error) {
            setMesas(mesas.map(m => 
                m.id === mesaId ? { ...m, estado: nuevoEstado } : m
            ))
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
            disponible: '✅',
            ocupada: '🟡',
            reservada: '🔵',
        }
        return emojis[estado] || '❓'
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">🍽️ Panel de Mesas</h2>
                        <p className="text-sm text-gray-500">Gestiona las mesas y pedidos activos</p>
                    </div>
                    <button
                        onClick={crearMesa}
                        className="btn-primary text-sm flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Agregar Mesa
                    </button>
                </div>

                {/* Información de mesero y cliente */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ClienteSelector value={cliente} onChange={setCliente} />
                        <MeseroSelector value={mesero} onChange={setMesero} />
                    </div>
                </div>

                {/* Grid de Mesas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {cargando ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            Cargando mesas...
                        </div>
                    ) : mesas.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <p className="text-4xl mb-2">🍽️</p>
                            <p>No hay mesas registradas</p>
                            <p className="text-sm">Haz clic en "Agregar Mesa" para empezar</p>
                        </div>
                    ) : (
                        mesas.map((mesa) => (
                            <div
                                key={mesa.id}
                                className={`bg-white rounded-xl shadow-sm p-4 border-2 transition-all cursor-pointer ${getEstadoColor(mesa.estado)}`}
                                onClick={() => toggleMesa(mesa.id)}
                            >
                                <div className="text-center">
                                    <div className="text-3xl mb-2">
                                        {mesa.estado === 'disponible' ? '🪑' : '🍽️'}
                                    </div>
                                    <p className="font-bold text-lg">Mesa {mesa.numero}</p>
                                    <p className="text-xs font-medium">
                                        {mesa.estado.charAt(0).toUpperCase() + mesa.estado.slice(1)}
                                    </p>
                                    {mesa.estado === 'ocupada' && (
                                        <Link
                                            href={`/pedidos?mesa=${mesa.id}`}
                                            className="mt-2 inline-block btn-primary text-xs py-1 px-3"
                                        >
                                            Ver Pedido
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pedidos Activos */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="px-4 py-3 bg-gray-50 border-b">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Clock size={18} />
                            Pedidos Activos
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full ml-2">
                                {pedidosActivos.length}
                            </span>
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {pedidosActivos.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-4xl mb-2">📭</p>
                                <p>No hay pedidos activos</p>
                            </div>
                        ) : (
                            pedidosActivos.slice(0, 5).map((pedido) => (
                                <div key={pedido.id} className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="font-mono text-sm font-medium">
                                            #{pedido.id.slice(0, 8)}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {pedido.usuarios?.avatar} {pedido.usuarios?.nombre}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {pedido.cliente}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-orange-600">
                                            {formatPrice(pedido.total)}
                                        </p>
                                        <span className={`text-xs badge ${
                                            pedido.estado === 'pendiente' ? 'badge-warning' :
                                            pedido.estado === 'preparando' ? 'badge-info' :
                                            'badge-success'
                                        }`}>
                                            {pedido.estado}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                        {pedidosActivos.length > 5 && (
                            <div className="px-4 py-2 text-center text-sm text-gray-400">
                                + {pedidosActivos.length - 5} pedidos más
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}