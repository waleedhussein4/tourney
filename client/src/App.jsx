import { Router } from './app/router.jsx'

// Self-hosted variable fonts. Archivo is pulled with its width axis, which the
// display styles use to set headings slightly expanded.
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/instrument-sans'

import './styles/globals.css'

export default function App() {
  return <Router />
}
