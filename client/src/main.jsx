import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { Providers } from './app/providers.jsx'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>
)
