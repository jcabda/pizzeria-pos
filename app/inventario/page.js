'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'
import { Plus, Edit2, Trash2, RefreshCw, Search, X, Check, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

export default function InventarioPage() {
    const [ingredientes, setIngredientes] = useState([])
    const [cargando, setCargando] = useState(true)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [editandoId, setEditandoId] = useState(null)
    const [busqueda, setBusqueda] = useState('')
    const [unidades, setUnidades] = useState([])
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        cantidad: 0,
        unidad_id: '',
        precio_unitario: 0,
        stock_minimo: 0,
        activo: true
    })

    useEffect(() => {
        cargarIngredientes()
        cargarUnidades()
    }, [])

    const cargarIngredientes = async () => {
        setCargando(true)
        try {
            const { data } = await supabase
                .from('ingredientes')
                .select(`
                    *,
                    unidades (nombre, abreviatura)
                `)
                .order('nombre')
            setIngredientes(data || [])
        } catch (error) {
            console.error('Error cargando ingredientes:', error)
        } finally {
            setCargando(false)
        }
    }

    const cargarUnidades = async () => {
        try {
            const { data } = await supabase
                .from('unidades')
                .select('*')
                .eq('activo', true)
                .order('nombre')
            setUnidades(data || [])
        } catch (error) {
            console.error('Error cargando unidades:', error)
        }
    }

    const resetFormulario = () => {
        setFormData({
            nombre: '',
            descripcion: '',
            cantidad: 0,
            unidad_id: '',
            precio_unitario: 0,
            stock_minimo: 0,
            activo: true
        })
        setEditandoId(null)
        setMostrarFormulario(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.nombre || !formData.unidad_id) {
            alert('Por favor, completa todos los campos requeridos')
            return
        }

        try {
            if (editandoId) {
                const { error } = await supabase
                    .from('ingredientes')
                    .update({
                        nombre: formData.nombre,
                        descripcion: formData.descripcion,
                        cantidad: formData.cantidad,
                        unidad_id: formData.unidad_id,
                        precio_unitario: formData.precio_unitario,
                        stock_minimo: formData.stock_minimo,
                        activo: formData.activo
                    })
                    .eq('id', editandoId)

                if (error) throw error
                alert('✅ Ingrediente actualizado correctamente')
            } else {
                const { error } = await supabase
                    .from('ingredientes')
                    .insert({
                        nombre: formData.nombre,
                        descripcion: formData.descripcion,
                        cantidad: formData.cantidad,
                        unidad_id: formData.unidad_id,
                        precio_unitario: formData.precio_unitario,
                        stock_minimo: formData.stock_minimo,
                        activo: formData.activo
                    })

                if (error) throw error
                alert('✅ Ingrediente creado correctamente')
            }

            resetFormulario()
            cargarIngredientes()
        } catch (error) {
            console.error('Error guardando ingrediente:', error)
            alert('❌ Error al guardar el ingrediente: ' + error.message)
        }
    }

    const handleEditar = (ingrediente) => {
        setEditandoId(ingrediente.id)
        setFormData({
            nombre: ingrediente.nombre,
            descripcion: ingrediente.descripcion || '',
            cantidad: ingrediente.cantidad || 0,
            unidad_id: ingrediente.unidad_id || '',
            precio_unitario: ingrediente.precio_unitario || 0,
            stock_minimo: ingrediente.stock_minimo || 0,
            activo: ingrediente.activo !== false
        })
        setMostrarFormulario(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Estás seguro de desactivar este ingrediente?')) return

        try {
            const { error } = await supabase
                .from('ingredientes')
                .update({ activo: false })
                .eq('id', id)

            if (error) throw error
            alert('✅ Ingrediente desactivado correctamente')
            cargarIngredientes()
        } catch (error) {
            console.error('Error desactivando ingrediente:', error)
            alert('❌ Error al desactivar el ingrediente')
        }
    }

    const handleReactivar = async (id) => {
        try {
            const { error } = await supabase
                .from('ingredientes')
                .update({ activo: true })
                .eq('id', id)

            if (error) throw error
            alert('✅ Ingrediente reactivado correctamente')
            cargarIngredientes()
        } catch (error) {
            console.error('Error reactivando ingrediente:', error)
            alert('❌ Error al reactivar el ingrediente')
        }
    }

    const ingredientesFiltrados = ingredientes.filter(i => {
        if (!busqueda) return true
        return i.nombre?.toLowerCase().includes(busqueda.toLowerCase())
    })

    const getStockStatus = (ingrediente) => {
        if (ingrediente.cantidad <= 0) {
            return { label: 'Agotado', color: 'text-red-400 bg-red-500/20 border-red-500/30' }
        }
        if (ingrediente.cantidad <= ingrediente.stock_minimo) {
            return { label: 'Bajo stock', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' }
        }
        return { label: 'En stock', color: 'text-green-400 bg-green-500/20 border-green-500/30' }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            <span className="text-gradient-golden">Golden</span>
                            <span className="text-white"> on </span>
                            <span className="text-gradient-fire">Fire</span>
                            <span className="text-white/60"> - Inventario</span>
                        </h2>
                        <p className="text-sm text-white/40">Gestiona los ingredientes del inventario</p>
                    </div>
                    <button
                        onClick={() => {
                            resetFormulario()
                            setMostrarFormulario(!mostrarFormulario)
                        }}
                        className="btn-golden text-sm flex items-center gap-2"
                    >
                        <Plus size={18} />
                        {mostrarFormulario ? 'Cancelar' : 'Nuevo Ingrediente'}
                    </button>
                </div>

                {mostrarFormulario && (
                    <div className="glass-golden rounded-xl p-6 border border-golden/30 animate-fade-in-up">
                        <h3 className="text-lg font-semibold mb-4 text-white">
                            {editandoId ? '✏️ Editar Ingrediente' : '📝 Nuevo Ingrediente'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="input-label">Nombre *</label>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                        className="input-field"
                                        placeholder="Ej: Harina de trigo"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Unidad *</label>
                                    <select
                                        value={formData.unidad_id}
                                        onChange={(e) => setFormData({...formData, unidad_id: e.target.value})}
                                        className="input-field"
                                        required
                                    >
                                        <option value="">Seleccionar unidad</option>
                                        {unidades.map(u => (
                                            <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Cantidad</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.cantidad}
                                        onChange={(e) => setFormData({...formData, cantidad: parseFloat(e.target.value) || 0})}
                                        className="input-field"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Stock Mínimo</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.stock_minimo}
                                        onChange={(e) => setFormData({...formData, stock_minimo: parseFloat(e.target.value) || 0})}
                                        className="input-field"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Precio Unitario</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.precio_unitario}
                                        onChange={(e) => setFormData({...formData, precio_unitario: parseFloat(e.target.value) || 0})}
                                        className="input-field"
                                        placeholder="0.00"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Descripción</label>
                                    <textarea
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                                        className="input-field"
                                        rows="2"
                                        placeholder="Descripción del ingrediente"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.activo}
                                            onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                                            className="w-4 h-4 rounded accent-golden"
                                        />
                                        <span className="text-sm text-white/60">Activo</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button type="submit" className="btn-golden">
                                    {editandoId ? '💾 Actualizar' : '💾 Crear Ingrediente'}
                                </button>
                                <button type="button" onClick={resetFormulario} className="btn-secondary">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="input-field pl-10"
                            placeholder="🔍 Buscar ingredientes..."
                        />
                    </div>
                    <button onClick={cargarIngredientes} className="btn-secondary text-sm">
                        <RefreshCw size={16} />
                    </button>
                </div>

                <div className="glass rounded-xl overflow-hidden border border-white/10">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Nombre</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Cantidad</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Unidad</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Precio</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Stock Mínimo</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {cargando ? (
                                    <tr><td colSpan="7" className="text-center py-8 text-white/40">Cargando...</td></tr>
                                ) : ingredientesFiltrados.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-8 text-white/40">No hay ingredientes</td></tr>
                                ) : (
                                    ingredientesFiltrados.map((ingrediente) => {
                                        const stockStatus = getStockStatus(ingrediente)
                                        return (
                                            <tr key={ingrediente.id} className={!ingrediente.activo ? 'opacity-50' : ''}>
                                                <td className="px-4 py-3 font-medium text-white">{ingrediente.nombre}</td>
                                                <td className="px-4 py-3 text-white/60">{ingrediente.cantidad}</td>
                                                <td className="px-4 py-3 text-white/60">{ingrediente.unidades?.abreviatura || 'N/A'}</td>
                                                <td className="px-4 py-3 text-white/60">{formatPrice(ingrediente.precio_unitario)}</td>
                                                <td className="px-4 py-3 text-white/60">{ingrediente.stock_minimo}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs border ${stockStatus.color}`}>
                                                        {stockStatus.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 space-x-2">
                                                    {ingrediente.activo ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditar(ingrediente)}
                                                                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                                            >
                                                                <Edit2 size={14} /> Editar
                                                            </button>
                                                            <button
                                                                onClick={() => handleEliminar(ingrediente.id)}
                                                                className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                                                            >
                                                                <Trash2 size={14} /> Desactivar
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleReactivar(ingrediente.id)}
                                                            className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1"
                                                        >
                                                            <RefreshCw size={14} /> Reactivar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}