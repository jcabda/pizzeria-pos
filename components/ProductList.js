'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ProductList({ onSelectProduct }) {
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('')
    const [cargando, setCargando] = useState(true)
    const [busqueda, setBusqueda] = useState('')

    // Cargar productos y categorías al iniciar
    useEffect(() => {
        cargarCategorias()
        cargarProductos()
    }, [])

    // Recargar productos cuando cambia la categoría
    useEffect(() => {
        cargarProductos()
    }, [categoriaSeleccionada])

    const cargarCategorias = async () => {
        const { data } = await supabase
            .from('categorias')
            .select('*')
            .eq('activo', true)
            .order('nombre')
        
        if (data) setCategorias(data)
    }

    const cargarProductos = async () => {
        setCargando(true)
        let query = supabase
            .from('productos')
            .select(`
                *,
                categorias (nombre)
            `)
            .eq('activo', true)
            .gt('stock', 0) // Solo productos con stock

        if (categoriaSeleccionada) {
            query = query.eq('categoria_id', categoriaSeleccionada)
        }

        if (busqueda) {
            query = query.ilike('nombre', `%${busqueda}%`)
        }

        const { data } = await query.order('nombre')
        setProductos(data || [])
        setCargando(false)
    }

    // Búsqueda con debounce (espera a que termine de escribir)
    const handleBusqueda = (e) => {
        setBusqueda(e.target.value)
        clearTimeout(window.busquedaTimeout)
        window.busquedaTimeout = setTimeout(cargarProductos, 500)
    }

    return (
        <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="🔍 Buscar productos..."
                        value={busqueda}
                        onChange={handleBusqueda}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <div className="min-w-[150px]">
                    <select
                        value={categoriaSeleccionada}
                        onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="">Todas</option>
                        {categorias.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.nombre}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Lista de productos */}
            {cargando ? (
                <div className="text-center py-8 text-gray-500">Cargando productos...</div>
            ) : productos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No hay productos disponibles
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {productos.map((producto) => (
                        <div
                            key={producto.id}
                            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 cursor-pointer hover:border-orange-500 border-2 border-transparent"
                            onClick={() => onSelectProduct(producto)}
                        >
                            <div className="text-center">
                                <div className="text-4xl mb-2">🍕</div>
                                <h4 className="font-medium text-sm truncate">{producto.nombre}</h4>
                                <p className="text-xs text-gray-500">{producto.categorias?.nombre}</p>
                                <p className="text-orange-600 font-bold mt-1">${producto.precio}</p>
                                <p className="text-xs text-gray-400">Stock: {producto.stock}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}