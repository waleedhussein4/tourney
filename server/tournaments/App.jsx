import { useState } from 'react';

import 'nouislider/dist/nouislider.css';
import '/src/styles/App.css'
import './styles/App.css'

import Nav from '/src/components/Nav'
import Sidebar from './components/Sidebar.jsx'
import Content from './components/Content.jsx'

function App() {

  const [tournaments, setTournaments] = useState([])
  const [filters, setFilters] = useState([])
  const [filteredTourneys, setFilteredTourneys] = useState([])

  return (
    <>
      <Nav />
      <Sidebar
        tournaments={tournaments}
        setTournaments={setTournaments}
        filters={filters}
        setFilters={setFilters}
        filteredTourneys={filteredTourneys}
        setFilteredTourneys={setFilteredTourneys}
      />
      <Content
        tournaments={tournaments}
        setTournaments={setTournaments}
        filters={filters}
        setFilters={setFilters}
        filteredTourneys={filteredTourneys}
        setFilteredTourneys={setFilteredTourneys}
      />
    </>
  )
}

export default App