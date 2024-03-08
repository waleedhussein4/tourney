/* eslint-disable react/prop-types */
import { createRoot } from 'react-dom/client';
import Tournament from './Tournament';
import { useCallback, useEffect } from 'react';

const URL = ' https://api.npoint.io/62625fd6706d67650348'

function Content({tournaments, setTournaments}) {
  
  useEffect(() => {
    renderTournaments(tournaments)
  },[tournaments])

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
      <div id="tournaments"></div>
    </div>
  )
}

function renderTournaments(tournaments) {

  if(tournaments == undefined) return

  const arrayDataItems = tournaments.map((tourney) => <Tournament key={tourney.UUID} obj={tourney} />)
  let tournamentsContainer = document.getElementById('tournaments')

  const domNode = tournamentsContainer
  const root = createRoot(domNode)
  root.render(arrayDataItems)
}

export default Content