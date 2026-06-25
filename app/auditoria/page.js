'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Search, X, Calendar, User, Filter, Download, BarChart3, Trash2, Archive } from 'lucide-react'

export default function AuditoriaPage() {
    const [logs, setLogs] = useState([])
    const [cargando, setCargando] = useState(true)
    const [filtroUsuario, setFiltroUsuario] = useState('')
    const [filtroAccion, setFiltroAccion] = useState('')
    const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
    const [filtroFechaFin, setFiltroFechaFin] = useState('')
    const [usuarios, setUsuarios] = useState([])
    const [mostrarFiltros, setMostrarFiltros] = useState(true)
    const [statsAuditoria, setStatsAuditoria] = useState({
        totalAcciones: 0,
        usuariosActivos: 0,
        accionesHoy: 0,
        tipoAccionMasComun: ''
    })

    useEffect(() => {
        cargarUsuarios()
        cargarAuditoria()
        cargarEstadisticasAuditoria()
    }, [])

    const cargarUsuarios = async () => {
        const { data } = await supabase
            .from('usuarios')
            .select('id, nombre, avatar')
            .eq('activo', true)
            .order('nombre')
        setUsuarios(data || [])
    }

    const cargarEstadisticasAuditoria = async () => {
        try {
            // Total de acciones
            const { count: totalAcciones } = await supabase
                .from('auditoria')
                .select('*', { count: 'exact', head: true })

            // Usuarios que han hecho acciones
            const { data: usuariosActivos } = await supabase
                .from('auditoria')
                .select('usuario_id')
            const uniqueUsuarios = new Set(usuariosActivos?.map(u => u.usuario_id) || [])
            
            // Acciones de hoy
            const hoy = new Date()
            hoy.setHours(0, 0, 0, 0)
            const { count: accionesHoy } = await supabase
                .from('auditoria')
                .select('*', { count: 'exact', head: true })
                .gte('fecha', hoy.toISOString())

            // Tipo de acción más común
            const { data: acciones } = await supabase
                .from('auditoria')
                .select('accion')
                .limit(100)
            
            const tipos = {}
            acciones?.forEach(a => {
                const tipo = a.accion.split(' ')[0] || 'otra'
                tipos[tipo] = (tipos[tipo] || 0) + 1
            })
            const tipoMasComun = Object.entries(tipos).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

            setStatsAuditoria({
                totalAcciones: totalAcciones || 0,
                usuariosActivos: uniqueUsuarios.size,
                accionesHoy: accionesHoy || 0,
                tipoAccionMasComun: tipoMasComun
            })
        } catch (error) {
            console.error('Error cargando estadísticas de auditoría:', error)
        }
    }

    const cargarAuditoria = async () => {
        setCargando(true)
        try {
            let query = supabase
                .from('auditoria')
                .select(`
                    *,
                    usuarios (nombre, avatar)
                `)
                .order('fecha', { ascending: false })

            if (filtroUsuario) {
                query = query.eq('usuario_id', filtroUsuario)
            }
            if (filtroAccion) {
                query = query.ilike('accion', `%${filtroAccion}%`)
            }
            if (filtroFechaInicio) {
                query = query.gte('fecha', new Date(filtroFechaInicio).toISOString())
            }
            if (filtroFechaFin) {
                const fin = new Date(filtroFechaFin)
                fin.setHours(23, 59, 59, 999)
                query = query.lte('fecha', fin.toISOString())
            }

            const { data } = await query
            setLogs(data || [])
        } catch (error) {
            console.error('Error cargando auditoría:', error)
        } finally {
            setCargando(false)
        }
    }

    const limpiarFiltros = () => {
        setFiltroUsuario('')
        setFiltroAccion('')
        setFiltroFechaInicio('')
        setFiltroFechaFin('')
        cargarAuditoria()
    }

    const eliminarLog = async (id) => {
        if (!confirm('⚠️ ¿Eliminar este registro de auditoría permanentemente?')) return
        try {
            await supabase.from('auditoria').delete().eq('id', id)
            cargarAuditoria()
            cargarEstadisticasAuditoria()
        } catch (error) {
            console.error('Error eliminando log:', error)
            alert('Error al eliminar el registro')
        }
    }

    const archivarLogs = async () => {
        if (!confirm('⚠️ ¿Archivar logs antiguos (más de 30 días)?')) return
        try {
            const fechaLimite = new Date()
            fechaLimite.setDate(fechaLimite.getDate() - 30)
            await supabase
                .from('auditoria')
                .update({ archivado: true })
                .lt('fecha', fechaLimite.toISOString())
            cargarAuditoria()
            cargarEstadisticasAuditoria()
            alert('✅ Logs archivados correctamente')
        } catch (error) {
            console.error('Error archivando logs:', error)
            alert('Error al archivar logs')
        }
    }

    const exportarCSV = () => {
        if (logs.length === 0) {
            alert('No hay datos para exportar')
            return
        }
        const headers = ['Fecha', 'Usuario', 'Acción']
        const rows = logs.map(l => [
            new Date(l.fecha).toLocaleString(),
            l.usuarios?.nombre || 'Sistema',
            l.accion
        ])
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    const tiposAccion = [
        { value: '', label: 'Todas las acciones' },
        { value: 'Creó pedido', label: '📝 Creación de pedidos' },
        { value: 'Cambió estado', label: '🔄 Cambios de estado' },
        { value: 'Descontó', label: '📦 Descuentos de stock' },
        { value: 'producto', label: '🍕 Gestión de productos' },
        { value: 'categoría', label: '📂 Gestión de categorías' },
        { value: 'usuario', label: '👥 Gestión de usuarios' },
    ]

    const extraerPedidoId = (accion) => {
        const match = accion.match(/#([a-f0-9]{8})/)
        return match ? match[1] : null
    }

    const getIconoAccion = (accion) => {
        if (accion.includes('Creó pedido')) return '📝'
        if (accion.includes('Cambió estado')) return '🔄'
        if (accion.includes('Descontó')) return '📦'
        if (accion.includes('producto')) return '🍕'
        if (accion.includes('categoría')) return '📂'
        if (accion.includes('usuario')) return '👥'
        return '📌'
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">📋 Auditoría del Sistema</h2>
                        <p className="text-sm text-gray-500">Registro completo con análisis avanzado</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={exportarCSV} className="btn-secondary text-sm flex items-center gap-2">
                            <Download size={16} /> Exportar
                        </button>
                        <button onClick={archivarLogs} className="btn-secondary text-sm flex items-center gap-2">
                            <Archive size={16} /> Archivar
                        </button>
                        <button
                            onClick={() => setMostrarFiltros(!mostrarFiltros)}
                            className={`btn-secondary text-sm flex items-center gap-2 ${mostrarFiltros ? 'bg-orange-600 text-white hover:bg-orange-700' : ''}`}
                        >
                            <Filter size={16} />
                            {mostrarFiltros ? 'Ocultar filtros' : 'Filtros'}
                        </button>
                        <button onClick={cargarAuditoria} className="btn-secondary text-sm">
                            🔄 Actualizar
                        </button>
                    </div>
                </div>

                {/* Estadísticas de auditoría */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Total Acciones</p>
                        <p className="text-2xl font-bold text-gray-800">{statsAuditoria.totalAcciones}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Usuarios Activos</p>
                        <p className="text-2xl font-bold text-gray-800">{statsAuditoria.usuariosActivos}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Acciones Hoy</p>
                        <p className="text-2xl font-bold text-gray-800">{statsAuditoria.accionesHoy}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Acción Más Común</p>
                        <p className="text-2xl font-bold text-gray-800">{statsAuditoria.tipoAccionMasComun}</p>
                    </div>
                </div>

                {/* Panel de filtros */}
                {mostrarFiltros && (
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 animate-fade-in-up">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="input-label text-xs flex items-center gap-1">
                                    <User size={14} /> Usuario
                                </label>
                                <select
                                    value={filtroUsuario}
                                    onChange={(e) => {
                                        setFiltroUsuario(e.target.value)
                                        setTimeout(cargarAuditoria, 100)
                                    }}
                                    className="input-field text-sm"
                                >
                                    <option value="">Todos los usuarios</option>
                                    {usuarios.map(u => (
                                        <option key={u.id} value={u.id}>{u.avatar} {u.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="input-label text-xs flex items-center gap-1">
                                    <Search size={14} /> Acción
                                </label>
                                <select
                                    value={filtroAccion}
                                    onChange={(e) => {
                                        setFiltroAccion(e.target.value)
                                        setTimeout(cargarAuditoria, 100)
                                    }}
                                    className="input-field text-sm"
                                >
                                    {tiposAccion.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="input-label text-xs flex items-center gap-1">
                                    <Calendar size={14} /> Desde
                                </label>
                                <input
                                    type="date"
                                    value={filtroFechaInicio}
                                    onChange={(e) => {
                                        setFiltroFechaInicio(e.target.value)
                                        setTimeout(cargarAuditoria, 100)
                                    }}
                                    className="input-field text-sm"
                                />
                            </div>

                            <div>
                                <label className="input-label text-xs flex items-center gap-1">
                                    <Calendar size={14} /> Hasta
                                </label>
                                <input
                                    type="date"
                                    value={filtroFechaFin}
                                    onChange={(e) => {
                                        setFiltroFechaFin(e.target.value)
                                        setTimeout(cargarAuditoria, 100)
                                    }}
                                    className="input-field text-sm"
                                />
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                            <button
                                onClick={limpiarFiltros}
                                className="btn-ghost text-sm flex items-center gap-2 text-red-500 hover:text-red-700"
                            >
                                <X size={16} /> Limpiar filtros
                            </button>
                            <span className="text-sm text-gray-400">
                                {logs.length} registros encontrados
                            </span>
                        </div>
                    </div>
                )}

                {/* Resumen de filtros activos */}
                {(filtroUsuario || filtroAccion || filtroFechaInicio || filtroFechaFin) && (
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className="text-gray-500">Filtros activos:</span>
                        {filtroUsuario && (
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                Usuario: {usuarios.find(u => u.id === filtroUsuario)?.nombre || filtroUsuario}
                            </span>
                        )}
                        {filtroAccion && (
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                Acción: {tiposAccion.find(t => t.value === filtroAccion)?.label || filtroAccion}
                            </span>
                        )}
                        {filtroFechaInicio && (
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                Desde: {new Date(filtroFechaInicio).toLocaleDateString()}
                            </span>
                        )}
                        {filtroFechaFin && (
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                Hasta: {new Date(filtroFechaFin).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                )}

                {/* Tabla de resultados */}
                {cargando ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="animate-pulse">
                            <div className="text-4xl mb-4">📋</div>
                            <p>Cargando registros...</p>
                        </div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-4xl mb-4">📭</p>
                        <p className="text-lg font-medium">No hay registros que coincidan</p>
                        <p className="text-sm text-gray-400">Prueba ajustando los filtros</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enlace</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {logs.map((log) => {
                                        const pedidoId = extraerPedidoId(log.accion)
                                        return (
                                            <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                                    {new Date(log.fecha).toLocaleString('es-ES', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center space-x-2">
                                                        <span className="text-xl">{log.usuarios?.avatar || '👤'}</span>
                                                        <span className="font-medium text-gray-700">{log.usuarios?.nombre || 'Sistema'}</span>
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center gap-2">
                                                        <span>{getIconoAccion(log.accion)}</span>
                                                        <span className="text-gray-700">{log.accion}</span>
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {pedidoId && (
                                                        <Link href={`/cocina`} className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                                                            🔍 Ver pedido #{pedidoId}
                                                        </Link>
                                                    )}
                                                    {log.accion.includes('Descontó') && (
                                                        <Link href={`/inventario`} className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1">
                                                            📦 Ver inventario
                                                        </Link>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => eliminarLog(log.id)}
                                                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Eliminar registro"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-gray-50 px-4 py-2 text-sm text-gray-500 border-t border-gray-100 flex justify-between">
                            <span>Mostrando {logs.length} registros</span>
                            <span className="text-xs text-gray-400">Total en BD: {statsAuditoria.totalAcciones}</span>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}