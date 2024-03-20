import './styles/App.css'
import Nav from '/src/components/Nav.jsx'

const url = ''

function Tournament() {

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
    <div id='Tournament'> 
      <Nav />
    </div>
  )
}

export default Tournament