'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

export default function Multiplicador({ value, onChange, min = 1, max = 10 }) {
    const [cantidad, setCantidad] = useState(value || 1)

    const handleChange = (delta) => {
        const nuevo = Math.min(max, Math.max(min, cantidad + delta))
        setCantidad(nuevo)
        if (onChange) onChange(nuevo)
    }

    return (
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
                onClick={() => handleChange(-1)}
                disabled={cantidad <= min}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <Minus size={16} />
            </button>
            <span className="w-8 text-center font-bold text-sm">{cantidad}</span>
            <button
                onClick={() => handleChange(1)}
                disabled={cantidad >= max}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <Plus size={16} />
            </button>
            <span className="text-xs text-gray-400 ml-1">x{cantidad}</span>
        </div>
    )
}