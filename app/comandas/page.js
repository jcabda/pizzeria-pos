'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'
import Link from 'next/link'
import { 
    Users, Coffee, X, Eye, Truck, Plus, Minus, 
    Pizza, Search, ShoppingCart, Trash2, Check,
    Utensils, Home, LogOut, Clock, ChefHat
} from 'lucide-react'

export default function ComandasPage() {
    // ============================================
    // ESTADOS
    // ============================================
    const [mesas, setMesas] = useState([])
    const [comandas, setComandas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)
    
    // Mesa seleccionada
    const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
    const [comandaActiva, setComandaActiva] = useState(null)
    const [itemsComanda, setItemsComanda] = useState([])
    const [mostrarPanelPedido, setMostrarPanelPedido] = useState(false)
    
    // Productos
    const [categorias, setCategorias] = useState([])
    const [productos, setProductos] = useState([])
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
    const [busqueda, setBusqueda] = useState('')
    
    // Configurador de pizza
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
    
    // Meseros
    const [meseros, setMeseros] = useState([])
    const [meseroId, setMeseroId] = useState('')
    const [clienteNombre, setClienteNombre] = useState('')
    const [tipoCliente, setTipoCliente] = useState('local')
    const [mostrarModalCliente, setMostrarModalCliente] = useState(false)
    
    // Estado del empleado actual
    const [empleado, setEmpleado] = useState(null)

    // ============================================
    // CARGA INICIAL
    // ============================================
    useEffect(() => {
        const userData = localStorage.getItem('usuario')
        if (userData) {
            setEmpleado(JSON.parse(userData))
        }
        cargarDatos()
        cargarMeseros()
        cargarProductosBase()
    }, [])

    const cargarMeseros = async () => {
        try {
            const { data } = await supabase
                .from('usuarios')
                .select('id, nombre, avatar')
                .eq('activo', true)
                .in('rol', ['empleado', 'mesero'])
                .order('nombre')
            setMeseros(data || [])
        } catch (error) {
            console.error('Error cargando meseros:', error)
        }
    }

    const cargarProductosBase = async () => {
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
                await cargarProductos(catData[0].id)
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
                .select('*')
                .eq('activo', true)
                .order('nombre')
            setToppings(topData || [])

        } catch (error) {
            console.error('Error cargando productos base:', error)
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

    const cargarDatos = async () => {
        setCargando(true)
        setError(null)
        try {
            // Cargar mesas
            const { data: mesasData } = await supabase
                .from('mesas')
                .select('*')
                .eq('activo', true)
                .order('numero')
            setMesas(mesasData || [])

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

            // Si hay una mesa seleccionada, cargar su comanda
            if (mesaSeleccionada) {
                const comanda = comandasData?.find(c => c.mesa_id === mesaSeleccionada.id)
                if (comanda) {
                    setComandaActiva(comanda)
                    await cargarItemsComanda(comanda.id)
                    setMostrarPanelPedido(true)
                }
            }

            if (mesasData?.length === 0) {
                setError('No hay mesas registradas. Ejecuta el SQL para crear mesas en Supabase.')
            }

        } catch (error) {
            console.error('Error general:', error)
            setError('Error al cargar los datos: ' + error.message)
        } finally {
            setCargando(false)
        }
    }

    const cargarItemsComanda = async (comandaId) => {
        const { data } = await supabase
            .from('comanda_items')
            .select(`
                *,
                productos_menu (nombre)
            `)
            .eq('comanda_id', comandaId)
        setItemsComanda(data || [])
    }

    // ============================================
    // SELECCIÓN DE MESA
    // ============================================
    const seleccionarMesa = async (mesa) => {
        if (mesa.estado === 'ocupada') {
            // Buscar comanda existente
            const comanda = comandas.find(c => c.mesa_id === mesa.id)
            if (comanda) {
                setMesaSeleccionada(mesa)
                setComandaActiva(comanda)
                await cargarItemsComanda(comanda.id)
                setMostrarPanelPedido(true)
                setMostrarModalCliente(false)
                return
            }
        }

        // Mesa disponible - abrir modal para cliente
        setMesaSeleccionada(mesa)
        setMostrarModalCliente(true)
    }

    const abrirMesa = async () => {
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
                    estado_pedido: 'pendiente',
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

            setComandaActiva(data)
            setItemsComanda([])
            setMostrarModalCliente(false)
            setMostrarPanelPedido(true)
            
            // Recargar datos
            cargarDatos()
            
        } catch (error) {
            console.error('Error:', error)
            alert('❌ Error al abrir la mesa: ' + error.message)
        }
    }

    // ============================================
    // AGREGAR ITEMS A LA COMANDAS
    // ============================================
    const agregarItem = async (item) => {
        if (!comandaActiva) {
            alert('❌ No hay comanda activa')
            return
        }

        try {
            const { data, error } = await supabase
                .from('comanda_items')
                .insert({
                    comanda_id: comandaActiva.id,
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

            const nuevosItems = [...itemsComanda, data]
            setItemsComanda(nuevosItems)

            // Actualizar subtotal
            const nuevoSubtotal = nuevosItems.reduce((sum, i) => sum + (i.subtotal || 0), 0)
            await supabase
                .from('comandas')
                .update({ subtotal: nuevoSubtotal })
                .eq('id', comandaActiva.id)

            setMostrarConfigurador(false)

        } catch (error) {
            console.error('Error agregando item:', error)
            alert('❌ Error al agregar el item: ' + error.message)
        }
    }

    const eliminarItem = async (index) => {
        const item = itemsComanda[index]
        if (!confirm(`¿Eliminar ${item.nombre_producto}?`)) return

        try {
            await supabase
                .from('comanda_items')
                .delete()
                .eq('id', item.id)

            const nuevosItems = itemsComanda.filter((_, i) => i !== index)
            setItemsComanda(nuevosItems)

            const nuevoSubtotal = nuevosItems.reduce((sum, i) => sum + (i.subtotal || 0), 0)
            await supabase
                .from('comandas')
                .update({ subtotal: nuevoSubtotal })
                .eq('id', comandaActiva.id)

        } catch (error) {
            console.error('Error eliminando item:', error)
            alert('❌ Error al eliminar el item')
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
    // CONFIRMAR PEDIDO → ENVIAR A COCINA
    // ============================================
    const confirmarPedido = async () => {
        if (itemsComanda.length === 0) {
            alert('No hay items en el pedido')
            return
        }

        if (!confirm('¿Enviar este pedido a cocina?')) return

        try {
            const total = itemsComanda.reduce((sum, item) => sum + (item.subtotal || 0), 0)

            // Actualizar estado de la comanda a "en_cocina"
            await supabase
                .from('comandas')
                .update({ 
                    estado_pedido: 'en_cocina',
                    subtotal: total,
                    total: total
                })
                .eq('id', comandaActiva.id)

            // Crear pedido en la tabla de historial (para cocina)
            const { data: pedidoData } = await supabase
                .from('pedidos')
                .insert({
                    empleado_id: empleado.id,
                    cliente: clienteNombre || 'Cliente',
                    mesa_id: mesaSeleccionada.id,
                    total: total,
                    estado: 'preparando',
                    tiempos: {
                        pendiente_inicio: new Date().toISOString(),
                        pendiente_fin: new Date().toISOString(),
                        preparando_inicio: new Date().toISOString()
                    }
                })
                .select()
                .single()

            // Guardar historial
            await supabase
                .from('comandas_historial')
                .insert({
                    comanda_id: comandaActiva.id,
                    mesa_id: mesaSeleccionada.id,
                    cliente_nombre: clienteNombre || 'Cliente',
                    total: total,
                    items: itemsComanda
                })

            alert(`✅ Pedido enviado a cocina! Total: ${formatPrice(total)}`)
            
            // Limpiar items y actualizar estado
            setItemsComanda([])
            cargarDatos()

        } catch (error) {
            console.error('Error confirmando pedido:', error)
            alert('❌ Error al enviar el pedido a cocina')
        }
    }

    // ============================================
    // PAGAR Y CERRAR CUENTA
    // ============================================
    const pagarCuenta = async () => {
        if (!confirm('¿Confirmar pago y cerrar la cuenta?')) return

        try {
            const total = itemsComanda.reduce((sum, item) => sum + (item.subtotal || 0), 0)

            // Actualizar comanda
            await supabase
                .from('comandas')
                .update({
                    estado: 'cerrada',
                    total: total,
                    updated_at: new Date().toISOString()
                })
                .eq('id', comandaActiva.id)

            // Liberar mesa
            await supabase
                .from('mesas')
                .update({ estado: 'disponible' })
                .eq('id', mesaSeleccionada.id)

            // Guardar en historial
            await supabase
                .from('comandas_historial')
                .insert({
                    comanda_id: comandaActiva.id,
                    mesa_id: mesaSeleccionada.id,
                    cliente_nombre: clienteNombre || 'Cliente',
                    total: total,
                    items: itemsComanda
                })

            alert(`✅ Cuenta cerrada. Total: ${formatPrice(total)}`)

            // Resetear estado
            setMesaSeleccionada(null)
            setComandaActiva(null)
            setItemsComanda([])
            setMostrarPanelPedido(false)
            setClienteNombre('')
            cargarDatos()

        } catch (error) {
            console.error('Error pagando cuenta:', error)
            alert('❌ Error al pagar la cuenta')
        }
    }

    // ============================================
    // RENDERIZADO
    // ============================================
    const totalPedido = itemsComanda.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    const productosFiltrados = productos.filter(p => {
        if (!busqueda) return true
        return p.nombre?.toLowerCase().includes(busqueda.toLowerCase())
    })

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

    // Verificar permisos del empleado
    const esMesero = empleado?.rol === 'mesero' || empleado?.rol === 'empleado'
    const esAdmin = empleado?.rol === 'admin'

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
                        <p className="text-sm text-gray-500">Selecciona una mesa para tomar pedido</p>
                    </div>
                    <button onClick={cargarDatos} className="btn-secondary text-sm">
                        🔄 Actualizar
                    </button>
                </div>

                {/* Grid de Mesas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {cargando ? (
                        <div className="col-span-full text-center py-12 text-gray-500">Cargando mesas...</div>
                    ) : mesas.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <p className="text-4xl mb-2">🍽️</p>
                            <p>No hay mesas registradas</p>
                        </div>
                    ) : (
                        mesas.map((mesa) => {
                            const comanda = comandas.find(c => c.mesa_id === mesa.id)
                            const items = itemsComanda
                            const estaActiva = mesaSeleccionada?.id === mesa.id
                            
                            return (
                                <div
                                    key={mesa.id}
                                    onClick={() => seleccionarMesa(mesa)}
                                    className={`bg-white rounded-xl shadow-sm p-4 border-2 transition-all cursor-pointer ${
                                        estaActiva ? 'border-golden shadow-md' : getEstadoColor(mesa.estado)
                                    }`}
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
                                                {comanda.estado_pedido === 'en_cocina' && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                        🔪 En cocina
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {estaActiva && (
                                            <div className="mt-2 text-xs text-golden font-medium">
                                                ✅ Seleccionada
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* ============================================
                    PANEL DE PEDIDO (se muestra al seleccionar mesa)
                    ============================================ */}
                {mostrarPanelPedido && mesaSeleccionada && comandaActiva && (
                    <div className="bg-white rounded-xl shadow-lg border-2 border-golden p-4 animate-fade-in">
                        {/* Header de la mesa */}
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                            <div>
                                <p className="font-bold text-lg">
                                    Mesa {mesaSeleccionada.numero} - {comandaActiva.cliente_nombre}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {itemsComanda.length} items · Total: {formatPrice(totalPedido)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={confirmarPedido}
                                    disabled={itemsComanda.length === 0}
                                    className="btn-primary text-sm disabled:opacity-50"
                                >
                                    <ChefHat size={16} />
                                    Enviar a Cocina
                                </button>
                                <button
                                    onClick={pagarCuenta}
                                    disabled={itemsComanda.length === 0}
                                    className="btn-golden text-sm disabled:opacity-50"
                                >
                                    💳 Pagar
                                </button>
                                <button
                                    onClick={() => {
                                        setMostrarPanelPedido(false)
                                        setMesaSeleccionada(null)
                                        setComandaActiva(null)
                                        setItemsComanda([])
                                    }}
                                    className="btn-secondary text-sm"
                                >
                                    <X size={16} /> Cerrar
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* PRODUCTOS */}
                            <div className="lg:col-span-2 space-y-3">
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
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
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

                                {/* Productos en scroll horizontal */}
                                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                                    {productosFiltrados.length === 0 ? (
                                        <p className="text-center text-gray-500 py-4">No hay productos</p>
                                    ) : (
                                        productosFiltrados.map(p => {
                                            if (p.tipo === 'pizza_personalizable' || p.tipo === 'pizza_fija') {
                                                return (
                                                    <div key={p.id} className="border border-orange-200 rounded-lg p-3 hover:border-golden transition-all">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium text-sm">{p.nombre}</p>
                                                                <p className="text-xs text-gray-500">{p.tamanios_pizza?.nombre || 'Personalizable'}</p>
                                                                <p className="text-xs text-golden font-medium">{formatPrice(p.precio_venta)}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => abrirConfigurador(p)}
                                                                className="btn-golden text-xs py-1 px-3"
                                                            >
                                                                Configurar
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            }

                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => agregarProductoSimple(p)}
                                                    className="border border-gray-200 rounded-lg p-3 hover:border-golden cursor-pointer transition-all"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">
                                                                {p.nombre.includes('Coca') || p.nombre.includes('Agua') ? '🥤' :
                                                                 p.nombre.includes('Helado') || p.nombre.includes('Tiramisú') ? '🍨' :
                                                                 p.nombre.includes('Palitos') || p.nombre.includes('Alitas') ? '🍢' : '📦'}
                                                            </span>
                                                            <div>
                                                                <p className="font-medium text-sm">{p.nombre}</p>
                                                                <p className="text-xs text-gray-400">Stock: {p.stock || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <p className="font-bold text-golden text-sm">{formatPrice(p.precio_venta)}</p>
                                                            <button className="btn-golden text-xs py-1 px-2">
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>

                            {/* ITEMS DE LA COMANDAS */}
                            <div className="lg:col-span-1">
                                <div className="bg-gray-50 rounded-xl p-3 max-h-[400px] overflow-y-auto">
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <ShoppingCart size={16} />
                                        Pedido
                                        <span className="text-xs bg-golden text-dark-golden px-2 py-0.5 rounded-full">
                                            {itemsComanda.length}
                                        </span>
                                    </h4>
                                    {itemsComanda.length === 0 ? (
                                        <p className="text-gray-400 text-sm text-center py-4">
                                            Agrega productos
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {itemsComanda.map((item, index) => (
                                                <div key={index} className="bg-white rounded-lg p-2 border border-gray-200 text-sm">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <p className="font-medium">{item.nombre_producto}</p>
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
                                                        <div className="text-right">
                                                            <p className="font-bold text-golden text-xs">
                                                                {formatPrice(item.subtotal)}
                                                            </p>
                                                            <button
                                                                onClick={() => eliminarItem(index)}
                                                                className="text-red-400 hover:text-red-600 text-xs"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="border-t pt-2 mt-2">
                                                <div className="flex justify-between font-bold text-sm">
                                                    <span>Total</span>
                                                    <span className="text-golden">{formatPrice(totalPedido)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal para abrir mesa */}
                {mostrarModalCliente && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">🔥 Abrir mesa {mesaSeleccionada?.numero}</h3>
                                <button onClick={() => setMostrarModalCliente(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
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
                                    onClick={abrirMesa}
                                    className="btn-golden w-full justify-center"
                                >
                                    <Users size={18} />
                                    Abrir mesa
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Configurador de pizza */}
                {mostrarConfigurador && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">🍕 Configurar Pizza</h3>
                                <button onClick={() => setMostrarConfigurador(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Tamaño */}
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">📏 Tamaño</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {tamanios.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setConfigPizza(prev => ({ ...prev, tamanio: t }))}
                                                className={`p-2 rounded-xl border-2 transition-all ${
                                                    configPizza.tamanio?.id === t.id
                                                        ? 'border-golden bg-golden/10'
                                                        : 'border-gray-200 hover:border-golden'
                                                }`}
                                            >
                                                <p className="font-bold text-sm">{t.nombre}</p>
                                                <p className="text-xs text-gray-500">{t.porciones} porciones</p>
                                                <p className="text-xs text-golden">{formatPrice(t.precio_base)}</p>
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
                                                <p className="font-medium text-sm">{s.nombre}</p>
                                                {s.precio_extra > 0 && (
                                                    <p className="text-xs text-gray-500">+{formatPrice(s.precio_extra)}</p>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Toppings */}
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">🧀 Toppings</h4>
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
                                                    <span className="text-sm">{t.nombre}</span>
                                                    <span className="text-xs text-gray-500">+{formatPrice(t.precio_extra)}</span>
                                                    {selected && <Check size={14} className="text-golden" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Cantidad y multiplicador */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">🔢 Cantidad</h4>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => cambiarCantidadPizza(-1)}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="text-xl font-bold text-golden min-w-[30px] text-center">
                                                {configPizza.cantidad || 1}
                                            </span>
                                            <button
                                                onClick={() => cambiarCantidadPizza(1)}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">🔢 Multiplicador</h4>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => cambiarMultiplicadorPizza(-1)}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="text-xl font-bold text-fire min-w-[30px] text-center">
                                                {configPizza.multiplicador || 1}
                                            </span>
                                            <button
                                                onClick={() => cambiarMultiplicadorPizza(1)}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Multiplica ingredientes</p>
                                    </div>
                                </div>

                                {/* Precio y confirmar */}
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div>
                                        <p className="text-sm text-gray-500">Subtotal</p>
                                        <p className="text-xl font-bold text-golden">
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
                                        className="btn-golden text-sm px-6 py-2"
                                    >
                                        Agregar Pizza
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