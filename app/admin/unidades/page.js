'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { Plus, Edit2, Trash2 } from 'lucide-react'

export default function UnidadesPage() {
    const [unidades, setUnidades] = useState([
        'gramos', 'mililitros', 'litros', 'kilos', 'unidades', 'libras', 'onzas', 'tazas'
    ])
    const [nuevaUnidad, setNuevaUnidad] = useState('')
    const [editandoId, setEditandoId] = useState(null)
    const [editandoNombre, setEditandoNombre] = useState('')

    useEffect(() => {
        cargarUnidades()
    }, [])

    const cargarUnidades = async () => {
        try {
            const { data, error } = await supabase
                .from('unidades')
                .select('*')
                .order('nombre')
            
            if (!error && data && data.length > 0) {
                setUnidades(data.map(u => u.nombre))
            }
        } catch (error) {
            console.log('Usando unidades por defecto')
        }
    }

    const agregarUnidad = () => {
        if (!nuevaUnidad.trim()) {
            alert('Por favor, escribe un nombre para la unidad')
            return
        }

        if (unidades.some(u => u === nuevaUnidad.trim())) {
            alert('❌ Esta unidad ya existe')
            return
        }

        setUnidades([...unidades, nuevaUnidad.trim()])
        setNuevaUnidad('')
        alert('✅ Unidad agregada correctamente')
    }

    const editarUnidad = (unidad, index) => {
        setEditandoId(index)
        setEditandoNombre(unidad)
    }

    const guardarEdicion = () => {
        if (!editandoNombre.trim()) {
            alert('El nombre no puede estar vacío')
            return
        }

        const nuevasUnidades = [...unidades]
        nuevasUnidades[editandoId] = editandoNombre.trim()
        setUnidades(nuevasUnidades)
        setEditandoId(null)
        setEditandoNombre('')
        alert('✅ Unidad actualizada correctamente')
    }

    const eliminarUnidad = (index) => {
        if (!confirm('⚠️ ¿Eliminar esta unidad?')) return
        
        const nuevasUnidades = unidades.filter((_, i) => i !== index)
        setUnidades(nuevasUnidades)
        alert('✅ Unidad eliminada correctamente')
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">📏 Unidades de Medida</h2>
                    <p className="text-sm text-gray-500">Administra las unidades de medida para el inventario</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4">➕ Agregar nueva unidad</h3>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={nuevaUnidad}
                            onChange={(e) => setNuevaUnidad(e.target.value)}
                            className="input-field flex-1"
                            placeholder="Ej: onzas, tazas, cucharadas"
                            onKeyDown={(e) => e.key === 'Enter' && agregarUnidad()}
                        />
                        <button onClick={agregarUnidad} className="btn-golden">
                            Agregar
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        💡 Estas unidades estarán disponibles para los ingredientes del inventario
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {unidades.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center py-8 text-gray-500">No hay unidades registradas</td></tr>
                                ) : (
                                    unidades.map((unidad, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                                            <td className="px-4 py-3 font-medium">
                                                {editandoId === index ? (
                                                    <input
                                                        type="text"
                                                        value={editandoNombre}
                                                        onChange={(e) => setEditandoNombre(e.target.value)}
                                                        className="input-field text-sm py-1 px-2 w-48"
                                                        onKeyDown={(e) => e.key === 'Enter' && guardarEdicion()}
                                                    />
                                                ) : (
                                                    unidad
                                                )}
                                            </td>
                                            <td className="px-4 py-3 space-x-2">
                                                {editandoId === index ? (
                                                    <>
                                                        <button onClick={guardarEdicion} className="text-green-600 hover:text-green-800 text-sm">
                                                            💾 Guardar
                                                        </button>
                                                        <button onClick={() => setEditandoId(null)} className="text-gray-600 hover:text-gray-800 text-sm">
                                                            Cancelar
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => editarUnidad(unidad, index)} className="text-blue-600 hover:text-blue-800 text-sm">
                                                            Editar
                                                        </button>
                                                        <button onClick={() => eliminarUnidad(index)} className="text-red-600 hover:text-red-800 text-sm">
                                                            Eliminar
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