/* eslint-disable react/prop-types */
import Nav from '/src/components/Nav.jsx'

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import './Manage.css'
import pencil from '/src/assets/pencil.svg'

function Manage() {

  const { UUID } = useParams();

  const navigate = useNavigate();

  const [tournament, setTournament] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchTournamentData = async () => {
    const URL = `http://localhost:2000/api/tournement/tournament/manage`
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
      <>
        { tournament.hasStarted
        ? <div className="pencil-placeholder"></div>
        : <img className='pencil' src={pencil} onClick={onclick} />
        }
      </>
    )
  }

  const handleEditTitle = async () => {
    const newTitle = document.getElementById('newTitle').value;
    const popup = document.getElementById('editTitlePopup');
    popup.remove();

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

  const handleEditTitleInputChange = () => {
    const newTitle = document.getElementById('newTitle').value;
    if (newTitle.length < 3) {
      document.querySelector('#editTitlePopup .error').innerText = 'Title must be at least 3 characters long';
      document.getElementById('newTitle').value = '';
    } else {
      document.querySelector('#editTitlePopup .error').innerText = '';
    }
  }

  const showEditTitlePopup = () => {
    let popup = document.createElement('div');
    popup.id = 'editTitlePopup';
    popup.classList.add('popup');

    let h2 = document.createElement('h2');
    h2.innerHTML = 'Edit Title';
    let input = document.createElement('input');
    input.type = 'text';
    input.id = 'newTitle';
    input.onchange = handleEditTitleInputChange
    let button = document.createElement('button');
    button.innerHTML = 'Confirm';
    button.onclick = handleEditTitle;
    let cancel = document.createElement('button');
    cancel.innerHTML = 'Cancel';
    cancel.onclick = () => popup.remove();
    let error = document.createElement('span')
    error.classList.add('error')

    popup.appendChild(h2);
    popup.appendChild(input);
    popup.appendChild(button);
    popup.appendChild(cancel);
    popup.appendChild(error);

    document.getElementById('Manage').appendChild(popup);
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

  const handleEditStartDate = async () => {
    const newStartDate = document.getElementById('newStartDate').value;
    const popup = document.getElementById('editStartDatePopup');
    popup.remove();

    if (newStartDate) {
      const URL = `http://localhost:2000/api/tournement/tournament/editStartDate`
      await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          UUID: UUID,
          startDate: newStartDate,
        }),
      })
      .then((res) => {
        if (res.ok) {
          navigate(0)
        }
      })
    }
  }

  const handleEditStartDateInputChange = () => {
    const newStartDate = document.getElementById('newStartDate').value;
    // make sure the date is in the future
    if (new Date(newStartDate) < new Date()) {
      document.querySelector('#editStartDatePopup .error').innerText = 'Start date must be in the future';
      document.getElementById('newStartDate').value = '';
    }

    // make sure the date is before the end date
    if (new Date(newStartDate) > new Date(tournament.endDate)) {
      document.querySelector('#editStartDatePopup .error').innerText = 'Start date must be before the end date';
      document.getElementById('newStartDate').value = '';
    }

    // clear error message if date is valid
    if (new Date(newStartDate) > new Date() && new Date(newStartDate) < new Date(tournament.endDate)) {
      document.querySelector('#editStartDatePopup .error').innerText = '';
    }
  }


  const showEditStartDatePopup = () => {
    let popup = document.createElement('div');
    popup.id = 'editStartDatePopup';
    popup.classList.add('popup');

    let h2 = document.createElement('h2');
    h2.innerHTML = 'Edit Start Date';
    let input = document.createElement('input');
    input.type = 'datetime-local';
    input.id = 'newStartDate';
    input.onchange = handleEditStartDateInputChange
    let button = document.createElement('button');
    button.innerHTML = 'Confirm';
    button.onclick = handleEditStartDate;
    let cancel = document.createElement('button');
    cancel.innerHTML = 'Cancel';
    cancel.onclick = () => popup.remove();
    let error = document.createElement('span')
    error.classList.add('error')

    popup.appendChild(h2);
    popup.appendChild(input);
    popup.appendChild(button);
    popup.appendChild(cancel);
    popup.appendChild(error);

    document.getElementById('Manage').appendChild(popup);
  }

  const handleEditEndDate = async () => {
    const newEndDate = document.getElementById('newEndDate').value;
    const popup = document.getElementById('editEndDatePopup');
    popup.remove();

    if (newEndDate) {
      const URL = `http://localhost:2000/api/tournement/tournament/editEndDate`
      await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          UUID: UUID,
          endDate: newEndDate,
        }),
      })
      .then((res) => {
        if (res.ok) {
          navigate(0)
        }
      })
    }
  }

  const handleEditEndDateInputChange = () => {
    const newEndDate = document.getElementById('newEndDate').value;
    // make sure the date is in the future
    if (new Date(newEndDate) < new Date()) {
      document.querySelector('#editEndDatePopup .error').innerText = 'End date must be in the future';
      document.getElementById('newEndDate').value = '';
    }

    // make sure the date is after the start date
    if (new Date(newEndDate) < new Date(tournament.startDate)) {
      document.querySelector('#editEndDatePopup .error').innerText = 'End date must be after the start date';
      document.getElementById('newEndDate').value = '';
    }

    // clear error message if date is valid
    if (new Date(newEndDate) > new Date() && new Date(newEndDate) > new Date(tournament.startDate)) {
      document.querySelector('#editEndDatePopup .error').innerText = '';
    }
  }

  const showEditEndDatePopup = () => {
    let popup = document.createElement('div');
    popup.id = 'editEndDatePopup';
    popup.classList.add('popup');

    let h2 = document.createElement('h2');
    h2.innerHTML = 'Edit End Date';
    let input = document.createElement('input');
    input.type = 'datetime-local';
    input.id = 'newEndDate';
    input.onchange = handleEditEndDateInputChange
    let button = document.createElement('button');
    button.innerHTML = 'Confirm';
    button.onclick = handleEditEndDate;
    let cancel = document.createElement('button');
    cancel.innerHTML = 'Cancel';
    cancel.onclick = () => popup.remove();
    let error = document.createElement('span')
    error.classList.add('error')

    popup.appendChild(h2);
    popup.appendChild(input);
    popup.appendChild(button);
    popup.appendChild(cancel);
    popup.appendChild(error);

    document.getElementById('Manage').appendChild(popup);
  }

  function showButton(event) {
    console.log(event.target)
    let buttons = event.target.querySelectorAll('.buttonsWrapper button')
    Array.from(buttons).forEach(btn => btn.style.display = 'inline-block')
  }
  
  function hideButton(event) {
    console.log(event.target)
    let buttons = event.target.querySelectorAll('.buttonsWrapper button')
    Array.from(buttons).forEach(btn => btn.style.display = 'none')
  }

  // const handleRemoveParticipant = async (event) => {
  //   const participant = event.target.parentElement.parentElement.querySelector('.name').innerText;
  //   const URL = `http://localhost:2000/api/tournement/tournament/removeParticipant`
  //   await fetch(URL, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     credentials: "include",
  //     body: JSON.stringify({
  //       UUID: UUID,
  //       participant: participant,
  //     }),
  //   })
  //   .then((res) => {
  //     if (res.ok) {
  //       navigate(0)
  //     }
  //   })
  // }

  const handleViewApplication = async (event) => {
    let popup = document.createElement('div');
    popup.id = 'viewApplicationPopup';
    popup.classList.add('popup');
    // it should show the application data with a button to accept or reject the application
    // show the application data
    const application = tournament.applications[event.target.parentElement.parentElement.getAttribute('key')];
    console.log(application)

    let h2 = document.createElement('h2');
    h2.innerHTML = 'Application';
    let button = document.createElement('button');
    button.innerHTML = 'Accept';
    let button2 = document.createElement('button');
    button2.innerHTML = 'Reject';
    let cancel = document.createElement('button');
    cancel.innerHTML = 'Cancel';
    cancel.onclick = () => popup.remove();
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
              {/* <h2>Attributes</h2> */}
              <div className="attribute editable title">
                <h3>Title</h3>
                <div className='content'>{tournament.title}</div>
                <EditButton onclick={showEditTitlePopup} />
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
                <EditButton onclick={showEditStartDatePopup} />
              </div>
              <div className="attribute editable endDate">
                <h3>End Date</h3>
                <div className='content'>{formatDate(tournament.endDate)}</div>
                <EditButton onclick={showEditEndDatePopup} />
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
              {/* <div className="attribute editable participants">
                <h3>Participants</h3>
                <div className='content'>
                  {
                    tournament.data.enrolledParticipants.map((participant,i) =>
                      <div className='participant' onMouseEnter={showButton} onMouseLeave={hideButton} key={i}>
                        <span className='name'>
                          {participant.teamName || participant.players[0].username}
                        </span>
                        { !tournament.hasStarted &&
                          <div className="buttonsWrapper">
                            <button className="removeParticipantButton" onClick={handleRemoveParticipant}>Remove</button>
                          </div>
                        } 
                      </div>
                    )
                  }
                </div>
                <div className="pencil-placeholder"></div>
              </div> */}
              <div className="attribute editable participants">
                <h3>Participants</h3>
                <div className='content'>
                  {
                    tournament.data.enrolledParticipants.map((participant,i) =>
                      <div className='participant' key={i}>
                        <span className='name'>
                          {participant.teamName || participant.players[0].username}
                        </span>
                      </div>
                    )
                  }
                </div>
                <div className="pencil-placeholder"></div>
              </div>
              <div className="attribute accessibility">
                <h3>Accessibility</h3>
                <div className='content'>{tournament.accessibility}</div>
                <div className="pencil-placeholder"></div>
              </div>
              {/* <div className="attribute editable applications">
                <h3>Applications</h3>
                <div className='content'>
                  {
                    tournament.applications.map((application,i) =>
                      <div className='application' onMouseEnter={showButton} onMouseLeave={hideButton} key={i}>
                        <span className='name'>
                          {application.teamName || application.players[0].username}
                        </span>
                        <div className="buttonsWrapper">
                          <button className="viewApplicationButton" onClick={handleViewApplication}>View</button>
                        </div>
                      </div>
                    )
                  }
                </div>
                <div className="pencil-placeholder"></div>
              </div> */}
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