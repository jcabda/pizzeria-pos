'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'
import { Plus, Edit2, Trash2, Check, X, Ruler, RefreshCw } from 'lucide-react'

export default function TamaniosPage() {
    const [tamanios, setTamanios] = useState([])
    const [cargando, setCargando] = useState(true)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [editandoId, setEditandoId] = useState(null)
    const [formData, setFormData] = useState({
        nombre: '',
        porciones: 1,
        factor: 1.0,
        precio_base: 0,
        max_sabores: 1, // ✅ NUEVO CAMPO
        activo: true
    })

    useEffect(() => {
        cargarTamanios()
    }, [])

    const cargarTamanios = async () => {
        setCargando(true)
        try {
            const { data } = await supabase
                .from('tamanios_pizza')
                .select('*')
                .order('porciones')
            setTamanios(data || [])
        } catch (error) {
            console.error('Error cargando tamaños:', error)
        } finally {
            setCargando(false)
        }
    }

    const resetFormulario = () => {
        setFormData({
            nombre: '',
            porciones: 1,
            factor: 1.0,
            precio_base: 0,
            max_sabores: 1,
            activo: true
        })
        setEditandoId(null)
        setMostrarFormulario(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.nombre || formData.precio_base <= 0) {
            alert('Por favor, completa todos los campos requeridos')
            return
        }

        try {
            if (editandoId) {
                const { error } = await supabase
                    .from('tamanios_pizza')
                    .update({
                        nombre: formData.nombre,
                        porciones: formData.porciones,
                        factor: formData.factor,
                        precio_base: formData.precio_base,
                        max_sabores: formData.max_sabores, // ✅ NUEVO
                        activo: formData.activo
                    })
                    .eq('id', editandoId)

                if (error) throw error
                alert('✅ Tamaño actualizado correctamente')
            } else {
                const { error } = await supabase
                    .from('tamanios_pizza')
                    .insert({
                        nombre: formData.nombre,
                        porciones: formData.porciones,
                        factor: formData.factor,
                        precio_base: formData.precio_base,
                        max_sabores: formData.max_sabores, // ✅ NUEVO
                        activo: formData.activo
                    })

                if (error) throw error
                alert('✅ Tamaño creado correctamente')
            }

            resetFormulario()
            cargarTamanios()
        } catch (error) {
            console.error('Error guardando tamaño:', error)
            alert('❌ Error al guardar el tamaño: ' + error.message)
        }
    }

    const handleEditar = (tamanio) => {
        setEditandoId(tamanio.id)
        setFormData({
            nombre: tamanio.nombre,
            porciones: tamanio.porciones || 1,
            factor: tamanio.factor || 1.0,
            precio_base: tamanio.precio_base || 0,
            max_sabores: tamanio.max_sabores || 1, // ✅ NUEVO
            activo: tamanio.activo !== false
        })
        setMostrarFormulario(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Estás seguro de desactivar este tamaño?')) return

        try {
            const { error } = await supabase
                .from('tamanios_pizza')
                .update({ activo: false })
                .eq('id', id)

            if (error) throw error
            alert('✅ Tamaño desactivado correctamente')
            cargarTamanios()
        } catch (error) {
            console.error('Error desactivando tamaño:', error)
            alert('❌ Error al desactivar el tamaño')
        }
    }

    const handleReactivar = async (id) => {
        try {
            const { error } = await supabase
                .from('tamanios_pizza')
                .update({ activo: true })
                .eq('id', id)

            if (error) throw error
            alert('✅ Tamaño reactivado correctamente')
            cargarTamanios()
        } catch (error) {
            console.error('Error reactivando tamaño:', error)
            alert('❌ Error al reactivar el tamaño')
        }
    }

    const handleEliminarPermanente = async (id) => {
        if (!confirm('⚠️ ¿Estás seguro de ELIMINAR PERMANENTEMENTE este tamaño?')) return

        try {
            const { error } = await supabase
                .from('tamanios_pizza')
                .delete()
                .eq('id', id)

            if (error) throw error
            alert('✅ Tamaño eliminado permanentemente')
            cargarTamanios()
        } catch (error) {
            console.error('Error eliminando tamaño:', error)
            alert('❌ Error al eliminar el tamaño')
        }
    }

    const getEstadoBadge = (activo) => {
        return activo 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-white/10 text-white-40 border border-white/10'
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">
                            <span className="text-gradient-golden">Golden</span>
                            <span className="text-white"> on </span>
                            <span className="text-gradient-fire">Fire</span>
                            <span className="text-white-60"> - Tamaños de Pizza</span>
                        </h2>
                        <p className="text-sm text-white-40">Gestiona los tamaños de pizza disponibles</p>
                    </div>
                    <button
                        onClick={() => {
                            resetFormulario()
                            setMostrarFormulario(!mostrarFormulario)
                        }}
                        className="btn-golden text-sm flex items-center gap-2"
                    >
                        <Plus size={18} />
                        {mostrarFormulario ? 'Cancelar' : 'Nuevo Tamaño'}
                    </button>
                </div>

                {/* Formulario */}
                {mostrarFormulario && (
                    <div className="glass-golden rounded-xl p-6 border border-golden/30 animate-fade-in-up">
                        <h3 className="text-lg font-semibold mb-4 text-white">
                            {editandoId ? '✏️ Editar Tamaño' : '📝 Nuevo Tamaño'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="input-label">Nombre *</label>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                        className="input-field"
                                        placeholder="Ej: Pequeña, Mediana, Grande"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Porciones *</label>
                                    <input
                                        type="number"
                                        value={formData.porciones}
                                        onChange={(e) => setFormData({...formData, porciones: parseInt(e.target.value) || 1})}
                                        className="input-field"
                                        placeholder="Ej: 6, 8, 12"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Factor (precio base)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.factor}
                                        onChange={(e) => setFormData({...formData, factor: parseFloat(e.target.value) || 1})}
                                        className="input-field"
                                        placeholder="Ej: 1.0, 1.3, 2.0"
                                        min="0.1"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Precio Base *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.precio_base}
                                        onChange={(e) => setFormData({...formData, precio_base: parseFloat(e.target.value) || 0})}
                                        className="input-field"
                                        placeholder="Ej: 8.99"
                                        min="0"
                                        required
                                    />
                                </div>
                                {/* ✅ NUEVO CAMPO: max_sabores */}
                                <div>
                                    <label className="input-label">Máximo de Sabores *</label>
                                    <input
                                        type="number"
                                        value={formData.max_sabores}
                                        onChange={(e) => setFormData({...formData, max_sabores: parseInt(e.target.value) || 1})}
                                        className="input-field"
                                        placeholder="Ej: 1, 2, 3"
                                        min="1"
                                        max="10"
                                        required
                                    />
                                    <p className="text-xs text-white-40 mt-1">
                                        Número máximo de sabores que puede tener una pizza de este tamaño
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.activo}
                                            onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                                            className="w-4 h-4 rounded accent-golden"
                                        />
                                        <span className="text-sm text-white-60">Activo</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button type="submit" className="btn-golden">
                                    {editandoId ? '💾 Actualizar' : '💾 Crear Tamaño'}
                                </button>
                                <button type="button" onClick={resetFormulario} className="btn-secondary">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tabla */}
                <div className="glass rounded-xl overflow-hidden border border-white/10">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white-40 uppercase">Nombre</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white-40 uppercase">Porciones</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white-40 uppercase">Factor</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white-40 uppercase">Precio Base</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white-40 uppercase">Máx Sabores</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white-40 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white-40 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {cargando ? (
                                    <tr><td colSpan="7" className="text-center py-8 text-white-40">Cargando...</td></tr>
                                ) : tamanios.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-8 text-white-40">No hay tamaños registrados</td></tr>
                                ) : (
                                    tamanios.map((tamanio) => (
                                        <tr key={tamanio.id} className={!tamanio.activo ? 'opacity-50' : ''}>
                                            <td className="px-4 py-3 font-medium text-white">{tamanio.nombre}</td>
                                            <td className="px-4 py-3 text-white-60">{tamanio.porciones}</td>
                                            <td className="px-4 py-3 text-white-60">{tamanio.factor}</td>
                                            <td className="px-4 py-3 font-bold text-golden">{formatPrice(tamanio.precio_base)}</td>
                                            {/* ✅ NUEVA COLUMNA */}
                                            <td className="px-4 py-3">
                                                <span className="badge badge-golden">
                                                    {tamanio.max_sabores || 1} sabor(es)
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs border ${getEstadoBadge(tamanio.activo)}`}>
                                                    {tamanio.activo ? '✅ Activo' : '⏸️ Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 space-x-2">
                                                {tamanio.activo ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditar(tamanio)}
                                                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                                        >
                                                            <Edit2 size={14} /> Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleEliminar(tamanio.id)}
                                                            className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                                                        >
                                                            <Trash2 size={14} /> Desactivar
                                                        </button>
                                                        <button
                                                            onClick={() => handleEliminarPermanente(tamanio.id)}
                                                            className="text-red-600 hover:text-red-500 text-sm font-bold"
                                                            title="Eliminar permanentemente"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleReactivar(tamanio.id)}
                                                            className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1"
                                                        >
                                                            <RefreshCw size={14} /> Reactivar
                                                        </button>
                                                        <button
                                                            onClick={() => handleEliminarPermanente(tamanio.id)}
                                                            className="text-red-600 hover:text-red-500 text-sm font-bold"
                                                            title="Eliminar permanentemente"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </>
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