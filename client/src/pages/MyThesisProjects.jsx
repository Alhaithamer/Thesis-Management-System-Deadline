import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

function MyThesisProjects() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // 从API获取论文项目列表
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true)
        setError('')
        
        const response = await fetch('http://localhost:3001/api/papers', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || '获取项目列表失败')
        }
        
        const data = await response.json()
        setProjects(data.data || [])
      } catch (err) {
        setError(err.message || '获取项目列表时出现错误')
        console.error('获取项目列表失败:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProjects()
  }, [currentUser])

  // 计算剩余天数
  const calculateDaysLeft = (deadline) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  // 获取进度条颜色
  const getProgressColor = (progress) => {
    if (progress >= 75) return 'bg-green-500'
    if (progress >= 40) return 'bg-blue-500'
    return 'bg-yellow-500'
  }

  // 获取倒计时颜色
  const getDaysLeftColor = (days) => {
    if (days <= 7) return 'text-red-600 font-semibold'
    if (days <= 14) return 'text-orange-600 font-semibold'
    return 'text-green-600'
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          {error}
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">我的论文项目</h1>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          onClick={() => navigate('/create-thesis')}
        >
          添加新项目
        </button>
      </header>

      <div className="grid gap-6">
        {projects.map(project => {
          // 格式化日期显示
          const formattedDeadline = new Date(project.deadline).toLocaleDateString('zh-CN')
          const daysLeft = calculateDaysLeft(project.deadline)
          const dailyTarget = Math.ceil(
            ((project.targetWords || 0) - (project.completedWords || 0)) / (daysLeft || 1)
          )
          const progress = project.progress || 0
          
          return (
            <Link to={`/thesis/${project.id}`} key={project.id}>
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{project.title}</h2>
                    <span className={`${getDaysLeftColor(daysLeft)}`}>
                      {daysLeft} 天
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>进度：{progress}%</span>
                      <span>{project.completedWords || 0}/{project.targetWords || 0} 字</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(progress)}`} 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>截止日期：{formattedDeadline}</span>
                      <span>每日目标：{dailyTarget} 字</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {projects.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">您还没有创建任何论文项目</p>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            onClick={() => navigate('/create-thesis')}
          >
            创建第一个项目
          </button>
        </div>
      )}
    </div>
  )
}

export default MyThesisProjects