import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

function CreateThesis() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [targetWords, setTargetWords] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 表单验证
    if (!title.trim()) {
      setError('请输入论文标题')
      return
    }
    if (title.trim().length < 5) {
      setError('论文标题长度至少需要5个字符')
      return
    }
    if (!deadline) {
      setError('请设置截止日期')
      return
    }
    if (!targetWords || parseInt(targetWords) <= 0) {
      setError('请输入有效的目标字数')
      return
    }

    const deadlineDate = new Date(deadline)
    if (deadlineDate <= new Date()) {
      setError('截止日期必须是未来的日期')
      return
    }

    try {
      setIsLoading(true)
      
      // 调用后端API创建论文项目
      const response = await fetch('http://localhost:3001/api/papers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          deadline: new Date(deadline).toISOString(),
          progress: 0,
          dailyTarget: Math.ceil(parseInt(targetWords) / 30) // 假设默认30天
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '创建项目失败')
      }

      const data = await response.json()
      navigate(`/thesis/${data.data.id}`)
    } catch (err) {
      setError(err.message || '创建项目时出现错误')
      console.error('创建论文失败:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">创建新论文项目</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                论文标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入论文标题"
                maxLength={200}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                论文描述
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入论文描述（可选）"
                rows={3}
                maxLength={1000}
              ></textarea>
            </div>

            <div className="mb-4">
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                截止日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="targetWords" className="block text-sm font-medium text-gray-700 mb-1">
                目标字数 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="targetWords"
                value={targetWords}
                onChange={(e) => setTargetWords(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入目标字数"
                min="1"
                max="100000"
              />
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => navigate('/my-thesis')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '创建中...' : '创建项目'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateThesis