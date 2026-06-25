'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js'
import { Bar, Pie, Doughnut } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
)

export default function EstadisticasPage() {
    const [cargando, setCargando] = useState(true)
    const [usuario, setUsuario] = useState(null)
    const [esAdmin, setEsAdmin] = useState(false)
    const [empleados, setEmpleados] = useState([])
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null)
    
    // Estados para estadísticas personales
    const [statsPersonales, setStatsPersonales] = useState({
        totalPedidos: 0,
        totalVentas: 0,
        pedidosHoy: 0,
        ventasHoy: 0,
        promedioPedido: 0,
        pedidosUltimaSemana: 0
    })
    const [ventasPorDia, setVentasPorDia] = useState({ fechas: [], montos: [] })
    const [productosMasVendidos, setProductosMasVendidos] = useState([])
    const [pedidosPorEstado, setPedidosPorEstado] = useState([])

    // Estados para estadísticas de empleados (solo admin)
    const [statsEmpleados, setStatsEmpleados] = useState([])

    useEffect(() => {
        const userData = localStorage.getItem('usuario')
        if (userData) {
            const user = JSON.parse(userData)
            setUsuario(user)
            setEsAdmin(user.rol === 'admin')
            if (user.rol === 'admin') {
                cargarEmpleados()
            }
        }
        cargarDatosPersonales()
    }, [])

    useEffect(() => {
        if (empleadoSeleccionado) {
            cargarDatosEmpleado(empleadoSeleccionado)
        }
    }, [empleadoSeleccionado])

    const cargarEmpleados = async () => {
        const { data } = await supabase
            .from('usuarios')
            .select('id, nombre, avatar')
            .eq('activo', true)
            .eq('rol', 'empleado')
            .order('nombre')
        setEmpleados(data || [])
        if (data && data.length > 0) {
            setEmpleadoSeleccionado(data[0].id)
        }
    }

    const cargarDatosPersonales = async () => {
        try {
            setCargando(true)
            const userData = localStorage.getItem('usuario')
            if (!userData) return
            const user = JSON.parse(userData)
            const empleadoId = user.id

            const hoy = new Date()
            hoy.setHours(0, 0, 0, 0)

            // Total pedidos del empleado
            const { count: totalPedidos } = await supabase
                .from('pedidos')
                .select('*', { count: 'exact', head: true })
                .eq('empleado_id', empleadoId)

            // Pedidos hoy
            const { count: pedidosHoy } = await supabase
                .from('pedidos')
                .select('*', { count: 'exact', head: true })
                .eq('empleado_id', empleadoId)
                .gte('fecha', hoy.toISOString())

            // Ventas totales
            const { data: ventas } = await supabase
                .from('pedidos')
                .select('total')
                .eq('empleado_id', empleadoId)
                .neq('estado', 'cancelado')

            // Ventas hoy
            const { data: ventasHoy } = await supabase
                .from('pedidos')
                .select('total')
                .eq('empleado_id', empleadoId)
                .neq('estado', 'cancelado')
                .gte('fecha', hoy.toISOString())

            const totalVentas = ventas?.reduce((sum, p) => sum + (p.total || 0), 0) || 0
            const ventasHoyTotal = ventasHoy?.reduce((sum, p) => sum + (p.total || 0), 0) || 0
            const promedioPedido = totalPedidos > 0 ? totalVentas / totalPedidos : 0

            // Ventas últimos 7 días
            const fechaInicio = new Date()
            fechaInicio.setDate(fechaInicio.getDate() - 6)
            fechaInicio.setHours(0, 0, 0, 0)
            
            const { data: ventasPorDiaData } = await supabase
                .from('pedidos')
                .select('total, fecha')
                .eq('empleado_id', empleadoId)
                .neq('estado', 'cancelado')
                .gte('fecha', fechaInicio.toISOString())

            // Pedidos última semana
            const { count: pedidosUltimaSemana } = await supabase
                .from('pedidos')
                .select('*', { count: 'exact', head: true })
                .eq('empleado_id', empleadoId)
                .gte('fecha', fechaInicio.toISOString())

            // Procesar ventas por día
            const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
            const ventasDiarias = {}
            for (let i = 6; i >= 0; i--) {
                const fecha = new Date()
                fecha.setDate(fecha.getDate() - i)
                const key = fecha.toISOString().split('T')[0]
                ventasDiarias[key] = 0
            }
            
            if (ventasPorDiaData) {
                ventasPorDiaData.forEach(item => {
                    const fecha = new Date(item.fecha).toISOString().split('T')[0]
                    if (ventasDiarias[fecha] !== undefined) {
                        ventasDiarias[fecha] += item.total || 0
                    }
                })
            }

            const fechas = Object.keys(ventasDiarias)
            const montos = Object.values(ventasDiarias)
            const etiquetas = fechas.map(f => {
                const d = new Date(f + 'T00:00:00')
                return diasSemana[d.getDay()]
            })

            setVentasPorDia({ fechas: etiquetas, montos })

            // Productos más vendidos por este empleado
            const { data: productosData } = await supabase
                .from('pedido_detalles')
                .select(`
                    nombre_producto,
                    cantidad,
                    pedidos!inner (empleado_id)
                `)
                .eq('pedidos.empleado_id', empleadoId)
                .not('nombre_producto', 'is', null)
                .limit(50)

            if (productosData && productosData.length > 0) {
                const conteo = {}
                productosData.forEach(d => {
                    const nombre = d.nombre_producto || 'Producto'
                    if (conteo[nombre]) {
                        conteo[nombre] += d.cantidad || 1
                    } else {
                        conteo[nombre] = d.cantidad || 1
                    }
                })
                const sorted = Object.entries(conteo)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
                setProductosMasVendidos(sorted)
            }

            // Pedidos por estado
            const { data: estadosData } = await supabase
                .from('pedidos')
                .select('estado')
                .eq('empleado_id', empleadoId)

            if (estadosData) {
                const conteo = {}
                estadosData.forEach(p => {
                    const estado = p.estado || 'desconocido'
                    conteo[estado] = (conteo[estado] || 0) + 1
                })
                setPedidosPorEstado(Object.entries(conteo).map(([estado, cantidad]) => ({ estado, cantidad })))
            }

            setStatsPersonales({
                totalPedidos: totalPedidos || 0,
                totalVentas: totalVentas,
                pedidosHoy: pedidosHoy || 0,
                ventasHoy: ventasHoyTotal,
                promedioPedido: promedioPedido,
                pedidosUltimaSemana: pedidosUltimaSemana || 0
            })

        } catch (error) {
            console.error('Error cargando estadísticas personales:', error)
        } finally {
            setCargando(false)
        }
    }

    const cargarDatosEmpleado = async (empleadoId) => {
        try {
            // Similar a cargarDatosPersonales pero para un empleado específico
            // (solo admin)
        } catch (error) {
            console.error('Error cargando datos del empleado:', error)
        }
    }

    // Datos para gráficos
    const datosVentasDiarias = {
        labels: ventasPorDia.fechas.length > 0 ? ventasPorDia.fechas : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [{
            label: 'Ventas ($)',
            data: ventasPorDia.montos.length > 0 ? ventasPorDia.montos : [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(255, 107, 53, 0.6)',
            borderColor: '#FF6B35',
            borderWidth: 2,
            borderRadius: 6,
        }],
    }

    const datosProductos = {
        labels: productosMasVendidos.map(p => p.nombre.length > 12 ? p.nombre.substring(0, 12) + '...' : p.nombre),
        datasets: [{
            label: 'Unidades',
            data: productosMasVendidos.map(p => p.cantidad),
            backgroundColor: ['rgba(255,107,53,0.8)', 'rgba(59,130,246,0.8)', 'rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(139,92,246,0.8)'],
            borderWidth: 0,
        }],
    }

    const datosEstados = {
        labels: pedidosPorEstado.map(p => p.estado),
        datasets: [{
            label: 'Pedidos',
            data: pedidosPorEstado.map(p => p.cantidad),
            backgroundColor: ['rgba(245,158,11,0.8)', 'rgba(59,130,246,0.8)', 'rgba(16,185,129,0.8)', 'rgba(107,114,128,0.8)', 'rgba(239,68,68,0.8)'],
            borderWidth: 0,
        }],
    }

    const opcionesVentas = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, ticks: { callback: v => '$' + v } },
            x: { grid: { display: false } }
        }
    }

    const opcionesProductos = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } }
    }

    const opcionesEstados = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } }
    }

    // Si es admin, mostrar panel de control de empleados
    if (esAdmin) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">📊 Panel de Control - Empleados</h2>
                            <p className="text-sm text-gray-500">Estadísticas por empleado (vista administrativa)</p>
                        </div>
                    </div>

                    {/* Selector de empleado */}
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <label className="input-label text-sm">👤 Seleccionar empleado</label>
                        <select
                            value={empleadoSeleccionado || ''}
                            onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
                            className="input-field"
                        >
                            <option value="">Todos los empleados</option>
                            {empleados.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.avatar} {emp.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Aquí irían las estadísticas del empleado seleccionado (similar a las personales) */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-4xl mb-4">👥</p>
                            <p>Estadísticas detalladas por empleado en desarrollo...</p>
                            <p className="text-sm text-gray-400">Próximamente: gráficos comparativos y análisis de rendimiento</p>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    // Vista para empleados (solo sus datos)
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">📊 Mis Estadísticas</h2>
                        <p className="text-sm text-gray-500">Tu rendimiento personal</p>
                    </div>
                    <button onClick={() => window.location.reload()} className="btn-secondary text-sm py-1 px-3">
                        🔄 Actualizar
                    </button>
                </div>

                {cargando ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="animate-pulse">
                            <div className="text-4xl mb-4">📊</div>
                            <p>Cargando tus estadísticas...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Tarjetas de resumen personal */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Total Pedidos</p>
                                <p className="text-2xl font-bold text-gray-800">{statsPersonales.totalPedidos}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Total Ventas</p>
                                <p className="text-2xl font-bold text-gray-800">${statsPersonales.totalVentas.toFixed(2)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Promedio por Pedido</p>
                                <p className="text-2xl font-bold text-gray-800">${statsPersonales.promedioPedido.toFixed(2)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Pedidos Hoy</p>
                                <p className="text-2xl font-bold text-gray-800">{statsPersonales.pedidosHoy}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-indigo-500">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Ventas Hoy</p>
                                <p className="text-2xl font-bold text-gray-800">${statsPersonales.ventasHoy.toFixed(2)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-pink-500">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Última Semana</p>
                                <p className="text-2xl font-bold text-gray-800">{statsPersonales.pedidosUltimaSemana}</p>
                            </div>
                        </div>

                        {/* Gráficos */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">📈 Ventas Últimos 7 Días</h3>
                                <div className="h-56">
                                    <Bar data={datosVentasDiarias} options={opcionesVentas} />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">🍕 Productos Más Vendidos</h3>
                                <div className="h-56">
                                    {productosMasVendidos.length > 0 ? (
                                        <Pie data={datosProductos} options={opcionesProductos} />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                            No hay datos suficientes
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">📊 Pedidos por Estado</h3>
                                <div className="h-56">
                                    {pedidosPorEstado.length > 0 ? (
                                        <Doughnut data={datosEstados} options={opcionesEstados} />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                            No hay datos suficientes
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Detalle de Productos</h3>
                                {productosMasVendidos.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-gray-500 font-medium">#</th>
                                                    <th className="px-4 py-2 text-left text-gray-500 font-medium">Producto</th>
                                                    <th className="px-4 py-2 text-right text-gray-500 font-medium">Unidades</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {productosMasVendidos.map((p, i) => (
                                                    <tr key={i} className="hover:bg-orange-50/50 transition-colors">
                                                        <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                                                        <td className="px-4 py-2 font-medium text-gray-700">{p.nombre}</td>
                                                        <td className="px-4 py-2 text-right font-bold text-orange-600">{p.cantidad}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                        No hay datos suficientes
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}