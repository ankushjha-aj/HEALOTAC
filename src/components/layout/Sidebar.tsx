'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Activity, Plus, FileText, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Logo Image
const Logo = ({ className = "" }: { className?: string }) => (
  <img src="/logo.png" alt="Logo" className={className} />
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
          
          // Regular navigation links
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
