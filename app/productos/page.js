'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'

export default function ProductosPage() {
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [tamanios, setTamanios] = useState([])
    const [cargando, setCargando] = useState(true)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [editandoId, setEditandoId] = useState(null)
    const [formData, setFormData] = useState({
        nombre: '',
        categoria_id: '',
        tamanio_id: '',
        precio_venta: '',
        tipo: 'simple',
        stock: ''
    })

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const { data: categoriasData } = await supabase
                .from('categorias')
                .select('*')
                .eq('activo', true)
                .order('nombre')
            setCategorias(categoriasData || [])

            const { data: tamaniosData } = await supabase
                .from('tamanios_pizza')
                .select('*')
                .eq('activo', true)
                .order('nombre')
            setTamanios(tamaniosData || [])

            const { data: productosData } = await supabase
                .from('productos_menu')
                .select(`
                    *,
                    categorias (nombre),
                    tamanios_pizza (nombre, porciones)
                `)
                .order('nombre')
            
            setProductos(productosData || [])
        } catch (error) {
            console.error('Error cargando datos:', error)
            alert('Error al cargar los datos')
        } finally {
            setCargando(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        const data = {
            nombre: formData.nombre,
            categoria_id: formData.categoria_id || null,
            tamanio_id: formData.tamanio_id || null,
            precio_venta: parseFloat(formData.precio_venta),
            tipo: formData.tipo,
            stock: formData.tipo === 'simple' ? parseInt(formData.stock) || 0 : 0,
            toppings_fijos: '[]',
            activo: true
        }

        try {
            if (editandoId) {
                const { error } = await supabase
                    .from('productos_menu')
                    .update(data)
                    .eq('id', editandoId)
                if (error) throw error
                alert('✅ Producto actualizado correctamente')
            } else {
                const { error } = await supabase
                    .from('productos_menu')
                    .insert(data)
                if (error) throw error
                alert('✅ Producto creado correctamente')
            }
            
            resetFormulario()
            cargarDatos()
        } catch (error) {
            console.error('Error guardando producto:', error)
            alert('❌ Error al guardar el producto: ' + error.message)
        }
    }

    const handleEditar = (producto) => {
        setEditandoId(producto.id)
        setFormData({
            nombre: producto.nombre,
            categoria_id: producto.categoria_id || '',
            tamanio_id: producto.tamanio_id || '',
            precio_venta: producto.precio_venta.toString(),
            tipo: producto.tipo,
            stock: producto.stock?.toString() || '0'
        })
        setMostrarFormulario(true)
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return
        try {
            const { error } = await supabase
                .from('productos_menu')
                .update({ activo: false })
                .eq('id', id)
            if (error) throw error
            alert('✅ Producto eliminado correctamente')
            cargarDatos()
        } catch (error) {
            console.error('Error eliminando producto:', error)
            alert('❌ Error al eliminar el producto')
        }
    }

    const resetFormulario = () => {
        setFormData({ nombre: '', categoria_id: '', tamanio_id: '', precio_venta: '', tipo: 'simple', stock: '' })
        setMostrarFormulario(false)
        setEditandoId(null)
    }

    const getTipoLabel = (tipo) => {
        const tipos = {
            simple: '📦 Simple',
            pizza_fija: '🍕 Pizza Fija',
            pizza_personalizable: '🎨 Personalizable'
        }
        return tipos[tipo] || tipo
    }

    const getEstadoColor = (tipo, stock) => {
        if (tipo === 'simple') {
            if (stock <= 0) return 'bg-red-100 text-red-800'
            if (stock < 10) return 'bg-yellow-100 text-yellow-800'
            return 'bg-green-100 text-green-800'
        }
        return 'bg-blue-100 text-blue-800'
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">🍕 Gestión de Productos</h2>
                    <button
                        onClick={() => {
                            resetFormulario()
                            setMostrarFormulario(!mostrarFormulario)
                        }}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        {mostrarFormulario ? '✕ Cancelar' : '+ Nuevo Producto'}
                    </button>
                </div>

                {mostrarFormulario && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-orange-200">
                        <h3 className="text-lg font-semibold mb-4">
                            {editandoId ? '✏️ Editar Producto' : '📝 Nuevo Producto'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                    <select
                                        value={formData.categoria_id}
                                        onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="">Sin categoría</option>
                                        {categorias.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <select
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="simple">📦 Simple (Bebidas, Postres)</option>
                                        <option value="pizza_fija">🍕 Pizza Fija</option>
                                        <option value="pizza_personalizable">🎨 Pizza Personalizable</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño (solo pizzas)</label>
                                    <select
                                        value={formData.tamanio_id}
                                        onChange={(e) => setFormData({...formData, tamanio_id: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="">Sin tamaño</option>
                                        {tamanios.map((t) => (
                                            <option key={t.id} value={t.id}>{t.nombre} ({t.porciones} porciones)</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.precio_venta}
                                        onChange={(e) => setFormData({...formData, precio_venta: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>

                                {formData.tipo === 'simple' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                        <input
                                            type="number"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({...formData, stock: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="0"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex space-x-3">
                                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                    {editandoId ? '💾 Actualizar' : '💾 Crear'}
                                </button>
                                <button type="button" onClick={resetFormulario} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {cargando ? (
                    <div className="text-center py-8 text-gray-500">Cargando productos...</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamaño</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {productos.map((producto) => (
                                        <tr key={producto.id} className={!producto.activo ? 'bg-gray-50 opacity-60' : ''}>
                                            <td className="px-4 py-3 font-medium">{producto.nombre}</td>
                                            <td className="px-4 py-3">{producto.categorias?.nombre || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs ${getEstadoColor(producto.tipo, producto.stock)}`}>
                                                    {getTipoLabel(producto.tipo)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{producto.tamanios_pizza?.nombre || '-'}</td>
                                            <td className="px-4 py-3 text-orange-600 font-medium">${producto.precio_venta}</td>
                                            <td className="px-4 py-3">
                                                {producto.tipo === 'simple' ? (
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        producto.stock <= 0 ? 'bg-red-100 text-red-800' :
                                                        producto.stock < 10 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {producto.stock}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 space-x-2">
                                                {producto.activo ? (
                                                    <>
                                                        <button onClick={() => handleEditar(producto)} className="text-blue-600 hover:text-blue-800 text-sm">
                                                            Editar
                                                        </button>
                                                        <button onClick={() => handleEliminar(producto.id)} className="text-red-600 hover:text-red-800 text-sm">
                                                            Eliminar
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => {
                                                        supabase.from('productos_menu').update({ activo: true }).eq('id', producto.id)
                                                            .then(() => cargarDatos())
                                                    }} className="text-green-600 hover:text-green-800 text-sm">
                                                        Reactivar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}