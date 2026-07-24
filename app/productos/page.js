'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/currency'
import { Plus, Edit2, Trash2, RefreshCw, Search, X, Check, Pizza, Tag, DollarSign, Package, Coffee, Utensils } from 'lucide-react'

export default function ProductosPage() {
    const [productos, setProductos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [editandoId, setEditandoId] = useState(null)
    const [categorias, setCategorias] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio_venta: 0,
        costo: 0,
        stock: 0,
        categoria_id: '',
        tipo: 'producto',
        activo: true
    })

    useEffect(() => {
        cargarProductos()
        cargarCategorias()
    }, [])

    const cargarProductos = async () => {
        setCargando(true)
        try {
            const { data } = await supabase
                .from('productos_menu')
                .select(`
                    *,
                    categorias (nombre)
                `)
                .order('nombre')
            setProductos(data || [])
        } catch (error) {
            console.error('Error cargando productos:', error)
        } finally {
            setCargando(false)
        }
    }

    const cargarCategorias = async () => {
        try {
            const { data } = await supabase
                .from('categorias')
                .select('*')
                .eq('activo', true)
                .order('nombre')
            setCategorias(data || [])
        } catch (error) {
            console.error('Error cargando categorías:', error)
        }
    }

    const resetFormulario = () => {
        setFormData({
            nombre: '',
            descripcion: '',
            precio_venta: 0,
            costo: 0,
            stock: 0,
            categoria_id: '',
            tipo: 'producto',
            activo: true
        })
        setEditandoId(null)
        setMostrarFormulario(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.nombre || !formData.categoria_id || formData.precio_venta <= 0) {
            alert('Por favor, completa todos los campos requeridos')
            return
        }

        try {
            if (editandoId) {
                const { error } = await supabase
                    .from('productos_menu')
                    .update({
                        nombre: formData.nombre,
                        descripcion: formData.descripcion,
                        precio_venta: formData.precio_venta,
                        costo: formData.costo,
                        stock: formData.stock,
                        categoria_id: formData.categoria_id,
                        tipo: formData.tipo,
                        activo: formData.activo
                    })
                    .eq('id', editandoId)

                if (error) throw error
                alert('✅ Producto actualizado correctamente')
            } else {
                const { error } = await supabase
                    .from('productos_menu')
                    .insert({
                        nombre: formData.nombre,
                        descripcion: formData.descripcion,
                        precio_venta: formData.precio_venta,
                        costo: formData.costo,
                        stock: formData.stock,
                        categoria_id: formData.categoria_id,
                        tipo: formData.tipo,
                        activo: formData.activo
                    })

                if (error) throw error
                alert('✅ Producto creado correctamente')
            }

            resetFormulario()
            cargarProductos()
        } catch (error) {
            console.error('Error guardando producto:', error)
            alert('❌ Error al guardar el producto: ' + error.message)
        }
    }

    const handleEditar = (producto) => {
        setEditandoId(producto.id)
        setFormData({
            nombre: producto.nombre,
            descripcion: producto.descripcion || '',
            precio_venta: producto.precio_venta || 0,
            costo: producto.costo || 0,
            stock: producto.stock || 0,
            categoria_id: producto.categoria_id || '',
            tipo: producto.tipo || 'producto',
            activo: producto.activo !== false
        })
        setMostrarFormulario(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Estás seguro de desactivar este producto?')) return

        try {
            const { error } = await supabase
                .from('productos_menu')
                .update({ activo: false })
                .eq('id', id)

            if (error) throw error
            alert('✅ Producto desactivado correctamente')
            cargarProductos()
        } catch (error) {
            console.error('Error desactivando producto:', error)
            alert('❌ Error al desactivar el producto')
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
            cargarProductos()
        } catch (error) {
            console.error('Error reactivando producto:', error)
            alert('❌ Error al reactivar el producto')
        }
    }

    const productosFiltrados = productos.filter(p => {
        if (!busqueda) return true
        return p.nombre?.toLowerCase().includes(busqueda.toLowerCase())
    })

    const getTipoIcon = (tipo) => {
        const iconos = {
            pizza: '🍕',
            bebida: '🥤',
            postre: '🍨',
            entrada: '🍢',
            producto: '📦'
        }
        return iconos[tipo] || '📦'
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            <span className="text-gradient-golden">Golden</span>
                            <span className="text-white"> on </span>
                            <span className="text-gradient-fire">Fire</span>
                            <span className="text-white/60"> - Productos</span>
                        </h2>
                        <p className="text-sm text-white/40">Gestiona el menú de productos</p>
                    </div>
                    <button
                        onClick={() => {
                            resetFormulario()
                            setMostrarFormulario(!mostrarFormulario)
                        }}
                        className="btn-golden text-sm flex items-center gap-2"
                    >
                        <Plus size={18} />
                        {mostrarFormulario ? 'Cancelar' : 'Nuevo Producto'}
                    </button>
                </div>

                {mostrarFormulario && (
                    <div className="glass-golden rounded-xl p-6 border border-golden/30 animate-fade-in-up">
                        <h3 className="text-lg font-semibold mb-4 text-white">
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
                                        placeholder="Ej: Pizza Margarita"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Categoría *</label>
                                    <select
                                        value={formData.categoria_id}
                                        onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                                        className="input-field"
                                        required
                                    >
                                        <option value="">Seleccionar categoría</option>
                                        {categorias.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Precio Venta *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.precio_venta}
                                        onChange={(e) => setFormData({...formData, precio_venta: parseFloat(e.target.value) || 0})}
                                        className="input-field"
                                        placeholder="0.00"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Costo</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.costo}
                                        onChange={(e) => setFormData({...formData, costo: parseFloat(e.target.value) || 0})}
                                        className="input-field"
                                        placeholder="0.00"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Stock</label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                                        className="input-field"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Tipo</label>
                                    <select
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                                        className="input-field"
                                    >
                                        <option value="producto">📦 Producto</option>
                                        <option value="pizza">🍕 Pizza</option>
                                        <option value="bebida">🥤 Bebida</option>
                                        <option value="postre">🍨 Postre</option>
                                        <option value="entrada">🍢 Entrada</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="input-label">Descripción</label>
                                    <textarea
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                                        className="input-field"
                                        rows="2"
                                        placeholder="Descripción del producto"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.activo}
                                            onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                                            className="w-4 h-4 rounded accent-golden"
                                        />
                                        <span className="text-sm text-white/60">Activo</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button type="submit" className="btn-golden">
                                    {editandoId ? '💾 Actualizar' : '💾 Crear Producto'}
                                </button>
                                <button type="button" onClick={resetFormulario} className="btn-secondary">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="input-field pl-10"
                            placeholder="🔍 Buscar productos..."
                        />
                    </div>
                    <button onClick={cargarProductos} className="btn-secondary text-sm">
                        <RefreshCw size={16} />
                    </button>
                </div>

                <div className="glass rounded-xl overflow-hidden border border-white/10">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Nombre</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Categoría</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Tipo</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Precio</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Stock</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {cargando ? (
                                    <tr><td colSpan="7" className="text-center py-8 text-white/40">Cargando...</td></tr>
                                ) : productosFiltrados.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-8 text-white/40">No hay productos</td></tr>
                                ) : (
                                    productosFiltrados.map((producto) => (
                                        <tr key={producto.id} className={!producto.activo ? 'opacity-50' : ''}>
                                            <td className="px-4 py-3 font-medium text-white">{producto.nombre}</td>
                                            <td className="px-4 py-3 text-white/60">{producto.categorias?.nombre || 'Sin categoría'}</td>
                                            <td className="px-4 py-3 text-white/60">{getTipoIcon(producto.tipo)} {producto.tipo}</td>
                                            <td className="px-4 py-3 font-bold text-golden">{formatPrice(producto.precio_venta)}</td>
                                            <td className="px-4 py-3 text-white/60">{producto.stock}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs border ${
                                                    producto.activo 
                                                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                                        : 'bg-white/10 text-white/40 border-white/10'
                                                }`}>
                                                    {producto.activo ? '✅ Activo' : '⏸️ Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 space-x-2">
                                                {producto.activo ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditar(producto)}
                                                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                                        >
                                                            <Edit2 size={14} /> Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleEliminar(producto.id)}
                                                            className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                                                        >
                                                            <Trash2 size={14} /> Desactivar
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReactivar(producto.id)}
                                                        className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1"
                                                    >
                                                        <RefreshCw size={14} /> Reactivar
                                                    </button>
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