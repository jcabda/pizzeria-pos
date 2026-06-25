'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'

export default function CategoriasPage() {
    const [categorias, setCategorias] = useState([])
    const [cargando, setCargando] = useState(true)
    const [nuevaCategoria, setNuevaCategoria] = useState('')
    const [editandoId, setEditandoId] = useState(null)

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
            alert('Error al cargar las categorías')
        } finally {
            setCargando(false)
        }
    }

    const handleCrear = async (e) => {
        e.preventDefault()
        if (!nuevaCategoria.trim()) {
            alert('Por favor, escribe un nombre para la categoría')
            return
        }

        try {
            const { error } = await supabase
                .from('categorias')
                .insert({ nombre: nuevaCategoria, activo: true })

            if (error) throw error
            alert('✅ Categoría creada correctamente')
            setNuevaCategoria('')
            cargarCategorias()
        } catch (error) {
            console.error('Error creando categoría:', error)
            alert('❌ Error al crear la categoría')
        }
    }

    const handleEditar = async (id, nombreActual) => {
        const nuevoNombre = prompt('Editar nombre de categoría:', nombreActual)
        if (!nuevoNombre || nuevoNombre.trim() === '') return

        try {
            const { error } = await supabase
                .from('categorias')
                .update({ nombre: nuevoNombre.trim() })
                .eq('id', id)

            if (error) throw error
            alert('✅ Categoría actualizada correctamente')
            cargarCategorias()
        } catch (error) {
            console.error('Error editando categoría:', error)
            alert('❌ Error al editar la categoría')
        }
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta categoría?')) return

        try {
            // Verificar si hay productos en esta categoría
            const { count } = await supabase
                .from('productos')
                .select('*', { count: 'exact', head: true })
                .eq('categoria_id', id)

            if (count > 0) {
                alert(`❌ No se puede eliminar. Hay ${count} productos en esta categoría.`)
                return
            }

            const { error } = await supabase
                .from('categorias')
                .update({ activo: false })
                .eq('id', id)

            if (error) throw error
            alert('✅ Categoría eliminada correctamente')
            cargarCategorias()
        } catch (error) {
            console.error('Error eliminando categoría:', error)
            alert('❌ Error al eliminar la categoría')
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">📂 Gestión de Categorías</h2>

                {/* Formulario para nueva categoría */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">➕ Nueva Categoría</h3>
                    <form onSubmit={handleCrear} className="flex space-x-4">
                        <input
                            type="text"
                            value={nuevaCategoria}
                            onChange={(e) => setNuevaCategoria(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Nombre de la categoría (Ej: Pizzas, Bebidas...)"
                            required
                        />
                        <button
                            type="submit"
                            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                        >
                            Crear
                        </button>
                    </form>
                </div>

                {/* Lista de categorías */}
                {cargando ? (
                    <div className="text-center py-8 text-gray-500">Cargando categorías...</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                            {categorias.map((categoria) => (
                                <div
                                    key={categoria.id}
                                    className={`border rounded-lg p-4 flex justify-between items-center ${
                                        categoria.activo ? 'border-gray-200' : 'bg-gray-50 border-gray-300 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">
                                            {categoria.nombre === 'Pizzas' ? '🍕' :
                                             categoria.nombre === 'Bebidas' ? '🥤' :
                                             categoria.nombre === 'Postres' ? '🍨' :
                                             categoria.nombre === 'Entradas' ? '🍢' : '📁'}
                                        </span>
                                        <div>
                                            <span className={`font-medium ${!categoria.activo ? 'line-through text-gray-500' : ''}`}>
                                                {categoria.nombre}
                                            </span>
                                            <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                                                categoria.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {categoria.activo ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-x-2">
                                        {categoria.activo ? (
                                            <>
                                                <button
                                                    onClick={() => handleEditar(categoria.id, categoria.nombre)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleEliminar(categoria.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    🗑️
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    // Reactivar
                                                    supabase
                                                        .from('categorias')
                                                        .update({ activo: true })
                                                        .eq('id', categoria.id)
                                                        .then(() => cargarCategorias())
                                                }}
                                                className="text-green-600 hover:text-green-800 text-sm"
                                            >
                                                🔄 Reactivar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {categorias.length === 0 && (
                                <div className="col-span-full text-center py-8 text-gray-500">
                                    No hay categorías registradas
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}