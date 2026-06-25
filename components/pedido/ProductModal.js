'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { X, Minus, Plus, Check } from 'lucide-react'

export default function ProductModal({ producto, onClose, onAdd }) {
    const [tamanios, setTamanios] = useState([])
    const [toppings, setToppings] = useState([])
    const [seleccion, setSeleccion] = useState({
        tamanio: null,
        toppings: [],
        cantidad: 1
    })
    const [cargando, setCargando] = useState(true)
    const [precioTotal, setPrecioTotal] = useState(producto.precio_venta)

    useEffect(() => {
        cargarDatos()
    }, [])

    useEffect(() => {
        calcularPrecio()
    }, [seleccion])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            // Cargar tamaños
            const { data: tamaniosData } = await supabase
                .from('tamanios_pizza')
                .select('*')
                .eq('activo', true)
                .order('porciones')
            setTamanios(tamaniosData || [])

            // Si es pizza personalizable, cargar toppings
            if (producto.tipo === 'pizza_personalizable') {
                const { data: toppingsData } = await supabase
                    .from('toppings')
                    .select('*, ingredientes (nombre, stock_actual)')
                    .eq('activo', true)
                    .order('nombre')
                setToppings(toppingsData || [])
            }

            // Seleccionar primer tamaño por defecto
            if (tamaniosData && tamaniosData.length > 0) {
                setSeleccion(prev => ({ ...prev, tamanio: tamaniosData[0] }))
            }
        } catch (error) {
            console.error('Error cargando datos:', error)
        } finally {
            setCargando(false)
        }
    }

    const calcularPrecio = () => {
        let precio = producto.precio_venta || 0
        
        // Si es pizza, usar precio base del tamaño
        if (producto.tipo !== 'simple' && seleccion.tamanio) {
            precio = seleccion.tamanio.precio_base || 0
        }

        // Sumar toppings
        seleccion.toppings.forEach(t => {
            precio += t.precio_extra || 0
        })

        // Multiplicar por cantidad
        precio *= seleccion.cantidad || 1

        setPrecioTotal(precio)
    }

    const toggleTopping = (topping) => {
        setSeleccion(prev => {
            const exists = prev.toppings.find(t => t.id === topping.id)
            if (exists) {
                return { ...prev, toppings: prev.toppings.filter(t => t.id !== topping.id) }
            } else {
                return { ...prev, toppings: [...prev.toppings, topping] }
            }
        })
    }

    const cambiarCantidad = (delta) => {
        setSeleccion(prev => ({
            ...prev,
            cantidad: Math.max(1, Math.min(99, (prev.cantidad || 1) + delta))
        }))
    }

    const handleAdd = () => {
        if (producto.tipo !== 'simple' && !seleccion.tamanio) {
            alert('Por favor selecciona un tamaño')
            return
        }

        onAdd({
            producto: producto,
            tamanio: seleccion.tamanio,
            toppings: seleccion.toppings,
            cantidad: seleccion.cantidad,
            precioTotal: precioTotal
        })
        onClose()
    }

    const isPizza = producto.tipo === 'pizza_fija' || producto.tipo === 'pizza_personalizable'
    const isPersonalizable = producto.tipo === 'pizza_personalizable'

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-100 rounded-t-3xl">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">
                                {producto.nombre.includes('Pizza') ? '🍕' :
                                 producto.nombre.includes('Coca') || producto.nombre.includes('Agua') ? '🥤' :
                                 producto.nombre.includes('Helado') || producto.nombre.includes('Tiramisú') ? '🍨' : '📦'}
                            </span>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">{producto.nombre}</h3>
                                <p className="text-sm text-gray-500 capitalize">{producto.tipo?.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-6">
                    {cargando ? (
                        <div className="text-center py-8 text-gray-500">Cargando opciones...</div>
                    ) : (
                        <>
                            {/* Tamaños (solo para pizzas) */}
                            {isPizza && (
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-3">📏 Tamaño</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {tamanios.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setSeleccion(prev => ({ ...prev, tamanio: t }))}
                                                className={`p-4 rounded-xl border-2 transition-all ${
                                                    seleccion.tamanio?.id === t.id
                                                        ? 'border-orange-500 bg-orange-50'
                                                        : 'border-gray-200 hover:border-orange-300'
                                                }`}
                                            >
                                                <div className="text-3xl mb-1">
                                                    {t.nombre === 'Pequeña' ? '👶' :
                                                     t.nombre === 'Mediana' ? '👨' : '🦁'}
                                                </div>
                                                <p className="font-medium text-sm">{t.nombre}</p>
                                                <p className="text-xs text-gray-500">{t.porciones} porciones</p>
                                                <p className="text-orange-600 font-bold">${t.precio_base}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Toppings (solo para personalizables) */}
                            {isPersonalizable && (
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-3">🧀 Toppings extras</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {toppings.map(t => {
                                            const selected = seleccion.toppings.find(t2 => t2.id === t.id)
                                            return (
                                                <button
                                                    key={t.id}
                                                    onClick={() => toggleTopping(t)}
                                                    className={`p-3 rounded-xl border-2 transition-all flex justify-between items-center ${
                                                        selected
                                                            ? 'border-orange-500 bg-orange-50'
                                                            : 'border-gray-200 hover:border-orange-300'
                                                    }`}
                                                >
                                                    <div>
                                                        <p className="font-medium text-sm">{t.nombre}</p>
                                                        <p className="text-xs text-gray-500">+${t.precio_extra}</p>
                                                    </div>
                                                    {selected && <Check className="text-orange-600" size={20} />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Cantidad */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-3">🔢 Cantidad</h4>
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={() => cambiarCantidad(-1)}
                                        className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl"
                                    >
                                        <Minus size={24} />
                                    </button>
                                    <div className="text-center">
                                        <p className="text-4xl font-bold text-orange-600">{seleccion.cantidad}</p>
                                        <p className="text-sm text-gray-500">unidades</p>
                                    </div>
                                    <button
                                        onClick={() => cambiarCantidad(1)}
                                        className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl"
                                    >
                                        <Plus size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Total y confirmar */}
                            <div className="pt-6 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-gray-600">Total</p>
                                    <p className="text-3xl font-bold text-orange-600">${precioTotal.toFixed(2)}</p>
                                </div>
                                <button
                                    onClick={handleAdd}
                                    className="w-full btn-success py-4 text-lg"
                                >
                                    🛒 Agregar al carrito
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}