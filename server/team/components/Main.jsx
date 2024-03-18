import Suggest from './Suggest'
import Display from './Display'

function Main(props) {
  return (
    <>
      <div id="main">
        { (props.loadingTeams) ? <Loading /> : <Content teams={props.teams} /> }
      </div>
    </>
  )
}

function Loading() {
  return (
    <h1>LOADING ...</h1>
  )
}

function Content(props) {
  return (
    <>
      { (Array.from(props.teams).length > 0) ? <Display teams={props.teams} /> : <Suggest teams={props.teams} /> }
    </>
   
  )
}

export default Main