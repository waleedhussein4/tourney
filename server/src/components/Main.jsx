import "../styles/Main.css";
import "../styles/App.css";

// export default Main
import BattleRoyalImage from "../assets/BattleRoyal.jpg"; // Adjust the path if necessary
import bracket from "../assets/bracket.jpg";

function Main() {
  return (
    <div id="main">
      <div className="about">
        <h1> YOUR JOYFULL LIFE BEGINS WITH US!</h1>
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
    </div>
  );
}

export default Main;
