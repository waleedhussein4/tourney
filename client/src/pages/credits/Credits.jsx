import CreditCard from "./components/Credit"; // Import CreditCard component
import { useEffect, useState } from "react";
import "./styles/Credits.css";
import Nav from "../../components/Nav";
import { useNavigate } from "react-router-dom";

const Credits = () => {
  const [credits, setCredits] = useState([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    console.log('fetching')
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase/getProducts`
    )
    .then((res) => res.json())
    .then((data) => setCredits(data));
    return response;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBuyClick = (creditId) => {
    console.log(`Buying ${creditId} credits`);
    navigate(`/purchase/${creditId}`);
  };

  return (
    <div id="Credits">
      <Nav />
      <div className="credits-page">
        <h1>Buy Credits</h1>
        <p>Purchase credits to use on the platform.</p>
        <div className="credit-cards">
          {credits.map((credit) => (
            <CreditCard
              key={credit.amount}
              name={credit.name}
              totalCredits={credit.amount}
              price={credit.price}
              onBuyClick={() => handleBuyClick(credit.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Credits;
