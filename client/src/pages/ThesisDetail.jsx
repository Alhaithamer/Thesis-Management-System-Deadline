import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

function ThesisDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [updateWords, setUpdateWords] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // 模拟获取项目数据
  useEffect(() => {
    // 模拟API请求延迟
    setTimeout(() => {
      // 模拟项目数据
      const mockProject = {
        id: parseInt(id),
        title: id === '1' ? '人工智能在教育领域的应用研究' : 
               id === '2' ? '大数据分析技术综述' : 
               '现代前端框架性能比较研究',
        description: '这是一篇关于当前技术发展趋势的研究论文，探讨了最新的技术进展和应用案例。',
        targetWords: 15000,
        completedWords: 5200,
        deadline: '2024-06-15',
        createdAt: '2024-01-15',
        lastUpdated: '2024-02-01'
      }
      setProject(mockProject)
      setIsLoading(false)
    }, 500)
  }, [id])

  // 更新倒计时
  useEffect(() => {
    if (!project) return

    const updateCountdown = () => {
      const now = new Date()
      const deadline = new Date(project.deadline)
      const diff = deadline - now

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setCountdown({ days, hours, minutes, seconds })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [project])

  // 计算每日目标
  const calculateDailyTarget = () => {
    if (!project || countdown.days <= 0) return 0
    const remainingWords = project.targetWords - project.completedWords
    return Math.ceil(remainingWords / countdown.days)
  }

  // 计算进度百分比
  const calculateProgress = () => {
    if (!project) return 0
    return Math.min(100, Math.round((project.completedWords / project.targetWords) * 100))
  }

  // 处理进度更新
  const handleUpdateProgress = () => {
    const words = parseInt(updateWords)
    if (isNaN(words) || words <= 0) {
      alert('请输入有效的字数')
      return
    }

    setProject(prev => ({
      ...prev,
      completedWords: prev.completedWords + words,
      lastUpdated: new Date().toISOString().split('T')[0]
    }))
    setUpdateWords('')
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center">
        <div className="text-lg text-gray-600">论文项目不存在</div>
      </div>
    )
  }

  const progress = calculateProgress()
  const dailyTarget = calculateDailyTarget()
  const progressColor = progress >= 75 ? 'bg-green-500' : progress >= 40 ? 'bg-blue-500' : 'bg-yellow-500'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
            <p className="opacity-90 mb-4">{project.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="opacity-80">创建日期</div>
                <div>{project.createdAt}</div>
              </div>
              <div>
                <div className="opacity-80">最后更新</div>
                <div>{project.lastUpdated}</div>
              </div>
              <div>
                <div className="opacity-80">目标字数</div>
                <div>{project.targetWords} 字</div>
              </div>
              <div>
                <div className="opacity-80">截止日期</div>
                <div>{project.deadline}</div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* 倒计时 */}
            <div className="mb-8 bg-blue-50 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">距离截止日还有</h2>
              <div className="flex justify-center gap-4">
                <div className="bg-white rounded-lg shadow p-4 w-20">
                  <div className="text-3xl font-bold text-blue-600">{countdown.days}</div>
                  <div className="text-sm text-gray-600">天</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 w-20">
                  <div className="text-3xl font-bold text-blue-600">{countdown.hours.toString().padStart(2, '0')}</div>
                  <div className="text-sm text-gray-600">时</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 w-20">
                  <div className="text-3xl font-bold text-blue-600">{countdown.minutes.toString().padStart(2, '0')}</div>
                  <div className="text-sm text-gray-600">分</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 w-20">
                  <div className="text-3xl font-bold text-blue-600">{countdown.seconds.toString().padStart(2, '0')}</div>
                  <div className="text-sm text-gray-600">秒</div>
                </div>
              </div>
            </div>

            {/* 进度 */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">写作进度</h2>
                <div className="text-lg font-medium text-blue-600">{progress}%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className={`h-3 rounded-full ${progressColor}`} 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-gray-600">
                <div>已完成：<span className="font-medium">{project.completedWords} 字</span></div>
                <div>每日应写：<span className="font-medium">{dailyTarget} 字</span></div>
              </div>
            </div>

            {/* 更新进度 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">更新今日进度</h2>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={updateWords}
                  onChange={(e) => setUpdateWords(e.target.value)}
                  placeholder="今日已完成字数"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
                <button
                  onClick={handleUpdateProgress}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  更新
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThesisDetail