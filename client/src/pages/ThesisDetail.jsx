import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

function ThesisDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [project, setProject] = useState(null)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [updateWords, setUpdateWords] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // 从API获取项目数据
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setIsLoading(true)
        setError('')
        
        const response = await fetch(`http://localhost:3001/api/papers/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || '获取论文详情失败')
        }
        
        const data = await response.json()
        // 格式化日期显示，确保必要字段存在并设置默认值
        const formattedProject = {
          ...data.data,
          createdAt: new Date(data.data.createdAt).toLocaleDateString('zh-CN'),
          deadline: new Date(data.data.deadline).toLocaleDateString('zh-CN'),
          lastUpdated: new Date(data.data.updatedAt).toLocaleDateString('zh-CN'),
          targetWords: data.data.targetWords || data.data.dailyTarget * 30 || 10000, // 设置合理默认值
          completedWords: data.data.completedWords || 0, // 确保已完成字数默认为0
          progress: data.data.progress || 0 // 确保进度百分比默认为0
        }
        setProject(formattedProject)
      } catch (err) {
        setError(err.message || '获取论文详情时出现错误')
        console.error('获取论文详情失败:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProjectData()
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
    const targetWords = project.targetWords || 10000
    const completedWords = project.completedWords || 0
    const remainingWords = targetWords - completedWords
    return Math.max(0, Math.ceil(remainingWords / countdown.days))
  }

  // 计算进度百分比
  const calculateProgress = () => {
    if (!project) return 0
    const targetWords = project.targetWords || 10000
    const completedWords = project.completedWords || 0
    // 防止除以0的情况
    if (targetWords <= 0) return 0
    return Math.min(100, Math.round((completedWords / targetWords) * 100))
  }

  // 处理进度更新
  const handleUpdateProgress = async () => {
    const words = parseInt(updateWords)
    if (isNaN(words) || words <= 0) {
      alert('请输入有效的字数')
      return
    }

    try {
      const targetWords = project.targetWords || 10000
      const completedWords = project.completedWords || 0
      
      // 计算新的进度百分比
      const newProgressPercentage = Math.min(100, Math.round(((completedWords + words) / targetWords) * 100))
      
      const newCompletedWords = completedWords + words
      const dailyTargetValue = calculateDailyTarget()
      
      // 准备请求数据
      const requestData = {
        progress: newProgressPercentage,
        completedWords: newCompletedWords,
        dailyTarget: dailyTargetValue,
        note: '日常进度更新'
      }
      
      console.log('发送请求数据:', requestData)
      
      const response = await fetch(`http://localhost:3001/api/papers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        // 检查响应类型是否为JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.error('服务器返回的错误数据:', JSON.stringify(errorData, null, 2));
            const errorDetails = errorData.errors && errorData.errors.length > 0 ? 
              `\n具体错误: ${errorData.errors.join('\n具体错误: ')}` : '';
            throw new Error(`${errorData.message || '更新进度失败'}${errorDetails}`);
          } else {
          // 获取非JSON响应内容
          const errorText = await response.text();
          console.error('非JSON错误响应:', errorText);
          throw new Error(`服务器错误: ${response.status} ${response.statusText}`);
        }
      }

      // 获取响应数据并打印
      const responseData = await response.json();
      console.log('更新成功，响应数据:', responseData);

      // 更新本地状态
      setProject(prev => ({
        ...prev,
        completedWords: prev.completedWords + words,
        lastUpdated: new Date().toLocaleDateString('zh-CN'),
        progress: newProgressPercentage
      }))
      setUpdateWords('')
      alert('进度更新成功！')
    } catch (err) {
      console.error('更新进度详细错误:', err);
      alert(`更新失败: ${err.message || '未知错误'}`)
    }
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
          onClick={() => navigate('/my-thesis')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          返回论文列表
        </button>
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
            <div>{project.targetWords || 0} 字</div>
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