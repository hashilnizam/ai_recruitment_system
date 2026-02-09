'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  HomeIcon, 
  BriefcaseIcon, 
  UsersIcon, 
  DocumentIcon, 
  ChartIcon, 
  UserIcon, 
  BellIcon, 
  SettingsIcon, 
  LogoutIcon 
} from '@/components/Icons';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const recruiterMenuItems = [
    { name: 'Dashboard', icon: HomeIcon, href: '/dashboard/recruiter' },
    { name: 'Post Job', icon: BriefcaseIcon, href: '/jobs/create' },
    { name: 'My Jobs', icon: DocumentIcon, href: '/jobs' },
    { name: 'All Candidates', icon: UsersIcon, href: '/candidates' },
    { name: 'Analytics', icon: ChartIcon, href: '/recruiter/analytics' },
  ];

  const candidateMenuItems = [
    { name: 'Dashboard', icon: HomeIcon, href: '/dashboard/candidate' },
    { name: 'Browse Jobs', icon: BriefcaseIcon, href: '/jobs' },
    { name: 'My Applications', icon: DocumentIcon, href: '/applications' },
    { name: 'Profile', icon: UserIcon, href: '/profile' },
  ];

  const menuItems = user?.role === 'recruiter' ? recruiterMenuItems : candidateMenuItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg z-40">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BriefcaseIcon className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">RecruitAI</h1>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
            Main Menu
          </div>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3 mb-3 px-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <LogoutIcon size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.firstName}!
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {user?.role === 'recruiter' 
                  ? 'Manage your recruitment pipeline and find the best talent'
                  : 'Discover opportunities and track your applications'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <BellIcon size={20} />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <SettingsIcon size={20} />
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
