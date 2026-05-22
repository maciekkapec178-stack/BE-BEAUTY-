import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'lenis/dist/lenis.css'
import './index.css'
import { initGsapMotion } from './lib/gsap-motion'
import { scrollToTop } from './lib/scroll'
import { initScrollDiagnostics } from './lib/scroll-diagnostics'

initGsapMotion()
scrollToTop()
initScrollDiagnostics()

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
