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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F0F1A] via-[#1A1A2E] to-[#16213E]">
            <div className="text-center">
                <div className="text-6xl mb-4 animate-fire-pulse">🔥</div>
                <p className="text-white/40">Redirigiendo...</p>
            </div>
        </div>
    )
}