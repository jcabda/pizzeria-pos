'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ChevronLeft, ChevronRight, Check, Plus, Minus, X } from 'lucide-react'

export default function FlujoPedidoCompleto({ onAgregar, onCancelar }) {
    // Estados principales
    const [paso, setPaso] = useState(0)
    const [categorias, setCategorias] = useState([])
    const [tamanios, setTamanios] = useState([])
    const [sabores, setSabores] = useState([])
    const [toppings, setToppings] = useState([])
    const [cargando, setCargando] = useState(true)
    
    // Selección del usuario
    const [seleccion, setSeleccion] = useState({
        categoria: null,
        tamanio: null,
        sabor: null,
        toppings: [],
        cantidad: 1
    })

    // Precios
    const [precioBase, setPrecioBase] = useState(0)
    const [precioTotal, setPrecioTotal] = useState(0)
    const [limiteToppings, setLimiteToppings] = useState(0)

    // Cargar datos iniciales
    useEffect(() => {
        cargarDatos()
    }, [])

    // Recalcular precio cuando cambia la selección
    useEffect(() => {
        calcularPrecio()
    }, [seleccion])

    // Actualizar límite de toppings según tamaño
    useEffect(() => {
        if (seleccion.tamanio) {
            const limites = {
                'Pequeña': 1,
                'Mediana': 2,
                'Grande': 4
            }
            setLimiteToppings(limites[seleccion.tamanio.nombre] || 0)
            // Limpiar toppings si exceden el nuevo límite
            if (seleccion.toppings.length > limites[seleccion.tamanio.nombre]) {
                setSeleccion(prev => ({
                    ...prev,
                    toppings: prev.toppings.slice(0, limites[seleccion.tamanio.nombre])
                }))
            }
        }
    }, [seleccion.tamanio])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            // Cargar categorías
            const { data: catData } = await supabase
                .from('categorias')
                .select('*')
                .eq('activo', true)
                .order('nombre')
            setCategorias(catData || [])

            // Cargar tamaños
            const { data: tamData } = await supabase
                .from('tamanios_pizza')
                .select('*')
                .eq('activo', true)
                .order('porciones')
            setTamanios(tamData || [])

            // Cargar sabores
            const { data: sabData } = await supabase
                .from('sabores_pizza')
                .select('*')
                .eq('activo', true)
                .order('nombre')
            setSabores(sabData || [])

            // Cargar toppings
            const { data: topData } = await supabase
                .from('toppings')
                .select('*, ingredientes (nombre, stock_actual)')
                .eq('activo', true)
                .order('nombre')
            setToppings(topData || [])
        } catch (error) {
            console.error('Error cargando datos:', error)
        } finally {
            setCargando(false)
        }
    }

    const calcularPrecio = () => {
        let base = 0
        let total = 0

        // Precio base del tamaño
        if (seleccion.tamanio) {
            base = seleccion.tamanio.precio_base || 0
        }

        // + precio del sabor
        if (seleccion.sabor) {
            base += seleccion.sabor.precio_extra || 0
        }

        // + precio de toppings
        let toppingsTotal = 0
        seleccion.toppings.forEach(t => {
            toppingsTotal += t.precio_extra || 0
        })

        total = (base + toppingsTotal) * (seleccion.cantidad || 1)
        setPrecioBase(base)
        setPrecioTotal(total)
    }

    // Navegación
    const siguientePaso = () => {
        if (paso < pasos.length - 1) {
            setPaso(paso + 1)
        }
    }

    const pasoAnterior = () => {
        if (paso > 0) {
            setPaso(paso - 1)
        }
    }

    // Selectores
    const seleccionarCategoria = (categoria) => {
        setSeleccion({ ...seleccion, categoria })
        siguientePaso()
    }

    const seleccionarTamanio = (tamanio) => {
        setSeleccion({ ...seleccion, tamanio, toppings: [] })
        siguientePaso()
    }

    const seleccionarSabor = (sabor) => {
        setSeleccion({ ...seleccion, sabor })
        siguientePaso()
    }

    const toggleTopping = (topping) => {
        setSeleccion(prev => {
            const exists = prev.toppings.find(t => t.id === topping.id)
            if (exists) {
                return { ...prev, toppings: prev.toppings.filter(t => t.id !== topping.id) }
            } else {
                if (prev.toppings.length >= limiteToppings) {
                    alert(`⚠️ Máximo ${limiteToppings} toppings para ${prev.tamanio.nombre}`)
                    return prev
                }
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

    const confirmar = () => {
        onAgregar({
            ...seleccion,
            precioTotal
        })
    }

    // Definir pasos del flujo
    const pasos = [
        { id: 'categoria', titulo: '¿Qué deseas pedir?', icono: '📂' },
        { id: 'tamanio', titulo: '¿Qué tamaño?', icono: '📏' },
        { id: 'sabor', titulo: '¿Qué sabor?', icono: '🍕' },
        { id: 'toppings', titulo: 'Acompañamientos', icono: '🧀' },
        { id: 'cantidad', titulo: '¿Cuántas unidades?', icono: '🔢' },
        { id: 'resumen', titulo: 'Confirmar pedido', icono: '✅' }
    ]

    // Renderizar paso actual
    const renderPaso = () => {
        switch (pasos[paso].id) {
            case 'categoria':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {categorias.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => seleccionarCategoria(cat)}
                                className="card-hover p-6 text-center hover:border-orange-500"
                            >
                                <div className="text-5xl mb-2">
                                    {cat.nombre === 'Pizzas' ? '🍕' :
                                     cat.nombre === 'Bebidas' ? '🥤' :
                                     cat.nombre === 'Postres' ? '🍨' :
                                     cat.nombre === 'Entradas' ? '🍢' : '📁'}
                                </div>
                                <p className="font-bold text-lg">{cat.nombre}</p>
                            </button>
                        ))}
                    </div>
                )

            case 'tamanio':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {tamanios.map(t => (
                            <button
                                key={t.id}
                                onClick={() => seleccionarTamanio(t)}
                                className="card-hover p-6 text-center hover:border-orange-500"
                            >
                                <div className="text-5xl mb-2">
                                    {t.nombre === 'Pequeña' ? '👶' :
                                     t.nombre === 'Mediana' ? '👨' :
                                     t.nombre === 'Grande' ? '🦁' : '🍕'}
                                </div>
                                <p className="font-bold text-lg">{t.nombre}</p>
                                <p className="text-sm text-gray-500">{t.porciones} porciones</p>
                                <p className="text-orange-600 font-bold text-xl">${t.precio_base}</p>
                                {t.nombre === 'Pequeña' && (
                                    <p className="text-xs text-gray-400">Máx 1 acompañamiento</p>
                                )}
                                {t.nombre === 'Mediana' && (
                                    <p className="text-xs text-gray-400">Máx 2 acompañamientos</p>
                                )}
                                {t.nombre === 'Grande' && (
                                    <p className="text-xs text-gray-400">Máx 4 acompañamientos</p>
                                )}
                            </button>
                        ))}
                    </div>
                )

            case 'sabor':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sabores.map(s => (
                            <button
                                key={s.id}
                                onClick={() => seleccionarSabor(s)}
                                className={`card p-4 text-left hover:border-orange-500 transition-all ${
                                    seleccion.sabor?.id === s.id ? 'border-orange-500 bg-orange-50' : ''
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-lg">{s.nombre}</p>
                                        <p className="text-sm text-gray-500">{s.descripcion}</p>
                                    </div>
                                    <div className="text-right">
                                        {s.precio_extra > 0 ? (
                                            <p className="text-orange-600 font-bold">+${s.precio_extra}</p>
                                        ) : (
                                            <p className="text-green-600 font-bold">Incluido</p>
                                        )}
                                        {seleccion.sabor?.id === s.id && (
                                            <Check className="text-orange-600" size={20} />
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )

            case 'toppings':
                return (
                    <div>
                        <div className="mb-4 flex justify-between items-center">
                            <p className="text-sm text-gray-600">
                                Selecciona hasta <strong>{limiteToppings}</strong> acompañamientos para tu {seleccion.tamanio?.nombre}
                            </p>
                            <p className="text-sm font-medium text-orange-600">
                                {seleccion.toppings.length} / {limiteToppings}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {toppings.map(t => {
                                const selected = seleccion.toppings.find(t2 => t2.id === t.id)
                                const disponible = t.ingredientes?.stock_actual > 0
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => disponible && toggleTopping(t)}
                                        disabled={!disponible}
                                        className={`card p-4 flex justify-between items-center hover:border-orange-500 transition-all ${
                                            selected ? 'border-orange-500 bg-orange-50' : ''
                                        } ${!disponible ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div>
                                            <p className="font-medium">{t.nombre}</p>
                                            <p className="text-sm text-gray-500">+${t.precio_extra}</p>
                                            {!disponible && (
                                                <p className="text-xs text-red-500">Sin stock</p>
                                            )}
                                        </div>
                                        {selected && <Check className="text-orange-600" size={20} />}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={siguientePaso}
                                className="btn-primary"
                            >
                                Continuar sin acompañamientos
                            </button>
                        </div>
                    </div>
                )

            case 'cantidad':
                return (
                    <div className="text-center py-8">
                        <div className="flex items-center justify-center gap-8">
                            <button
                                onClick={() => cambiarCantidad(-1)}
                                className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-3xl transition-all"
                            >
                                <Minus size={28} />
                            </button>
                            <div>
                                <p className="text-7xl font-bold text-orange-600">{seleccion.cantidad}</p>
                                <p className="text-sm text-gray-500">unidades</p>
                            </div>
                            <button
                                onClick={() => cambiarCantidad(1)}
                                className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-3xl transition-all"
                            >
                                <Plus size={28} />
                            </button>
                        </div>
                        <div className="mt-6">
                            <p className="text-3xl font-bold text-orange-600">${precioTotal.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">precio total</p>
                        </div>
                        <button onClick={siguientePaso} className="btn-primary mt-6 text-lg px-8 py-3">
                            Continuar
                        </button>
                    </div>
                )

            case 'resumen':
                return (
                    <div className="space-y-6">
                        <div className="card">
                            <h4 className="font-bold text-lg mb-3">📋 Resumen del pedido</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Categoría</span>
                                    <span className="font-medium">{seleccion.categoria?.nombre}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Tamaño</span>
                                    <span className="font-medium">{seleccion.tamanio?.nombre}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Sabor</span>
                                    <span className="font-medium">{seleccion.sabor?.nombre}</span>
                                </div>
                                {seleccion.toppings.length > 0 && (
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Acompañamientos</span>
                                        <span className="font-medium">
                                            {seleccion.toppings.map(t => t.nombre).join(', ')}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Cantidad</span>
                                    <span className="font-medium">{seleccion.cantidad}</span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="text-lg font-bold">Total</span>
                                    <span className="text-2xl font-bold text-orange-600">${precioTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={confirmar}
                                className="btn-success flex-1 py-3 text-lg"
                            >
                                ✅ Agregar al Carrito
                            </button>
                            <button
                                onClick={onCancelar}
                                className="btn-outline px-6"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    if (cargando) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="animate-pulse">
                    <div className="text-4xl mb-4">🍕</div>
                    <p className="text-gray-500">Cargando opciones...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                        {pasos[paso].icono} {pasos[paso].titulo}
                    </h3>
                    <p className="text-sm text-gray-500">Paso {paso + 1} de {pasos.length}</p>
                </div>
                <button
                    onClick={onCancelar}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Barra de progreso */}
            <div className="flex gap-1 mb-6">
                {pasos.map((_, i) => (
                    <div
                        key={i}
                        className={`flex-1 h-2 rounded-full transition-all ${
                            i <= paso ? 'bg-orange-600' : 'bg-gray-200'
                        }`}
                    />
                ))}
            </div>

            {/* Contenido del paso */}
            {renderPaso()}

            {/* Navegación */}
            <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
                <button
                    onClick={pasoAnterior}
                    disabled={paso === 0}
                    className="btn-ghost disabled:opacity-50"
                >
                    <ChevronLeft size={20} /> Atrás
                </button>
                {pasos[paso].id !== 'resumen' && pasos[paso].id !== 'cantidad' && (
                    <button
                        onClick={siguientePaso}
                        className="btn-primary"
                    >
                        Siguiente <ChevronRight size={20} />
                    </button>
                )}
            </div>
        </div>
    )
}