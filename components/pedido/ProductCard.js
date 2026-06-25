'use client'

import { useState } from 'react'
import { Plus, ShoppingCart } from 'lucide-react'

export default function ProductCard({ producto, onSelect }) {
    const getIcono = (nombre) => {
        if (nombre.includes('Pizza')) return '🍕'
        if (nombre.includes('Coca') || nombre.includes('Agua') || nombre.includes('Jugo')) return '🥤'
        if (nombre.includes('Helado') || nombre.includes('Tiramisú') || nombre.includes('Brownie')) return '🍨'
        if (nombre.includes('Palitos') || nombre.includes('Alitas') || nombre.includes('Nachos')) return '🍢'
        return '📦'
    }

    const getColor = (tipo) => {
        if (tipo === 'pizza_fija' || tipo === 'pizza_personalizable') return 'border-orange-200 hover:border-orange-500'
        if (tipo === 'simple') return 'border-blue-200 hover:border-blue-500'
        return 'border-gray-200 hover:border-gray-400'
    }

    return (
        <button
            onClick={() => onSelect(producto)}
            className={`bg-white rounded-2xl p-4 border-2 ${getColor(producto.tipo)} hover:shadow-lg transition-all duration-200 text-left w-full group`}
        >
            <div className="flex items-center gap-4">
                <div className="text-5xl flex-shrink-0">{getIcono(producto.nombre)}</div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 truncate">{producto.nombre}</h4>
                    <p className="text-sm text-gray-500 capitalize">
                        {producto.tipo === 'pizza_fija' ? '🍕 Pizza' :
                         producto.tipo === 'pizza_personalizable' ? '🎨 Personalizable' :
                         '📦 Simple'}
                    </p>
                    {producto.tamanios_pizza && (
                        <p className="text-xs text-gray-400">{producto.tamanios_pizza.nombre}</p>
                    )}
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-orange-600">${producto.precio_venta}</p>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full inline-block mt-1">
                        {producto.tipo === 'simple' ? `${producto.stock} disponibles` : 'Disponible'}
                    </span>
                </div>
            </div>
        </button>
    )
}