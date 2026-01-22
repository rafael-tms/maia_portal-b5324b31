import React from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AdminLogin from './pages/AdminLogin'
import AdminLayout from './layouts/AdminLayout'
import StatsEditor from './pages/editors/StatsEditor'
import AboutEditor from './pages/editors/AboutEditor'
import TodayEditor from './pages/editors/TodayEditor'
import TrajectoryEditor from './pages/editors/TrajectoryEditor'
import NewsEditor from './pages/editors/NewsEditor'
import GalleryEditor from './pages/editors/GalleryEditor'
import MontageEditor from './pages/editors/MontageEditor'
import VideoEditor from './pages/editors/VideoEditor'
import PlaceholderEditor from './pages/editors/PlaceholderEditor'
import ContactEditor from './pages/editors/ContactEditor'
import './App.css'

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        
        {/* Rotas Protegidas do Admin */}
        <Route path="/dashboard" element={<AdminLayout />}>
          <Route index element={<StatsEditor />} />
          <Route path="sobre" element={<AboutEditor />} />
          <Route path="hoje" element={<TodayEditor />} />
          <Route path="trajetoria" element={<TrajectoryEditor />} />
          <Route path="midia" element={<NewsEditor />} />
          <Route path="videos" element={<VideoEditor />} />
          <Route path="galeria" element={<GalleryEditor />} />
          <Route path="contato" element={<ContactEditor />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App