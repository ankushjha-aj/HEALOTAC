'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from './Header'
import Sidebar from './Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('jwt_token')
    if (!token) {
      router.push('/')
    }
  }, [router])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="w-px bg-gray-200 dark:bg-gray-700/50"></div>
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 lg:p-8 bg-background-light dark:bg-background-dark">
          {children}
        </main>
      </div>
    </div>
  )
}
