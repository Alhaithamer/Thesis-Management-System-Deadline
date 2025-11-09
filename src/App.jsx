import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import MyThesisProjects from './pages/MyThesisProjects.jsx'
import ThesisDetail from './pages/ThesisDetail.jsx'

function App() {
  // 模拟登录状态
  const isAuthenticated = false

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/my-thesis" 
            element={isAuthenticated ? <MyThesisProjects /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/thesis/:id" 
            element={isAuthenticated ? <ThesisDetail /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App