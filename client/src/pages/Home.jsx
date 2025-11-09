import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

function Home() {
  const { currentUser } = useAuth();
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-16">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
          论文跟踪系统
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          智能管理您的论文项目，精确追踪截止日期，合理规划写作进度
        </p>
      </header>

      <main className="max-w-5xl mx-auto">
        <section className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-center mb-3">精确倒计时</h3>
            <p className="text-gray-600 text-center">实时追踪论文截止日期，不再错过重要时限</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-center mb-3">进度管理</h3>
            <p className="text-gray-600 text-center">智能计算每日任务量，助您有序完成写作计划</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-center mb-3">智能提醒</h3>
            <p className="text-gray-600 text-center">每日任务提醒，保持写作动力和效率</p>
          </div>
        </section>

        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white text-center mb-16">
          {currentUser ? (
            <>
              <h2 className="text-3xl font-bold mb-6">欢迎回来，{currentUser.username}</h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                继续管理您的论文项目，保持良好的写作进度
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/my-thesis" className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors duration-300">
                  我的论文
                </Link>
                <Link to="/create-thesis" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors duration-300">
                  创建新项目
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-6">开始管理您的论文项目</h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                立即注册，享受智能论文管理功能，轻松应对学术挑战
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors duration-300">
                  免费注册
                </Link>
                <Link to="/login" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors duration-300">
                  登录
                </Link>
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="text-center text-gray-500 mt-16">
        <p>© 2024 论文跟踪系统 - 智能学术助手</p>
      </footer>
    </div>
  )
}

export default Home