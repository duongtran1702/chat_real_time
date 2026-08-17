import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { AuthInit } from './features/auth/components/AuthInit'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthInit>
      <App />
    </AuthInit>
  </StrictMode>,
)
