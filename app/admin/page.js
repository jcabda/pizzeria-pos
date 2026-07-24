'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Shield, Pizza, Package, FolderOpen, Users, FileText, Ruler, Tag, Scale, Utensils } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
    const router = useRouter()

    useEffect(() => {
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
        { href: '/productos', icon: Pizza, label: 'Productos', desc: 'Gestionar productos del menú' },
        { href: '/inventario', icon: Package, label: 'Inventario', desc: 'Control de ingredientes' },
        { href: '/categorias', icon: FolderOpen, label: 'Categorías', desc: 'Gestionar categorías' },
        { href: '/usuarios', icon: Users, label: 'Usuarios', desc: 'Gestionar empleados' },
        { href: '/auditoria', icon: FileText, label: 'Auditoría', desc: 'Ver historial de acciones' },
        { href: '/mesas', icon: Utensils, label: 'Mesas', desc: 'Gestionar mesas del restaurante' },
        { href: '/admin/tamanios', icon: Ruler, label: 'Tamaños', desc: 'Modificar tamaños de pizza' },
        { href: '/admin/tipos', icon: Tag, label: 'Tipos', desc: 'Gestionar tipos de productos' },
        { href: '/admin/unidades', icon: Scale, label: 'Unidades', desc: 'Gestionar unidades de medida' },
    ]

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Shield size={32} className="text-purple-600" />
                    <div>
                        <h2 className="text-2xl font-bold">Panel de Administración</h2>
                        <p className="text-sm text-gray-500">Gestiona todos los aspectos del sistema</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {adminModules.map((mod) => (
                        <Link
                            key={mod.href}
                            href={mod.href}
                            className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="bg-purple-100 rounded-xl p-3">
                                    <mod.icon size={22} className="text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">{mod.label}</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">{mod.desc}</p>
                                    <span className="text-xs text-purple-600 group-hover:underline inline-flex items-center gap-1 mt-1">
                                        Gestionar →
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