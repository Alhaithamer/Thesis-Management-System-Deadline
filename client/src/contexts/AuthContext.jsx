import { createContext, useState, useContext, useEffect } from 'react'

// 创建认证上下文
const AuthContext = createContext()

// 认证上下文提供器组件
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // 初始化时检查本地存储中的token
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')

        if (token && userData) {
          try {
            // 尝试解析用户数据
            const parsedUserData = JSON.parse(userData)
            setCurrentUser(parsedUserData)
          } catch (parseError) {
            console.error('解析用户数据失败:', parseError)
            // 清除损坏的数据
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        }
      } catch (error) {
        console.error('检查认证状态时出错:', error)
        // 清除可能损坏的数据
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, []);
  // 当localStorage变化时更新状态（处理多标签页登录/登出同步）
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          const userData = localStorage.getItem('user')
          if (userData) {
            try {
              setCurrentUser(JSON.parse(userData))
            } catch {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              setCurrentUser(null)
            }
          }
        } else {
          setCurrentUser(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // 登录函数
  const login = async (userData, token) => {
    try {
      // 存储token和用户数据到本地存储
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setCurrentUser(userData)
      return { success: true }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 登出函数
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setCurrentUser(null)
  }

  // 提供给子组件的值
  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 自定义钩子，方便在组件中使用认证上下文
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用')
  }
  return context
}