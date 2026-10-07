import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StoreProvider } from './store'
import { loadContent } from './content'
import './index.css'

// Content from the database first; the app is imported afterwards so that modules which
// build menus/lists when they load (Header, Sections, …) already see the latest content.
loadContent().then(async () => {
  const { default: App } = await import('./App')
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <StoreProvider>
          <App />
        </StoreProvider>
      </BrowserRouter>
    </StrictMode>,
  )
})
