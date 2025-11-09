import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    // 模拟登录请求
    setTimeout(() => {
      // 实际项目中应该调用API进行验证
      console.log('登录信息:', { email, password })
      setIsLoading(false)
      navigate('/my-thesis')
    }, 1000)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">登录</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="请输入邮箱"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="请输入密码"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              还没有账号？ <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">立即注册</Link>
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 px-8 py-4">
          <div className="text-center">
            <Link to="/" className="text-sm text-gray-600 hover:text-blue-600">
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login