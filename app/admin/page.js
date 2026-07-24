'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { Plus, Edit2, Trash2, RefreshCw, Search, Scale } from 'lucide-react'

export default function UnidadesPage() {
    const [unidades, setUnidades] = useState([])
    const [cargando, setCargando] = useState(true)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [editandoId, setEditandoId] = useState(null)
    const [busqueda, setBusqueda] = useState('')
    const [formData, setFormData] = useState({
        nombre: '',
        abreviatura: '',
        descripcion: '',
        activo: true
    })

    useEffect(() => {
        cargarUnidades()
    }, [])

    const cargarUnidades = async () => {
        setCargando(true)
        try {
            const { data } = await supabase
                .from('unidades')
                .select('*')
                .order('nombre')
            setUnidades(data || [])
        } catch (error) {
            console.error('Error cargando unidades:', error)
        } finally {
            setCargando(false)
        }
    }

    const resetFormulario = () => {
        setFormData({
            nombre: '',
            abreviatura: '',
            descripcion: '',
            activo: true
        })
        setEditandoId(null)
        setMostrarFormulario(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.nombre || !formData.abreviatura) {
            alert('Por favor, completa el nombre y la abreviatura')
            return
        }

        try {
            if (editandoId) {
                const { error } = await supabase
                    .from('unidades')
                    .update({
                        nombre: formData.nombre,
                        abreviatura: formData.abreviatura,
                        descripcion: formData.descripcion,
                        activo: formData.activo
                    })
                    .eq('id', editandoId)

                if (error) throw error
                alert('✅ Unidad actualizada correctamente')
            } else {
                const { error } = await supabase
                    .from('unidades')
                    .insert({
                        nombre: formData.nombre,
                        abreviatura: formData.abreviatura,
                        descripcion: formData.descripcion,
                        activo: formData.activo
                    })

                if (error) throw error
                alert('✅ Unidad creada correctamente')
            }

            resetFormulario()
            cargarUnidades()
        } catch (error) {
            console.error('Error guardando unidad:', error)
            alert('❌ Error al guardar la unidad: ' + error.message)
        }
    }

    const handleEditar = (unidad) => {
        setEditandoId(unidad.id)
        setFormData({
            nombre: unidad.nombre,
            abreviatura: unidad.abreviatura || '',
            descripcion: unidad.descripcion || '',
            activo: unidad.activo !== false
        })
        setMostrarFormulario(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Estás seguro de desactivar esta unidad?')) return

        try {
            const { error } = await supabase
                .from('unidades')
                .update({ activo: false })
                .eq('id', id)

            if (error) throw error
            alert('✅ Unidad desactivada correctamente')
            cargarUnidades()
        } catch (error) {
            console.error('Error desactivando unidad:', error)
            alert('❌ Error al desactivar la unidad')
        }
    }

    const handleReactivar = async (id) => {
        try {
            const { error } = await supabase
                .from('unidades')
                .update({ activo: true })
                .eq('id', id)

            if (error) throw error
            alert('✅ Unidad reactivada correctamente')
            cargarUnidades()
        } catch (error) {
            console.error('Error reactivando unidad:', error)
            alert('❌ Error al reactivar la unidad')
        }
    }

    const unidadesFiltradas = unidades.filter(u => {
        if (!busqueda) return true
        return u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
               u.abreviatura?.toLowerCase().includes(busqueda.toLowerCase())
    })

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            <span className="text-gradient-golden">Golden</span>
                            <span className="text-white"> on </span>
                            <span className="text-gradient-fire">Fire</span>
                            <span className="text-white/60"> - Unidades</span>
                        </h2>
                        <p className="text-sm text-white/40">Gestiona las unidades de medida</p>
                    </div>
                    <button
                        onClick={() => {
                            resetFormulario()
                            setMostrarFormulario(!mostrarFormulario)
                        }}
                        className="btn-golden text-sm flex items-center gap-2"
                    >
                        <Plus size={18} />
                        {mostrarFormulario ? 'Cancelar' : 'Nueva Unidad'}
                    </button>
                </div>

                {mostrarFormulario && (
                    <div className="glass-golden rounded-xl p-6 border border-golden/30 animate-fade-in-up">
                        <h3 className="text-lg font-semibold mb-4 text-white">
                            {editandoId ? '✏️ Editar Unidad' : '📝 Nueva Unidad'}
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
                                        placeholder="Ej: Kilogramo, Litro, Unidad"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Abreviatura *</label>
                                    <input
                                        type="text"
                                        value={formData.abreviatura}
                                        onChange={(e) => setFormData({...formData, abreviatura: e.target.value.toUpperCase()})}
                                        className="input-field"
                                        placeholder="Ej: kg, L, und"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Descripción</label>
                                    <input
                                        type="text"
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                                        className="input-field"
                                        placeholder="Descripción de la unidad"
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
                                    {editandoId ? '💾 Actualizar' : '💾 Crear Unidad'}
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
                            placeholder="🔍 Buscar unidades..."
                        />
                    </div>
                    <button onClick={cargarUnidades} className="btn-secondary text-sm">
                        <RefreshCw size={16} />
                    </button>
                </div>

                <div className="glass rounded-xl overflow-hidden border border-white/10">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Nombre</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Abreviatura</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Descripción</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {cargando ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-white/40">Cargando...</td></tr>
                                ) : unidadesFiltradas.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-white/40">No hay unidades</td></tr>
                                ) : (
                                    unidadesFiltradas.map((unidad) => (
                                        <tr key={unidad.id} className={!unidad.activo ? 'opacity-50' : ''}>
                                            <td className="px-4 py-3 font-medium text-white">{unidad.nombre}</td>
                                            <td className="px-4 py-3 text-white/60 font-mono">{unidad.abreviatura}</td>
                                            <td className="px-4 py-3 text-white/60">{unidad.descripcion || 'Sin descripción'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs border ${
                                                    unidad.activo 
                                                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                                        : 'bg-white/10 text-white/40 border-white/10'
                                                }`}>
                                                    {unidad.activo ? '✅ Activo' : '⏸️ Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 space-x-2">
                                                {unidad.activo ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditar(unidad)}
                                                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                                        >
                                                            <Edit2 size={14} /> Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleEliminar(unidad.id)}
                                                            className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                                                        >
                                                            <Trash2 size={14} /> Desactivar
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReactivar(unidad.id)}
                                                        className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1"
                                                    >
                                                        <RefreshCw size={14} /> Reactivar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}