'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Shield, Pizza, Package, FolderOpen, Users, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
    const router = useRouter()

    useEffect(() => {
        // Verificar que el usuario es admin
        const userData = localStorage.getItem('usuario')
        if (!userData) {
            router.push('/login')
            return
        }
        const usuario = JSON.parse(userData)
        if (usuario.rol !== 'admin') {
            router.push('/dashboard')
        }
    }, [router])

    const adminModules = [
        { href: '/productos', icon: Pizza, label: 'Productos', desc: 'Gestionar productos del menú', color: 'bg-orange-100 text-orange-600' },
        { href: '/inventario', icon: Package, label: 'Inventario', desc: 'Control de ingredientes', color: 'bg-blue-100 text-blue-600' },
        { href: '/categorias', icon: FolderOpen, label: 'Categorías', desc: 'Gestionar categorías', color: 'bg-green-100 text-green-600' },
        { href: '/usuarios', icon: Users, label: 'Usuarios', desc: 'Gestionar empleados', color: 'bg-pink-100 text-pink-600' },
        { href: '/auditoria', icon: FileText, label: 'Auditoría', desc: 'Ver historial de acciones', color: 'bg-gray-100 text-gray-600' },
    ]

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 rounded-xl p-3">
                        <Shield size={28} className="text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Panel de Administración</h2>
                        <p className="text-sm text-gray-500">Gestiona todos los aspectos del sistema</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {adminModules.map((mod) => (
                        <Link
                            key={mod.href}
                            href={mod.href}
                            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all group"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`rounded-xl p-3 ${mod.color}`}>
                                    <mod.icon size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800">{mod.label}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{mod.desc}</p>
                                    <span className="text-xs text-purple-600 group-hover:underline inline-flex items-center gap-1 mt-2">
                                        Gestionar <ArrowRight size={12} />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-sm text-purple-700 flex items-center gap-2">
                        <Shield size={16} />
                        Estas herramientas solo están disponibles para administradores
                    </p>
                </div>
            </div>
        </DashboardLayout>
    )
}