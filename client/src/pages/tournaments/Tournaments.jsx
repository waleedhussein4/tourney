import { useState, useEffect } from 'react';

import './styles/Tournaments.css'
import Nav from '/src/components/Nav'
import Sidebar from './components/Sidebar.jsx'
import Content from './components/Content.jsx'

function App() {

  const [tournaments, setTournaments] = useState([])
  const [filters, setFilters] = useState()
  const [pageNumber, setPageNumber] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchPaginatedData = async () => {
    if(!filters) {
      return;
    }
    const URL = `${import.meta.env.VITE_BACKEND_URL}/api/tournement/getFilteredTournaments/` + pageNumber
    await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': `${import.meta.env.VITE_FRONTEND_URL}`
      },
      body: JSON.stringify({
        search: filters.search,
        category: filters.category,
        minEntryFee: filters.minEntryFee,
        maxEntryFee: filters.maxEntryFee,
        type: filters.type,
        accessibility: filters.accessibility
      })
    })
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
  }, [pageNumber, filters])

  return (
    <div id='Tournaments'>
      <Nav />
      <Sidebar
        setFilters={setFilters}
      />
      <Content
        tournaments={tournaments}
      />
      {hasMore && <button onClick={() => { setPageNumber(pageNumber + 1) }} className="loadMore">Load More</button>}
    </div>
  )
}

export default App