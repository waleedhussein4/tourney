/* eslint-disable react/prop-types */
import { createRoot } from 'react-dom/client';
import Tournament from './Tournament';
import { useCallback, useEffect } from 'react';

const URL = ' https://api.npoint.io/62625fd6706d67650348'
var domNode
var root

function Content({tournaments, setTournaments, filters, setFilters, filteredTourneys, setFilteredTourneys}) {
  
  // useEffect(() => {
  //   if(tournaments) {
  //     renderTournaments(tournaments)
  //   }
  //   console.log('tournaments updated')
  // },[tournaments])

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
    // createTournamentsContainerRoot()
    fetchData()
  }, [])

  return (
    <div id="content">
      <h1>Tournaments</h1>
      <div id="tournaments">{filteredTourneys.map((tourney) => <Tournament key={tourney.UUID} obj={tourney} />)}</div>
    </div>
  )
}

// function createTournamentsContainerRoot() {
//   let tournamentsContainer = document.getElementById('tournaments')
//   domNode = tournamentsContainer
//   root = createRoot(domNode)
// }

// function renderTournaments(tournaments) {

//   if(tournaments == undefined) return

//   const arrayDataItems = tournaments.map((tourney) => <Tournament key={tourney.UUID} obj={tourney} />)

//   root.render(arrayDataItems)
// }

export default Content