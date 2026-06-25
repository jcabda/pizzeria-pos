'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'

export default function InventarioPage() {
    const [ingredientes, setIngredientes] = useState([])
    const [cargando, setCargando] = useState(true)
    const [editandoId, setEditandoId] = useState(null)
    const [formData, setFormData] = useState({
        nombre: '',
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

    const handleEditar = (ingrediente) => {
        setEditandoId(ingrediente.id)
        setFormData({
            nombre: ingrediente.nombre,
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
                    <h2 className="text-2xl font-bold">🧂 Inventario de Ingredientes</h2>
                    <button
                        onClick={cargarIngredientes}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        🔄 Actualizar
                    </button>
                </div>

                {cargando ? (
                    <div className="text-center py-8 text-gray-500">Cargando inventario...</div>
                ) : (
                    <>
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

                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                                    <tbody className="divide-y divide-gray-200">
                                        {ingredientes.map((ing) => {
                                            const estado = getEstadoStock(ing.stock_actual, ing.stock_minimo)
                                            return (
                                                <tr key={ing.id}>
                                                    <td className="px-4 py-3 font-medium">{ing.nombre}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">{ing.unidad}</td>
                                                    <td className="px-4 py-3 font-medium">{ing.stock_actual}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">{ing.stock_minimo}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${estado.color}`}>
                                                            {estado.text}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">${ing.precio_compra}</td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => handleEditar(ing)}
                                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                                        >
                                                            Editar
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {editandoId && (
                            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-orange-200">
                                <h3 className="text-lg font-semibold mb-4">✏️ Editar Ingrediente</h3>
                                <form onSubmit={handleGuardar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                        <input
                                            type="text"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.stock_actual}
                                            onChange={(e) => setFormData({...formData, stock_actual: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.stock_minimo}
                                            onChange={(e) => setFormData({...formData, stock_minimo: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Compra</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.precio_compra}
                                            onChange={(e) => setFormData({...formData, precio_compra: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex space-x-3">
                                        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                            💾 Guardar
                                        </button>
                                        <button type="button" onClick={() => setEditandoId(null)} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}