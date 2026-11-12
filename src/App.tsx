import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { NeuroCareProvider } from '@/context/NeuroCareContext'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Onboarding from '@/pages/Onboarding'
import Dashboard from '@/pages/Dashboard'
import Assessment from '@/pages/Assessment'
import MemoryGames from '@/pages/MemoryGames'
import SleepMonitoring from '@/pages/SleepMonitoring'
import LifestyleTracking from '@/pages/LifestyleTracking'
import FamilyHistory from '@/pages/FamilyHistory'
import Analytics from '@/pages/Analytics'
import AIReport from '@/pages/AIReport'
import Recommendations from '@/pages/Recommendations'
import Assistant from '@/pages/Assistant'
import ClinicalSupport from '@/pages/ClinicalSupport'
import AssessmentHistory from '@/pages/AssessmentHistory'
import AdminPortal from '@/pages/AdminPortal'
import Profile from '@/pages/Profile'

export function App() {
  return (
    <NeuroCareProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/games" element={<MemoryGames />} />
          <Route path="/sleep" element={<SleepMonitoring />} />
          <Route path="/sleep-wellness" element={<SleepMonitoring />} />
          <Route path="/lifestyle" element={<LifestyleTracking />} />
          <Route path="/family-history" element={<FamilyHistory />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/report" element={<AIReport />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/clinical-support" element={<ClinicalSupport />} />
          <Route path="/history" element={<AssessmentHistory />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </NeuroCareProvider>
  )
}

export default App
