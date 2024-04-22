import React, { useContext, useState } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import Nav from '../../components/Nav'; // Ensure this import path is correct
import './BecomeHost.css';
import { useNavigate } from 'react-router-dom';

const BecomeHost = () => {
    const [loading, setLoading] = useState(false);
    const { user, setUser } = useContext(AuthContext);

    const navigate = useNavigate();

    const checkCreditsAndBecomeHost = async () => {
        setLoading(true);

        try {
            const creditResponse = await axios.get('http://localhost:2000/api/credit/getTotalCredits', { withCredentials: true });
            console.log(creditResponse)
            if (creditResponse.data.credits >= 20) {
                const isUserSure = window.confirm('Are you sure you want to become a host for 20 credits?');
                if (isUserSure) {
                    await becomeHost();
                } else {
                    alert('Operation canceled.');
                }
            } else {
                alert('Not enough credits. Please buy credits.');
            }
        } catch (error) {
            console.error('An error occurred while checking credits:', error);
            alert('An error occurred. Please try again later.');
        }
        setLoading(false);
    };

    const becomeHost = async () => {
        try {
            const response = await axios.post('http://localhost:2000/api/user/becomehost', { withCredentials: true });
    
            if (response.status === 200) {
                navigate("/")
            } else {
                console.error('Failed to become a host:', response.status, response.data);
                alert(`An error occurred: ${response.data.message}`);
            }
        } catch (error) {
            console.error('An error occurred while trying to become a host:', error);
            alert(`An error occurred. Please try again later. Error: ${error.message}`);
        }
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


