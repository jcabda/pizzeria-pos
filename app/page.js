'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
    const router = useRouter()

    useEffect(() => {
        // Verificar si hay usuario logueado
        const usuario = localStorage.getItem('usuario')
        if (usuario) {
            router.push('/dashboard')
        } else {
            router.push('/login')
        }
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="text-4xl mb-4">⏳</div>
                <p>Redirigiendo...</p>
            </div>
        </div>
    )
}