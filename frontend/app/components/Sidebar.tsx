'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Code2,
  Search,
  Image,
  FileText,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  Monitor,
  LogOut,
  User,
  Bell,
  Star,
  Clock,
  FolderOpen,
  Trash2,
  Plus,
  Menu,
  X,
  Sparkles,
  Zap,
  Globe,
  Shield,
  Cpu,
  Database,
  Cloud,
  Lock,
  Heart,
  Share2,
  Bookmark,
  Flag,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Home,
  BarChart3,
  Users,
  Mail,
  Calendar,
  Music,
  Video,
  Camera,
  Mic,
  Headphones,
  Tv,
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  HardDrive,
  Network,
  Wifi,
  Bluetooth,
  Battery,
  Volume2,
  VolumeX,
  RotateCw,
  Download,
  Upload,
  Copy,
  Cut,
  Paste,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  File,
  Folder,
  Archive,
  Save,
  Printer,
  Share,
  Heart as HeartOutline,
  Bookmark as BookmarkOutline,
  Flag as FlagOutline,
  MoreVertical,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  XCircle,
  CheckCircle,
  AlertCircle,
  Info,
  HelpCircle as HelpCircleIcon,
  LifeBuoy,
  Gift,
  Award,
  Trophy,
  Medal,
  Crown,
  Diamond,
  Gem,
  Flame,
  Droplet,
  Wind,
  Sun as SunIcon,
  Moon as MoonIcon,
  CloudRain,
  Snowflake,
  Zap as ZapIcon,
  Sparkles as SparklesIcon,
  Rocket,
  Plane,
  Car,
  Train,
  Bike,
  Bus,
  Ship,
  Truck,
  Home as HomeIcon,
  Building,
  Factory,
  Hospital,
  School,
  Church,
  Mosque,
  Temple,
  Castle,
  Tree,
  Flower,
  Leaf,
  Seed,
  Apple,
  Coffee,
  Pizza,
  Burger,
  IceCream,
  Cake,
  Cookie,
  Candy,
  Beer,
  Wine,
  Glass,
  Mug,
  Utensils,
  Knife,
  Fork,
  Spoon,
  ChefHat,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Euro,
  PoundSterling,
  Yen,
  Bitcoin,
  Wallet,
  Bank,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  LineChart,
  BarChart,
  PieChart,
  Activity,
  HeartPulse,
  Stethoscope,
  Pill,
  Syringe,
  Bandage,
  Thermometer,
  Bone,
  Brain,
  Eye,
  Ear,
  Nose,
  Mouth,
  Tooth,
  Hand,
  Foot,
  Arm,
  Leg,
  Spine,
  Ribbon,
  Medal as MedalIcon,
  Star as StarIcon,
  Heart as HeartIcon,
  Flag as FlagIcon,
  Check,
  X as XIcon,
  Plus as PlusIcon,
  Minus,
  Divide,
  Equal,
  Percent,
  Infinity,
  Hash,
  AtSign,
  DollarSign as DollarSignIcon,
  Euro as EuroIcon,
  PoundSterling as PoundIcon,
  Yen as YenIcon,
  Bitcoin as BitcoinIcon,
  Ethereum,
  Dogecoin,
  Litecoin,
  Ripple,
  Cardano,
  Solana,
  Polkadot,
  Polygon,
  Avalanche,
  Chainlink,
  Uniswap,
  Aave,
  Compound,
  Curve,
  Sushi,
  PancakeSwap,
} from 'lucide-react'
import { useTheme } from './ThemeProvider'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onNewChat: () => void
  sessions: any[]
  currentSessionId: string | null
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
}

export default function Sidebar({
  isOpen,
  onClose,
  onNewChat,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
}: SidebarProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const filteredSessions = sessions.filter(session =>
    session.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/' },
    { icon: MessageSquare, label: 'Chat', href: '/chat' },
    { icon: Code2, label: 'Code Studio', href: '/code' },
    { icon: ImageIcon, label: 'Image Lab', href: '/image' },
    { icon: FileText, label: 'Documents', href: '/docs' },
    { icon: Search, label: 'Research', href: '/research' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-dark-100 border-r border-gray-200 dark:border-dark-300">
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">HundredXMind</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI-OS v5.0</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-dark-300 bg-gray-50 dark:bg-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 space-y-6">
          {/* Main Menu */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Main</h3>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                    pathname === item.href
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'hover:bg-gray-100 dark:hover:bg-dark-200 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Chats */}
          {filteredSessions.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Chats</h3>
              <div className="space-y-1">
                {filteredSessions.slice(0, 10).map((session) => (
                  <div
                    key={session.session_id}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      currentSessionId === session.session_id
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : 'hover:bg-gray-100 dark:hover:bg-dark-200'
                    }`}
                    onClick={() => onSelectSession(session.session_id)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm truncate">{session.last_message || 'New chat'}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSession(session.session_id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-300 transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-dark-300 space-y-2">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-dark-200">
          <span className="text-sm text-gray-600 dark:text-gray-400">Theme</span>
          <div className="flex gap-1">
            <button
              onClick={() => setTheme('light')}
              className={`p-2 rounded-lg transition-all ${
                resolvedTheme === 'light'
                  ? 'bg-primary-500 text-white'
                  : 'hover:bg-gray-200 dark:hover:bg-dark-300'
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-2 rounded-lg transition-all ${
                resolvedTheme === 'dark'
                  ? 'bg-primary-500 text-white'
                  : 'hover:bg-gray-200 dark:hover:bg-dark-300'
              }`}
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`p-2 rounded-lg transition-all ${
                theme === 'system'
                  ? 'bg-primary-500 text-white'
                  : 'hover:bg-gray-200 dark:hover:bg-dark-300'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-200 cursor-pointer transition-all">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Guest User</p>
            <p className="text-xs text-gray-500">Free Plan</p>
          </div>
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed left-0 top-0 bottom-0 w-80 z-50 shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    )
  }

  return (
    <div className={`fixed left-0 top-0 bottom-0 w-80 z-30 transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {sidebarContent}
    </div>
  )
}