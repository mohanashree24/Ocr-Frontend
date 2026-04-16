// src/App.jsx
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import AutoExtractor from './components/AutoExtractor'
import ExtractedData from './components/ExtractedData'
import EnhancedCostDashboard from './components/CostDashboard'
import BarcodeExtractor from './components/BarcodeExtractor'
import BarcodeResults from './components/BarcodeResults'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes with Layout */}
        <Route path="/" element={<Layout />}>
          {/* Redirect root to auto-extract */}
          <Route index element={<Navigate to="/auto-extract" replace />} />
          
          {/* Main routes */}
          <Route path="auto-extract" element={<AutoExtractor />} />
          <Route path="extracted-data" element={<ExtractedData />} />
          <Route path="cost" element={<EnhancedCostDashboard />} />
          <Route path="bar" element={<BarcodeExtractor />} />
          <Route path="/barcode-results" element={<BarcodeResults />} />
          
          {/* Catch all - redirect to auto-extract */}
          <Route path="*" element={<Navigate to="/auto-extract" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App