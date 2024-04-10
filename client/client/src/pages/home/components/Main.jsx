import Carousel from "./Carousel";
import BattleRoyalImage from "/src/assets/BattleRoyal.jpg";
import bracket from "/src/assets/bracket.jpg";

function Main() {
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
      <br></br>
      {/* <div className="banners">
        <div className="banner">
          <a href="/tournaments/?type=Brackets">
            <img src={bracket} alt="Bracket Tournament" />
          </a>
        </div>
        <div className="banner">
        <a href="/tournaments/?type=Battle Royale">
            <img
              src={BattleRoyalImage}
              alt="Battle Royale Tournament"
              width="350px"
            />
          </a>
        </div>
      </div> */}
      <input id='temp' type="text" placeholder="Search..." />
      <div id='suggest-join'>
        <div className="text">
          <h2>Bracket Tournaments</h2>
          <span>Random description of bracket tournaments to entice the user to click on the button on the right</span>
          <h2>Battle Royale Tournaments</h2>
          <span>Random description of battle Royale tournaments to entice the user to click on the button on the right</span>
        </div>
        <button>BROWSE TOURNEYS</button>
      </div>
      <Carousel
        title="Trending"
        data={[
          {
            UUID: '89b72cfe-0b87-4395-8230-8e8e1f571cb7',
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
          {
            UUID: '018a76ca-ae36-46f5-96e6-d3d2a13e17a1',
            title: "League of Legends Practice",
            description: "Casual games for training",
            image: "https://cdn1.epicgames.com/offer/24b9b5e323bc40eea252a10cdd3b2f10/EGS_LeagueofLegends_RiotGames_S2_1200x1600-905a96cea329205358868f5871393042"
          },
          {
            UUID: '12360807-b081-48da-8546-d2f7fd4b0e6f',
            title: "Football Junior U18 Cup",
            description: "Local football tournament, hosted by IC",
            image: "https://upload.wikimedia.org/wikipedia/commons/4/42/Football_in_Bloomington%2C_Indiana%2C_1995.jpg"
          },
          {
            UUID: 'ac809167-d0bb-4dfb-85f6-04704da9edc9',
            title: "Basketball Freethrow Games",
            description: "Basketball minigames with a high reward",
            image: "https://static.owayo-cdn.com/newhp/img/magazin/basketballstatistikEN/basketball-statistics-670.jpg"
          },
          {
            UUID: 'c7c0f4e8-849e-4c5d-ace7-946c92147af5',
            title: "Valorant Scouting Skirmish",
            description: "Prove your worth in this official pro tournament",
            image: "https://m.media-amazon.com/images/M/MV5BNmNhM2NjMTgtNmIyZC00ZmVjLTk4YWItZmZjNGY2NThiNDhkXkEyXkFqcGdeQXVyODU4MDU1NjU@._V1_FMjpg_UX1000_.jpg"
          },
          {
            UUID: '62d2dc82-5664-4e0f-8cf5-3634a84ab27a',
            title: "League of Legends World Cup",
            description: "Join the greatest teams in LoL history",
            image: "https://cdn1.epicgames.com/offer/24b9b5e323bc40eea252a10cdd3b2f10/EGS_LeagueofLegends_RiotGames_S2_1200x1600-905a96cea329205358868f5871393042"
          },
          {
            UUID: 'a5db7a62-3f62-485e-a83d-1d66f13ea9f8',
            title: "CS2 Rookie Cup",
            description: "The starting point of all beginners",
            image: "https://static.displate.com/857x1200/displate/2023-06-12/6e217abc7f5bb5d0dc56e68752193a11_5c51574f5f2f216f9ef25a0d08fa6400.jpg"
          },  
          {
            UUID: 'ab878297-d793-4595-af2e-7661aecc42ef',
            title: "Tennis Olympics",
            description: "Spectate the greatest annual tennis competition",
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/2013_Australian_Open_-_Guillaume_Rufin.jpg/800px-2013_Australian_Open_-_Guillaume_Rufin.jpg"
          }, 
        ]}
      />
    </div>
  );
}

export default Main;
