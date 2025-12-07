'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Activity, Plus, FileText, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import Image from 'next/image'

// Logo Image
const Logo = ({ className = "" }: { className?: string }) => (
  <Image src="/logo.png" alt="Logo" width={32} height={32} className={className} />
)

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Cadet Records', href: '/cadets', icon: Users },
  { name: 'Medical History', href: '/medical-history', icon: Activity },
  { name: 'Add Record', href: '/medical-records/new', icon: Plus },
  { name: 'Reports', href: '/reports', icon: FileText },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const [navigatingToNewRecord, setNavigatingToNewRecord] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('user_info')
    router.push('/')
  }

  const handleAddNewRecord = () => {
    setNavigatingToNewRecord(true)
    // Add a smooth scrolling animation before navigation
    setTimeout(() => {
      router.push('/medical-records/new')
    }, 800) // 800ms delay for smooth animation
  }

  // Check for Read-Only users (Brig, Coco)
  const isReadOnly = (user?.username?.toLowerCase() || '').includes('brig') ||
    (user?.username?.toLowerCase() || '').includes('coco') ||
    (user?.name?.toLowerCase() || '').includes('brig') ||
    (user?.name?.toLowerCase() || '').includes('coco')

  // Check if user is NA user (restricted to only Add Record)
  // Exclude read-only users from this restriction (they can view everything but edit nothing)
  const isNAUser = user?.role === 'user' && !isReadOnly

  return (
    <aside className="w-64 flex-col bg-white dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700/50 p-4 hidden lg:flex sticky top-0 h-screen overflow-y-auto">
      <div className="flex flex-col gap-y-2 mb-8">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8" />
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">HEALOTAC</h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href

          // Special handling for Add Record button
          if (item.name === 'Add Record') {
            // Hide for Read-Only users
            if (isReadOnly) return null

            return (
              <button
                key={item.name}
                onClick={handleAddNewRecord}
                disabled={navigatingToNewRecord}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2 font-medium
                  ${isActive
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                  ${navigatingToNewRecord ? 'cursor-not-allowed opacity-75' : ''}
                `}
              >
                {navigatingToNewRecord ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                <span>{navigatingToNewRecord ? 'Loading...' : item.name}</span>
              </button>
            )
          }

          // For NA users, show disabled navigation items for other pages
          if (isNAUser && item.name !== 'Add Record') {
            return (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50"
                title="Access restricted for NA users"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
                <div className="ml-auto text-xs text-gray-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            )
          }

          // Regular navigation links for non-NA users
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2 font-medium
                ${isActive
                  ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 mt-auto"
      >
        <LogOut className="h-5 w-5" />
        <span>Logout</span>
      </button>
    </aside>
  )
}
