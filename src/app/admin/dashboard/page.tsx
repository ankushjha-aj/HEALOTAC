'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Database, BarChart2, LogOut } from 'lucide-react'
import Image from 'next/image'

export default function AdminDashboardPage() {
    const router = useRouter()
    const [isAdmin, setIsAdmin] = useState(false)
    const [checkingAuth, setCheckingAuth] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('jwt_token')
        const storedUser = localStorage.getItem('user_info')

        if (!token || !storedUser) {
            router.push('/admin')
            return
        }

        try {
            const userData = JSON.parse(storedUser)
            if (userData.role !== 'super_admin') {
                // Redirect non-super-admins back to their own dashboard or login
                router.push(userData.role === 'user' ? '/dashboard' : '/admin')
            } else {
                setIsAdmin(true)
            }
        } catch (e) {
            localStorage.removeItem('jwt_token')
            localStorage.removeItem('user_info')
            router.push('/admin')
        } finally {
            setCheckingAuth(false)
        }
    }, [router])

    const handleLogout = () => {
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('user_info')
        router.push('/admin')
    }

    if (checkingAuth) return null

    if (!isAdmin) return null

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Standalone Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8">
                            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                            HEALOTAC <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">Admin</span>
                        </h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                        System management and analytics
                    </p>
                </div>

                {/* Admin Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Database Card */}
                    <Link href="/admin/database" className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden relative border border-gray-200 dark:border-gray-700 block">
                        <div className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[250px]">
                            <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Database className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Database Management</h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                Full access to manage users, cadets, and system records directly.
                            </p>
                        </div>
                        {/* Hover Effect Border Bottom */}
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 dark:bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </Link>

                    {/* Insights Card */}
                    <Link href="/admin/insights" className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden relative border border-gray-200 dark:border-gray-700 block">
                        <div className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[250px]">
                            <div className="p-5 bg-purple-50 dark:bg-purple-900/20 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                                <BarChart2 className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">System Insights</h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                View detailed analytics, utilization stats, and health metrics.
                            </p>
                        </div>
                        {/* Hover Effect Border Bottom */}
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-600 dark:bg-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </Link>

                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-gray-800 mt-auto bg-white dark:bg-gray-800">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        This is an admin panel for the HEALOTAC application
                    </p>
                </div>
            </footer>
        </div>
    )
}
