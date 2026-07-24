'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
    const router = useRouter()

    useEffect(() => {
        const usuario = localStorage.getItem('usuario')
        if (usuario) {
            router.push('/comandas')
        } else {
            router.push('/login')
        }
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="text-4xl mb-4 animate-pulse">🍕</div>
                <p className="text-gray-600">Redirigiendo...</p>
            </div>
        </div>
    )
}