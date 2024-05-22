import { useEffect, useState, useContext } from "react";
import Carousel from "./Carousel";
import { Link } from "react-router-dom";
import { AuthContext } from "/src/context/AuthContext";

function Main() {
  const [trendingTournaments, setTrendingTournaments] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [bracketDescription, setBracketDescription] = useState("");
  const [battleRoyaleDescription, setBattleRoyaleDescription] = useState("");

  const { loggedIn } = useContext(AuthContext)

  const getTrendingTournaments = async () => {
    const URL = `${import.meta.env.VITE_BACKEND_URL}/api/tournement/getTrendingTournaments`;
    await fetch(URL)
    .then((res) => res.json())
    .then((data) => {
      setTrendingTournaments(data);
    });
  }

  const getMyTournaments = async () => {
    const URL = `${import.meta.env.VITE_BACKEND_URL}/api/tournement/getMyTournaments`;
    await fetch(URL,
      {
        credentials: 'include',
      })
    .then((res) => res.json())
    .then((data) => {
      setMyTournaments(data);
    });
  }
  
  useEffect(() => {
    getTrendingTournaments();
    try {
      getMyTournaments();
    }
    catch (e) {
      console.log(e);
    }
  }, []);


  const fetchDescriptions = async () => {
    const mockBracketDescription = "Experience organized competition at its finest with our bracket tourneys, showcasing skillful matchups and strategic gameplay.";
    const mockBattleRoyaleDescription = "Embark on thrilling survival challenges in our battle royale tourneys, where only the most skilled emerge victorious in intense showdowns.";
    setBracketDescription(mockBracketDescription);
    setBattleRoyaleDescription(mockBattleRoyaleDescription);
  }

  useEffect(() => {
    fetchDescriptions();
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
      <div className="tournament-container">
        <div className="bracket">
          <div className="description">
            <h2>Bracket Tourneys</h2>
            <p>{bracketDescription}</p>
          </div>
        </div>
        <div className="battle-royale">
          <div className="description">
            <h2>Battle Royale Tourneys</h2>
            <p>{battleRoyaleDescription}</p>
          </div>
        </div>
      </div>
      <div className="browse-container">
        <Link to={'/tournaments'} className="browseBtn">BROWSE</Link>
      </div>
        <Carousel
         title="Trending"
         data={trendingTournaments}
        />
        {loggedIn && myTournaments.length > 0 && <Carousel
          title="My Tournaments"
          data={myTournaments}
        />}
      </div>
  );
}

export default Main;
