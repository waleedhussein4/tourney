import { useState, useEffect } from 'react';

import './styles/Tournaments.css'
import { Nav } from '/src/components/layout/Nav.jsx'
import Sidebar from './components/Sidebar.jsx'
import Content from './components/Content.jsx'
import { listTournaments } from '/src/api/tournaments.js'

function App() {

  const [tournaments, setTournaments] = useState([])
  const [filters, setFilters] = useState()
  const [pageNumber, setPageNumber] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // "All"/"Any" are the form's way of saying "no filter", and an empty string is
  // an empty box — neither belongs in the query string.
  const toQuery = () => {
    const query = { page: pageNumber, limit: 12 }
    if (filters.search) query.search = filters.search
    if (filters.category && filters.category !== 'All') query.category = filters.category
    if (filters.type && filters.type !== 'Any') query.type = filters.type.toLowerCase()
    if (filters.accessibility && filters.accessibility !== 'Any') {
      query.accessibility = filters.accessibility.toLowerCase()
    }
    if (filters.minEntryFee) query.minEntryFee = filters.minEntryFee
    if (filters.maxEntryFee) query.maxEntryFee = filters.maxEntryFee
    return query
  }

  const fetchPaginatedData = async () => {
    if (!filters) return

    const data = await listTournaments(toQuery())
    const page = data.tournaments.map((tournament) => ({
      ...tournament,
      UUID: tournament.id,
    }))

    // Page 1 is always a fresh result set. The original appended every time, so
    // changing a filter added its results to the ones it was meant to replace.
    setTournaments((current) => (pageNumber === 1 ? page : [...current, ...page]))
    setHasMore(pageNumber < data.pagination.pages)
  }

  useEffect(() => {
    fetchPaginatedData()
  }, [pageNumber, filters])

  // A new filter set starts again from the first page.
  useEffect(() => {
    setPageNumber(1)
    setHasMore(true)
  }, [filters])

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