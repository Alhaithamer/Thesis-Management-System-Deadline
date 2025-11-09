import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshInterval, setRefreshInterval] = useState(null)
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  // 确保用户是管理员
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      // 如果不是管理员，重定向到普通用户页面
      navigate('/my-thesis')
    }
  }, [currentUser, navigate])

  // 获取系统统计信息
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('未找到认证令牌，请重新登录')
      }

      const response = await fetch('http://localhost:3001/api/admin/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || '获取统计信息失败')
      }

      setStats(data.data)
      setError('')
    } catch (err) {
      console.error('获取统计信息错误:', err)
      setError(err.message || '获取统计信息时发生错误')
    } finally {
      setIsLoading(false)
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchStats()

    // 设置自动刷新（每分钟）
    const interval = setInterval(() => {
      fetchStats()
    }, 60000)

    setRefreshInterval(interval)

    // 清理函数
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [])

  // 手动刷新数据
  const handleRefresh = () => {
    setIsLoading(true)
    fetchStats()
  }

  // 退出登录
  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // 格式化数字显示
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // 加载中状态
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-800 mb-4"></div>
              <h3 className="text-xl font-medium text-gray-700">正在加载系统统计信息...</h3>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* 管理员导航栏 */}
      <nav className="bg-indigo-900 shadow-lg py-3 px-6 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          {/* 网站Logo - 链接到首页 */}
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xl font-bold text-white">管理后台</span>
          </div>

          {/* 管理员信息和退出按钮 */}
          <div className="flex items-center space-x-4">
            <div className="text-white">
              <span className="font-medium">管理员: {currentUser?.username}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题和操作栏 */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">系统统计信息</h1>
                <p className="text-gray-500 mt-1">实时监控系统用户数据</p>
              </div>
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>刷新数据</span>
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg">
                <strong>错误:</strong> {error}
              </div>
            )}
          </div>

          {/* 统计卡片区域 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* 用户总数卡片 */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-blue-100">用户总数</h3>
                <div className="bg-white/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold mb-2">{stats ? formatNumber(stats.users.total) : '0'}</div>
              <p className="text-blue-100">系统中注册的所有用户</p>
            </div>

            {/* 普通用户数量卡片 */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-green-100">普通用户</h3>
                <div className="bg-white/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold mb-2">{stats ? formatNumber(stats.users.regular) : '0'}</div>
              <p className="text-green-100">使用系统的普通用户</p>
            </div>

            {/* 管理员数量卡片 */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-purple-100">管理员</h3>
                <div className="bg-white/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold mb-2">{stats ? formatNumber(stats.users.admin) : '0'}</div>
              <p className="text-purple-100">具有管理权限的用户</p>
            </div>

            {/* 论文总数卡片 */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-amber-100">论文总数</h3>
                <div className="bg-white/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold mb-2">{stats ? formatNumber(stats.papers.total) : '0'}</div>
              <p className="text-amber-100">系统中创建的论文总数</p>
            </div>
          </div>

          {/* 系统信息卡片 */}
          {stats && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">系统信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500 text-sm">数据更新时间</p>
                  <p className="font-medium text-gray-800">{new Date(stats.systemInfo.lastUpdated).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500 text-sm">服务器时间</p>
                  <p className="font-medium text-gray-800">{new Date(stats.systemInfo.serverTime).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 页脚 */}
      <footer className="bg-indigo-900 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} 论文跟踪系统管理后台</p>
          <p className="text-indigo-300 text-sm mt-1">本页面仅供管理员访问</p>
        </div>
      </footer>
    </div>
  )
}

export default AdminDashboard