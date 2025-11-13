'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Header from './Header'
import Sidebar from './Sidebar'
import { useUser } from '@/hooks/useUser'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()

  useEffect(() => {
    const token = localStorage.getItem('jwt_token')
    if (!token) {
      router.push('/')
    }
  }, [router])

  // Redirect NA users from restricted pages
  useEffect(() => {
    if (user?.role === 'user' && pathname !== '/medical-records/new') {
      router.push('/medical-records/new')
    }
  }, [user, pathname, router])

  // Check if user is NA user and not on add record page
  const isNAUserBlocked = user?.role === 'user' && pathname !== '/medical-records/new'

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="w-px bg-gray-200 dark:bg-gray-700/50"></div>
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 lg:p-8 bg-background-light dark:bg-background-dark relative">
          {children}
          
          {/* Blocking overlay for NA users on pages other than add record */}
          {isNAUserBlocked && (
            <div 
              className="absolute inset-0 bg-black/5 dark:bg-black/20 z-50 cursor-not-allowed"
              style={{ pointerEvents: 'all' }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <div className="flex items-center justify-center h-full">
                <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6 shadow-lg max-w-md mx-4">
                  <div className="text-center">
                    <div className="text-gray-500 dark:text-gray-400 mb-2">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Access Restricted
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      As an NA user, you can only add new medical records. 
                      Please navigate to the Add Medical Record page to continue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
