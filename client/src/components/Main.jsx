import "../styles/Main.css";
import "../styles/App.css";
import Carousel from "./Carousel";

import BattleRoyalImage from "../assets/BattleRoyal.jpg"; // Adjust the path if necessary
import bracket from "../assets/bracket.jpg";

function Main() {
  return (
    <div id="main">
      <div className="about">
        <h1> YOUR JOYFUL LIFE BEGINS HERE</h1>
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
        {/* <p className="slogan">This is our slogan.</p> */}
      </div>
      <br></br>
      <div className="banners">
        <div className="banner">
          <a href="index.html">
            <img src={bracket} alt="Bracket Tournament" />
          </a>
        </div>
        <div className="banner">
          <a href="index.html">
            <img
              src={BattleRoyalImage}
              alt="Battle Royale Tournament"
              width="350px"
            />
          </a>
        </div>
      </div>
      <Carousel
        title="Trending"
        data={[
          {
            UUID: '8930c122-0016-49d9-9437-049bbc7323bf',
            title: "Fortnite FNCS",
            description: "March Solo Cash Cup",
            image: "https://m.media-amazon.com/images/M/MV5BOGY3ZjM3NWUtMWNiMi00OTcwLWIxN2UtMjNhMDhmZWRlNzRkXkEyXkFqcGdeQXVyNjMxNzQ2NTQ@._V1_.jpg"
          },
          {
            UUID: '4a265b77-fd44-47ca-a3b9-6238454e0f6d',
            title: "Counter Strike Gold Championship",
            description: "The highly anticipated annual tournament",
            image: "https://static.displate.com/857x1200/displate/2023-06-12/6e217abc7f5bb5d0dc56e68752193a11_5c51574f5f2f216f9ef25a0d08fa6400.jpg"
          }, 
          {
            UUID: '0c431807-b67f-4f7f-a2d0-89c062935074',
            title: "Tennis Skirmish Casual",
            description: "BBQ after!",
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/2013_Australian_Open_-_Guillaume_Rufin.jpg/800px-2013_Australian_Open_-_Guillaume_Rufin.jpg"
          }, 
        ]}
      />
    </div>
  );
}

export default Main;
