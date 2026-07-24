'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { 
    calcularIngredientesPizza, 
    verificarStock, 
    descontarIngredientes,
    descontarStockProductoSimple
} from '@/lib/recetas'
import { formatPrice } from '@/lib/currency'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
    ShoppingCart, Trash2, Plus, Minus, Check, Eye, X, CreditCard, 
    Pizza, Slice, History, ClipboardList, Search, Edit3, Percent, Tag,
    Utensils
} from 'lucide-react'
import Multiplicador from '@/components/pedido/Multiplicador'
import ClienteSelector from '@/components/pedido/ClienteSelector'
import MeseroSelector from '@/components/pedido/MeseroSelector'

export default function PedidosPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const comandaId = searchParams.get('comanda')
    
    // Estados principales
    const [categorias, setCategorias] = useState([])
    const [productos, setProductos] = useState([])
    const [tamanios, setTamanios] = useState([])
    const [sabores, setSabores] = useState([])
    const [toppings, setToppings] = useState([])
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
    const [carrito, setCarrito] = useState([])
    const [empleado, setEmpleado] = useState(null)
    const [cliente, setCliente] = useState('')
    const [tipoCliente, setTipoCliente] = useState('local')
    const [meseroId, setMeseroId] = useState('')
    const [pedidos, setPedidos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [cargandoPedidos, setCargandoPedidos] = useState(true)
    const [mostrarResumen, setMostrarResumen] = useState(true)
    const [errorStock, setErrorStock] = useState(null)
    const [busquedaProductos, setBusquedaProductos] = useState('')
    const [busquedaHistorial, setBusquedaHistorial] = useState('')
    const [modoPorcion, setModoPorcion] = useState(false)
    const [esAdmin, setEsAdmin] = useState(false)
    const [comandaActual, setComandaActual] = useState(null)
    const [multiplicador, setMultiplicador] = useState(1)

    // Estados para selección de pizza
    const [pizzaSeleccion, setPizzaSeleccion] = useState({
        tamanio: null,
        sabor: null,
        saborBase: null,
        toppings: [],
        cantidad: 1,
        porciones: 0,
        esPorcion: false,
        porcionesSeleccionadas: [],
        multiplicador: 1
    })
    const [mostrarConfigurador, setMostrarConfigurador] = useState(false)
    const [limiteToppings, setLimiteToppings] = useState(0)
    const [pizzaConfigurando, setPizzaConfigurando] = useState(null)

    // Estado para ajuste de precio
    const [mostrarAjustePrecio, setMostrarAjustePrecio] = useState(false)
    const [ajustePrecio, setAjustePrecio] = useState({
        tipo: 'descuento',
        valor: 0,
        esPorcentaje: true,
        motivo: ''
    })

    // Calcular totales
    const subtotal = carrito.reduce((sum, item) => sum + (item.precioTotal || 0), 0)
    const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0)

    const calcularTotalConAjuste = () => {
        let total = subtotal
        if (ajustePrecio.tipo === 'descuento') {
            if (ajustePrecio.esPorcentaje) {
                total = total * (1 - (ajustePrecio.valor / 100))
            } else {
                total = total - ajustePrecio.valor
            }
        } else if (ajustePrecio.tipo === 'recargo') {
            if (ajustePrecio.esPorcentaje) {
                total = total * (1 + (ajustePrecio.valor / 100))
            } else {
                total = total + ajustePrecio.valor
            }
        }
        return Math.max(0, total)
    }

    const totalCarrito = calcularTotalConAjuste()

    // ============================================
    // PERSISTENCIA
    // ============================================

    useEffect(() => {
        const userData = localStorage.getItem('usuario')
        if (userData) {
            const user = JSON.parse(userData)
            setEmpleado(user)
            setEsAdmin(user.rol === 'admin')
        }
        
        const carritoGuardado = localStorage.getItem('carrito_pedidos')
        if (carritoGuardado) {
            try {
                const parsed = JSON.parse(carritoGuardado)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setCarrito(parsed)
                }
            } catch (e) {
                console.error('Error cargando carrito:', e)
            }
        }
        
        const clienteGuardado = localStorage.getItem('cliente_pedido')
        if (clienteGuardado) {
            setCliente(clienteGuardado)
        }
        
        const ajusteGuardado = localStorage.getItem('ajuste_pedido')
        if (ajusteGuardado) {
            try {
                setAjustePrecio(JSON.parse(ajusteGuardado))
            } catch (e) {
                console.error('Error cargando ajuste:', e)
            }
        }

        // Cargar comanda si existe
        if (comandaId) {
            cargarComanda(comandaId)
        }
    }, [comandaId])

    useEffect(() => {
        localStorage.setItem('carrito_pedidos', JSON.stringify(carrito))
    }, [carrito])

    useEffect(() => {
        localStorage.setItem('cliente_pedido', cliente)
    }, [cliente])

    useEffect(() => {
        localStorage.setItem('ajuste_pedido', JSON.stringify(ajustePrecio))
    }, [ajustePrecio])

    // ============================================
    // CARGA DE DATOS
    // ============================================

    useEffect(() => {
        cargarDatos()
        cargarPedidos()
    }, [])

    useEffect(() => {
        if (categoriaSeleccionada) {
            cargarProductos(categoriaSeleccionada)
        }
    }, [categoriaSeleccionada])

    useEffect(() => {
        if (pizzaSeleccion.tamanio && !pizzaSeleccion.esPorcion) {
            const limites = { 'Pequeña': 1, 'Mediana': 2, 'Grande': 4 }
            setLimiteToppings(limites[pizzaSeleccion.tamanio.nombre] || 0)
            if (pizzaSeleccion.toppings.length > limites[pizzaSeleccion.tamanio.nombre]) {
                setPizzaSeleccion(prev => ({
                    ...prev,
                    toppings: prev.toppings.slice(0, limites[pizzaSeleccion.tamanio.nombre])
                }))
            }
        }
    }, [pizzaSeleccion.tamanio, pizzaSeleccion.esPorcion])

    const cargarComanda = async (id) => {
        try {
            const { data, error } = await supabase
                .from('comandas')
                .select(`
                    *,
                    mesas (numero),
                    usuarios (nombre, avatar)
                `)
                .eq('id', id)
                .single()

            if (error) throw error
            setComandaActual(data)
            setCliente(data.cliente_nombre || '')
            setTipoCliente(data.tipo_cliente || 'local')
            setMeseroId(data.mesero_id || '')
        } catch (error) {
            console.error('Error cargando comanda:', error)
        }
    }

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const { data: catData } = await supabase
                .from('categorias')
                .select('*')
                .eq('activo', true)
                .order('nombre')
            setCategorias(catData || [])
            if (catData && catData.length > 0) {
                setCategoriaSeleccionada(catData[0].id)
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

    const cargarProductos = async (categoriaId) => {
        setCargando(true)
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
        } finally {
            setCargando(false)
        }
    }

    const cargarPedidos = async () => {
        setCargandoPedidos(true)
        try {
            const { data } = await supabase
                .from('pedidos')
                .select('*, usuarios (nombre, avatar)')
                .order('fecha', { ascending: false })
                .limit(100)
            setPedidos(data || [])
        } catch (error) {
            console.error('Error cargando pedidos:', error)
        } finally {
            setCargandoPedidos(false)
        }
    }

    // ============================================
    // FILTROS
    // ============================================
    const productosFiltrados = productos.filter(p => {
        if (!busquedaProductos) return true
        const termino = busquedaProductos.toLowerCase()
        return (
            p.nombre?.toLowerCase().includes(termino) ||
            p.tipo?.toLowerCase().includes(termino) ||
            p.tamanios_pizza?.nombre?.toLowerCase().includes(termino)
        )
    })

    const pedidosFiltrados = pedidos.filter(p => {
        if (!busquedaHistorial) return true
        const termino = busquedaHistorial.toLowerCase()
        return (
            p.cliente?.toLowerCase().includes(termino) ||
            p.id?.toLowerCase().includes(termino) ||
            p.estado?.toLowerCase().includes(termino) ||
            p.total?.toString().includes(termino)
        )
    })

    // ============================================
    // FUNCIONES DEL CARRITO
    // ============================================

    const agregarAlCarrito = (item) => {
        setCarrito(prev => [...prev, item])
        setPizzaSeleccion({
            tamanio: null,
            sabor: null,
            saborBase: null,
            toppings: [],
            cantidad: 1,
            porciones: 0,
            esPorcion: false,
            porcionesSeleccionadas: [],
            multiplicador: 1
        })
        setMostrarConfigurador(false)
        setPizzaConfigurando(null)
        setErrorStock(null)
        setModoPorcion(false)
        setMultiplicador(1)
    }

    const eliminarDelCarrito = (index) => {
        setCarrito(prev => prev.filter((_, i) => i !== index))
        setErrorStock(null)
    }

    const vaciarCarrito = () => {
        if (confirm('¿Vaciar carrito?')) {
            setCarrito([])
            localStorage.removeItem('carrito_pedidos')
            setErrorStock(null)
            setAjustePrecio({ tipo: 'descuento', valor: 0, esPorcentaje: true, motivo: '' })
        }
    }

    const abrirAjustePrecio = () => {
        setMostrarAjustePrecio(true)
    }

    const aplicarAjuste = () => {
        setMostrarAjustePrecio(false)
    }

    // ============================================
    // GUARDAR PEDIDO / AGREGAR A COMANDAS
    // ============================================

    const guardarPedido = async () => {
        if (carrito.length === 0) {
            alert('❌ Carrito vacío')
            return
        }
        if (!empleado) {
            alert('❌ No hay empleado logueado')
            return
        }

        setCargando(true)
        setErrorStock(null)

        try {
            let todosLosIngredientes = {}
            let erroresStock = []
            let productosSimples = []

            for (const item of carrito) {
                if (item.tipo === 'pizza' && item.tamanio && !item.esPorcion) {
                    const ingredientes = await calcularIngredientesPizza(
                        item.tamanio.id,
                        item.sabor?.id,
                        item.toppings?.map(t => t.id) || [],
                        item.cantidad || 1
                    )

                    const errores = await verificarStock(ingredientes)
                    if (errores.length > 0) {
                        erroresStock = [...erroresStock, ...errores]
                    }

                    for (const [nombre, data] of Object.entries(ingredientes)) {
                        if (todosLosIngredientes[nombre]) {
                            todosLosIngredientes[nombre].cantidad += data.cantidad
                        } else {
                            todosLosIngredientes[nombre] = { ...data }
                        }
                    }
                }

                if (item.tipo === 'porcion' && item.productoId) {
                    productosSimples.push({
                        id: item.productoId,
                        cantidad: item.cantidad || 1,
                        nombre: item.nombre
                    })
                }

                if (item.tipo === 'simple' && item.productoId) {
                    productosSimples.push({
                        id: item.productoId,
                        cantidad: item.cantidad || 1,
                        nombre: item.nombre
                    })
                }
            }

            for (const ps of productosSimples) {
                const { data: producto } = await supabase
                    .from('productos_menu')
                    .select('stock, nombre')
                    .eq('id', ps.id)
                    .single()

                if (producto && producto.stock < ps.cantidad) {
                    erroresStock.push({
                        ingrediente: producto.nombre,
                        disponible: producto.stock,
                        necesario: ps.cantidad,
                        faltante: ps.cantidad - producto.stock,
                        unidad: 'unidades'
                    })
                }
            }

            if (erroresStock.length > 0) {
                let mensaje = '❌ NO HAY SUFICIENTE STOCK:\n\n'
                erroresStock.forEach(e => {
                    if (typeof e === 'string') {
                        mensaje += `• ${e}\n`
                    } else {
                        mensaje += `• ${e.ingrediente}: `
                        mensaje += `Disponible ${e.disponible}${e.unidad || 'g'}, `
                        mensaje += `Necesario ${e.necesario}${e.unidad || 'g'}, `
                        mensaje += `Faltante ${e.faltante}${e.unidad || 'g'}\n`
                    }
                })
                setErrorStock(mensaje)
                setCargando(false)
                return
            }

            const total = totalCarrito
            const ahora = new Date().toISOString()
            
            // Si hay comanda, solo agregamos items a la comanda
            if (comandaActual) {
                for (const item of carrito) {
                    await supabase
                        .from('comanda_items')
                        .insert({
                            comanda_id: comandaActual.id,
                            producto_menu_id: item.productoId || null,
                            cantidad: item.cantidad || 1,
                            multiplicador: item.multiplicador || 1,
                            precio_unitario: (item.precioTotal || 0) / (item.cantidad || 1),
                            subtotal: item.precioTotal || 0,
                            notas: item.notas || ''
                        })
                }

                // Actualizar subtotal de la comanda
                const { data: comandaData } = await supabase
                    .from('comandas')
                    .select('subtotal')
                    .eq('id', comandaActual.id)
                    .single()

                const nuevoSubtotal = (comandaData?.subtotal || 0) + total
                await supabase
                    .from('comandas')
                    .update({ 
                        subtotal: nuevoSubtotal,
                        updated_at: ahora
                    })
                    .eq('id', comandaActual.id)

                setCarrito([])
                localStorage.removeItem('carrito_pedidos')
                localStorage.removeItem('cliente_pedido')
                localStorage.removeItem('ajuste_pedido')
                setCliente('')
                setAjustePrecio({ tipo: 'descuento', valor: 0, esPorcentaje: true, motivo: '' })
                
                alert(`✅ Items agregados a la comanda #${comandaActual.id.slice(0, 8)}`)
                router.push('/comandas')
                return
            }

            // Si no hay comanda, crear pedido normal
            const { data: pedidoData, error: pedidoError } = await supabase
                .from('pedidos')
                .insert({
                    empleado_id: empleado.id,
                    cliente: cliente || 'Cliente general',
                    total: total,
                    estado: 'preparando',
                    tiempos: {
                        pendiente_inicio: ahora,
                        pendiente_fin: ahora,
                        preparando_inicio: ahora
                    },
                    subtotal: subtotal,
                    ajuste: ajustePrecio.valor > 0 ? `${ajustePrecio.tipo}: ${ajustePrecio.valor}${ajustePrecio.esPorcentaje ? '%' : '$'} - ${ajustePrecio.motivo || 'Sin motivo'}` : null
                })
                .select()
                .single()

            if (pedidoError) throw pedidoError

            for (const item of carrito) {
                await supabase
                    .from('pedido_detalles')
                    .insert({
                        pedido_id: pedidoData.id,
                        producto_menu_id: item.productoId || null,
                        cantidad: item.cantidad || 1,
                        precio_unitario: (item.precioTotal || 0) / (item.cantidad || 1),
                        subtotal: item.precioTotal || 0,
                        toppings_seleccionados: item.toppings?.map(t => t.id) || [],
                        tamanio_nombre: item.tamanio?.nombre || null,
                        sabor_nombre: item.sabor?.nombre || null,
                        nombre_producto: item.nombre,
                        es_porcion: item.esPorcion || false,
                        detalle_sabores: item.detallePorciones || null
                    })
            }

            if (Object.keys(todosLosIngredientes).length > 0) {
                await descontarIngredientes(
                    todosLosIngredientes,
                    pedidoData.id,
                    null,
                    empleado.id
                )
            }

            for (const ps of productosSimples) {
                await descontarStockProductoSimple(
                    ps.id,
                    ps.cantidad,
                    pedidoData.id,
                    empleado.id
                )
            }

            await supabase
                .from('auditoria')
                .insert({
                    usuario_id: empleado.id,
                    accion: `Creó pedido #${pedidoData.id.slice(0, 8)} - ${carrito.length} items - Total: ${formatPrice(total)}`
                })

            setCarrito([])
            localStorage.removeItem('carrito_pedidos')
            localStorage.removeItem('cliente_pedido')
            localStorage.removeItem('ajuste_pedido')
            setCliente('')
            setAjustePrecio({ tipo: 'descuento', valor: 0, esPorcentaje: true, motivo: '' })
            await cargarPedidos()
            
            alert(`✅ ¡Pedido #${pedidoData.id.slice(0, 8)} creado!`)
            router.push('/cocina')

        } catch (error) {
            console.error('Error guardando pedido:', error)
            alert('❌ Error al guardar el pedido: ' + error.message)
        } finally {
            setCargando(false)
        }
    }

    // ============================================
    // CONFIGURADOR DE PIZZA
    // ============================================

    const toggleTopping = (topping) => {
        setPizzaSeleccion(prev => {
            const exists = prev.toppings.find(t => t.id === topping.id)
            if (exists) {
                return { ...prev, toppings: prev.toppings.filter(t => t.id !== topping.id) }
            } else {
                if (prev.toppings.length >= limiteToppings) {
                    alert(`⚠️ Máximo ${limiteToppings} toppings para ${prev.tamanio?.nombre || 'este tamaño'}`)
                    return prev
                }
                return { ...prev, toppings: [...prev.toppings, topping] }
            }
        })
    }

    const cambiarCantidadPizza = (delta) => {
        setPizzaSeleccion(prev => ({
            ...prev,
            cantidad: Math.max(1, Math.min(99, (prev.cantidad || 1) + delta))
        }))
    }

    const cambiarPorciones = (delta) => {
        setPizzaSeleccion(prev => {
            const max = prev.tamanio?.porciones || 12
            const current = prev.porciones || 0
            const nuevo = Math.max(0, Math.min(max, current + delta))
            return { ...prev, porciones: nuevo }
        })
    }

    const calcularPrecioPizza = () => {
        if (pizzaSeleccion.esPorcion) {
            const precioBase = pizzaSeleccion.tamanio?.precio_base || 0
            const porciones = pizzaSeleccion.tamanio?.porciones || 8
            const precioPorcion = precioBase / porciones
            const seleccionadas = pizzaSeleccion.porcionesSeleccionadas?.filter(p => p !== null).length || 0
            return precioPorcion * seleccionadas * (pizzaSeleccion.multiplicador || 1)
        }

        let base = pizzaSeleccion.tamanio?.precio_base || 0
        if (pizzaSeleccion.sabor) {
            base += pizzaSeleccion.sabor.precio_extra || 0
        }
        let toppingsTotal = 0
        pizzaSeleccion.toppings.forEach(t => {
            toppingsTotal += t.precio_extra || 0
        })
        return (base + toppingsTotal) * (pizzaSeleccion.cantidad || 1) * (pizzaSeleccion.multiplicador || 1)
    }

    const confirmarPizzaEntera = async () => {
        if (!pizzaSeleccion.tamanio) {
            alert('Selecciona un tamaño')
            return
        }
        if (!pizzaSeleccion.sabor) {
            alert('Selecciona un sabor')
            return
        }

        const precioTotal = calcularPrecioPizza()
        
        try {
            const ingredientes = await calcularIngredientesPizza(
                pizzaSeleccion.tamanio.id,
                pizzaSeleccion.sabor.id,
                pizzaSeleccion.toppings.map(t => t.id),
                pizzaSeleccion.cantidad * (pizzaSeleccion.multiplicador || 1)
            )
            
            const errores = await verificarStock(ingredientes)
            if (errores.length > 0) {
                let mensaje = '⚠️ No hay suficiente stock para esta pizza:\n\n'
                errores.forEach(e => {
                    if (typeof e === 'string') {
                        mensaje += `• ${e}\n`
                    } else {
                        mensaje += `• ${e.ingrediente}: disponible ${e.disponible}g, necesita ${e.necesario}g\n`
                    }
                })
                alert(mensaje)
                return
            }
        } catch (error) {
            console.error('Error verificando stock:', error)
        }

        agregarAlCarrito({
            nombre: `🍕 ${pizzaSeleccion.sabor.nombre} ${pizzaSeleccion.tamanio.nombre}`,
            tipo: 'pizza',
            tamanio: pizzaSeleccion.tamanio,
            sabor: pizzaSeleccion.sabor,
            toppings: pizzaSeleccion.toppings,
            cantidad: pizzaSeleccion.cantidad * (pizzaSeleccion.multiplicador || 1),
            multiplicador: pizzaSeleccion.multiplicador || 1,
            precioTotal: precioTotal,
            productoId: null,
            esPorcion: false
        })
    }

    const confirmarPizzaPorciones = async () => {
        if (!pizzaSeleccion.tamanio) {
            alert('Selecciona un tamaño')
            return
        }

        const porcionesSeleccionadas = pizzaSeleccion.porcionesSeleccionadas?.filter(p => p !== null) || []
        if (porcionesSeleccionadas.length === 0) {
            alert('Selecciona al menos 1 porción')
            return
        }

        const precioPorcion = pizzaSeleccion.tamanio.precio_base / pizzaSeleccion.tamanio.porciones
        const precioTotal = porcionesSeleccionadas.length * precioPorcion * (pizzaSeleccion.multiplicador || 1)

        const saboresCount = {}
        porcionesSeleccionadas.forEach(s => {
            const nombre = s.nombre
            saboresCount[nombre] = (saboresCount[nombre] || 0) + 1
        })
        const resumenSabores = Object.entries(saboresCount)
            .map(([nombre, count]) => `${count}x ${nombre}`)
            .join(', ')

        agregarAlCarrito({
            nombre: `🍕 ${resumenSabores} (${porcionesSeleccionadas.length * (pizzaSeleccion.multiplicador || 1)} porciones)`,
            tipo: 'porcion',
            tamanio: pizzaSeleccion.tamanio,
            sabor: null,
            toppings: [],
            cantidad: porcionesSeleccionadas.length * (pizzaSeleccion.multiplicador || 1),
            multiplicador: pizzaSeleccion.multiplicador || 1,
            precioTotal: precioTotal,
            productoId: null,
            esPorcion: true,
            detallePorciones: porcionesSeleccionadas.map((s, i) => `Porción ${i+1}: ${s.nombre}`).join(' | ')
        })
    }

    const agregarProductoSimple = (producto) => {
        const precioTotal = producto.precio_venta * multiplicador
        agregarAlCarrito({
            nombre: `${producto.nombre} x${multiplicador}`,
            tipo: 'simple',
            precioTotal: precioTotal,
            cantidad: multiplicador,
            multiplicador: multiplicador,
            productoId: producto.id,
            esPorcion: false
        })
        setMultiplicador(1)
    }

    const formatearPrecio = (precio) => {
        return formatPrice(precio)
    }

    return (
        <DashboardLayout>
            <div className="space-y-4">
                {/* HEADER CON RESUMEN Y DATOS DE COMANDAS */}
                <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 sticky top-16 z-30">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold">
                                {comandaActual ? `🔥 Comanda #${comandaActual.id.slice(0, 8)}` : '📝 Pedido'}
                            </h2>
                            {comandaActual && (
                                <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                    Mesa {comandaActual.mesas?.numero}
                                </span>
                            )}
                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                                <ShoppingCart size={16} className="text-orange-600" />
                                <span className="font-bold">{totalItems}</span>
                                <span className="text-sm text-gray-500">items</span>
                            </div>
                            {subtotal !== totalCarrito && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    Ajustado
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">
                                    {subtotal !== totalCarrito ? 'Total ajustado' : 'Total del pedido'}
                                </p>
                                <p className={`text-2xl font-bold ${subtotal !== totalCarrito ? 'text-green-600' : 'text-orange-600'}`}>
                                    {formatearPrecio(totalCarrito)}
                                </p>
                                {subtotal !== totalCarrito && (
                                    <p className="text-xs text-gray-400 line-through">
                                        {formatearPrecio(subtotal)}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setMostrarResumen(!mostrarResumen)}
                                className="btn-secondary text-sm flex items-center gap-2"
                            >
                                <Eye size={16} />
                                {mostrarResumen ? 'Ocultar' : 'Ver resumen'}
                            </button>
                            {esAdmin && carrito.length > 0 && (
                                <button
                                    onClick={abrirAjustePrecio}
                                    className="btn-secondary text-sm flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700"
                                >
                                    <Edit3 size={16} />
                                    Ajustar precio
                                </button>
                            )}
                            {carrito.length > 0 && (
                                <button
                                    onClick={guardarPedido}
                                    disabled={cargando}
                                    className="btn-golden text-sm flex items-center gap-2"
                                >
                                    <CreditCard size={16} />
                                    {cargando ? 'Procesando...' : comandaActual ? 'Agregar a comanda' : 'Pagar'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Selectores de Cliente y Mesero (si hay comanda) */}
                    {comandaActual && (
                        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="input-label text-sm">👤 Cliente</label>
                                <input
                                    type="text"
                                    value={cliente}
                                    onChange={(e) => setCliente(e.target.value)}
                                    className="input-field text-sm"
                                    placeholder="Nombre del cliente"
                                    disabled={!!comandaActual}
                                />
                            </div>
                            <div>
                                <label className="input-label text-sm">👨‍🍳 Mesero</label>
                                <select
                                    value={meseroId}
                                    onChange={(e) => setMeseroId(e.target.value)}
                                    className="input-field text-sm"
                                    disabled={!!comandaActual}
                                >
                                    <option value="">Seleccionar mesero</option>
                                    {/* Aquí se cargan los meseros */}
                                </select>
                            </div>
                        </div>
                    )}

                    {errorStock && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm whitespace-pre-line">
                            {errorStock}
                        </div>
                    )}

                    {mostrarResumen && carrito.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 max-h-60 overflow-y-auto">
                            {carrito.map((item, index) => (
                                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="font-medium text-sm">{item.nombre}</p>
                                        {item.toppings && item.toppings.length > 0 && (
                                            <p className="text-xs text-gray-400">+ {item.toppings.map(t => t.nombre).join(', ')}</p>
                                        )}
                                        <p className="text-xs text-gray-500">{item.cantidad}x</p>
                                        {item.multiplicador > 1 && (
                                            <span className="text-xs text-orange-500">x{item.multiplicador}</span>
                                        )}
                                        {item.esPorcion && <span className="text-xs text-blue-500">🍕 Porciones</span>}
                                        {item.detallePorciones && (
                                            <p className="text-xs text-gray-400 truncate max-w-[150px]">{item.detallePorciones}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="font-bold text-orange-600">{formatearPrecio(item.precioTotal)}</p>
                                        <button
                                            onClick={() => eliminarDelCarrito(index)}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {subtotal !== totalCarrito && (
                                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-sm text-green-600">
                                    <span>Ajuste aplicado</span>
                                    <span className="font-bold">{formatearPrecio(totalCarrito)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* CONTENIDO PRINCIPAL */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* BÚSQUEDA DE PRODUCTOS */}
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={busquedaProductos}
                                onChange={(e) => setBusquedaProductos(e.target.value)}
                                className="input-field pl-10"
                                placeholder="🔍 Buscar productos..."
                            />
                        </div>

                        {/* CATEGORÍAS */}
                        <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
                            {categorias.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategoriaSeleccionada(cat.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                        categoriaSeleccionada === cat.id
                                            ? 'bg-orange-600 text-white shadow-md'
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

                        {/* MULTIPLICADOR GLOBAL */}
                        <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">🔢 Multiplicador global:</span>
                            <Multiplicador value={multiplicador} onChange={setMultiplicador} min={1} max={10} />
                            <span className="text-xs text-gray-400">Aplica a todos los productos</span>
                        </div>

                        {/* PRODUCTOS */}
                        {cargando ? (
                            <div className="text-center py-8 text-gray-500">Cargando...</div>
                        ) : productosFiltrados.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-4xl mb-2">🔍</p>
                                <p>No se encontraron productos</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {productosFiltrados.map(p => {
                                    if (p.tipo === 'pizza_personalizable' || p.tipo === 'pizza_fija') {
                                        const isConfiguring = pizzaConfigurando === p.id
                                        return (
                                            <div key={p.id} className="card border-2 border-orange-200 hover:border-orange-400 transition-all">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-lg">🍕 Pizza {p.tamanios_pizza?.nombre || ''}</p>
                                                        <p className="text-sm text-gray-500">Configura tu pizza</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (isConfiguring) {
                                                                setPizzaConfigurando(null)
                                                                setMostrarConfigurador(false)
                                                                setModoPorcion(false)
                                                            } else {
                                                                setPizzaConfigurando(p.id)
                                                                setMostrarConfigurador(true)
                                                                setPizzaSeleccion({
                                                                    tamanio: p.tamanios_pizza || null,
                                                                    sabor: null,
                                                                    saborBase: null,
                                                                    toppings: [],
                                                                    cantidad: 1,
                                                                    porciones: 0,
                                                                    esPorcion: false,
                                                                    porcionesSeleccionadas: [],
                                                                    multiplicador: 1
                                                                })
                                                                setModoPorcion(false)
                                                            }
                                                        }}
                                                        className={isConfiguring ? 'btn-danger text-sm' : 'btn-primary text-sm'}
                                                    >
                                                        {isConfiguring ? 'Cerrar' : 'Configurar 🍕'}
                                                    </button>
                                                </div>

                                                {isConfiguring && mostrarConfigurador && (
                                                    <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4">
                                                        {/* TOGGLE: Pizza entera / Porciones */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <button
                                                                onClick={() => {
                                                                    setModoPorcion(false)
                                                                    setPizzaSeleccion(prev => ({ 
                                                                        ...prev, 
                                                                        esPorcion: false, 
                                                                        porciones: 0, 
                                                                        toppings: [],
                                                                        porcionesSeleccionadas: []
                                                                    }))
                                                                }}
                                                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                                                                    !modoPorcion
                                                                        ? 'border-orange-500 bg-orange-50'
                                                                        : 'border-gray-200 hover:border-orange-300'
                                                                }`}
                                                            >
                                                                <Pizza size={32} className={!modoPorcion ? 'text-orange-600' : 'text-gray-400'} />
                                                                <span className="font-medium mt-1">Pizza entera</span>
                                                                <span className="text-xs text-gray-400">Con toppings</span>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setModoPorcion(true)
                                                                    setPizzaSeleccion(prev => ({
                                                                        ...prev,
                                                                        esPorcion: true,
                                                                        porciones: 0,
                                                                        cantidad: 1,
                                                                        toppings: [],
                                                                        porcionesSeleccionadas: Array(prev.tamanio?.porciones || 8).fill(null)
                                                                    }))
                                                                }}
                                                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                                                                    modoPorcion
                                                                        ? 'border-orange-500 bg-orange-50'
                                                                        : 'border-gray-200 hover:border-orange-300'
                                                                }`}
                                                            >
                                                                <Slice size={32} className={modoPorcion ? 'text-orange-600' : 'text-gray-400'} />
                                                                <span className="font-medium mt-1">Porción</span>
                                                                <span className="text-xs text-gray-400">Multisabor</span>
                                                            </button>
                                                        </div>

                                                        {!modoPorcion ? (
                                                            // PIZZA ENTERA
                                                            <>
                                                                <div>
                                                                    <p className="font-medium text-sm mb-2">📏 Tamaño:</p>
                                                                    <div className="flex gap-2 flex-wrap">
                                                                        {tamanios.map(t => (
                                                                            <button
                                                                                key={t.id}
                                                                                onClick={() => setPizzaSeleccion(prev => ({ ...prev, tamanio: t }))}
                                                                                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                                                                                    pizzaSeleccion.tamanio?.id === t.id
                                                                                        ? 'bg-orange-600 text-white shadow-md'
                                                                                        : 'bg-white border-2 border-gray-200 hover:border-orange-300'
                                                                                }`}
                                                                            >
                                                                                {t.nombre} ({formatearPrecio(t.precio_base)})
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-sm mb-2">🍕 Sabor:</p>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {sabores.filter(s => s.activo).map(s => (
                                                                            <button
                                                                                key={s.id}
                                                                                onClick={() => setPizzaSeleccion(prev => ({ ...prev, sabor: s }))}
                                                                                className={`p-2 rounded-lg text-sm transition-all text-left ${
                                                                                    pizzaSeleccion.sabor?.id === s.id
                                                                                        ? 'bg-orange-600 text-white shadow-md'
                                                                                        : 'bg-white border-2 border-gray-200 hover:border-orange-300'
                                                                                }`}
                                                                            >
                                                                                {s.nombre}
                                                                                {s.precio_extra > 0 && (
                                                                                    <span className="text-xs opacity-75"> +{formatearPrecio(s.precio_extra)}</span>
                                                                                )}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-sm mb-2">
                                                                        🧀 Acompañamientos (máx {limiteToppings}):
                                                                        <span className="text-orange-600 ml-2">
                                                                            {pizzaSeleccion.toppings.length}/{limiteToppings}
                                                                        </span>
                                                                    </p>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {toppings.map(t => {
                                                                            const selected = pizzaSeleccion.toppings.find(t2 => t2.id === t.id)
                                                                            return (
                                                                                <button
                                                                                    key={t.id}
                                                                                    onClick={() => toggleTopping(t)}
                                                                                    className={`p-2 rounded-lg text-sm transition-all flex justify-between items-center ${
                                                                                        selected
                                                                                            ? 'bg-orange-600 text-white shadow-md'
                                                                                            : 'bg-white border-2 border-gray-200 hover:border-orange-300'
                                                                                    }`}
                                                                                >
                                                                                    <span>{t.nombre}</span>
                                                                                    <span className="text-xs opacity-75">+{formatearPrecio(t.precio_extra)}</span>
                                                                                    {selected && <Check size={16} />}
                                                                                </button>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-sm mb-2">🔢 Cantidad:</p>
                                                                    <Multiplicador 
                                                                        value={pizzaSeleccion.cantidad} 
                                                                        onChange={(val) => setPizzaSeleccion(prev => ({ ...prev, cantidad: val }))}
                                                                        min={1} 
                                                                        max={99} 
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-sm mb-2">🔢 Multiplicador de toppings:</p>
                                                                    <Multiplicador 
                                                                        value={pizzaSeleccion.multiplicador} 
                                                                        onChange={(val) => setPizzaSeleccion(prev => ({ ...prev, multiplicador: val }))}
                                                                        min={1} 
                                                                        max={10} 
                                                                    />
                                                                </div>
                                                                <div className="flex items-center justify-between pt-4 border-t">
                                                                    <div className="text-right">
                                                                        <p className="text-sm text-gray-500">Subtotal</p>
                                                                        <p className="text-2xl font-bold text-orange-600">
                                                                            {formatearPrecio(calcularPrecioPizza())}
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        onClick={confirmarPizzaEntera}
                                                                        className="btn-success text-sm"
                                                                    >
                                                                        Agregar al Carrito
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            // PORCIONES MULTISABORES
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <p className="font-medium text-sm mb-2">📏 Tamaño:</p>
                                                                    <div className="flex gap-2 flex-wrap">
                                                                        {tamanios.map(t => (
                                                                            <button
                                                                                key={t.id}
                                                                                onClick={() => {
                                                                                    setPizzaSeleccion(prev => ({
                                                                                        ...prev,
                                                                                        tamanio: t,
                                                                                        porcionesSeleccionadas: Array(t.porciones).fill(null)
                                                                                    }))
                                                                                }}
                                                                                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                                                                                    pizzaSeleccion.tamanio?.id === t.id
                                                                                        ? 'bg-orange-600 text-white shadow-md'
                                                                                        : 'bg-white border-2 border-gray-200 hover:border-orange-300'
                                                                                }`}
                                                                            >
                                                                                {t.nombre} ({t.porciones} porciones)
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-sm mb-2">🍕 Sabor base:</p>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {sabores.filter(s => s.activo).map(s => (
                                                                            <button
                                                                                key={s.id}
                                                                                onClick={() => setPizzaSeleccion(prev => ({ ...prev, saborBase: s }))}
                                                                                className={`p-2 rounded-lg text-sm transition-all text-left ${
                                                                                    pizzaSeleccion.saborBase?.id === s.id
                                                                                        ? 'bg-orange-600 text-white shadow-md'
                                                                                        : 'bg-white border-2 border-gray-200 hover:border-orange-300'
                                                                                }`}
                                                                            >
                                                                                {s.nombre}
                                                                                {s.precio_extra > 0 && (
                                                                                    <span className="text-xs opacity-75"> +{formatearPrecio(s.precio_extra)}</span>
                                                                                )}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                {pizzaSeleccion.tamanio && (
                                                                    <div>
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <p className="font-medium text-sm">🍕 Porciones:</p>
                                                                            <span className="text-sm text-orange-600 font-bold">
                                                                                {pizzaSeleccion.porcionesSeleccionadas?.filter(p => p !== null).length || 0} / {pizzaSeleccion.tamanio.porciones}
                                                                            </span>
                                                                        </div>
                                                                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                                                            {Array.from({ length: pizzaSeleccion.tamanio.porciones }, (_, i) => {
                                                                                const index = i
                                                                                const saborSeleccionado = pizzaSeleccion.porcionesSeleccionadas?.[index] || null
                                                                                const estaSeleccionada = saborSeleccionado !== null
                                                                                
                                                                                return (
                                                                                    <div key={index} className="flex flex-col items-center gap-1">
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setPizzaSeleccion(prev => {
                                                                                                    const nuevas = [...(prev.porcionesSeleccionadas || Array(prev.tamanio.porciones).fill(null))]
                                                                                                    if (nuevas[index] !== null) {
                                                                                                        nuevas[index] = null
                                                                                                    } else {
                                                                                                        if (prev.saborBase) {
                                                                                                            nuevas[index] = prev.saborBase
                                                                                                        } else {
                                                                                                            alert('Selecciona un sabor base primero')
                                                                                                            return prev
                                                                                                        }
                                                                                                    }
                                                                                                    return { ...prev, porcionesSeleccionadas: nuevas }
                                                                                                })
                                                                                            }}
                                                                                            className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center text-xs font-bold ${
                                                                                                estaSeleccionada
                                                                                                    ? 'bg-orange-600 text-white border-orange-700 shadow-md'
                                                                                                    : 'bg-white border-gray-300 hover:border-orange-400'
                                                                                            }`}
                                                                                        >
                                                                                            {index + 1}
                                                                                        </button>
                                                                                        {estaSeleccionada && (
                                                                                            <select
                                                                                                value={saborSeleccionado?.id || ''}
                                                                                                onChange={(e) => {
                                                                                                    const saborId = e.target.value
                                                                                                    const sabor = sabores.find(s => s.id === saborId)
                                                                                                    if (sabor) {
                                                                                                        setPizzaSeleccion(prev => {
                                                                                                            const nuevas = [...(prev.porcionesSeleccionadas || [])]
                                                                                                            nuevas[index] = sabor
                                                                                                            return { ...prev, porcionesSeleccionadas: nuevas }
                                                                                                        })
                                                                                                    }
                                                                                                }}
                                                                                                className="text-[10px] w-full border rounded px-1 py-0.5 bg-white"
                                                                                            >
                                                                                                {sabores.filter(s => s.activo).map(s => (
                                                                                                    <option key={s.id} value={s.id}>
                                                                                                        {s.nombre.substring(0, 6)}
                                                                                                    </option>
                                                                                                ))}
                                                                                            </select>
                                                                                        )}
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                        <p className="text-xs text-gray-400 mt-2">
                                                                            💡 Haz clic en una porción para seleccionarla. Cada porción puede tener un sabor diferente.
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {pizzaSeleccion.porcionesSeleccionadas?.some(p => p !== null) && (
                                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                                        <p className="text-sm font-medium mb-1">📋 Resumen:</p>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {pizzaSeleccion.porcionesSeleccionadas.map((sabor, i) => (
                                                                                sabor && (
                                                                                    <span key={i} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                                                                        {i + 1}: {sabor.nombre}
                                                                                    </span>
                                                                                )
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <p className="font-medium text-sm mb-2">🔢 Multiplicador:</p>
                                                                    <Multiplicador 
                                                                        value={pizzaSeleccion.multiplicador} 
                                                                        onChange={(val) => setPizzaSeleccion(prev => ({ ...prev, multiplicador: val }))}
                                                                        min={1} 
                                                                        max={10} 
                                                                    />
                                                                </div>
                                                                {pizzaSeleccion.porcionesSeleccionadas?.some(p => p !== null) && (
                                                                    <div className="flex items-center justify-between pt-4 border-t">
                                                                        <div className="text-right">
                                                                            <p className="text-sm text-gray-500">Subtotal</p>
                                                                            <p className="text-2xl font-bold text-orange-600">
                                                                                {formatearPrecio(calcularPrecioPizza())}
                                                                            </p>
                                                                            <p className="text-xs text-gray-400">
                                                                                {pizzaSeleccion.porcionesSeleccionadas.filter(p => p !== null).length} porciones
                                                                            </p>
                                                                        </div>
                                                                        <button
                                                                            onClick={confirmarPizzaPorciones}
                                                                            className="btn-success text-sm"
                                                                        >
                                                                            Agregar porción(es)
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    }

                                    return (
                                        <div
                                            key={p.id}
                                            className="card hover:border-orange-400 transition-all cursor-pointer"
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
                                                    <p className="font-bold text-orange-600">{formatearPrecio(p.precio_venta)}</p>
                                                    <button className="btn-success text-sm py-1 px-3">
                                                        Agregar {multiplicador > 1 ? `${multiplicador}x` : ''}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* CARRITO */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-36 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <ShoppingCart size={20} /> Carrito
                                    {totalItems > 0 && (
                                        <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
                                            {totalItems}
                                        </span>
                                    )}
                                </h3>
                                {carrito.length > 0 && (
                                    <button
                                        onClick={vaciarCarrito}
                                        className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                                    >
                                        <Trash2 size={16} /> Vaciar
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[35vh] overflow-y-auto space-y-3 mb-4">
                                {carrito.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8 text-sm">El carrito está vacío</p>
                                ) : (
                                    carrito.map((item, index) => (
                                        <div key={index} className="border-b border-gray-100 pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm text-gray-800">{item.nombre}</p>
                                                    {item.toppings && item.toppings.length > 0 && (
                                                        <p className="text-xs text-gray-400">+ {item.toppings.map(t => t.nombre).join(', ')}</p>
                                                    )}
                                                    <p className="text-xs text-gray-400">{item.cantidad}x</p>
                                                    {item.multiplicador > 1 && (
                                                        <span className="text-xs text-orange-500">x{item.multiplicador}</span>
                                                    )}
                                                    {item.esPorcion && <span className="text-xs text-blue-500">🍕 Porciones</span>}
                                                    {item.detallePorciones && (
                                                        <p className="text-xs text-gray-400 truncate max-w-[120px]">{item.detallePorciones}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-orange-600 text-sm">{formatearPrecio(item.precioTotal)}</p>
                                                    <button
                                                        onClick={() => eliminarDelCarrito(index)}
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
                                <div className="space-y-1 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span>{formatearPrecio(subtotal)}</span>
                                    </div>
                                    {subtotal !== totalCarrito && (
                                        <>
                                            <div className="flex justify-between text-sm text-green-600">
                                                <span>Ajuste aplicado</span>
                                                <span>- {formatearPrecio(subtotal - totalCarrito)}</span>
                                            </div>
                                            {ajustePrecio.motivo && (
                                                <div className="text-xs text-gray-400 text-right">
                                                    Motivo: {ajustePrecio.motivo}
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
                                        <span>Total</span>
                                        <span className="text-orange-600">{formatearPrecio(totalCarrito)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={guardarPedido}
                                    disabled={cargando || carrito.length === 0}
                                    className="w-full btn-golden py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {cargando ? '⏳ Verificando stock...' : (
                                        <>
                                            <CreditCard size={18} />
                                            <span>{comandaActual ? 'Agregar a comanda' : 'Confirmar Pedido'}</span>
                                            <span className="text-sm bg-white/20 px-2 py-0.5 rounded">
                                                {formatearPrecio(totalCarrito)}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* HISTORIAL DE PEDIDOS */}
                <div className="card">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <h3 className="text-lg font-bold">📋 Pedidos Recientes</h3>
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                value={busquedaHistorial}
                                onChange={(e) => setBusquedaHistorial(e.target.value)}
                                className="input-field text-sm"
                                placeholder="🔍 Buscar por cliente, ID o estado..."
                            />
                        </div>
                        <Link href="/cocina" className="btn-secondary text-sm whitespace-nowrap">
                            👨‍🍳 Ver Cocina
                        </Link>
                    </div>

                    <div className="table-container">
                        <table className="w-full">
                            <thead className="table-header">
                                <tr>
                                    <th>ID</th>
                                    <th>Cliente</th>
                                    <th>Empleado</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargandoPedidos ? (
                                    <tr><td colSpan="6" className="text-center py-4 text-gray-500">Cargando...</td></tr>
                                ) : pedidosFiltrados.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-4 text-gray-500">
                                        {busquedaHistorial ? 'No se encontraron pedidos' : 'No hay pedidos'}
                                    </td></tr>
                                ) : (
                                    pedidosFiltrados.map((pedido) => (
                                        <tr key={pedido.id} className="table-row">
                                            <td className="font-mono text-sm">#{pedido.id.slice(0, 8)}</td>
                                            <td>{pedido.cliente}</td>
                                            <td>{pedido.usuarios?.avatar} {pedido.usuarios?.nombre}</td>
                                            <td className="font-bold text-orange-600">{formatearPrecio(pedido.total)}</td>
                                            <td>
                                                <span className={`badge ${
                                                    pedido.estado === 'pendiente' ? 'badge-warning' :
                                                    pedido.estado === 'preparando' ? 'badge-info' :
                                                    pedido.estado === 'listo' ? 'badge-success' :
                                                    pedido.estado === 'entregado' ? 'badge-neutral' :
                                                    'badge-danger'
                                                }`}>
                                                    {pedido.estado}
                                                </span>
                                            </td>
                                            <td className="text-sm text-gray-500">
                                                {new Date(pedido.fecha).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* NAVEGACIÓN CONTEXTUAL */}
                <div className="flex gap-4 mt-4">
                    <Link href="/cocina" className="btn-secondary text-sm">
                        👨‍🍳 Ver en Cocina
                    </Link>
                    <Link href="/dashboard" className="btn-ghost text-sm">
                        📊 Dashboard
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    )
}