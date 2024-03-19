import './styles/App.css'
import Nav from '/src/components/Nav.jsx'

const url = ''

function App() {

  const fetchTournamentData = async () => {
    await fetch('https://example.com?' + new URLSearchParams({
      foo: 'value',
      bar: 2,
    }))
    .then(res => res.json())
    .then(data => console.log(data))
  }

  fetchTournamentData()

  return (
    <>
      <Nav />
    </>
  )
}

export default App