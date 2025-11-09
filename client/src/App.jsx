import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import MyThesisProjects from './pages/MyThesisProjects.jsx'
import ThesisDetail from './pages/ThesisDetail.jsx'
import CreateThesis from './pages/CreateThesis.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'

// 受保护的路由组件
const ProtectedRoute = ({ element }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    // 可以替换为更美观的加载组件
    return <div className="flex items-center justify-center h-screen">加载中...</div>
  }

  return isAuthenticated ? element : <Navigate to="/login" />
}

// 内部应用组件
const AppContent = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* 全局导航栏 */}
      <nav className="bg-white shadow-md py-4 px-6 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          {/* 网站Logo - 链接到首页 */}
          <Link to="/" className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xl font-bold text-gray-800">论文跟踪系统</span>
          </Link>

          {/* 导航链接 */}
          <div className="flex items-center space-x-6">
            {currentUser ? (
              // 已登录状态
              <>
                {currentUser.role === 'ADMIN' ? (
                  // 管理员用户
                  <>
                    <Link to="/admin/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                      管理后台
                    </Link>
                  </>
                ) : (
                  // 普通用户
                  <>
                    <Link to="/my-thesis" className="text-gray-600 hover:text-blue-600 transition-colors">
                      我的论文
                    </Link>
                  </>
                )}
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                >
                  退出登录
                </button>
              </>
            ) : (
              // 未登录状态
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors">
                  登录
                </Link>
                <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  注册
                </Link>
                <Link to="/admin/login" className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors">
                  管理员登录
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <div className="pt-6 pb-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/my-thesis" 
            element={<ProtectedRoute element={<MyThesisProjects />} />} 
          />
          <Route 
            path="/thesis/:id" 
            element={<ProtectedRoute element={<ThesisDetail />} />} 
          />
          <Route 
            path="/create-thesis" 
            element={<ProtectedRoute element={<CreateThesis />} />} 
          />
          {/* 管理员相关路由 */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={<ProtectedRoute element={<AdminDashboard />} />} 
          />
        </Routes>
      </div>
    </div>
  )
}

// 主应用组件，包含认证提供器
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App