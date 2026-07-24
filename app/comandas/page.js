'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'
import { 
    Users, X, Plus, Minus, Pizza, Search, 
    ShoppingCart, Trash2, ChefHat, Coffee, 
    Utensils, Check, Flame, Sparkles, Clock,
    ChevronDown, ChevronRight, Eye
} from 'lucide-react'

export default function ComandasPage() {
    const [empleado, setEmpleado] = useState(null)
    const [mesas, setMesas] = useState([])
    const [comandas, setComandas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)
    
    // Mesa seleccionada
    const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
    const [comandaActiva, setComandaActiva] = useState(null)
    const [itemsComanda, setItemsComanda] = useState([])
    const [mostrarPanelPedido, setMostrarPanelPedido] = useState(false)
    const [subtotalAcumulado, setSubtotalAcumulado] = useState(0)
    
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
        sabores: [],
        toppings: [],
        cantidad: 1
    })
    const [productoConfigurando, setProductoConfigurando] = useState(null)
    const [saboresAbiertos, setSaboresAbiertos] = useState(false)
    const [toppingsAbiertos, setToppingsAbiertos] = useState(false)
    
    // Cliente
    const [clienteNombre, setClienteNombre] = useState('')
    const [tipoCliente, setTipoCliente] = useState('local')
    const [mostrarModalCliente, setMostrarModalCliente] = useState(false)

    // ============================================
    // CARGA INICIAL
    // ============================================
    useEffect(() => {
        const userData = localStorage.getItem('usuario')
        if (userData) {
            setEmpleado(JSON.parse(userData))
        }
        cargarDatos()
        cargarProductosBase()
    }, [])

    const cargarProductosBase = async () => {
        try {
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

            const { data: tamData } = await supabase
                .from('tamanios_pizza')
                .select('*')
                .eq('activo', true)
                .order('porciones')
            setTamanios(tamData || [])

            const { data: sabData } = await supabase
                .from('sabores_pizza')
                .select('*')
                .eq('activo', true)
                .order('nombre')
            setSabores(sabData || [])

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
                    tamanios_pizza (nombre, porciones, precio_base, max_sabores)
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
            const { data: mesasData } = await supabase
                .from('mesas')
                .select('*')
                .eq('activo', true)
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

            if (mesaSeleccionada) {
                const comanda = comandasData?.find(c => c.mesa_id === mesaSeleccionada.id)
                if (comanda) {
                    setComandaActiva(comanda)
                    await cargarItemsComanda(comanda.id)
                    setMostrarPanelPedido(true)
                    // Calcular subtotal acumulado de items ya enviados a cocina
                    const { data: items } = await supabase
                        .from('comanda_items')
                        .select('subtotal')
                        .eq('comanda_id', comanda.id)
                        .eq('enviado_a_cocina', true)
                    const total = items?.reduce((sum, i) => sum + (i.subtotal || 0), 0) || 0
                    setSubtotalAcumulado(total)
                }
            }

            if (mesasData?.length === 0) {
                setError('No hay mesas registradas. Ejecuta el SQL para crear mesas.')
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
            .order('created_at', { ascending: true })
        setItemsComanda(data || [])
    }

    // ============================================
    // SELECCIÓN DE MESA
    // ============================================
    const seleccionarMesa = async (mesa) => {
        if (mesa.estado === 'ocupada') {
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

        setMesaSeleccionada(mesa)
        setMostrarModalCliente(true)
    }

    const abrirMesa = async () => {
        if (!mesaSeleccionada) return
        if (!empleado) {
            alert('❌ No hay empleado logueado')
            return
        }

        try {
            const { data, error } = await supabase
                .from('comandas')
                .insert({
                    mesa_id: mesaSeleccionada.id,
                    mesero_id: empleado.id,
                    cliente_nombre: clienteNombre || 'Cliente',
                    tipo_cliente: tipoCliente,
                    estado: 'abierta',
                    estado_pedido: 'pendiente',
                    subtotal: 0,
                    servicio: 0,
                    total: 0,
                    subtotal_en_cocina: 0
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
            setSubtotalAcumulado(0)
            setMostrarModalCliente(false)
            setMostrarPanelPedido(true)
            
            cargarDatos()
            
        } catch (error) {
            console.error('Error:', error)
            alert('❌ Error al abrir la mesa: ' + error.message)
        }
    }

    // ============================================
    // AGREGAR ITEMS
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
                    multiplicador: 1,
                    precio_unitario: item.precioUnitario,
                    subtotal: item.subtotal || (item.precioUnitario * (item.cantidad || 1)),
                    tamanio_nombre: item.tamanio?.nombre || null,
                    sabor_nombre: item.sabor?.nombre || null,
                    toppings: item.toppings || [],
                    enviado_a_cocina: false
                })
                .select()
                .single()

            if (error) throw error

            const nuevosItems = [...itemsComanda, data]
            setItemsComanda(nuevosItems)

            // Actualizar subtotal total (todo lo que está en la mesa, enviado o no)
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
    // ENVIAR A COCINA - LÓGICA CORREGIDA
    // ============================================
    const enviarACocina = async () => {
        // Obtener items NO enviados
        const itemsNoEnviados = itemsComanda.filter(item => !item.enviado_a_cocina)
        
        if (itemsNoEnviados.length === 0) {
            alert('No hay nuevos items para enviar a cocina')
            return
        }

        if (!confirm(`¿Enviar ${itemsNoEnviados.length} item(s) a cocina?`)) return

        try {
            // Marcar items como enviados
            for (const item of itemsNoEnviados) {
                await supabase
                    .from('comanda_items')
                    .update({ enviado_a_cocina: true })
                    .eq('id', item.id)
            }

            // Calcular subtotal de los items enviados
            const subtotalEnviado = itemsNoEnviados.reduce((sum, i) => sum + (i.subtotal || 0), 0)
            const nuevoSubtotalEnCocina = (comandaActiva.subtotal_en_cocina || 0) + subtotalEnviado

            // Actualizar comanda
            await supabase
                .from('comandas')
                .update({ 
                    estado_pedido: 'en_cocina',
                    subtotal_en_cocina: nuevoSubtotalEnCocina
                })
                .eq('id', comandaActiva.id)

            // Recargar items (para ocultar los enviados)
            await cargarItemsComanda(comandaActiva.id)
            
            // Actualizar subtotal acumulado
            setSubtotalAcumulado(nuevoSubtotalEnCocina)

            // Crear pedido en cocina
            await supabase
                .from('pedidos')
                .insert({
                    empleado_id: empleado.id,
                    cliente: clienteNombre || 'Cliente',
                    mesa_id: mesaSeleccionada.id,
                    total: subtotalEnviado,
                    estado: 'preparando',
                    tiempos: {
                        pendiente_inicio: new Date().toISOString(),
                        pendiente_fin: new Date().toISOString(),
                        preparando_inicio: new Date().toISOString()
                    },
                    items: itemsNoEnviados.map(i => ({
                        nombre: i.nombre_producto,
                        cantidad: i.cantidad,
                        subtotal: i.subtotal
                    }))
                })

            alert(`✅ ${itemsNoEnviados.length} item(s) enviados a cocina!`)

        } catch (error) {
            console.error('Error enviando a cocina:', error)
            alert('❌ Error al enviar a cocina')
        }
    }

    // ============================================
    // CONFIGURADOR DE PIZZA
    // ============================================
    const abrirConfigurador = (producto) => {
        setProductoConfigurando(producto)
        setConfigPizza({
            tamanio: producto.tamanios_pizza || null,
            sabores: [],
            toppings: [],
            cantidad: 1
        })
        setSaboresAbiertos(false)  // CERRADO POR DEFECTO
        setToppingsAbiertos(false) // CERRADO POR DEFECTO
        setMostrarConfigurador(true)
    }

    const toggleSabor = (sabor) => {
        setConfigPizza(prev => {
            const exists = prev.sabores.find(s => s.id === sabor.id)
            const maxSabores = prev.tamanio?.max_sabores || 1
            
            if (exists) {
                return { ...prev, sabores: prev.sabores.filter(s => s.id !== sabor.id) }
            } else {
                if (prev.sabores.length >= maxSabores) {
                    alert(`⚠️ Máximo ${maxSabores} sabor(es) para ${prev.tamanio?.nombre || 'este tamaño'}`)
                    return prev
                }
                return { ...prev, sabores: [...prev.sabores, sabor] }
            }
        })
    }

    const cambiarCantidadTopping = (topping, delta) => {
        setConfigPizza(prev => {
            const exists = prev.toppings.find(t => t.id === topping.id)
            if (exists) {
                const nuevaCantidad = Math.max(0, exists.cantidad + delta)
                if (nuevaCantidad === 0) {
                    return { ...prev, toppings: prev.toppings.filter(t => t.id !== topping.id) }
                }
                return {
                    ...prev,
                    toppings: prev.toppings.map(t => 
                        t.id === topping.id ? { ...t, cantidad: nuevaCantidad } : t
                    )
                }
            } else {
                if (delta > 0) {
                    return { ...prev, toppings: [...prev.toppings, { ...topping, cantidad: 1 }] }
                }
                return prev
            }
        })
    }

    const getCantidadTopping = (toppingId) => {
        const found = configPizza.toppings.find(t => t.id === toppingId)
        return found?.cantidad || 0
    }

    const calcularPrecioPizza = () => {
        let base = configPizza.tamanio?.precio_base || 0
        const saboresExtra = configPizza.sabores.reduce((sum, s) => sum + (s.precio_extra || 0), 0)
        const toppingsExtra = configPizza.toppings.reduce((sum, t) => sum + ((t.precio_extra || 0) * (t.cantidad || 1)), 0)
        return (base + saboresExtra + toppingsExtra) * (configPizza.cantidad || 1)
    }

    const confirmarPizza = () => {
        if (!configPizza.tamanio) {
            alert('Selecciona un tamaño')
            return
        }
        if (configPizza.sabores.length === 0) {
            alert('Selecciona al menos 1 sabor')
            return
        }

        const precioTotal = calcularPrecioPizza()
        const nombreSabores = configPizza.sabores.map(s => s.nombre).join(' + ')
        const nombre = `🍕 ${nombreSabores} ${configPizza.tamanio.nombre}`

        agregarItem({
            nombre: nombre,
            productoId: productoConfigurando?.id || null,
            cantidad: configPizza.cantidad,
            multiplicador: 1,
            precioUnitario: precioTotal / (configPizza.cantidad || 1),
            subtotal: precioTotal,
            tamanio: configPizza.tamanio,
            sabor: configPizza.sabores[0] || null,
            toppings: configPizza.toppings.map(t => ({ ...t, nombre: t.nombre }))
        })
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
    // PAGAR Y CERRAR
    // ============================================
    const pagarCuenta = async () => {
        if (itemsComanda.length === 0 && subtotalAcumulado === 0) {
            alert('No hay items en la cuenta')
            return
        }

        if (!confirm('¿Confirmar pago y cerrar la cuenta?')) return

        try {
            const total = itemsComanda.reduce((sum, item) => sum + (item.subtotal || 0), 0) + subtotalAcumulado

            // Cerrar comanda
            await supabase
                .from('comandas')
                .update({
                    estado: 'cerrada',
                    total: total,
                    updated_at: new Date().toISOString()
                })
                .eq('id', comandaActiva.id)

            // Guardar historial
            await supabase
                .from('comandas_historial')
                .insert({
                    comanda_id: comandaActiva.id,
                    mesa_id: mesaSeleccionada.id,
                    cliente_nombre: clienteNombre || 'Cliente',
                    total: total,
                    items: itemsComanda.map(i => ({
                        nombre: i.nombre_producto,
                        cantidad: i.cantidad,
                        subtotal: i.subtotal,
                        enviado: i.enviado_a_cocina
                    }))
                })

            // Liberar mesa
            await supabase
                .from('mesas')
                .update({ estado: 'disponible' })
                .eq('id', mesaSeleccionada.id)

            alert(`✅ Cuenta cerrada. Total: ${formatPrice(total)}`)

            // Resetear
            setMesaSeleccionada(null)
            setComandaActiva(null)
            setItemsComanda([])
            setSubtotalAcumulado(0)
            setMostrarPanelPedido(false)
            setClienteNombre('')
            cargarDatos()

        } catch (error) {
            console.error('Error pagando cuenta:', error)
            alert('❌ Error al pagar la cuenta')
        }
    }

    // ============================================
    // RENDER
    // ============================================
    const totalPedido = itemsComanda.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    const totalGeneral = totalPedido + subtotalAcumulado
    const itemsNoEnviados = itemsComanda.filter(item => !item.enviado_a_cocina)
    
    const productosFiltrados = productos.filter(p => {
        if (!busqueda) return true
        return p.nombre?.toLowerCase().includes(busqueda.toLowerCase())
    })

    const getEstadoColor = (estado) => {
        const colores = {
            disponible: 'border-green-500/30 bg-green-500/10',
            ocupada: 'border-yellow-500/30 bg-yellow-500/10',
            reservada: 'border-blue-500/30 bg-blue-500/10',
        }
        return colores[estado] || 'border-white/10 bg-white/5'
    }

    const getEstadoEmoji = (estado) => {
        const emojis = {
            disponible: '🪑',
            ocupada: '🍽️',
            reservada: '🔵',
        }
        return emojis[estado] || '❓'
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">
                            <span className="text-gradient-golden">Golden</span>
                            <span className="text-white"> on </span>
                            <span className="text-gradient-fire">Fire</span>
                            <span className="text-white-60"> - Mesas</span>
                        </h2>
                        <p className="text-sm text-white-40">Selecciona una mesa para tomar pedido</p>
                    </div>
                    <button onClick={cargarDatos} className="btn-secondary text-sm">
                        🔄 Actualizar
                    </button>
                </div>

                {/* Grid de Mesas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {cargando ? (
                        <div className="col-span-full text-center py-12 text-white-40">Cargando mesas...</div>
                    ) : mesas.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-white-40">
                            <p className="text-6xl mb-4">🍽️</p>
                            <p>No hay mesas registradas</p>
                        </div>
                    ) : (
                        mesas.map((mesa) => {
                            const comanda = comandas.find(c => c.mesa_id === mesa.id)
                            const estaActiva = mesaSeleccionada?.id === mesa.id
                            
                            return (
                                <div
                                    key={mesa.id}
                                    onClick={() => seleccionarMesa(mesa)}
                                    className={`glass rounded-xl p-4 border-2 cursor-pointer transition-all ${
                                        estaActiva 
                                            ? 'border-golden shadow-golden' 
                                            : getEstadoColor(mesa.estado)
                                    } hover:border-golden/50`}
                                >
                                    <div className="text-center">
                                        <div className="text-4xl mb-2 animate-float">
                                            {getEstadoEmoji(mesa.estado)}
                                        </div>
                                        <p className="font-bold text-white text-lg">Mesa {mesa.numero}</p>
                                        <p className="text-xs text-white-40">
                                            {mesa.estado.charAt(0).toUpperCase() + mesa.estado.slice(1)}
                                        </p>
                                        {comanda && (
                                            <div className="mt-2 text-sm">
                                                <p className="font-medium text-golden">
                                                    {formatPrice(comanda.subtotal)}
                                                </p>
                                                <p className="text-xs text-white-30">
                                                    {comanda.usuarios?.nombre}
                                                </p>
                                                {comanda.estado_pedido === 'en_cocina' && (
                                                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                                                        🔪 En cocina
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {estaActiva && (
                                            <div className="mt-2 text-xs text-golden animate-pulse">
                                                ✅ Seleccionada
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Panel de pedido */}
                {mostrarPanelPedido && mesaSeleccionada && comandaActiva && (
                    <div className="glass-golden rounded-2xl p-4 border border-golden/30 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                            <div>
                                <p className="font-bold text-lg text-white">
                                    Mesa {mesaSeleccionada.numero} - {comandaActiva.cliente_nombre}
                                </p>
                                <div className="flex gap-3 text-sm text-white-40">
                                    <span>{itemsComanda.length} items pendientes</span>
                                    <span>|</span>
                                    <span className="text-golden">Subtotal: {formatPrice(totalPedido)}</span>
                                    {subtotalAcumulado > 0 && (
                                        <span className="text-blue-400">En cocina: {formatPrice(subtotalAcumulado)}</span>
                                    )}
                                    <span>|</span>
                                    <span className="text-golden font-bold">Total: {formatPrice(totalGeneral)}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {itemsNoEnviados.length > 0 && (
                                    <button
                                        onClick={enviarACocina}
                                        className="btn-primary text-sm"
                                    >
                                        <ChefHat size={16} />
                                        Enviar a Cocina ({itemsNoEnviados.length})
                                    </button>
                                )}
                                <button
                                    onClick={pagarCuenta}
                                    disabled={itemsComanda.length === 0 && subtotalAcumulado === 0}
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
                                        setSubtotalAcumulado(0)
                                    }}
                                    className="btn-secondary text-sm"
                                >
                                    <X size={16} /> Cerrar
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Productos */}
                            <div className="lg:col-span-2 space-y-3">
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white-30" />
                                    <input
                                        type="text"
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                        className="input-field pl-10"
                                        placeholder="🔍 Buscar productos..."
                                    />
                                </div>

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
                                                    ? 'bg-golden/20 text-golden border border-golden/30'
                                                    : 'bg-white/5 text-white-40 hover:text-white hover:bg-white/10'
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

                                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 scrollbar-golden">
                                    {productosFiltrados.length === 0 ? (
                                        <p className="text-center text-white-40 py-4">No hay productos</p>
                                    ) : (
                                        productosFiltrados.map(p => {
                                            if (p.tipo === 'pizza_personalizable' || p.tipo === 'pizza_fija') {
                                                return (
                                                    <div key={p.id} className="glass rounded-xl p-3 hover:border-golden/50 transition-all">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium text-white text-sm">{p.nombre}</p>
                                                                <p className="text-xs text-white-40">{p.tamanios_pizza?.nombre || 'Personalizable'}</p>
                                                                <p className="text-xs text-golden font-medium">{formatPrice(p.precio_venta)}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => abrirConfigurador(p)}
                                                                className="btn-golden text-xs py-1 px-3"
                                                            >
                                                                Crear Pizza 🍕
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            }

                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => agregarProductoSimple(p)}
                                                    className="glass rounded-xl p-3 hover:border-golden/30 cursor-pointer transition-all"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">
                                                                {p.nombre.includes('Coca') || p.nombre.includes('Agua') ? '🥤' :
                                                                 p.nombre.includes('Helado') || p.nombre.includes('Tiramisú') ? '🍨' :
                                                                 p.nombre.includes('Palitos') || p.nombre.includes('Alitas') ? '🍢' : '📦'}
                                                            </span>
                                                            <div>
                                                                <p className="font-medium text-white text-sm">{p.nombre}</p>
                                                                <p className="text-xs text-white-30">Stock: {p.stock || 'N/A'}</p>
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

                            {/* Items de la comanda */}
                            <div className="lg:col-span-1">
                                <div className="glass rounded-xl p-3 max-h-[400px] overflow-y-auto scrollbar-golden">
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-white">
                                        <ShoppingCart size={16} />
                                        Pedido
                                        <span className="text-xs bg-golden/20 text-golden px-2 py-0.5 rounded-full border border-golden/20">
                                            {itemsComanda.filter(i => !i.enviado_a_cocina).length} pendientes
                                        </span>
                                        {subtotalAcumulado > 0 && (
                                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                                                {formatPrice(subtotalAcumulado)} en cocina
                                            </span>
                                        )}
                                    </h4>
                                    {itemsComanda.length === 0 ? (
                                        <p className="text-white-30 text-sm text-center py-4">
                                            Agrega productos
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {/* Items enviados a cocina (grises) */}
                                            {itemsComanda.filter(i => i.enviado_a_cocina).map((item, index) => (
                                                <div key={`enviado-${index}`} className="glass rounded-lg p-2 border border-white/5 opacity-50">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-white text-sm line-through">
                                                                {item.nombre_producto}
                                                            </p>
                                                            <p className="text-xs text-white-30">✅ En cocina</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-golden text-xs">
                                                                {formatPrice(item.subtotal)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Items pendientes (no enviados) */}
                                            {itemsComanda.filter(i => !i.enviado_a_cocina).map((item, index) => (
                                                <div key={`pendiente-${index}`} className="glass rounded-lg p-2 border border-golden/20">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-white text-sm">{item.nombre_producto}</p>
                                                            {item.tamanio_nombre && (
                                                                <p className="text-xs text-white-40">{item.tamanio_nombre}</p>
                                                            )}
                                                            {item.sabor_nombre && (
                                                                <p className="text-xs text-white-40">Sabor: {item.sabor_nombre}</p>
                                                            )}
                                                            <p className="text-xs text-white-30">
                                                                {item.cantidad}x
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-golden text-xs">
                                                                {formatPrice(item.subtotal)}
                                                            </p>
                                                            <button
                                                                onClick={() => eliminarItem(itemsComanda.indexOf(item))}
                                                                className="text-red-400 hover:text-red-300 text-xs"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="border-t border-white/10 pt-2 mt-2">
                                                <div className="flex justify-between font-bold text-sm">
                                                    <span className="text-white-60">Total pendiente</span>
                                                    <span className="text-golden">{formatPrice(totalPedido)}</span>
                                                </div>
                                                {subtotalAcumulado > 0 && (
                                                    <div className="flex justify-between text-sm text-white-40">
                                                        <span>En cocina</span>
                                                        <span>{formatPrice(subtotalAcumulado)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between font-bold text-base pt-1 border-t border-white/5">
                                                    <span className="text-white">Total cuenta</span>
                                                    <span className="text-golden text-lg">{formatPrice(totalGeneral)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal abrir mesa */}
                {mostrarModalCliente && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fade-in-up">
                        <div className="glass-golden rounded-2xl max-w-md w-full p-6 border border-golden/30">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    🔥 Abrir mesa {mesaSeleccionada?.numero}
                                </h3>
                                <button onClick={() => setMostrarModalCliente(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={20} className="text-white-60" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="input-label">👤 Tipo de cliente</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setTipoCliente('local')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ${
                                                tipoCliente === 'local'
                                                    ? 'bg-golden/20 text-golden border border-golden/30'
                                                    : 'bg-white/5 text-white-40 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            🏠 Local
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTipoCliente('domicilio')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ${
                                                tipoCliente === 'domicilio'
                                                    ? 'bg-golden/20 text-golden border border-golden/30'
                                                    : 'bg-white/5 text-white-40 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            🏍️ Domicilio
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTipoCliente('nuevo')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ${
                                                tipoCliente === 'nuevo'
                                                    ? 'bg-golden/20 text-golden border border-golden/30'
                                                    : 'bg-white/5 text-white-40 hover:text-white hover:bg-white/10'
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
                                    <Flame size={18} />
                                    Abrir mesa
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Configurador de pizza */}
                {mostrarConfigurador && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fade-in-up">
                        <div className="glass-golden rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-golden/30">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    🍕 Crear Pizza
                                </h3>
                                <button onClick={() => setMostrarConfigurador(false)} className="p-2 hover:bg-white/10 rounded-full">
                                    <X size={24} className="text-white-60" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Tamaño */}
                                <div>
                                    <h4 className="font-semibold text-white-60 mb-2">📏 Tamaño</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {tamanios.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => {
                                                    setConfigPizza(prev => ({ 
                                                        ...prev, 
                                                        tamanio: t,
                                                        sabores: [] 
                                                    }))
                                                }}
                                                className={`p-3 rounded-xl border-2 transition-all ${
                                                    configPizza.tamanio?.id === t.id
                                                        ? 'border-golden bg-golden/10'
                                                        : 'border-white/10 hover:border-golden/30'
                                                }`}
                                            >
                                                <p className="font-bold text-white">{t.nombre}</p>
                                                <p className="text-xs text-white-40">{t.porciones} porciones</p>
                                                <p className="text-xs text-golden">{formatPrice(t.precio_base)}</p>
                                                <p className="text-[10px] text-white-30">Máx {t.max_sabores} sabores</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sabores - Colapsable (CERRADO POR DEFECTO) */}
                                {configPizza.tamanio && (
                                    <div className="border border-white/10 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => setSaboresAbiertos(!saboresAbiertos)}
                                            className="w-full flex justify-between items-center p-3 hover:bg-white/5 transition-colors"
                                        >
                                            <h4 className="font-semibold text-white-60 flex items-center gap-2">
                                                🍕 Sabores
                                                <span className="text-xs text-golden">
                                                    ({configPizza.sabores.length}/{configPizza.tamanio.max_sabores})
                                                </span>
                                            </h4>
                                            {saboresAbiertos ? <ChevronDown size={18} className="text-white-40" /> : <ChevronRight size={18} className="text-white-40" />}
                                        </button>
                                        {saboresAbiertos && (
                                            <div className="p-3 pt-0 grid grid-cols-2 gap-2">
                                                {sabores.map(s => {
                                                    const selected = configPizza.sabores.find(s2 => s2.id === s.id)
                                                    return (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => toggleSabor(s)}
                                                            className={`p-2 rounded-xl border-2 transition-all text-left ${
                                                                selected
                                                                    ? 'border-golden bg-golden/10'
                                                                    : 'border-white/10 hover:border-golden/30'
                                                            }`}
                                                        >
                                                            <p className="font-medium text-white text-sm">{s.nombre}</p>
                                                            {s.precio_extra > 0 && (
                                                                <p className="text-xs text-white-40">+{formatPrice(s.precio_extra)}</p>
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Toppings - Colapsable (CERRADO POR DEFECTO) */}
                                {configPizza.tamanio && (
                                    <div className="border border-white/10 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => setToppingsAbiertos(!toppingsAbiertos)}
                                            className="w-full flex justify-between items-center p-3 hover:bg-white/5 transition-colors"
                                        >
                                            <h4 className="font-semibold text-white-60 flex items-center gap-2">
                                                🧀 Toppings adicionales
                                            </h4>
                                            {toppingsAbiertos ? <ChevronDown size={18} className="text-white-40" /> : <ChevronRight size={18} className="text-white-40" />}
                                        </button>
                                        {toppingsAbiertos && (
                                            <div className="p-3 pt-0 space-y-2">
                                                {toppings.map(t => {
                                                    const cantidad = getCantidadTopping(t.id)
                                                    return (
                                                        <div key={t.id} className="flex justify-between items-center p-2 rounded-xl border border-white/10">
                                                            <div>
                                                                <p className="font-medium text-white text-sm">{t.nombre}</p>
                                                                <p className="text-xs text-white-40">+{formatPrice(t.precio_extra)} c/u</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => cambiarCantidadTopping(t, -1)}
                                                                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
                                                                >
                                                                    <Minus size={14} />
                                                                </button>
                                                                <span className="text-white font-medium w-6 text-center">
                                                                    {cantidad}
                                                                </span>
                                                                <button
                                                                    onClick={() => cambiarCantidadTopping(t, 1)}
                                                                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
                                                                >
                                                                    <Plus size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Cantidad */}
                                <div>
                                    <h4 className="font-semibold text-white-60 mb-2">🔢 Cantidad</h4>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setConfigPizza(prev => ({ ...prev, cantidad: Math.max(1, (prev.cantidad || 1) - 1) }))}
                                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <span className="text-2xl font-bold text-golden min-w-[40px] text-center">
                                            {configPizza.cantidad || 1}
                                        </span>
                                        <button
                                            onClick={() => setConfigPizza(prev => ({ ...prev, cantidad: Math.min(99, (prev.cantidad || 1) + 1) }))}
                                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Precio y confirmar */}
                                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                    <div>
                                        <p className="text-sm text-white-40">Subtotal</p>
                                        <p className="text-2xl font-bold text-golden">
                                            {formatPrice(calcularPrecioPizza())}
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