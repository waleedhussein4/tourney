/* eslint-disable react/prop-types */
import Nav from '/src/components/Nav.jsx'

import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import './Manage.css'
import pencil from '/src/assets/pencil.svg'

function Manage() {

  const { UUID } = useParams();

  const navigate = useNavigate();

  const [tournament, setTournament] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchTournamentData = async () => {
    const URL = `http://localhost:2000/api/tournement/tournament`
    await fetch(
      URL +
        "?" +
        new URLSearchParams({
          UUID: UUID,
        }),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setTournament(data);
        setIsLoading(false);
        console.log(data)
        console.log(data.earnings)
      });
  };

  useEffect(() => {
    fetchTournamentData();
  }, []);

  
  function formatDate(dateString) {
    const date = new Date(dateString);

    // Get month abbreviation
    const monthAbbreviation = date.toLocaleString('default', { month: 'short' });

    // Get day of the month
    const day = date.getDate();

    // Get hour (12-hour format)
    let hour = date.getHours();
    const ampm = hour >= 12 ? 'pm' : 'am';
    hour = hour % 12 || 12; // Convert 0 to 12

    // Get minutes
    const minutes = date.getMinutes();

    // Format the string
    const formattedDate = `${monthAbbreviation} ${day} ${date.getFullYear()} @${hour}:${minutes < 10 ? '0' : ''}${minutes}${ampm}`;

    return formattedDate;
  }

  function EditButton({ onclick }) {
    return (
      <img className='pencil' src={pencil} onClick={onclick} />
    )
  }

  const handleEditTitle = async () => {
    const newTitle = prompt('Enter new title:');

    if (newTitle) {
      const URL = `http://localhost:2000/api/tournement/tournament/editTitle`
      await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          UUID: UUID,
          title: newTitle,
        }),
      })
      .then((res) => {
        if (res.ok) {
          navigate(0)
        }
      })
    }
  }

  const handleEditDescription = async () => {
    const newDescription = prompt('Enter new description:');

    if (newDescription) {
      const URL = `http://localhost:2000/api/tournement/tournament/editDescription`
      await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          UUID: UUID,
          description: newDescription,
        }),
      })
      .then((res) => {
        if (res.ok) {
          navigate(0)
        }
      })
    }
  }

  return (
    <div id="Manage">
      <Nav />
      <div id="container">
        {isLoading
        ? (
          <h1 className="loadingText">Loading tournament ...</h1>
        )
        : (
          <>
            <h1>{`${tournament.title}`}</h1>
            <div className="attributes">
              <h2>Attributes</h2>
              <div className="attribute editable title">
                <h3>Title</h3>
                <div className='content'>{tournament.title}</div>
                <EditButton onclick={handleEditTitle} />
              </div>
              <div className="attribute editable description">
                <h3>Description</h3>
                <div className='content'>{tournament.description}</div>
                <EditButton onclick={handleEditDescription} />
              </div>
              <div className="attribute category">
                <h3>Category</h3>
                <div className='content'>{tournament.category}</div>
                <div className="pencil-placeholder"></div>
              </div>
              <div className="attribute editable startDate">
                <h3>Start Date</h3>
                <div className='content'>{formatDate(tournament.startDate)}</div>
                <EditButton onclick={() => console.log('edit')} />
              </div>
              <div className="attribute editable endDate">
                <h3>End Date</h3>
                <div className='content'>{formatDate(tournament.endDate)}</div>
                <EditButton onclick={() => console.log('edit')} />
              </div>
              <div className="attribute earnings">
                <h3>Earnings</h3>
                <div className='content'>{Object.entries(tournament.earnings).map(([index, value]) => (<div key={index}> {index}: {value} </div>))}</div>
                <div className="pencil-placeholder"></div>
              </div>
              <div className="attribute maxCapacity">
                <h3>Max Capacity</h3>
                <div className='content'>{tournament.maxCapacity}</div>
                <div className="pencil-placeholder"></div>
              </div>
              <div className="attribute editable participants">
                <h3>Participants</h3>
                <div className='content'>{tournament.data.enrolledParticipants.map((participant,i) => <div key={i}>{participant.teamName || participant.players[0].username}</div>)}</div>
                <EditButton onclick={() => console.log('edit')} />
              </div>
              <div className="attribute accessibility">
                <h3>Accessibility</h3>
                <div className='content'>{tournament.accessibility}</div>
                <div className="pencil-placeholder"></div>
              </div>
              <div className="attribute editable applications">
                <h3>Applications</h3>
                <div className='content'>{tournament.applications}</div>
                <EditButton onclick={() => console.log('edit')} />
              </div>
              <div className="attribute editable updates">
                <h3>Updates</h3>
                <div className='content updates-wrapper'>
                  {tournament.updates.map((update, i) => (
                    <div key={i}>
                      <h4>{formatDate(update.date)}</h4>
                      <p>{update.content}</p>
                    </div>
                  ))}
                </div>
                <EditButton onclick={() => console.log('edit')} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Manage