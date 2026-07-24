'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { Plus, Edit2, Trash2, RefreshCw, Search, X, Check, FolderOpen } from 'lucide-react'

export default function CategoriasPage() {
    const [categorias, setCategorias] = useState([])
    const [cargando, setCargando] = useState(true)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [editandoId, setEditandoId] = useState(null)
    const [busqueda, setBusqueda] = useState('')
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        activo: true
    })

    useEffect(() => {
        cargarCategorias()
    }, [])

    const cargarCategorias = async () => {
        setCargando(true)
        try {
            const { data } = await supabase
                .from('categorias')
                .select('*')
                .order('nombre')
            setCategorias(data || [])
        } catch (error) {
            console.error('Error cargando categorías:', error)
        } finally {
            setCargando(false)
        }
    }

    const resetFormulario = () => {
        setFormData({
            nombre: '',
            descripcion: '',
            activo: true
        })
        setEditandoId(null)
        setMostrarFormulario(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.nombre) {
            alert('Por favor, completa el nombre de la categoría')
            return
        }

        try {
            if (editandoId) {
                const { error } = await supabase
                    .from('categorias')
                    .update({
                        nombre: formData.nombre,
                        descripcion: formData.descripcion,
                        activo: formData.activo
                    })
                    .eq('id', editandoId)

                if (error) throw error
                alert('✅ Categoría actualizada correctamente')
            } else {
                const { error } = await supabase
                    .from('categorias')
                    .insert({
                        nombre: formData.nombre,
                        descripcion: formData.descripcion,
                        activo: formData.activo
                    })

                if (error) throw error
                alert('✅ Categoría creada correctamente')
            }

            resetFormulario()
            cargarCategorias()
        } catch (error) {
            console.error('Error guardando categoría:', error)
            alert('❌ Error al guardar la categoría: ' + error.message)
        }
    }

    const handleEditar = (categoria) => {
        setEditandoId(categoria.id)
        setFormData({
            nombre: categoria.nombre,
            descripcion: categoria.descripcion || '',
            activo: categoria.activo !== false
        })
        setMostrarFormulario(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Estás seguro de desactivar esta categoría?')) return

        try {
            const { error } = await supabase
                .from('categorias')
                .update({ activo: false })
                .eq('id', id)

            if (error) throw error
            alert('✅ Categoría desactivada correctamente')
            cargarCategorias()
        } catch (error) {
            console.error('Error desactivando categoría:', error)
            alert('❌ Error al desactivar la categoría')
        }
    }

    const handleReactivar = async (id) => {
        try {
            const { error } = await supabase
                .from('categorias')
                .update({ activo: true })
                .eq('id', id)

            if (error) throw error
            alert('✅ Categoría reactivada correctamente')
            cargarCategorias()
        } catch (error) {
            console.error('Error reactivando categoría:', error)
            alert('❌ Error al reactivar la categoría')
        }
    }

    const categoriasFiltradas = categorias.filter(c => {
        if (!busqueda) return true
        return c.nombre?.toLowerCase().includes(busqueda.toLowerCase())
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
                            <span className="text-white/60"> - Categorías</span>
                        </h2>
                        <p className="text-sm text-white/40">Gestiona las categorías de productos</p>
                    </div>
                    <button
                        onClick={() => {
                            resetFormulario()
                            setMostrarFormulario(!mostrarFormulario)
                        }}
                        className="btn-golden text-sm flex items-center gap-2"
                    >
                        <Plus size={18} />
                        {mostrarFormulario ? 'Cancelar' : 'Nueva Categoría'}
                    </button>
                </div>

                {mostrarFormulario && (
                    <div className="glass-golden rounded-xl p-6 border border-golden/30 animate-fade-in-up">
                        <h3 className="text-lg font-semibold mb-4 text-white">
                            {editandoId ? '✏️ Editar Categoría' : '📝 Nueva Categoría'}
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
                                        placeholder="Ej: Pizzas, Bebidas, Postres"
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
                                        placeholder="Descripción de la categoría"
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
                                    {editandoId ? '💾 Actualizar' : '💾 Crear Categoría'}
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
                            placeholder="🔍 Buscar categorías..."
                        />
                    </div>
                    <button onClick={cargarCategorias} className="btn-secondary text-sm">
                        <RefreshCw size={16} />
                    </button>
                </div>

                <div className="glass rounded-xl overflow-hidden border border-white/10">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Nombre</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Descripción</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {cargando ? (
                                    <tr><td colSpan="4" className="text-center py-8 text-white/40">Cargando...</td></tr>
                                ) : categoriasFiltradas.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-8 text-white/40">No hay categorías</td></tr>
                                ) : (
                                    categoriasFiltradas.map((categoria) => (
                                        <tr key={categoria.id} className={!categoria.activo ? 'opacity-50' : ''}>
                                            <td className="px-4 py-3 font-medium text-white">{categoria.nombre}</td>
                                            <td className="px-4 py-3 text-white/60">{categoria.descripcion || 'Sin descripción'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs border ${
                                                    categoria.activo 
                                                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                                        : 'bg-white/10 text-white/40 border-white/10'
                                                }`}>
                                                    {categoria.activo ? '✅ Activo' : '⏸️ Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 space-x-2">
                                                {categoria.activo ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditar(categoria)}
                                                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                                        >
                                                            <Edit2 size={14} /> Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleEliminar(categoria.id)}
                                                            className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                                                        >
                                                            <Trash2 size={14} /> Desactivar
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReactivar(categoria.id)}
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