'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'
import { Plus, Edit2, Trash2, RefreshCw } from 'lucide-react'

export default function ProductosPage() {
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [tamanios, setTamanios] = useState([])
    const [tipos, setTipos] = useState(['simple', 'pizza_fija', 'pizza_personalizable'])
    const [cargando, setCargando] = useState(true)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [editandoId, setEditandoId] = useState(null)
    const [nuevoTipo, setNuevoTipo] = useState('')
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
                    tamanios_pizza (nombre, porciones, precio_base)
                `)
                .order('nombre')
            
            setProductos(productosData || [])
        } catch (error) {
            console.error('Error cargando datos:', error)
        } finally {
            setCargando(false)
        }
    }

    const agregarTipo = () => {
        if (nuevoTipo.trim() && !tipos.includes(nuevoTipo.trim())) {
            setTipos([...tipos, nuevoTipo.trim()])
            setNuevoTipo('')
            alert(`✅ Tipo "${nuevoTipo.trim()}" agregado correctamente`)
        }
    }

    const eliminarTipo = (tipo) => {
        if (confirm(`¿Eliminar el tipo "${tipo}"?`)) {
            setTipos(tipos.filter(t => t !== tipo))
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

    const handleEliminarPermanente = async (id) => {
        if (!confirm('⚠️ ¿Eliminar PERMANENTEMENTE este producto? Esta acción NO se puede deshacer.')) return
        try {
            const { error } = await supabase
                .from('productos_menu')
                .delete()
                .eq('id', id)
            if (error) throw error
            alert('✅ Producto eliminado permanentemente')
            cargarDatos()
        } catch (error) {
            console.error('Error eliminando producto permanentemente:', error)
            alert('❌ Error al eliminar el producto')
        }
    }

    const handleReactivar = async (id) => {
        try {
            const { error } = await supabase
                .from('productos_menu')
                .update({ activo: true })
                .eq('id', id)
            if (error) throw error
            alert('✅ Producto reactivado correctamente')
            cargarDatos()
        } catch (error) {
            console.error('Error reactivando producto:', error)
            alert('❌ Error al reactivar el producto')
        }
    }

    const resetFormulario = () => {
        setFormData({ nombre: '', categoria_id: '', tamanio_id: '', precio_venta: '', tipo: 'simple', stock: '' })
        setMostrarFormulario(false)
        setEditandoId(null)
    }

    const getTipoLabel = (tipo) => {
        const tiposMap = {
            simple: '📦 Simple',
            pizza_fija: '🍕 Pizza Fija',
            pizza_personalizable: '🎨 Personalizable'
        }
        return tiposMap[tipo] || tipo
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
                    <div>
                        <h2 className="text-2xl font-bold">🍕 Gestión de Productos</h2>
                        <p className="text-sm text-gray-500">Administra los productos del menú</p>
                    </div>
                    <button
                        onClick={() => {
                            resetFormulario()
                            setMostrarFormulario(!mostrarFormulario)
                        }}
                        className="btn-golden text-sm flex items-center gap-2"
                    >
                        {mostrarFormulario ? '✕ Cancelar' : '+ Nuevo Producto'}
                    </button>
                </div>

                {/* Gestión de Tipos */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">🏷️ Tipos de productos</h3>
                    <div className="flex flex-wrap gap-2 items-center">
                        <div className="flex flex-wrap gap-2">
                            {tipos.map((tipo) => (
                                <span key={tipo} className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-xs">
                                    {tipo}
                                    <button
                                        onClick={() => eliminarTipo(tipo)}
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
                                value={nuevoTipo}
                                onChange={(e) => setNuevoTipo(e.target.value)}
                                placeholder="Nuevo tipo..."
                                className="input-field text-sm py-1 px-2 w-32"
                            />
                            <button onClick={agregarTipo} className="btn-primary text-sm py-1 px-3">
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>

                {mostrarFormulario && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-golden">
                        <h3 className="text-lg font-semibold mb-4">
                            {editandoId ? '✏️ Editar Producto' : '📝 Nuevo Producto'}
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
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Categoría</label>
                                    <select
                                        value={formData.categoria_id}
                                        onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                                        className="input-field"
                                    >
                                        <option value="">Sin categoría</option>
                                        {categorias.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Tipo *</label>
                                    <select
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                                        className="input-field"
                                    >
                                        {tipos.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Tamaño (solo pizzas)</label>
                                    <select
                                        value={formData.tamanio_id}
                                        onChange={(e) => setFormData({...formData, tamanio_id: e.target.value})}
                                        className="input-field"
                                    >
                                        <option value="">Sin tamaño</option>
                                        {tamanios.map((t) => (
                                            <option key={t.id} value={t.id}>{t.nombre} ({t.porciones} porciones)</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Precio *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.precio_venta}
                                        onChange={(e) => setFormData({...formData, precio_venta: e.target.value})}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                {formData.tipo === 'simple' && (
                                    <div>
                                        <label className="input-label">Stock</label>
                                        <input
                                            type="number"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({...formData, stock: e.target.value})}
                                            className="input-field"
                                            placeholder="0"
                                        />
                                    </div>
                                )}
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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamaño</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cargando ? (
                                    <tr><td colSpan="7" className="text-center py-8 text-gray-500">Cargando...</td></tr>
                                ) : productos.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-8 text-gray-500">No hay productos registrados</td></tr>
                                ) : (
                                    productos.map((producto) => (
                                        <tr key={producto.id} className={!producto.activo ? 'bg-gray-50 opacity-60' : ''}>
                                            <td className="px-4 py-3 font-medium">{producto.nombre}</td>
                                            <td className="px-4 py-3">{producto.categorias?.nombre || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs ${getEstadoColor(producto.tipo, producto.stock)}`}>
                                                    {getTipoLabel(producto.tipo)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{producto.tamanios_pizza?.nombre || '-'}</td>
                                            <td className="px-4 py-3 text-orange-600 font-medium">{formatPrice(producto.precio_venta)}</td>
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
                                                            Desactivar
                                                        </button>
                                                        <button onClick={() => handleEliminarPermanente(producto.id)} className="text-red-800 hover:text-red-950 text-sm font-bold">
                                                            🗑️
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleReactivar(producto.id)} className="text-green-600 hover:text-green-800 text-sm">
                                                            Reactivar
                                                        </button>
                                                        <button onClick={() => handleEliminarPermanente(producto.id)} className="text-red-800 hover:text-red-950 text-sm font-bold">
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