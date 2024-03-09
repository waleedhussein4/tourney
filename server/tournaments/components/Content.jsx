/* eslint-disable react/prop-types */
import Tournament from './Tournament';
import { useCallback, useEffect } from 'react';

const URL = ' https://api.npoint.io/62625fd6706d67650348'

function Content({tournaments, setTournaments, filters, setFilters, filteredTourneys, setFilteredTourneys}) {

  const fetchData = useCallback(async () => {
    const response = await fetch(URL)
    .then(res => res.json())
    .then(data => {
      setTournaments(data)
      setFilteredTourneys(data)
    })
    .then(() => console.log)
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