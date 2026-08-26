import Nav from '../../components/Nav'; // Ensure this import path is correct
import './BecomeHost.css';
import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import AuthContext from '../../context/AuthContext';

const BecomeHost = () => {

  const { loggedIn, isHost, refreshUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const checkCreditsAndBecomeHost = async () => {
    setLoading(true);
    let creditResponse

    await fetch('/api/users/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        creditResponse = data?.user ?? { credits: 0 }
      })

    if (creditResponse.credits >= 20) {
      const isUserSure = window.confirm('Are you sure you want to become a host for 20 credits?');
      if (isUserSure) {
        becomeHost();
      } else {
        alert('Operation canceled.');
      }
    } else {
      alert('Not enough credits. Please buy credits.');
    }

    setLoading(false);
  };

  const becomeHost = async () => {
    const response = await fetch('/api/users/me/become-host', {
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) {
      const json = await response.json()
      alert(json.error?.message ?? 'Could not become a host.')
      return
    }
    await refreshUser()
    navigate('/')
  };

  useEffect(() => {
    if (loggedIn === undefined) return
    if (!loggedIn) {
      navigate('/signin')
    }
  }, [loggedIn])

  useEffect(() => {
    if (isHost === undefined) return
    if (isHost) {
      navigate('/host')
    }
  }, [isHost])

  return (
    <div id="BecomeHost">
      <div className="overall-container">
        <Nav />
        <div className="become-host-container">
          <h1 className="title">Become a <span className="highlight">Tourney Host</span> Today!</h1>
          <p className="description">
            As a host, you will have the power to create and manage your own tournaments,
            engage with a large community of gamers, and much more.
            Step up your game and start your hosting journey now!
          </p>
          <p className="price-info">
            Price: <strong>20 credits</strong>
          </p>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <button onClick={checkCreditsAndBecomeHost} className="become-host-btn">
              Let's do it!
            </button>
          )}
        </div>
      </div>
    </div>

  );
};

export default BecomeHost;


