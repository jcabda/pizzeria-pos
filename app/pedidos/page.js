'use client'

import { useState, useEffect, Suspense } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
    ShoppingCart, Trash2, Plus, Minus, Check, X, 
    Pizza, Slice, Search, Edit3, Users, Truck,
    Coffee, Utensils, ArrowLeft
} from 'lucide-react'

function PedidosContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const comandaId = searchParams.get('comanda')
    
    const [empleado, setEmpleado] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [comandaActual, setComandaActual] = useState(null)
    const [mesaActual, setMesaActual] = useState(null)
    
    // ============================================
    // ESTADO DE PRODUCTOS
    // ============================================
    const [categorias, setCategorias] = useState([])
    const [productos, setProductos] = useState([])
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
    const [busqueda, setBusqueda] = useState('')
    
    // ============================================
    // ESTADO DE ITEMS (CARRITO)
    // ============================================
    const [items, setItems] = useState([])
    const [totalItems, setTotalItems] = useState(0)
    
    // ============================================
    // ESTADO DEL CONFIGURADOR DE PIZZA
    // ============================================
    const [mostrarConfigurador, setMostrarConfigurador] = useState(false)
    const [tamanios, setTamanios] = useState([])
    const [sabores, setSabores] = useState([])
    const [toppings, setToppings] = useState([])
    const [configPizza, setConfigPizza] = useState({
        tamanio: null,
        sabor: null,
        toppings: [],
        cantidad: 1,
        multiplicador: 1
    })
    const [productoConfigurando, setProductoConfigurando] = useState(null)

    // ============================================
    // CARGA INICIAL
    // ============================================
    useEffect(() => {
        const userData = localStorage.getItem('usuario')
        if (userData) {
            setEmpleado(JSON.parse(userData))
        }
        cargarDatosIniciales()
        if (comandaId) {
            cargarComanda(comandaId)
        }
    }, [comandaId])

    const cargarComanda = async (id) => {
        try {
            const { data, error } = await supabase
                .from('comandas')
                .select(`
                    *,
                    mesas (numero, capacidad, estado),
                    usuarios (nombre, avatar)
                `)
                .eq('id', id)
                .single()

            if (error) throw error
            setComandaActual(data)
            setMesaActual(data.mesas)
            
            // Cargar items de la comanda
            const { data: itemsData } = await supabase
                .from('comanda_items')
                .select('*')
                .eq('comanda_id', id)
            setItems(itemsData || [])
            setTotalItems(itemsData?.length || 0)
        } catch (error) {
            console.error('Error cargando comanda:', error)
            alert('❌ Error al cargar la comanda')
            router.push('/comandas')
        }
    }

    const cargarDatosIniciales = async () => {
        try {
            // Cargar categorías
            const { data: catData } = await supabase
                .from('categorias')
                .select('*')
                .eq('activo', true)
                .order('nombre')
            setCategorias(catData || [])
            if (catData && catData.length > 0) {
                setCategoriaSeleccionada(catData[0].id)
            }

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
                .select(`
                    *,
                    ingredientes (nombre, stock_actual)
                `)
                .eq('activo', true)
                .order('nombre')
            setToppings(topData || [])

            // Cargar productos
            await cargarProductos(catData?.[0]?.id)

        } catch (error) {
            console.error('Error cargando datos:', error)
        } finally {
            setCargando(false)
        }
    }

    const cargarProductos = async (categoriaId) => {
        if (!categoriaId) return
        try {
            const { data } = await supabase
                .from('productos_menu')
                .select(`
                    *,
                    tamanios_pizza (nombre, porciones, precio_base)
                `)
                .eq('categoria_id', categoriaId)
                .eq('activo', true)
                .order('nombre')
            setProductos(data || [])
        } catch (error) {
            console.error('Error cargando productos:', error)
        }
    }

    // ============================================
    // AGREGAR ITEMS A LA COMANDAS
    // ============================================
    const agregarItem = async (item) => {
        if (!comandaActual) {
            alert('❌ No hay comanda activa. Abre una mesa primero.')
            return
        }

        try {
            const { data, error } = await supabase
                .from('comanda_items')
                .insert({
                    comanda_id: comandaActual.id,
                    producto_menu_id: item.productoId || null,
                    nombre_producto: item.nombre,
                    cantidad: item.cantidad || 1,
                    multiplicador: item.multiplicador || 1,
                    precio_unitario: item.precioUnitario,
                    subtotal: item.subtotal || (item.precioUnitario * (item.cantidad || 1)),
                    tamanio_nombre: item.tamanio?.nombre || null,
                    sabor_nombre: item.sabor?.nombre || null,
                    toppings: item.toppings || []
                })
                .select()
                .single()

            if (error) throw error

            const nuevosItems = [...items, data]
            setItems(nuevosItems)
            setTotalItems(nuevosItems.length)

            // Actualizar subtotal de la comanda
            const nuevoSubtotal = nuevosItems.reduce((sum, i) => sum + (i.subtotal || 0), 0)
            await supabase
                .from('comandas')
                .update({ subtotal: nuevoSubtotal })
                .eq('id', comandaActual.id)

            setMostrarConfigurador(false)

        } catch (error) {
            console.error('Error agregando item:', error)
            alert('❌ Error al agregar el item: ' + error.message)
        }
    }

    const eliminarItem = async (index) => {
        const item = items[index]
        if (!confirm(`¿Eliminar ${item.nombre_producto} de la comanda?`)) return

        try {
            await supabase
                .from('comanda_items')
                .delete()
                .eq('id', item.id)

            const nuevosItems = items.filter((_, i) => i !== index)
            setItems(nuevosItems)
            setTotalItems(nuevosItems.length)

            // Recalcular subtotal
            const nuevoSubtotal = nuevosItems.reduce((sum, i) => sum + (i.subtotal || 0), 0)
            await supabase
                .from('comandas')
                .update({ subtotal: nuevoSubtotal })
                .eq('id', comandaActual.id)

        } catch (error) {
            console.error('Error eliminando item:', error)
            alert('❌ Error al eliminar el item')
        }
    }

    const vaciarItems = async () => {
        if (!confirm('¿Eliminar todos los items de la comanda?')) return

        try {
            for (const item of items) {
                await supabase
                    .from('comanda_items')
                    .delete()
                    .eq('id', item.id)
            }

            setItems([])
            setTotalItems(0)

            await supabase
                .from('comandas')
                .update({ subtotal: 0 })
                .eq('id', comandaActual.id)

        } catch (error) {
            console.error('Error vaciando items:', error)
            alert('❌ Error al vaciar los items')
        }
    }

    // ============================================
    // CONFIGURADOR DE PIZZA
    // ============================================
    const abrirConfigurador = (producto) => {
        setProductoConfigurando(producto)
        setConfigPizza({
            tamanio: producto.tamanios_pizza || null,
            sabor: null,
            toppings: [],
            cantidad: 1,
            multiplicador: 1
        })
        setMostrarConfigurador(true)
    }

    const confirmarPizza = () => {
        if (!configPizza.tamanio) {
            alert('Selecciona un tamaño')
            return
        }
        if (!configPizza.sabor) {
            alert('Selecciona un sabor')
            return
        }

        const precioBase = configPizza.tamanio.precio_base || 0
        const precioSabor = configPizza.sabor.precio_extra || 0
        const precioToppings = configPizza.toppings.reduce((sum, t) => sum + (t.precio_extra || 0), 0)
        const precioUnitario = (precioBase + precioSabor + precioToppings) * (configPizza.multiplicador || 1)
        const subtotal = precioUnitario * (configPizza.cantidad || 1)

        const nombre = `🍕 ${configPizza.sabor.nombre} ${configPizza.tamanio.nombre}`

        agregarItem({
            nombre: nombre,
            productoId: productoConfigurando?.id || null,
            cantidad: configPizza.cantidad,
            multiplicador: configPizza.multiplicador,
            precioUnitario: precioUnitario,
            subtotal: subtotal,
            tamanio: configPizza.tamanio,
            sabor: configPizza.sabor,
            toppings: configPizza.toppings
        })
    }

    const toggleTopping = (topping) => {
        setConfigPizza(prev => {
            const exists = prev.toppings.find(t => t.id === topping.id)
            if (exists) {
                return { ...prev, toppings: prev.toppings.filter(t => t.id !== topping.id) }
            } else {
                return { ...prev, toppings: [...prev.toppings, topping] }
            }
        })
    }

    const cambiarCantidadPizza = (delta) => {
        setConfigPizza(prev => ({
            ...prev,
            cantidad: Math.max(1, Math.min(99, (prev.cantidad || 1) + delta))
        }))
    }

    const cambiarMultiplicadorPizza = (delta) => {
        setConfigPizza(prev => ({
            ...prev,
            multiplicador: Math.max(1, Math.min(10, (prev.multiplicador || 1) + delta))
        }))
    }

    // ============================================
    // PRODUCTOS SIMPLES
    // ============================================
    const agregarProductoSimple = (producto) => {
        agregarItem({
            nombre: producto.nombre,
            productoId: producto.id,
            cantidad: 1,
            multiplicador: 1,
            precioUnitario: producto.precio_venta,
            subtotal: producto.precio_venta,
            tamanio: null,
            sabor: null,
            toppings: []
        })
    }

    // ============================================
    // RENDERIZADO
    // ============================================
    const totalPedido = items.reduce((sum, item) => sum + (item.subtotal || 0), 0)

    const productosFiltrados = productos.filter(p => {
        if (!busqueda) return true
        return p.nombre?.toLowerCase().includes(busqueda.toLowerCase())
    })

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* HEADER CON MARCA Y COMANDAS */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl animate-fire-pulse">🔥</span>
                        <div>
                            <h2 className="text-2xl font-bold">
                                <span className="text-golden">Golden</span>
                                <span className="text-fire"> on </span>
                                <span className="text-fire-orange">Fire</span>
                                <span className="text-gray-800"> - Tomar Pedido</span>
                            </h2>
                            {comandaActual && (
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    <span className="bg-golden/20 text-golden px-2 py-0.5 rounded-full text-xs">
                                        Mesa {mesaActual?.numero}
                                    </span>
                                    <span>👤 {comandaActual.cliente_nombre}</span>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                        {items.length} items
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/comandas" className="btn-secondary text-sm flex items-center gap-2">
                            <ArrowLeft size={16} />
                            Volver a mesas
                        </Link>
                    </div>
                </div>

                {/* ============================================
                    SELECCIÓN DE PRODUCTOS
                    ============================================ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* COLUMNA DE PRODUCTOS */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Búsqueda */}
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="input-field pl-10"
                                placeholder="🔍 Buscar productos..."
                            />
                        </div>

                        {/* Categorías */}
                        <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
                            {categorias.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setCategoriaSeleccionada(cat.id)
                                        cargarProductos(cat.id)
                                    }}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                        categoriaSeleccionada === cat.id
                                            ? 'bg-golden text-dark-golden shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {cat.nombre === 'Pizzas' ? '🍕 ' :
                                     cat.nombre === 'Bebidas' ? '🥤 ' :
                                     cat.nombre === 'Postres' ? '🍨 ' :
                                     cat.nombre === 'Entradas' ? '🍢 ' : ''}
                                    {cat.nombre}
                                </button>
                            ))}
                        </div>

                        {/* Productos */}
                        {cargando ? (
                            <div className="text-center py-8 text-gray-500">Cargando...</div>
                        ) : productosFiltrados.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-4xl mb-2">📭</p>
                                <p>No hay productos en esta categoría</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {productosFiltrados.map(p => {
                                    if (p.tipo === 'pizza_personalizable' || p.tipo === 'pizza_fija') {
                                        return (
                                            <div key={p.id} className="card border-2 border-orange-200 hover:border-golden transition-all">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-lg">🍕 {p.nombre}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {p.tamanios_pizza?.nombre || 'Personalizable'}
                                                        </p>
                                                        <p className="text-sm text-golden font-medium">
                                                            Desde {formatPrice(p.precio_venta)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => abrirConfigurador(p)}
                                                        className="btn-golden text-sm"
                                                    >
                                                        Configurar 🍕
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div
                                            key={p.id}
                                            className="card hover:border-golden transition-all cursor-pointer"
                                            onClick={() => agregarProductoSimple(p)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-3xl">
                                                        {p.nombre.includes('Coca') || p.nombre.includes('Agua') ? '🥤' :
                                                         p.nombre.includes('Helado') || p.nombre.includes('Tiramisú') ? '🍨' :
                                                         p.nombre.includes('Palitos') || p.nombre.includes('Alitas') ? '🍢' : '📦'}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium">{p.nombre}</p>
                                                        <p className="text-sm text-gray-500">Stock: {p.stock || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <p className="font-bold text-golden">{formatPrice(p.precio_venta)}</p>
                                                    <button className="btn-golden text-sm py-1 px-3">
                                                        Agregar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* ============================================
                        ITEMS DE LA COMANDAS (CARRITO)
                        ============================================ */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-36 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <ShoppingCart size={20} /> Comanda
                                    {totalItems > 0 && (
                                        <span className="bg-golden text-dark-golden text-xs px-2 py-0.5 rounded-full">
                                            {totalItems}
                                        </span>
                                    )}
                                </h3>
                                {items.length > 0 && (
                                    <button
                                        onClick={vaciarItems}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Vaciar
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[40vh] overflow-y-auto space-y-3 mb-4">
                                {items.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8 text-sm">
                                        No hay items en la comanda
                                    </p>
                                ) : (
                                    items.map((item, index) => (
                                        <div key={index} className="border-b border-gray-100 pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm text-gray-800">
                                                        {item.nombre_producto}
                                                    </p>
                                                    {item.tamanio_nombre && (
                                                        <p className="text-xs text-gray-500">{item.tamanio_nombre}</p>
                                                    )}
                                                    {item.sabor_nombre && (
                                                        <p className="text-xs text-gray-500">Sabor: {item.sabor_nombre}</p>
                                                    )}
                                                    {item.toppings?.length > 0 && (
                                                        <p className="text-xs text-gray-400">
                                                            + {item.toppings.map(t => t.nombre).join(', ')}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-400">
                                                        {item.cantidad}x {item.multiplicador > 1 && `x${item.multiplicador}`}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-golden text-sm">
                                                        {formatPrice(item.subtotal)}
                                                    </p>
                                                    <button
                                                        onClick={() => eliminarItem(index)}
                                                        className="text-xs text-red-400 hover:text-red-600"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span className="text-golden">{formatPrice(totalPedido)}</span>
                                </div>
                                <p className="text-xs text-gray-400 text-center mt-2">
                                    💡 Los items se agregan directamente a la mesa
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <Link
                                        href="/comandas"
                                        className="btn-secondary flex-1 text-center text-sm py-2"
                                    >
                                        Ver mesa
                                    </Link>
                                    <button
                                        onClick={() => {
                                            if (items.length === 0) {
                                                alert('No hay items para cerrar')
                                                return
                                            }
                                            router.push('/comandas')
                                        }}
                                        className="btn-golden flex-1 text-sm py-2"
                                    >
                                        Cerrar cuenta
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============================================
                    CONFIGURADOR DE PIZZA (MODAL)
                    ============================================ */}
                {mostrarConfigurador && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">
                                    <span className="text-golden">Golden</span>
                                    <span className="text-fire"> on </span>
                                    <span className="text-fire-orange">Fire</span>
                                    <span className="text-gray-800"> - Configurar Pizza</span>
                                </h3>
                                <button
                                    onClick={() => setMostrarConfigurador(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Tamaño */}
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">📏 Tamaño</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {tamanios.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setConfigPizza(prev => ({ ...prev, tamanio: t }))}
                                                className={`p-3 rounded-xl border-2 transition-all ${
                                                    configPizza.tamanio?.id === t.id
                                                        ? 'border-golden bg-golden/10'
                                                        : 'border-gray-200 hover:border-golden'
                                                }`}
                                            >
                                                <p className="font-bold">{t.nombre}</p>
                                                <p className="text-sm text-gray-500">{t.porciones} porciones</p>
                                                <p className="text-golden font-bold">{formatPrice(t.precio_base)}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sabor */}
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">🍕 Sabor</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {sabores.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => setConfigPizza(prev => ({ ...prev, sabor: s }))}
                                                className={`p-2 rounded-xl border-2 transition-all text-left ${
                                                    configPizza.sabor?.id === s.id
                                                        ? 'border-golden bg-golden/10'
                                                        : 'border-gray-200 hover:border-golden'
                                                }`}
                                            >
                                                <p className="font-medium">{s.nombre}</p>
                                                {s.precio_extra > 0 && (
                                                    <p className="text-sm text-gray-500">+{formatPrice(s.precio_extra)}</p>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Toppings */}
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">🧀 Toppings extras</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {toppings.map(t => {
                                            const selected = configPizza.toppings.find(t2 => t2.id === t.id)
                                            return (
                                                <button
                                                    key={t.id}
                                                    onClick={() => toggleTopping(t)}
                                                    className={`p-2 rounded-xl border-2 transition-all flex justify-between items-center ${
                                                        selected
                                                            ? 'border-golden bg-golden/10'
                                                            : 'border-gray-200 hover:border-golden'
                                                    }`}
                                                >
                                                    <span>{t.nombre}</span>
                                                    <span className="text-sm text-gray-500">+{formatPrice(t.precio_extra)}</span>
                                                    {selected && <Check size={16} className="text-golden" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Cantidad y Multiplicador */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">🔢 Cantidad</h4>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => cambiarCantidadPizza(-1)}
                                                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                            >
                                                <Minus size={20} />
                                            </button>
                                            <span className="text-2xl font-bold text-golden min-w-[40px] text-center">
                                                {configPizza.cantidad || 1}
                                            </span>
                                            <button
                                                onClick={() => cambiarCantidadPizza(1)}
                                                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">🔢 Multiplicador</h4>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => cambiarMultiplicadorPizza(-1)}
                                                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                            >
                                                <Minus size={20} />
                                            </button>
                                            <span className="text-2xl font-bold text-fire min-w-[40px] text-center">
                                                {configPizza.multiplicador || 1}
                                            </span>
                                            <button
                                                onClick={() => cambiarMultiplicadorPizza(1)}
                                                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Multiplica todos los ingredientes</p>
                                    </div>
                                </div>

                                {/* Precio y confirmar */}
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div>
                                        <p className="text-sm text-gray-500">Subtotal</p>
                                        <p className="text-2xl font-bold text-golden">
                                            {formatPrice(
                                                ((configPizza.tamanio?.precio_base || 0) +
                                                (configPizza.sabor?.precio_extra || 0) +
                                                configPizza.toppings.reduce((sum, t) => sum + (t.precio_extra || 0), 0)) *
                                                (configPizza.multiplicador || 1) *
                                                (configPizza.cantidad || 1)
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        onClick={confirmarPizza}
                                        className="btn-golden text-lg px-8 py-3"
                                    >
                                        🍕 Agregar Pizza
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

export default function PedidosPage() {
    return (
        <Suspense fallback={
            <DashboardLayout>
                <div className="text-center py-12 text-gray-500">
                    <div className="animate-pulse">
                        <div className="text-4xl mb-4">🍕</div>
                        <p>Cargando pedidos...</p>
                    </div>
                </div>
            </DashboardLayout>
        }>
            <PedidosContent />
        </Suspense>
    )
}