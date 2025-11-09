import { useState } from 'react'
import { Link } from 'react-router-dom'

function MyThesisProjects() {
  // 模拟论文项目数据
  const [projects, setProjects] = useState([
    {
      id: 1,
      title: '人工智能在教育领域的应用研究',
      targetWords: 15000,
      completedWords: 5200,
      deadline: '2024-06-15',
      progress: 35
    },
    {
      id: 2,
      title: '大数据分析技术综述',
      targetWords: 12000,
      completedWords: 8700,
      deadline: '2024-05-30',
      progress: 72
    },
    {
      id: 3,
      title: '现代前端框架性能比较研究',
      targetWords: 10000,
      completedWords: 2300,
      deadline: '2024-07-20',
      progress: 23
    }
  ])

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

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">我的论文项目</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
          添加新项目
        </button>
      </header>

      <div className="grid gap-6">
        {projects.map(project => {
          const daysLeft = calculateDaysLeft(project.deadline)
          const dailyTarget = Math.ceil(
            (project.targetWords - project.completedWords) / (daysLeft || 1)
          )
          
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
                      <span>进度：{project.progress}%</span>
                      <span>{project.completedWords}/{project.targetWords} 字</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(project.progress)}`} 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>截止日期：{project.deadline}</span>
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
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
            创建第一个项目
          </button>
        </div>
      )}
    </div>
  )
}

export default MyThesisProjects