/* eslint-disable react/prop-types */
import Tournament from './Tournament';
import { useCallback, useEffect } from 'react';

const URL = 'http://localhost:2000/api/tournement/'

function Content({tournaments, setTournaments, filters, setFilters, filteredTourneys, setFilteredTourneys}) {

  const fetchData = useCallback(async () => {
    const response = await fetch(URL)
    .then(res => res.json())
    .then(data => setTournaments(data))
    return response
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div id="content">
      <h1>Tournaments</h1>
      <div id="tournaments">{filteredTourneys.map((tourney) => <Tournament key={tourney.UUID} obj={tourney} />)}</div>
    </div>
  )
}

export default Content