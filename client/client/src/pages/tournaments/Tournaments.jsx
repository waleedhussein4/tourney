import { useState } from 'react';

import './styles/Tournaments.css'
import Nav from '/src/components/Nav'
import Sidebar from './components/Sidebar.jsx'
import Content from './components/Content.jsx'

function App() {

  const [tournaments, setTournaments] = useState([])
  const [filters, setFilters] = useState([])
  const [filteredTourneys, setFilteredTourneys] = useState([])

  return (
    <div id='Tournaments'>
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
    </div>
  )
}

export default App