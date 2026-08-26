import CreditCard from "./components/Credit"; // Import CreditCard component
import { useEffect, useState } from "react";
import "./styles/Credits.css";
import Nav from "../../components/Nav";
import { useNavigate } from "react-router-dom";

const Credits = () => {
  const [credits, setCredits] = useState([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    const response = await fetch("/api/products");
    if (!response.ok) return;
    const data = await response.json();
    setCredits(data.products);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBuyClick = (creditId) => {
    navigate(`/purchase/${creditId}`);
  };

  return (
    <div id="Credits">
      <Nav />
      <div className="credits-page">
        <h1>Buy Credits</h1>
        <p>Purchase credits to use on the platform.</p>
        <p className="demo-notice">
          <strong>Demo checkout.</strong> No payment is taken and no card details
          ever leave your browser — the credits are granted straight away.
        </p>
        <div className="credit-cards">
          {credits.map((credit) => (
            <CreditCard
              key={credit.id}
              name={credit.name}
              totalCredits={credit.credits}
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
