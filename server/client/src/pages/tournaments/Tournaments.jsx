import { useState, useEffect } from 'react';

import './styles/Tournaments.css'
import Nav from '/src/components/Nav'
import Sidebar from './components/Sidebar.jsx'
import Content from './components/Content.jsx'

function App() {

  const [tournaments, setTournaments] = useState([])
  const [filters, setFilters] = useState([])
  const [filteredTourneys, setFilteredTourneys] = useState([])
  const [pageNumber, setPageNumber] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchPaginatedData = async () => {
    const URL = 'http://localhost:2000/api/tournement/getPaginatedTournaments/' + pageNumber
    await fetch(URL)
      .then(res => res.json())
      .then(data => {
        if (data.length === 0) {
          setHasMore(false)
        }
        setTournaments([...tournaments, ...data])
      })
  }

  useEffect(() => {
    fetchPaginatedData()
  }, [pageNumber])

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
        filteredTourneys={filteredTourneys}
      />
      {hasMore && <button onClick={() => { setPageNumber(pageNumber + 1) }} className="loadMore">Load More</button>}
    </div>
  )
}

export default App