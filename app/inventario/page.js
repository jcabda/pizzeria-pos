'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'

export default function InventarioPage() {
    const [ingredientes, setIngredientes] = useState([])
    const [cargando, setCargando] = useState(true)
    const [editandoId, setEditandoId] = useState(null)
    const [unidades, setUnidades] = useState(['gramos', 'mililitros', 'litros', 'kilos', 'unidades', 'libras'])
    const [nuevaUnidad, setNuevaUnidad] = useState('')
    const [formData, setFormData] = useState({
        nombre: '',
        unidad: 'gramos',
        stock_actual: '',
        stock_minimo: '',
        precio_compra: ''
    })

    useEffect(() => {
        cargarIngredientes()
    }, [])

    const cargarIngredientes = async () => {
        setCargando(true)
        try {
            const { data } = await supabase
                .from('ingredientes')
                .select('*')
                .order('nombre')
            setIngredientes(data || [])
        } catch (error) {
            console.error('Error cargando ingredientes:', error)
        } finally {
            setCargando(false)
        }
    }

    const agregarUnidad = () => {
        if (nuevaUnidad.trim() && !unidades.includes(nuevaUnidad.trim())) {
            setUnidades([...unidades, nuevaUnidad.trim()])
            setNuevaUnidad('')
            alert(`✅ Unidad "${nuevaUnidad.trim()}" agregada correctamente`)
        }
    }

    const eliminarUnidad = (unidad) => {
        if (confirm(`¿Eliminar la unidad "${unidad}"?`)) {
            setUnidades(unidades.filter(u => u !== unidad))
        }
    }

    const handleEditar = (ingrediente) => {
        setEditandoId(ingrediente.id)
        setFormData({
            nombre: ingrediente.nombre,
            unidad: ingrediente.unidad || 'gramos',
            stock_actual: ingrediente.stock_actual.toString(),
            stock_minimo: ingrediente.stock_minimo.toString(),
            precio_compra: ingrediente.precio_compra.toString()
        })
    }

    const handleGuardar = async (e) => {
        e.preventDefault()
        try {
            const { error } = await supabase
                .from('ingredientes')
                .update({
                    nombre: formData.nombre,
                    unidad: formData.unidad,
                    stock_actual: parseFloat(formData.stock_actual),
                    stock_minimo: parseFloat(formData.stock_minimo),
                    precio_compra: parseFloat(formData.precio_compra)
                })
                .eq('id', editandoId)

            if (error) throw error
            alert('✅ Ingrediente actualizado correctamente')
            setEditandoId(null)
            cargarIngredientes()
        } catch (error) {
            console.error('Error actualizando ingrediente:', error)
            alert('❌ Error al actualizar el ingrediente')
        }
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este ingrediente?')) return
        try {
            const { error } = await supabase
                .from('ingredientes')
                .update({ activo: false })
                .eq('id', id)
            if (error) throw error
            alert('✅ Ingrediente eliminado correctamente')
            cargarIngredientes()
        } catch (error) {
            console.error('Error eliminando ingrediente:', error)
            alert('❌ Error al eliminar el ingrediente')
        }
    }

    const handleEliminarPermanente = async (id) => {
        if (!confirm('⚠️ ¿Eliminar PERMANENTEMENTE este ingrediente? Esta acción NO se puede deshacer.')) return
        try {
            const { error } = await supabase
                .from('ingredientes')
                .delete()
                .eq('id', id)
            if (error) throw error
            alert('✅ Ingrediente eliminado permanentemente')
            cargarIngredientes()
        } catch (error) {
            console.error('Error eliminando ingrediente permanentemente:', error)
            alert('❌ Error al eliminar el ingrediente')
        }
    }

    const getEstadoStock = (stock, minimo) => {
        if (stock <= 0) return { color: 'bg-red-100 text-red-800', text: '⚠️ SIN STOCK' }
        if (stock < minimo) return { color: 'bg-red-100 text-red-800', text: '⚠️ CRÍTICO' }
        if (stock < minimo * 2) return { color: 'bg-yellow-100 text-yellow-800', text: '⚠️ BAJO' }
        return { color: 'bg-green-100 text-green-800', text: '✅ OK' }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">🧂 Inventario de Ingredientes</h2>
                        <p className="text-sm text-gray-500">Control de stock y materiales</p>
                    </div>
                    <button onClick={cargarIngredientes} className="btn-secondary text-sm">
                        🔄 Actualizar
                    </button>
                </div>

                {/* Gestión de Unidades */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">📏 Unidades de medida</h3>
                    <div className="flex flex-wrap gap-2 items-center">
                        <div className="flex flex-wrap gap-2">
                            {unidades.map((unidad) => (
                                <span key={unidad} className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-xs">
                                    {unidad}
                                    <button
                                        onClick={() => eliminarUnidad(unidad)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={nuevaUnidad}
                                onChange={(e) => setNuevaUnidad(e.target.value)}
                                placeholder="Nueva unidad..."
                                className="input-field text-sm py-1 px-2 w-32"
                            />
                            <button onClick={agregarUnidad} className="btn-primary text-sm py-1 px-3">
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
                        <p className="text-sm text-gray-600">Total Ingredientes</p>
                        <p className="text-2xl font-bold">{ingredientes.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
                        <p className="text-sm text-gray-600">Stock Crítico</p>
                        <p className="text-2xl font-bold">
                            {ingredientes.filter(i => i.stock_actual < i.stock_minimo).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
                        <p className="text-sm text-gray-600">Sin Stock</p>
                        <p className="text-2xl font-bold">
                            {ingredientes.filter(i => i.stock_actual <= 0).length}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingrediente</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Mínimo</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Compra</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cargando ? (
                                    <tr><td colSpan="7" className="text-center py-8 text-gray-500">Cargando...</td></tr>
                                ) : ingredientes.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-8 text-gray-500">No hay ingredientes registrados</td></tr>
                                ) : (
                                    ingredientes.map((ing) => {
                                        const estado = getEstadoStock(ing.stock_actual, ing.stock_minimo)
                                        return (
                                            <tr key={ing.id}>
                                                <td className="px-4 py-3 font-medium">{ing.nombre}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{ing.unidad || 'g'}</td>
                                                <td className="px-4 py-3 font-medium">{ing.stock_actual}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{ing.stock_minimo}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${estado.color}`}>
                                                        {estado.text}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">{formatPrice(ing.precio_compra)}</td>
                                                <td className="px-4 py-3 space-x-2">
                                                    <button
                                                        onClick={() => handleEditar(ing)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleEliminar(ing.id)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        Desactivar
                                                    </button>
                                                    <button
                                                        onClick={() => handleEliminarPermanente(ing.id)}
                                                        className="text-red-800 hover:text-red-950 text-sm font-bold"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {editandoId && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-golden">
                        <h3 className="text-lg font-semibold mb-4">✏️ Editar Ingrediente</h3>
                        <form onSubmit={handleGuardar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="input-label">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="input-label">Unidad</label>
                                <select
                                    value={formData.unidad}
                                    onChange={(e) => setFormData({...formData, unidad: e.target.value})}
                                    className="input-field"
                                >
                                    {unidades.map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="input-label">Stock Actual</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.stock_actual}
                                    onChange={(e) => setFormData({...formData, stock_actual: e.target.value})}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="input-label">Stock Mínimo</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.stock_minimo}
                                    onChange={(e) => setFormData({...formData, stock_minimo: e.target.value})}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="input-label">Precio de Compra (por unidad base)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.precio_compra}
                                    onChange={(e) => setFormData({...formData, precio_compra: e.target.value})}
                                    className="input-field"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    💡 Precio por {formData.unidad || 'unidad'} base (ej: 1 kg, 1 litro, etc.)
                                </p>
                            </div>
                            <div className="md:col-span-2 flex space-x-3">
                                <button type="submit" className="btn-golden">
                                    💾 Guardar
                                </button>
                                <button type="button" onClick={() => setEditandoId(null)} className="btn-secondary">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}