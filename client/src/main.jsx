import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import dotenv from 'dotenv';

import { BrowserRouter } from "react-router-dom";
import { AuthContextProvider } from '/src/context/AuthContext.jsx';

const configureEnvironment = () => {
  console.log('Environment:', import.meta.env)

  // if (import.meta.env.MODE === 'development') {
  //   console.log('Development environment')
  //   dotenv.config({ path: '.env.dev' });
  // } else {
  //   console.log('Production environment')
  //   dotenv.config({ path: '.env' });
  // }

  // console.log('Environment:', import.meta.env)
}

configureEnvironment();

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthContextProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AuthContextProvider>
)
