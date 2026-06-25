'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { calcularIngredientes, verificarStock } from '@/lib/recetas'
import { ChevronLeft, ChevronRight, Check, X, Plus, Minus, ShoppingCart } from 'lucide-react'

export default function FlujoPedido({ onAgregarAlCarrito, onCancelar }) {
    const [paso, setPaso] = useState(0)
    const [seleccion, setSeleccion] = useState({
        categoria: null,
        tamanio: null,
        producto: null,
        toppings: [],
        cantidad: 1
    })
    const [categorias, setCategorias] = useState([])
    const [tamanios, setTamanios] = useState([])
    const [productos, setProductos] = useState([])
    const [toppings, setToppings] = useState([])
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState(null)
    const [precioTotal, setPrecioTotal] = useState(0)

    const pasos = [
        { id: 'categoria', titulo: '¿Qué categoría?', icono: '📂' },
        { id: 'tamanio', titulo: '¿Qué tamaño?', icono: '🍕' },
        { id: 'producto', titulo: '¿Qué producto?', icono: '📋' },
        { id: 'toppings', titulo: '¿Toppings extra?', icono: '🧀' },
        { id: 'cantidad', titulo: '¿Cuántas unidades?', icono: '🔢' },
        { id: 'resumen', titulo: 'Confirmar', icono: '✅' }
    ]

    useEffect(() => {
        cargarCategorias()
        cargarTamanios()
        cargarToppings()
    }, [])

    useEffect(() => {
        if (seleccion.categoria) {
            cargarProductos(seleccion.categoria)
        }
    }, [seleccion.categoria])

    useEffect(() => {
        calcularPrecio()
    }, [seleccion])

    const cargarCategorias = async () => {
        const { data } = await supabase
            .from('categorias')
            .select('*')
            .eq('activo', true)
            .order('nombre')
        setCategorias(data || [])
    }

    const cargarTamanios = async () => {
        const { data } = await supabase
            .from('tamanios_pizza')
            .select('*')
            .eq('activo', true)
            .order('nombre')
        setTamanios(data || [])
    }

    const cargarToppings = async () => {
        const { data } = await supabase
            .from('toppings')
            .select('*, ingredientes (nombre, stock_actual)')
            .eq('activo', true)
            .order('nombre')
        setToppings(data || [])
    }

    const cargarProductos = async (categoriaId) => {
        setCargando(true)
        const { data } = await supabase
            .from('productos_menu')
            .select('*')
            .eq('categoria_id', categoriaId)
            .eq('activo', true)
            .order('nombre')
        setProductos(data || [])
        setCargando(false)
    }

    const calcularPrecio = () => {
        let precio = 0
        if (seleccion.producto) {
            precio = seleccion.producto.precio_venta || 0
            // Sumar toppings
            seleccion.toppings.forEach(t => {
                precio += t.precio_extra || 0
            })
            // Multiplicar por cantidad
            precio *= seleccion.cantidad || 1
        }
        setPrecioTotal(precio)
    }

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

    const seleccionarCategoria = (categoria) => {
        setSeleccion({ ...seleccion, categoria })
        siguientePaso()
    }

    const seleccionarTamanio = (tamanio) => {
        setSeleccion({ ...seleccion, tamanio })
        siguientePaso()
    }

    const seleccionarProducto = (producto) => {
        setSeleccion({ ...seleccion, producto })
        siguientePaso()
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

    const confirmarPedido = async () => {
        setCargando(true)
        setError(null)

        try {
            // Calcular ingredientes
            const ingredientes = await calcularIngredientes(
                seleccion.producto.id,
                seleccion.tamanio.id,
                seleccion.toppings.map(t => t.id),
                seleccion.cantidad
            )

            // Verificar stock
            const erroresStock = await verificarStock(ingredientes)
            if (erroresStock.length > 0) {
                setError(erroresStock)
                return
            }

            // Agregar al carrito
            onAgregarAlCarrito({
                ...seleccion,
                ingredientes,
                precioTotal
            })

        } catch (err) {
            setError([{ message: err.message }])
        } finally {
            setCargando(false)
        }
    }

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
                                <div className="text-4xl mb-2">
                                    {cat.nombre === 'Pizzas' ? '🍕' :
                                     cat.nombre === 'Bebidas' ? '🥤' :
                                     cat.nombre === 'Postres' ? '🍨' :
                                     cat.nombre === 'Entradas' ? '🍢' : '📁'}
                                </div>
                                <p className="font-medium">{cat.nombre}</p>
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
                                <div className="text-4xl mb-2">
                                    {t.nombre === 'Pequeña' ? '👶' :
                                     t.nombre === 'Mediana' ? '👨' :
                                     t.nombre === 'Grande' ? '🦁' : '🍕'}
                                </div>
                                <p className="font-medium">{t.nombre}</p>
                                <p className="text-sm text-gray-500">{t.porciones} porciones</p>
                                <p className="text-orange-600 font-bold">Base: ${t.precio_base}</p>
                            </button>
                        ))}
                    </div>
                )

            case 'producto':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {cargando ? (
                            <p className="col-span-3 text-center text-gray-500">Cargando...</p>
                        ) : productos.length === 0 ? (
                            <p className="col-span-3 text-center text-gray-500">No hay productos en esta categoría</p>
                        ) : (
                            productos.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => seleccionarProducto(p)}
                                    className="card-hover p-6 text-center hover:border-orange-500"
                                >
                                    <div className="text-3xl mb-2">
                                        {p.tipo === 'pizza_fija' ? '🍕' :
                                         p.tipo === 'pizza_personalizable' ? '🎨' : '📦'}
                                    </div>
                                    <p className="font-medium">{p.nombre}</p>
                                    <p className="text-sm text-gray-500 capitalize">{p.tipo?.replace('_', ' ')}</p>
                                    <p className="text-orange-600 font-bold">${p.precio_venta}</p>
                                </button>
                            ))
                        )}
                    </div>
                )

            case 'toppings':
                return (
                    <div>
                        {seleccion.producto?.tipo === 'pizza_personalizable' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {toppings.map(t => {
                                    const selected = seleccion.toppings.find(t2 => t2.id === t.id)
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => toggleTopping(t)}
                                            className={`card p-4 flex justify-between items-center hover:border-orange-500 transition-all ${
                                                selected ? 'border-orange-500 bg-orange-50' : ''
                                            }`}
                                        >
                                            <div>
                                                <p className="font-medium">{t.nombre}</p>
                                                <p className="text-sm text-gray-500">+${t.precio_extra}</p>
                                            </div>
                                            {selected && <Check className="text-orange-600" size={20} />}
                                        </button>
                                    )
                                })}
                                <button
                                    onClick={siguientePaso}
                                    className="col-span-2 btn-primary py-3"
                                >
                                    Continuar sin toppings
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-600">Este producto no permite toppings personalizados.</p>
                                <button onClick={siguientePaso} className="btn-primary mt-4">
                                    Continuar
                                </button>
                            </div>
                        )}
                    </div>
                )

            case 'cantidad':
                return (
                    <div className="text-center py-8">
                        <div className="flex items-center justify-center gap-8">
                            <button
                                onClick={() => cambiarCantidad(-1)}
                                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl"
                            >
                                -
                            </button>
                            <div>
                                <p className="text-6xl font-bold text-orange-600">{seleccion.cantidad}</p>
                                <p className="text-sm text-gray-500">unidades</p>
                            </div>
                            <button
                                onClick={() => cambiarCantidad(1)}
                                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl"
                            >
                                +
                            </button>
                        </div>
                        <div className="mt-6">
                            <p className="text-2xl font-bold text-orange-600">${precioTotal.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">precio total</p>
                        </div>
                        <button onClick={siguientePaso} className="btn-primary mt-6">
                            Continuar
                        </button>
                    </div>
                )

            case 'resumen':
                return (
                    <div className="space-y-6">
                        {error && (
                            <div className="alert-danger">
                                <div>
                                    <p className="font-semibold">❌ Error de stock:</p>
                                    {Array.isArray(error) ? error.map((e, i) => (
                                        <p key={i} className="text-sm">
                                            {e.ingrediente}: disponible {e.disponible}g, necesario {e.necesario}g
                                        </p>
                                    )) : (
                                        <p className="text-sm">{error.message}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="card">
                            <h4 className="font-semibold mb-2">Resumen del pedido</h4>
                            <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Categoría:</span> {seleccion.categoria?.nombre}</p>
                                <p><span className="font-medium">Tamaño:</span> {seleccion.tamanio?.nombre} ({seleccion.tamanio?.porciones} porciones)</p>
                                <p><span className="font-medium">Producto:</span> {seleccion.producto?.nombre}</p>
                                {seleccion.toppings.length > 0 && (
                                    <p><span className="font-medium">Toppings:</span> {seleccion.toppings.map(t => t.nombre).join(', ')}</p>
                                )}
                                <p><span className="font-medium">Cantidad:</span> {seleccion.cantidad}</p>
                                <p className="text-lg font-bold text-orange-600">Total: ${precioTotal.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={confirmarPedido}
                                disabled={cargando}
                                className="btn-success flex-1 py-3 disabled:opacity-50"
                            >
                                {cargando ? '⏳ Verificando...' : '✅ Agregar al Carrito'}
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

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
            {/* Header del flujo */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">
                        {pasos[paso].icono} {pasos[paso].titulo}
                    </h3>
                    <p className="text-sm text-gray-500">Paso {paso + 1} de {pasos.length}</p>
                </div>
                <button
                    onClick={onCancelar}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Barra de progreso */}
            <div className="flex gap-1 mb-6">
                {pasos.map((p, i) => (
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