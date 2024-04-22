import { useEffect, useState } from "react";
import Carousel from "./Carousel";
import { Link } from "react-router-dom";

function Main() {

  const [trendingTournaments, setTrendingTOurnaments] = useState([])

  const getTrendingTournaments = async () => {

    const URL = 'http://localhost:2000/api/tournement/getTrendingTournaments';
    await fetch(URL)
    .then((res) => res.json())
    .then((data) => {
      console.log(data)
      setTrendingTOurnaments(data)
    })
  }

  useEffect(() => {
    getTrendingTournaments();
  }, []);

  return (
    <div id="main">
      <div className="about">
        <h1>YOUR COMPETITIVE EXPERIENCE BEGINS HERE</h1>
        <p>
          Welcome to our exciting tournament website! Here, you'll enter a world
          of fierce competition and thrilling battles. Our platform is designed
          to bring together passionate gamers from all corners of the globe,
          where they can showcase their skills and vie for glory. With a vast
          array of tournaments spanning different genres and platforms, there's
          something for everyone. Immerse yourself in the exhilarating
          atmosphere as you challenge opponents, strategize, and push your
          limits to claim victory. Stay up-to-date with the latest schedules,
          rankings, and results, and connect with fellow gamers in a vibrant
          community. Join us on this electrifying journey and let the games
          begin!
        </p>
      </div>
      <div id='suggest-join'>
        <div className="description">
          <h2>Bracket Tournaments</h2>
          <span>Random description of bracket tournaments to entice the user to click on the button on the right</span>
        </div>
        <Link to={'/tournaments'} className="browseBtn">BROWSE</Link>
        <div className="description">
          <h2>Battle Royale Tournaments</h2>
          <span>Random description of battle Royale tournaments to entice the user to click on the button on the right</span>
        </div>
      </div>
      <Carousel
        title="Trending"
        data={trendingTournaments}
      />
    </div>
  );
}

export default Main;
