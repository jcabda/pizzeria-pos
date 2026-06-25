'use client'

import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export default function TestPage() {
    const [productos, setProductos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const probarConexion = async () => {
            try {
                // Intentar obtener productos de Supabase
                const { data, error } = await supabase
                    .from('productos')
                    .select('*')
                    .limit(5)

                if (error) throw error
                setProductos(data)
                setCargando(false)
            } catch (err) {
                setError(err.message)
                setCargando(false)
            }
        }

        probarConexion()
    }, [])

    return (
        <div style={{ padding: '20px' }}>
            <h1>🔌 Probando conexión con Supabase</h1>
            
            {cargando && <p>Cargando productos...</p>}
            
            {error && (
                <div style={{ color: 'red', background: '#ffeeee', padding: '10px' }}>
                    ❌ Error: {error}
                </div>
            )}
            
            {!cargando && !error && (
                <div>
                    <h2>✅ ¡Conectado! Productos encontrados:</h2>
                    <ul>
                        {productos.map(producto => (
                            <li key={producto.id}>
                                🍕 {producto.nombre} - ${producto.precio}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}