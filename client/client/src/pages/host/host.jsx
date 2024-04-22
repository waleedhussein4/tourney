import React, { useState, useRef, useEffect } from "react";
import "./app.css";
import Nav from "../../components/Nav";

export default function Host() {
  const [isDisplayed, setIsDisplayed] = useState(false);
  const [btnIsDisplayed, setBtnIsDisplayed] = useState(true);
  const [specIsDisplayed, setSpecIsDisplayed] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [typeSpec, setTypeSpec] = useState(false);
  const [describeVal , setDescribeVal] = useState('');
  const [describeError , setDescribeError] = useState(false);
  const describeRef = useRef(null);
  const [selectedGame, setSelectedGame] = useState("");
  const [soloOrTeam, setSoloOrTeam] = useState("");
  const [stringPerTeam, setStringPerTeam] = useState("");
  const [inputPrizes, setInputPrizes] = useState([]);
  const [rankCounter, setRankCounter] = useState(1);
  const [numberOfBrackets, setNumberOfBrackets] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const maxParticipantsRef = useRef(null);
  const [entryFee , setEntryFee] = useState('');
  const [entryFeeError , setEntryFeeError]=useState(false);
  const entryFeeRef = useRef(null);
  const [winnerPrize , setWinnerPrize]=useState("");
  const [winnerPrizeError , setWinnerPrizeError]=useState(false);
  const winnerPrizeRef = useRef(null);
  const [isValidated, setIsValidated] = useState(true);
  const [selectedEntryMode, setSelectedEntryMode] = useState("");
  const [additionalInfoRequired, setAdditionalInfoRequired] = useState(false);
  const [additionalInfoList, setAdditionalInfoList] = useState([]);
  const [infoCounter, setInfoCounter] = useState(1);
  const additionalInfoRef = useRef(null);
  const [teamTypeError, setTeamTypeError] = useState(false);
  const teamTypeRef = useRef(null);
  const [bracketsError, setBracketsError] = useState(false);
  const bracketRef = useRef(null);
  const [participantsError , setParticipantsError]=useState(false);
  const [selectGameError , setSelectGameError] = useState(false);
  const selectedGameRef = useRef(null);
  const divPrizeRankRef = useRef(null);
  const [selectedEntryError , setSelectedEntryError]= useState(false);
  const handleAddInfo = () => {
    if (infoCounter <= 5) {
      setAdditionalInfoList([...additionalInfoList, <div key={additionalInfoList.length}>* <input type="text" ref={additionalInfoRef} /></div>]);
      setInfoCounter(infoCounter + 1);
    }
  };

  const handleRemoveInfo = () => {
    if (infoCounter >= 2) {
      const newList = [...additionalInfoList];
      newList.pop();
      setAdditionalInfoList(newList);
      setInfoCounter(infoCounter - 1);
    }
  };

  const handleAddRank = () => {
    if (rankCounter <= maxParticipants) {
      if (!isValidated) {
        setIsValidated(true);
      }
      setInputPrizes([
        ...inputPrizes,
        <div key={inputPrizes.length}>
          {rankCounter} <input type="number" placeholder="Enter a prize" />
        </div>,
      ]);
      setRankCounter(rankCounter + 1);
    } else {
      console.log('Rank counter exceeded max number');
      setIsValidated(false);
    }
  };

  const handleRemoveRank = () => {
    if (rankCounter >= 2) {
      const newList = [...inputPrizes];
      newList.pop();
      setInputPrizes(newList);
      setRankCounter(rankCounter - 1);
      if (!isValidated) {
        setIsValidated(true);
      }
    }
  };
  
  
  const handleClick = () => {
    if (!isDisplayed) {
      setIsDisplayed(true);
    }
    if (btnIsDisplayed) {
      setBtnIsDisplayed(false);
    }
  };
  const handleDescribeChange=(event)=>{
   setDescribeVal(event.target.value);
   setDescribeError(false);
   describeRef.current.style.border = "";
  }

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
    setTypeSpec(event.target.value === "Bracket");
    setSpecIsDisplayed(true);
  };

  const handleSelectChange = (event) => {
    setSelectedGame(event.target.value);
    setSelectGameError(false);
   selectedGameRef.current.style.border = "";
  };

  const handleNbBracketsChange = (event) => {
    setNumberOfBrackets(event.target.value);
    setBracketsError(false);
    bracketRef.current.style.border = "";
  };

  const handleTeamChange = (event) => {
    setSoloOrTeam(event.target.value);
    setTeamTypeError(false);
    teamTypeRef.current.style.border = '';
    if (event.target.value !== "solo") {
      setStringPerTeam("(per team)");
    } else {
      setStringPerTeam("");
    }
  };

  const handleMaxParticipants = (event) => {
    setMaxParticipants(event.target.value);
    setParticipantsError(false);
    maxParticipantsRef.current.style.border = "";
  };

  useEffect(() => {
    if (!isValidated) {
      maxParticipantsRef.current.style.border = '2px solid red';
      const timer = setTimeout(() => {
        maxParticipantsRef.current.style.border = '';
      }, 4000);
    } else {
      maxParticipantsRef.current.style.border = '';
    }
  }, [isValidated]);
  const handleEntryFeeChange = (event)=>{
     setEntryFee(event.target.value);
     setEntryFeeError(false);
     entryFeeRef.current.style.border='';
  }
  const handleWinningPrize = (event)=>{
    setWinnerPrize(event.target.value);
    setWinnerPrizeError(false);
    winnerPrizeRef.current.style.border='';
  }

  const handleEntry = (event) => {
    setSelectedEntryMode(event.target.value);
    setAdditionalInfoRequired(event.target.value === "Application Required");
    setSelectedEntryError(false);
  };
  

  const games = [
    { id: 1, name: "Game 1" },
    { id: 2, name: "Game 2" },
    { id: 3, name: "Game 3" },
  ];

  const handleSubmit = (e) => {
    if(describeVal ===""){
      e.preventDefault();
      setDescribeError(true);
      describeRef.current.style.border = '2px solid red';
    }
    if(selectedGame===""){
      e.preventDefault();
      setSelectGameError(true);
      selectedGameRef.current.style.border="2px solid red";
    }
    if (soloOrTeam === "") {
      e.preventDefault();
      setTeamTypeError(true);
      teamTypeRef.current.style.border = '2px solid red';
    }
    
    if (numberOfBrackets === "") {
      setBracketsError(true);
      bracketRef.current.style.border = '2px solid red';
    }
    if(maxParticipants=== ""){
      setParticipantsError(true);
      maxParticipantsRef.current.style.border = "2px solid red";
    }if (numberOfBrackets==="" && maxParticipants==="" ){
      e.preventDefault();
    }
    if(entryFee===""){
      e.preventDefault();
      setEntryFeeError(true);
      entryFeeRef.current.style.border = "2px solid red";
    }
    if(winnerPrize===""){
      setWinnerPrizeError(true);
      winnerPrizeRef.current.style.border = "2px solid red";
    
    }
    if(selectedEntryMode===""){
      e.preventDefault();
      setSelectedEntryError(true);
    }
  };


  return (
    <div id="Host">
      <Nav />
      <div id="container">
        <div className="content-container">
          <h1>Create a Tournament</h1>
          <div id="page-description">
            Create and manage thrilling tournaments on our platform. Choose between classic bracket-style tournaments or action-packed battle royals. Customize rules, seeding, and formats for an unforgettable gaming experience!
          </div>
          <hr className="custom-line" />
          <div id="btnTournament">
            <button
              id="createTournament"
              onClick={handleClick}
              style={{ display: btnIsDisplayed ? "block" : "none" }}
            >
              Press here to create your tournament
            </button>
          </div>
        </div>
        <div id="main" style={{ display: isDisplayed ? "block" : "none" }}>
          <form onSubmit={handleSubmit}>
            <div id="type">
              <h2>Choose tourney type</h2>
              <div id="chooseType">
                <label>
                  Bracket:
                  <input
                    type="radio"
                    id="Bracket"
                    name="type"
                    value="Bracket"
                    checked={selectedType === "Bracket"}
                    onChange={handleTypeChange}
                  />
                </label>
                <label>
                  Battle Royale:
                  <input
                    type="radio"
                    id="battleRoyale"
                    name="type"
                    value="BattleRoyale"
                    checked={selectedType === "BattleRoyale"}
                    onChange={handleTypeChange}
                  />
                </label>
              </div>
            </div>
            <hr className="custom-line" />
            <div id="specification" style={{ display: specIsDisplayed ? 'block' : 'none' }}>
              <div className="form-group">
                <h2>Description:</h2>
              <span id="teamTypeError" style={{ display: describeError ? 'block' : 'none' }}>
                   Please fill out this field</span>
                <textarea ref={describeRef} onChange={handleDescribeChange} value={describeVal} placeholder="Please describe your tournament.
Include any unique rules, what participants can expect, and why they should join. Be as detailed as possible to attract the right participants."></textarea>
              </div>
              <hr
className="custom-line"></hr>
<div className="form-group">
<h2>Choose game:</h2>
<span id="teamTypeError" style={{ display: selectGameError ? 'block' : 'none' }}>
Please fill out this field</span>
<select ref={selectedGameRef} id="selectGame" name="game" defaultValue="" value={selectedGame} onChange={handleSelectChange}>
<option value="" disabled hidden>Select Game</option>
{games.map((game) => (
<option key={game.id} value={game.id}>
{game.name}
</option>
))}
</select>
</div>
<div className="form-group" id="participantNumber" style={{ display: typeSpec ? 'none' : 'block' }}>
<h2>Maximum Number of Participants:</h2>
<span id="teamTypeError" style={{ display: participantsError ? 'block' : 'none' }}>
Please fill out this field
</span>
<input type="number" id="capacity" name="capacity" value={maxParticipants} onChange={handleMaxParticipants} ref={maxParticipantsRef} />
</div>
<div className="form-group" id="bracketNumber" style={{ display: typeSpec ? 'block' : 'none' }}>
<h2>Number of brackets:</h2>
<span id="teamTypeError" style={{ display: bracketsError ? 'block' : 'none' }}>
Please fill out this field
</span>
<select ref={bracketRef} id="selectBracket" name="nbofbrackets" defaultValue="" onChange={handleNbBracketsChange}>
<option value="" disabled hidden>Select a number</option>
<option value="2">2</option>
<option value="4">4</option>
<option value="8">8</option>
<option value="16">16</option>
<option value="32">32</option>
<option value="64">64</option>
<option value="128">128</option>
<option value="256">256</option>
</select>
</div>
<div className="form-group">
<h2>Teams type:</h2>
<span id="teamTypeError" style={{ display: teamTypeError ? 'block' : 'none' }}>
Please fill out this field
</span>
<select ref={teamTypeRef} defaultValue="" onChange={handleTeamChange}>
<option value="" disabled hidden>Select an option</option>
<option value="solo" >solo</option>
<option value="team of 2">team of 2</option>
<option value="team of 3">team of 3</option>
<option value="team of 4">team of 4</option>
<option value="team of 5">team of 5</option>
</select>
</div>
<div className="form-group">
<h2>Entry fee ($) {stringPerTeam}:</h2>
<span id="teamTypeError" style={{ display: entryFeeError ? 'block' : 'none' }}>
                   Please fill out this field</span>
<input type="number" id="entryFee" name="entryFee" value={entryFee} onChange={handleEntryFeeChange} ref={entryFeeRef}/>
</div>
<div className="form-group" style={{ display: typeSpec ? 'block' : 'none' }}>
<h2>Winner Prize:</h2>
<span id="teamTypeError" style={{ display: winnerPrizeError ? 'block' : 'none' }}>
                   Please fill out this field</span>
<input type="number" id="earning" name="earnings" placeholder="Enter a prize" value={winnerPrize} onChange={handleWinningPrize} ref={winnerPrizeRef}/>
</div>
<div ref={divPrizeRankRef} id="form-rank" style={{ display: typeSpec ? 'none' : 'block' }}>
<h2>Prize by rank :</h2>
{inputPrizes.map((input, index) => (
<div key={index}>{input}</div>
))}
<input type="submit" className="submitRank-App" onClick={(event) => { event.preventDefault(); handleAddRank() }} value="Add Rank" />
<input type="submit" className="submitRank-App" onClick={(event) => { event.preventDefault(); handleRemoveRank() }} value="Remove Rank" />
{isValidated ? null : <div id="rankError">if you wish to add more prize rank, you should increase the number of participants above!</div>}
</div>
<div id="form-app">
<h2>Tourney entry mode:</h2>
<span id="teamTypeError" style={{ display: selectedEntryError ? 'block' : 'none' }}>
                   Please fill out this field</span>
<label>
<input type="radio"
id="openField"
name="publicity"
value="Open"
checked={selectedEntryMode === "Open"}
onChange={handleEntry}
/>
Open
</label>
<label>
<input
type="radio"
id="applicationRequired"
name="publicity"
value="Application Required"
checked={selectedEntryMode === "Application Required"}
onChange={handleEntry}
/>
Application Required
</label>
</div>
<div id="form-app" style={{ display: additionalInfoRequired ? 'block' : 'none' }}>
<h4>Please fill in any additional questions or information requests you have for applicants</h4>
{additionalInfoList.map((input, index) => (
<div key={index}>{input}</div>
))}
<input type="submit" className="submitRank-App" onClick={(event) => { event.preventDefault(); handleAddInfo() }} value="Add question/request" />
<input type="submit" className="submitRank-App" onClick={(event) => { event.preventDefault(); handleRemoveInfo() }} value="Remove question/request" />
</div>
<footer>
<input type="submit" value="Create" />
</footer>
</div>
</form>
</div>
</div>
</div>
);
}