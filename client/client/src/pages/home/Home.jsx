import Nav from "/src/components/Nav";
import Main from "./components/Main";
import { useAuthContext } from "/src/hooks/useAuthContext";

import './styles/Home.css'

function App() {
  return (
    <div id="Home">
      <Nav />
      <Main />
    </div>
  );
}

export default App;