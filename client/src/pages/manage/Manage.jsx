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
  const [tournamentType, setTournamentType] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTournamentData = async () => {
    const URL = `${import.meta.env.VITE_BACKEND_URL}/api/tournement/tournament/manage`
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
      .then((res) => {
        if (!res.ok) {
          navigate('/page-not-found')
        }
        return res.json()
      })
      .then((data) => {
        setTournament(data);
        setTournamentType(data.type);
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

  function EditButton({ canBeEditedAfterStart, onclick }) {
    return (
      <>
        {tournament.hasStarted && !canBeEditedAfterStart
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
      const URL = `${import.meta.env.VITE_BACKEND_URL}/api/tournement/tournament/editTitle`
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
    const newDescription = document.getElementById('newDescription').value;
    const popup = document.getElementById('editDescriptionPopup');
    popup.remove();

    const URL = `${import.meta.env.VITE_BACKEND_URL}/api/tournement/tournament/editDescription`
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

  const handleEditDescriptionInputChange = () => {
    return
  }

  const showEditDescriptionPopup = () => {
    let popup = document.createElement('div');
    popup.id = 'editDescriptionPopup';
    popup.classList.add('popup');

    let h2 = document.createElement('h2');
    h2.innerHTML = 'Edit Description';
    let input = document.createElement('input');
    input.type = 'text';
    input.id = 'newDescription';
    input.onchange = handleEditDescriptionInputChange
    let button = document.createElement('button');
    button.innerHTML = 'Confirm';
    button.onclick = handleEditDescription;
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

  const handleEditStartDate = async () => {
    const newStartDate = document.getElementById('newStartDate').value;
    const popup = document.getElementById('editStartDatePopup');
    popup.remove();

    if (newStartDate) {
      const URL = `${import.meta.env.VITE_BACKEND_URL}/api/tournement/tournament/editStartDate`
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
      const URL = `${import.meta.env.VITE_BACKEND_URL}/api/tournement/tournament/editEndDate`
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

  const showPostUpdatePopup = () => {
    let popup = document.createElement('div');
    popup.id = 'postUpdatePopup';
    popup.classList.add('popup');

    let h2 = document.createElement('h2');
    h2.innerHTML = 'Post Update';
    let input = document.createElement('input');
    input.type = 'text';
    input.id = 'newUpdate';
    let button = document.createElement('button');
    button.innerHTML = 'Confirm';
    button.onclick = handlePostUpdate;
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

  const handlePostUpdate = async () => {
    const newUpdate = document.getElementById('newUpdate').value;
    if (newUpdate.length < 1) {
      document.querySelector('#postUpdatePopup .error').innerText = 'You must enter an update';
      return
    }

    const popup = document.getElementById('postUpdatePopup');
    popup.remove();

    if (newUpdate) {
      const URL = `${import.meta.env.VITE_BACKEND_URL}/api/tournement/tournament/postUpdate`
      await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          UUID: UUID,
          update: newUpdate,
        }),
      })
        .then((res) => {
          if (res.ok) {
            navigate(0)
          }
        })
    }
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

  const handleViewApplication = async (event) => {
    let popup = document.createElement('div');
    popup.id = 'viewApplicationPopup';
    popup.classList.add('popup');

    const parent = event.target.parentElement.parentElement
    const application = tournament.applications.map(app => app.UUID === parent.dataset.uuid ? app : null).filter(app => app !== null)[0]
    console.log(application)

    let h2 = document.createElement('h2');
    h2.innerHTML = 'Application';
    let button = document.createElement('button');
    button.innerHTML = 'Accept';
    button.onclick = () => handleAcceptApplication(event);
    let button2 = document.createElement('button');
    button2.innerHTML = 'Reject';
    button2.onclick = () => handleRejectApplication(event);
    let cancel = document.createElement('button');
    cancel.innerHTML = 'Cancel';
    cancel.onclick = () => popup.remove();
    let buttons = document.createElement('div');
    buttons.classList.add('buttons');
    buttons.appendChild(button);
    buttons.appendChild(button2);
    buttons.appendChild(cancel);

    let content = document.createElement('div');
    content.classList.add('content');
    content.innerHTML = `
      <p>${application.teamName}</p>
      <ul>
        ${application.application.map(app => `<li>${app.label}: ${app.input}</li>`).join('')}
      </ul>
    `
    popup.appendChild(h2);
    popup.appendChild(content)
    popup.appendChild(buttons);
    document.getElementById('Manage').appendChild(popup);
  }

  const handleAcceptApplication = async (event) => {
    const parent = event.target.parentElement.parentElement
    const application = tournament.applications.map(app => app.UUID === parent.dataset.uuid ? app : null).filter(app => app !== null)[0]
    const uuid = application.UUID
    const URL = `${import.meta.env.VITE_BACKEND_URL}/api/tournement/tournament/acceptApplication`
    await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        tournamentUUID: UUID,
        applicationUUID: uuid,
      }),
    })
      .then((res) => {
        if (res.ok) {
          navigate(0)
        }
      })
  }

  const handleRejectApplication = async (event) => {
    const parent = event.target.parentElement.parentElement
    const application = tournament.applications.map(app => app.UUID === parent.dataset.uuid ? app : null).filter(app => app !== null)[0]
    const uuid = application.UUID
    const URL = `${import.meta.env.VITE_BACKEND_URL}/api/tournement/tournament/rejectApplication`
    await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        tournamentUUID: UUID,
        applicationUUID: uuid,
      }),
    })
      .then((res) => {
        if (res.ok) {
          navigate(0)
        }
      })
  }

  const SoloParticipants = () => {
    return (
      <>
        {
          tournament.enrolledUsers.map((participant, i) =>
            <div className='participant' key={i}>
              <span className='name'>
                {participant.username}
              </span>
              <span className="score">
                Score: {participant.score}
              </span>
              <span className="eliminationStatus">
                {participant.eliminated ? 'Eliminated' : 'Active'}
              </span>
            </div>
          )
        }
      </>
    )
  }

  const TeamParticipants = () => {
    return (
      <>
        {
          tournament.enrolledTeams.map((team, i) =>
            <div className='participant' key={i}>
              <span className='name'>
                {team.teamName}
              </span>
              <span className="score">
                Score: {team.score}
              </span>
              <span className="eliminationStatus">
                {team.eliminated ? 'Eliminated' : 'Active'}
              </span>
            </div>
          )
        }
      </>
    )
  }

  const showEditSoloParticipantsPopup = () => {
    let popup = document.createElement('div');
    popup.id = 'editParticipantsPopup';
    popup.classList.add('popup');

    let h2 = document.createElement('h2');
    h2.innerHTML = 'Edit Participants';

    const participantsContainer = document.createElement('div');
    participantsContainer.classList.add('participants-container');

    tournament.enrolledUsers.forEach(user => {
      const participantDiv = document.createElement('div');
      participantDiv.classList.add('participant');

      const nameDiv = document.createElement('div');
      nameDiv.classList.add('participant-name');
      nameDiv.textContent = user.username;

      const infoDiv = document.createElement('div');
      infoDiv.classList.add('participant-info');
      infoDiv.textContent = `Score: ${user.score}, Eliminated: ${user.eliminated ? 'Yes' : 'No'}`;

      const editButton = document.createElement('button');
      editButton.textContent = 'Edit';
      editButton.classList.add('edit-button');
      editButton.onclick = () => editSolo(user);


      participantDiv.appendChild(nameDiv);
      participantDiv.appendChild(infoDiv);
      participantDiv.appendChild(editButton);

      participantsContainer.appendChild(participantDiv);
    });

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.classList.add('confirm-button');
    confirmButton.onclick = () => handleEditSoloParticipants();

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.classList.add('cancel-button');
    cancelButton.onclick = () => popup.remove();

    popup.appendChild(h2);
    popup.appendChild(participantsContainer);
    popup.appendChild(confirmButton);
    popup.appendChild(cancelButton);

    document.getElementById('Manage').appendChild(popup);
  }

  const handleEditSoloParticipants = async () => {
    const popup = document.getElementById('editParticipantsPopup');
    popup.remove();

    const URL = `${import.meta.env.VITE_BACKEND_URL}/api/tournement/editSoloParticipants`
    await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        UUID: UUID,
        participants: tournament.enrolledUsers,
      }),
    })
      .then((res) => {
        if (res.ok) {
          navigate(0)
        }
      })
  }

  function editSolo(user) {
    // Here you can implement your logic to edit the user's score and elimination status
    const newScore = prompt(`Enter new score for ${user.username}:`, user.score);
    const newEliminated = confirm(`Is ${user.username} eliminated?`);

    // Update user object with new values
    user.score = parseInt(newScore);
    user.eliminated = newEliminated;

    // remove the popup
    document.getElementById('editParticipantsPopup').remove();

    // Re-render users with updated data
    showEditSoloParticipantsPopup();
  }

  const handleEditTeamParticipants = async () => {
    const popup = document.getElementById('editParticipantsPopup');
    popup.remove();

    const URL = `${import.meta.env.VITE_BACKEND_URL}/api/tournement/editTeamParticipants`
    await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        UUID: UUID,
        participants: tournament.enrolledTeams,
      }),
    })
      .then((res) => {
        if (res.ok) {
          navigate(0)
        }
      })
  }

  function editTeam(team) {
    // Here you can implement your logic to edit the team's score and elimination status
    const newScore = prompt(`Enter new score for ${team.teamName}:`, team.score);
    const newEliminated = confirm(`Is ${team.teamName} eliminated?`);

    // Update team object with new values
    team.score = parseInt(newScore);
    team.eliminated = newEliminated;

    // remove the popup
    document.getElementById('editParticipantsPopup').remove();

    // Re-render teams with updated data
    showEditTeamParticipantsPopup();
  }

  const showEditTeamParticipantsPopup = () => {
    console.log(tournament.enrolledTeams)
    let popup = document.createElement('div');
    popup.id = 'editParticipantsPopup';
    popup.classList.add('popup');

    let h2 = document.createElement('h2');
    h2.innerHTML = 'Edit Participants';

    const teamsContainer = document.createElement('div');
    teamsContainer.classList.add('teams-container');

    tournament.enrolledTeams.forEach(team => {
      const teamDiv = document.createElement('div');
      teamDiv.classList.add('team');

      const nameDiv = document.createElement('div');
      nameDiv.classList.add('team-name');
      nameDiv.textContent = team.teamName;

      const infoDiv = document.createElement('div');
      infoDiv.classList.add('team-info');
      infoDiv.textContent = `Score: ${team.score}, Eliminated: ${team.eliminated ? 'Yes' : 'No'}`;

      const editButton = document.createElement('button');
      editButton.textContent = 'Edit';
      editButton.classList.add('edit-button');
      editButton.onclick = () => editTeam(team);

      teamDiv.appendChild(nameDiv);
      teamDiv.appendChild(infoDiv);
      teamDiv.appendChild(editButton);

      teamsContainer.appendChild(teamDiv);
    });

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.classList.add('confirm-button');
    confirmButton.onclick = () => handleEditTeamParticipants();

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.classList.add('cancel-button');
    cancelButton.onclick = () => popup.remove();

    popup.appendChild(h2);
    popup.appendChild(teamsContainer);
    popup.appendChild(confirmButton);
    popup.appendChild(cancelButton);

    document.getElementById('Manage').appendChild(popup);
  }

  const Applications = () => {
    if (tournament.applications.length === 0) {
      return <span>No applications yet</span>
    }
    return (
      tournament.applications.map((application, i) =>
        <div data-uuid={application.UUID} className={`application ${application.UUID}`} onMouseEnter={showButton} onMouseLeave={hideButton} key={i}>
          <span className='name'>
            {application.teamName || application.username}
          </span>
          <div className="buttonsWrapper">
            <button className="viewApplicationButton" onClick={handleViewApplication}>View</button>
            <button className="acceptApplicationButton" onClick={handleAcceptApplication}>Accept</button>
            <button className="rejectApplication" onClick={handleRejectApplication}>Reject</button>
          </div>
        </div>
      )
    )
  }

  const Updates = () => {
    if (tournament.updates.length === 0) {
      return <span>No updates yet</span>
    }
    return (
      tournament.updates.map((update, i) => (
        <div key={i}>
          <h4>{formatDate(update.date)}</h4>
          <p>{update.content}</p>
        </div>
      ))
    )
  }

  const MatchesEditor = () => {

    var matchesInFirstRound = Math.ceil(Math.max(tournament.enrolledTeams?.length / 2, tournament.enrolledUsers?.length / 2));
    var totalMatches = matchesInFirstRound;

    const teamsEnrolledYet = matchesInFirstRound > 0

    // Calculate the total number of matches
    while (matchesInFirstRound > 1) {
      matchesInFirstRound = Math.ceil(matchesInFirstRound / 2);
      totalMatches += matchesInFirstRound;
    }

    console.log('totalMatches: ', totalMatches)
    console.log(totalMatches)
    let matches = tournament.matches
    for (let i = 0; i < totalMatches; i++) {
      if (matches[i] === undefined) {
        matches[i] = 'n/a'
      }
    }

    const [editedMatches, setEditedMatches] = useState([...tournament.matches]);

    const handleEdit = (index) => {
      const newEditedMatches = [...editedMatches];
      const editedMatch = prompt('Edit the string:', editedMatches[index]);
      if (editedMatch !== null) {
        newEditedMatches[index] = editedMatch;
        setEditedMatches(newEditedMatches);
      }
    };

    const handleSaveAll = async () => {
      // Implement logic to save all edited strings
      console.log('Save all edited strings:', editedMatches);

      const URL = `${import.meta.env.VITE_BACKEND_URL}/api/tournement/editMatches`
      await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          UUID: UUID,
          matches: editedMatches,
        }),
      })
        .then((res) => {
          if (res.ok) {
            navigate(0)
          }
          else {
            res.json().then(data => {
              document.querySelector('#matchesEditor .error').innerText = data.error
            })
          }
        })
    };

    return (
      <div id='matchesEditor' className='attribute'>
        <h3>Match Winners</h3>
        {!teamsEnrolledYet && <span>You will be able to access the match editor and manage rounds after users have joined your tournament.</span>}
        <div className="matches">
          {
            editedMatches.map((match, i) =>
              <div className='match' key={i}>
                <span className="matchNumber">Match {i}</span>
                <span className="matchWinner">{match}</span>
                <button onClick={() => handleEdit(i)}>Edit</button>
              </div>
            )
          }
        </div>
        {teamsEnrolledYet && <button onClick={handleSaveAll}>Save All</button>}
        <span className="error"></span>
      </div>
    )
  }

  const startTournament = async () => {
    const URL = `${import.meta.env.VITE_BACKEND_URL}/api/tournement/startTournament`
    await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        UUID: UUID,
      }),
    })
      .then((res) => {
        if (res.ok) {
          navigate(0)
        }
        else {
          return res.json()
        }
      })
      .then((data) => {
        console.log(data)
        document.querySelector('.controlButtons .error').innerText = data.error
      })
  }

  const endTournament = async () => {
    const URL = `${import.meta.env.VITE_BACKEND_URL}/api/tournement/endTournament`
    await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        UUID: UUID,
      }),
    })
      .then((res) => {
        if (res.ok) {
          navigate(0)
        }
        else {
          return res.json()
        }
      })
      .then((data) => {
        console.log(data)
        document.querySelector('.controlButtons .error').innerText = data.error
      })
  }

  const Earnings = () => {
    if (tournament.type === 'brackets') {
      return (
        <>
          {tournament.earnings}
        </>
      )
    }
    else {
      return (
        <>
          {Array.from(tournament.earnings).map((earning, i) =>
            <div key={i}>
              <span>{earning.rank}. {earning.prize} credits</span>
            </div>
          )}
        </>
      )
    }
  }

  const Bank = () => {
    tournament.bank = 5
    const maxEarnings = tournament.type == 'brackets' ? tournament.earnings : tournament.earnings.reduce((acc, curr) => acc + curr.prize, 0)

    const percentage = Math.min(100, Math.floor((tournament.bank / maxEarnings) * 100))

    return (
      <div id="bank" className='attribute'>
        <h3>Bank</h3>
        <div className="info">
          In order to start the tournament, the bank must have enough credits to pay out the earnings.
          You can either wait for more entry fees to be paid, or you can directly deposit credits into the bank.
          Earnings will be given out from the bank after the tournament has ended, and any leftover amount will be given to you, the host.
        </div>
        <div className="balance">
          <span className='balance-header'>Balance:</span>
          <div className="bar">
            <div className="bar-fill" style={{ width: `${percentage}%`, padding: `0 0 0 ${Math.min(percentage, 94)}%` }}>{`${percentage}%`}</div>
          </div>
          <div className="amount">{`${tournament.bank}/${maxEarnings} credits`}</div>
        </div>
        {percentage == 100 ? <span>Bank is full. You may now start the tournament.</span> : <button onClick={handleDepositeCredits}>Deposit credits</button>}
        <span className="error"></span>
      </div>
    )
  }

  const handleDepositeCredits = async () => {
    const maxEarnings = tournament.type == 'brackets' ? tournament.earnings : tournament.earnings.reduce((acc, curr) => acc + curr.prize, 0)

    let popup = document.createElement('div');
    popup.id = 'depositCreditsPopup';
    popup.classList.add('popup');

    let h2 = document.createElement('h2');
    h2.innerHTML = 'Deposit Credits';

    let input = document.createElement('input');
    input.type = 'number';
    input.id = 'depositAmount';
    input.oninput = (e) => {
      const field = document.getElementById('depositAmount');
      field.value = field.value.replace(/[^0-9]/g, '');

      const depositAmount = field.value;
      const currentBank = tournament.bank;
      const maxDeposit = currentBank + parseInt(depositAmount);
      if (depositAmount < 1) {
        document.querySelector('#depositCreditsPopup .error').innerText = 'Deposit amount must be greater than 0';
        field.value = '';
      } else if (maxDeposit > maxEarnings) {
        document.querySelector('#depositCreditsPopup .error').innerText = `Deposit amount cannot exceed the maximum earnings of ${maxEarnings}`;
        field.value = maxEarnings - currentBank;
      } else {
        document.querySelector('#depositCreditsPopup .error').innerText = '';
      }
    }

    let button = document.createElement('button');
    button.innerHTML = 'Confirm';
    button.onclick = async () => {
      console.log('hi');
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tournement/depositIntoTournamentBank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          UUID: UUID,
          amount: document.getElementById('depositAmount').value
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            document.querySelector('#depositCreditsPopup .error').innerText = data.error;
          } else {
            navigate(0);
          }
        });
    }

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
                  <EditButton onclick={showEditDescriptionPopup} />
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
                  <div className='content'><Earnings /></div>
                  <div className="pencil-placeholder"></div>
                </div>
                <div className="attribute maxCapacity">
                  <h3>Max Capacity</h3>
                  <div className='content'>{tournament.maxCapacity}</div>
                  <div className="pencil-placeholder"></div>
                </div>
                {tournamentType === 'battle royale' && (
                  <div className="attribute editable participants">
                    <h3>Participants</h3>
                    <div className='content'>
                      {tournament.enrolledUsers.length === 0 && tournament.enrolledTeams.length > 0 && <TeamParticipants />}
                      {tournament.enrolledTeams.length === 0 && tournament.enrolledUsers.length > 0 && <SoloParticipants />}
                      {tournament.enrolledTeams.length === 0 && tournament.enrolledUsers.length === 0 && <span>No participants yet</span>}
                      {/* <SoloParticipants /> */}
                    </div>
                    <EditButton canBeEditedAfterStart={true} onclick={tournament.teamSize == 1 ? showEditSoloParticipantsPopup : showEditTeamParticipantsPopup} />
                  </div>)}
                <div className="attribute accessibility">
                  <h3>Accessibility</h3>
                  <div className='content'>{tournament.accessibility}</div>
                  <div className="pencil-placeholder"></div>
                </div>
                <div className="attribute editable applications">
                  <h3>Applications</h3>
                  <div className='content'>
                    <Applications />
                  </div>
                  <div className="pencil-placeholder"></div>
                </div>
                <div className="attribute editable updates">
                  <h3>Updates</h3>
                  <div className="wrapper">
                    <div className='content updates-wrapper'>
                      <Updates />
                    </div>
                    <button className='postUpdateButton' onClick={showPostUpdatePopup}>Post Update</button>
                  </div>
                  <div className="pencil-placeholder"></div>
                </div>
              </div>
              {tournament.type === 'brackets' && <MatchesEditor />}
              {!tournament.hasStarted && <Bank />}
              <div className="controlButtons">
                {tournament.hasStarted
                  ? <button onClick={endTournament} className="endTournament">End Tournament</button>
                  : <button onClick={startTournament} className="startTournament">Start Tournament</button>
                }
                <div className="error"></div>
              </div>
            </>
          )}
      </div>
    </div>
  );
}

export default Manage