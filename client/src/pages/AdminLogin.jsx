import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      // 调用后端登录API
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || '登录失败，请检查邮箱和密码')
      }
      
      // 验证是否为管理员
      if (data.data.role !== 'ADMIN') {
        throw new Error('请使用管理员账号登录')
      }
      
      // 使用AuthContext更新登录状态
      await login(data.data, data.data.token)
      
      // 登录成功后跳转到管理员面板
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message || '登录失败，请稍后重试')
      console.error('管理员登录错误:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-gradient-to-br from-indigo-800 to-purple-900 rounded-xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold text-white">管理员登录</h2>
            <p className="text-indigo-200 mt-2">仅限管理员访问的安全区域</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-indigo-100 mb-1">
                邮箱
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-indigo-950/50 border border-indigo-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-white placeholder-indigo-400"
                placeholder="请输入管理员邮箱"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-indigo-100 mb-1">
                密码
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-indigo-950/50 border border-indigo-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-white placeholder-indigo-400"
                placeholder="请输入管理员密码"
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-purple-700'}`}
            >
              {isLoading ? '登录中...' : '管理员登录'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link to="/login" className="text-indigo-300 hover:text-white font-medium transition-colors">
              返回普通用户登录
            </Link>
          </div>
        </div>
        
        <div className="bg-indigo-900/50 px-8 py-4">
          <div className="text-center">
            <Link to="/" className="text-sm text-indigo-300 hover:text-white transition-colors">
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin