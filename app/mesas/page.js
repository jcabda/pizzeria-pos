'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Plus, Edit2, Trash2, RefreshCw } from 'lucide-react'

export default function MesasPage() {
    const [mesas, setMesas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [editandoId, setEditandoId] = useState(null)
    const [formData, setFormData] = useState({
        numero: '',
        capacidad: 4,
        estado: 'disponible'
    })

    useEffect(() => {
        cargarMesas()
    }, [])

    const cargarMesas = async () => {
        setCargando(true)
        try {
            const { data } = await supabase
                .from('mesas')
                .select('*')
                .order('numero')
            setMesas(data || [])
        } catch (error) {
            console.error('Error cargando mesas:', error)
        } finally {
            setCargando(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.numero) {
            alert('Por favor, completa todos los campos requeridos')
            return
        }

        const data = {
            numero: parseInt(formData.numero),
            capacidad: parseInt(formData.capacidad) || 4,
            estado: formData.estado || 'disponible',
            activo: true
        }

        try {
            if (editandoId) {
                const { error } = await supabase
                    .from('mesas')
                    .update(data)
                    .eq('id', editandoId)
                if (error) throw error
                alert('✅ Mesa actualizada correctamente')
            } else {
                const { error } = await supabase
                    .from('mesas')
                    .insert(data)
                if (error) throw error
                alert('✅ Mesa creada correctamente')
            }
            
            resetFormulario()
            cargarMesas()
        } catch (error) {
            console.error('Error guardando mesa:', error)
            alert('❌ Error al guardar la mesa: ' + error.message)
        }
    }

    const handleEditar = (mesa) => {
        setEditandoId(mesa.id)
        setFormData({
            numero: mesa.numero.toString(),
            capacidad: mesa.capacidad.toString(),
            estado: mesa.estado
        })
        setMostrarFormulario(true)
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta mesa?')) return
        try {
            const { error } = await supabase
                .from('mesas')
                .update({ activo: false })
                .eq('id', id)
            if (error) throw error
            alert('✅ Mesa eliminada correctamente')
            cargarMesas()
        } catch (error) {
            console.error('Error eliminando mesa:', error)
            alert('❌ Error al eliminar la mesa')
        }
    }

    const handleEliminarPermanente = async (id) => {
        if (!confirm('⚠️ ¿Eliminar PERMANENTEMENTE esta mesa? Esta acción NO se puede deshacer.')) return
        try {
            const { error } = await supabase
                .from('mesas')
                .delete()
                .eq('id', id)
            if (error) throw error
            alert('✅ Mesa eliminada permanentemente')
            cargarMesas()
        } catch (error) {
            console.error('Error eliminando mesa permanentemente:', error)
            alert('❌ Error al eliminar la mesa')
        }
    }

    const resetFormulario = () => {
        setFormData({ numero: '', capacidad: 4, estado: 'disponible' })
        setMostrarFormulario(false)
        setEditandoId(null)
    }

    const getEstadoColor = (estado) => {
        const colores = {
            disponible: 'bg-green-100 text-green-800',
            ocupada: 'bg-yellow-100 text-yellow-800',
            reservada: 'bg-blue-100 text-blue-800',
        }
        return colores[estado] || 'bg-gray-100 text-gray-800'
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">🍽️ Gestión de Mesas</h2>
                        <p className="text-sm text-gray-500">Administra las mesas del restaurante</p>
                    </div>
                    <button
                        onClick={() => {
                            resetFormulario()
                            setMostrarFormulario(!mostrarFormulario)
                        }}
                        className="btn-golden text-sm flex items-center gap-2"
                    >
                        <Plus size={18} />
                        {mostrarFormulario ? 'Cancelar' : 'Nueva Mesa'}
                    </button>
                </div>

                {mostrarFormulario && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-golden">
                        <h3 className="text-lg font-semibold mb-4">
                            {editandoId ? '✏️ Editar Mesa' : '📝 Nueva Mesa'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="input-label">Número de mesa *</label>
                                    <input
                                        type="number"
                                        value={formData.numero}
                                        onChange={(e) => setFormData({...formData, numero: e.target.value})}
                                        className="input-field"
                                        placeholder="Ej: 1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Capacidad</label>
                                    <input
                                        type="number"
                                        value={formData.capacidad}
                                        onChange={(e) => setFormData({...formData, capacidad: e.target.value})}
                                        className="input-field"
                                        placeholder="Ej: 4"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Estado</label>
                                    <select
                                        value={formData.estado}
                                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                                        className="input-field"
                                    >
                                        <option value="disponible">🟢 Disponible</option>
                                        <option value="ocupada">🟡 Ocupada</option>
                                        <option value="reservada">🔵 Reservada</option>
                                    </select>
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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacidad</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cargando ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">Cargando...</td></tr>
                                ) : mesas.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">No hay mesas registradas</td></tr>
                                ) : (
                                    mesas.map((mesa) => (
                                        <tr key={mesa.id} className={!mesa.activo ? 'bg-gray-50 opacity-60' : ''}>
                                            <td className="px-4 py-3 text-gray-400">{mesa.id.slice(0, 6)}</td>
                                            <td className="px-4 py-3 font-medium">Mesa {mesa.numero}</td>
                                            <td className="px-4 py-3">{mesa.capacidad} personas</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(mesa.estado)}`}>
                                                    {mesa.estado.charAt(0).toUpperCase() + mesa.estado.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 space-x-2">
                                                {mesa.activo ? (
                                                    <>
                                                        <button onClick={() => handleEditar(mesa)} className="text-blue-600 hover:text-blue-800 text-sm">
                                                            Editar
                                                        </button>
                                                        <button onClick={() => handleEliminar(mesa.id)} className="text-red-600 hover:text-red-800 text-sm">
                                                            Desactivar
                                                        </button>
                                                        <button onClick={() => handleEliminarPermanente(mesa.id)} className="text-red-800 hover:text-red-950 text-sm font-bold">
                                                            🗑️
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => {
                                                            supabase.from('mesas').update({ activo: true }).eq('id', mesa.id)
                                                                .then(() => cargarMesas())
                                                        }} className="text-green-600 hover:text-green-800 text-sm">
                                                            Reactivar
                                                        </button>
                                                        <button onClick={() => handleEliminarPermanente(mesa.id)} className="text-red-800 hover:text-red-950 text-sm font-bold">
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