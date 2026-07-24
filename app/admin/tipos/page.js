'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { Plus, Edit2, Trash2 } from 'lucide-react'

export default function TiposPage() {
    const [tipos, setTipos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [nuevoTipo, setNuevoTipo] = useState('')
    const [editandoId, setEditandoId] = useState(null)
    const [editandoNombre, setEditandoNombre] = useState('')

    useEffect(() => {
        cargarTipos()
    }, [])

    const cargarTipos = async () => {
        setCargando(true)
        try {
            const { data } = await supabase
                .from('productos_menu')
                .select('tipo')
                .not('tipo', 'is', null)
            
            const tiposUnicos = [...new Set(data?.map(p => p.tipo) || [])]
            setTipos(tiposUnicos.map((t, i) => ({ id: i + 1, nombre: t })))
        } catch (error) {
            console.error('Error cargando tipos:', error)
        } finally {
            setCargando(false)
        }
    }

    const agregarTipo = () => {
        if (!nuevoTipo.trim()) {
            alert('Por favor, escribe un nombre para el tipo')
            return
        }

        if (tipos.some(t => t.nombre === nuevoTipo.trim())) {
            alert('❌ Este tipo ya existe')
            return
        }

        setTipos([...tipos, { id: Date.now(), nombre: nuevoTipo.trim() }])
        setNuevoTipo('')
        alert('✅ Tipo agregado correctamente')
    }

    const editarTipo = (tipo) => {
        setEditandoId(tipo.id)
        setEditandoNombre(tipo.nombre)
    }

    const guardarEdicion = () => {
        if (!editandoNombre.trim()) {
            alert('El nombre no puede estar vacío')
            return
        }

        setTipos(tipos.map(t => 
            t.id === editandoId ? { ...t, nombre: editandoNombre.trim() } : t
        ))
        setEditandoId(null)
        setEditandoNombre('')
        alert('✅ Tipo actualizado correctamente')
    }

    const eliminarTipo = (id) => {
        if (!confirm('⚠️ ¿Eliminar este tipo? Esta acción no se puede deshacer.')) return
        
        setTipos(tipos.filter(t => t.id !== id))
        alert('✅ Tipo eliminado correctamente')
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">🏷️ Tipos de Productos</h2>
                    <p className="text-sm text-gray-500">Administra los tipos de productos disponibles</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4">➕ Agregar nuevo tipo</h3>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={nuevoTipo}
                            onChange={(e) => setNuevoTipo(e.target.value)}
                            className="input-field flex-1"
                            placeholder="Ej: pizza_especial, bebida_artesanal"
                            onKeyDown={(e) => e.key === 'Enter' && agregarTipo()}
                        />
                        <button onClick={agregarTipo} className="btn-golden">
                            Agregar
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        💡 Los tipos se usan para clasificar productos en el menú
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cargando ? (
                                    <tr><td colSpan="3" className="text-center py-8 text-gray-500">Cargando...</td></tr>
                                ) : tipos.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center py-8 text-gray-500">No hay tipos registrados</td></tr>
                                ) : (
                                    tipos.map((tipo, index) => (
                                        <tr key={tipo.id}>
                                            <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                                            <td className="px-4 py-3 font-medium">
                                                {editandoId === tipo.id ? (
                                                    <input
                                                        type="text"
                                                        value={editandoNombre}
                                                        onChange={(e) => setEditandoNombre(e.target.value)}
                                                        className="input-field text-sm py-1 px-2 w-48"
                                                        onKeyDown={(e) => e.key === 'Enter' && guardarEdicion()}
                                                    />
                                                ) : (
                                                    tipo.nombre
                                                )}
                                            </td>
                                            <td className="px-4 py-3 space-x-2">
                                                {editandoId === tipo.id ? (
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
                                                        <button onClick={() => editarTipo(tipo)} className="text-blue-600 hover:text-blue-800 text-sm">
                                                            Editar
                                                        </button>
                                                        <button onClick={() => eliminarTipo(tipo.id)} className="text-red-600 hover:text-red-800 text-sm">
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