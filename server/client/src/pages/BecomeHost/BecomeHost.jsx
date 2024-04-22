import Nav from '../../components/Nav'; // Ensure this import path is correct
import './BecomeHost.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const BecomeHost = () => {
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const checkCreditsAndBecomeHost = async () => {
    setLoading(true);
    let creditResponse

    await fetch('http://localhost:2000/api/user/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    .then((res) => res.json())
    .then((data) => {
      console.log(data)
      creditResponse = data
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
    console.log("in become host")
    await fetch('http://localhost:2000/api/user/becomehost',
      {
        method: 'POST',
        credentials: 'include',
      })
      .then((res) => {
        if (res.ok) {
          console.log('navigating')
          navigate("/")
        }
      })
  };

  return (
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
          The price: <strong>20 credits</strong>
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
  );
};

export default BecomeHost;


