'use client'

import { useState } from 'react'

export default function ClienteSelector({ value, onChange }) {
    const [tipoCliente, setTipoCliente] = useState('local')
    const [nombreCliente, setNombreCliente] = useState('')
    const [nuevoCliente, setNuevoCliente] = useState('')

    const tipos = [
        { value: 'local', label: '🏠 Local' },
        { value: 'domicilio', label: '🏍️ Domicilio' },
        { value: 'nuevo', label: '🆕 Nuevo Cliente' },
    ]

    const handleTipoChange = (tipo) => {
        setTipoCliente(tipo)
        if (tipo === 'local') {
            setNombreCliente('Cliente Local')
            onChange('Cliente Local')
        } else if (tipo === 'domicilio') {
            setNombreCliente('Cliente Domicilio')
            onChange('Cliente Domicilio')
        } else {
            setNombreCliente('')
            onChange('')
        }
    }

    const handleNuevoCliente = (e) => {
        const nombre = e.target.value
        setNuevoCliente(nombre)
        if (nombre.trim()) {
            onChange(nombre)
        }
    }

    return (
        <div className="space-y-2">
            <label className="input-label">👤 Tipo de Cliente</label>
            <div className="flex gap-2 flex-wrap">
                {tipos.map((tipo) => (
                    <button
                        key={tipo.value}
                        type="button"
                        onClick={() => handleTipoChange(tipo.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            tipoCliente === tipo.value
                                ? 'bg-orange-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {tipo.label}
                    </button>
                ))}
            </div>

            {tipoCliente === 'nuevo' && (
                <div className="mt-2">
                    <label className="input-label">📝 Nombre del Cliente</label>
                    <input
                        type="text"
                        value={nuevoCliente}
                        onChange={handleNuevoCliente}
                        className="input-field"
                        placeholder="Escribe el nombre del cliente"
                    />
                </div>
            )}

            {tipoCliente !== 'nuevo' && (
                <p className="text-sm text-gray-500 mt-1">
                    {tipoCliente === 'local' ? '🏠 Pedido para consumir en el local' : '🏍️ Pedido para enviar a domicilio'}
                </p>
            )}
        </div>
    )
}