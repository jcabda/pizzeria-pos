'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function MeseroSelector({ value, onChange }) {
    const [meseros, setMeseros] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        cargarMeseros()
    }, [])

    const cargarMeseros = async () => {
        try {
            const { data } = await supabase
                .from('usuarios')
                .select('id, nombre, avatar')
                .eq('activo', true)
                .eq('rol', 'empleado')
                .order('nombre')
            
            setMeseros(data || [])
            if (data && data.length > 0 && !value) {
                onChange(data[0].id)
            }
        } catch (error) {
            console.error('Error cargando meseros:', error)
        } finally {
            setCargando(false)
        }
    }

    return (
        <div>
            <label className="input-label">👨‍🍳 Mesero</label>
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="input-field"
                disabled={cargando}
            >
                <option value="">Seleccionar mesero</option>
                {meseros.map((mesero) => (
                    <option key={mesero.id} value={mesero.id}>
                        {mesero.avatar || '👤'} {mesero.nombre}
                    </option>
                ))}
            </select>
            {cargando && <p className="text-sm text-gray-400 mt-1">Cargando meseros...</p>}
        </div>
    )
}