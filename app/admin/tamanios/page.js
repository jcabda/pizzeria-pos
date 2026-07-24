'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'
import { Plus, Edit2, Trash2, RefreshCw } from 'lucide-react'

export default function TamaniosPage() {
    const [tamanios, setTamanios] = useState([])
    const [cargando, setCargando] = useState(true)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [editandoId, setEditandoId] = useState(null)
    const [formData, setFormData] = useState({
        nombre: '',
        porciones: '',
        factor: '',
        precio_base: ''
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

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.nombre || !formData.porciones || !formData.precio_base) {
            alert('Por favor, completa todos los campos requeridos')
            return
        }

        const data = {
            nombre: formData.nombre,
            porciones: parseInt(formData.porciones),
            factor: parseFloat(formData.factor) || 1.0,
            precio_base: parseFloat(formData.precio_base),
            activo: true
        }

        try {
            if (editandoId) {
                const { error } = await supabase
                    .from('tamanios_pizza')
                    .update(data)
                    .eq('id', editandoId)
                if (error) throw error
                alert('✅ Tamaño actualizado correctamente')
            } else {
                const { error } = await supabase
                    .from('tamanios_pizza')
                    .insert(data)
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
            porciones: tamanio.porciones.toString(),
            factor: tamanio.factor.toString(),
            precio_base: tamanio.precio_base.toString()
        })
        setMostrarFormulario(true)
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este tamaño?')) return
        try {
            const { error } = await supabase
                .from('tamanios_pizza')
                .update({ activo: false })
                .eq('id', id)
            if (error) throw error
            alert('✅ Tamaño eliminado correctamente')
            cargarTamanios()
        } catch (error) {
            console.error('Error eliminando tamaño:', error)
            alert('❌ Error al eliminar el tamaño')
        }
    }

    const handleEliminarPermanente = async (id) => {
        if (!confirm('⚠️ ¿Eliminar PERMANENTEMENTE este tamaño? Esta acción NO se puede deshacer.')) return
        try {
            const { error } = await supabase
                .from('tamanios_pizza')
                .delete()
                .eq('id', id)
            if (error) throw error
            alert('✅ Tamaño eliminado permanentemente')
            cargarTamanios()
        } catch (error) {
            console.error('Error eliminando tamaño permanentemente:', error)
            alert('❌ Error al eliminar el tamaño')
        }
    }

    const resetFormulario = () => {
        setFormData({ nombre: '', porciones: '', factor: '', precio_base: '' })
        setMostrarFormulario(false)
        setEditandoId(null)
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">📏 Tamaños de Pizza</h2>
                        <p className="text-sm text-gray-500">Administra los tamaños y porciones</p>
                    </div>
                    <button
                        onClick={() => {
                            resetFormulario()
                            setMostrarFormulario(!mostrarFormulario)
                        }}
                        className="btn-golden text-sm flex items-center gap-2"
                    >
                        {mostrarFormulario ? '✕ Cancelar' : '+ Nuevo Tamaño'}
                    </button>
                </div>

                {mostrarFormulario && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-golden">
                        <h3 className="text-lg font-semibold mb-4">
                            {editandoId ? '✏️ Editar Tamaño' : '📝 Nuevo Tamaño'}
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
                                        placeholder="Ej: Mediana"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Porciones *</label>
                                    <input
                                        type="number"
                                        value={formData.porciones}
                                        onChange={(e) => setFormData({...formData, porciones: e.target.value})}
                                        className="input-field"
                                        placeholder="Ej: 8"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Factor (multiplicador)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.factor}
                                        onChange={(e) => setFormData({...formData, factor: e.target.value})}
                                        className="input-field"
                                        placeholder="Ej: 1.3"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Precio Base *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.precio_base}
                                        onChange={(e) => setFormData({...formData, precio_base: e.target.value})}
                                        className="input-field"
                                        placeholder="Ej: 12.99"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <button type="submit" className="btn-golden">
                                    {editandoId ? '💾 Actualizar' : '💾 Crear'}
                                </button>
                                <button type="button" onClick={resetFormulario} className="btn-secondary">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Porciones</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Factor</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Base</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cargando ? (
                                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">Cargando...</td></tr>
                                ) : tamanios.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">No hay tamaños registrados</td></tr>
                                ) : (
                                    tamanios.map((t) => (
                                        <tr key={t.id} className={!t.activo ? 'bg-gray-50 opacity-60' : ''}>
                                            <td className="px-4 py-3 font-medium">{t.nombre}</td>
                                            <td className="px-4 py-3">{t.porciones}</td>
                                            <td className="px-4 py-3">{t.factor}</td>
                                            <td className="px-4 py-3 text-orange-600 font-medium">{formatPrice(t.precio_base)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs ${t.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {t.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 space-x-2">
                                                {t.activo ? (
                                                    <>
                                                        <button onClick={() => handleEditar(t)} className="text-blue-600 hover:text-blue-800 text-sm">
                                                            Editar
                                                        </button>
                                                        <button onClick={() => handleEliminar(t.id)} className="text-red-600 hover:text-red-800 text-sm">
                                                            Desactivar
                                                        </button>
                                                        <button onClick={() => handleEliminarPermanente(t.id)} className="text-red-800 hover:text-red-950 text-sm font-bold">
                                                            🗑️
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => {
                                                            supabase.from('tamanios_pizza').update({ activo: true }).eq('id', t.id)
                                                                .then(() => cargarTamanios())
                                                        }} className="text-green-600 hover:text-green-800 text-sm">
                                                            Reactivar
                                                        </button>
                                                        <button onClick={() => handleEliminarPermanente(t.id)} className="text-red-800 hover:text-red-950 text-sm font-bold">
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