import CreditCard from "./components/Credit"; // Import CreditCard component
import React, { useEffect, useState, useCallback } from "react";
import "./styles/Credits.css";
import Nav from "../../components/Nav";
import { useNavigate } from "react-router-dom";

const Credits = () => {
  const [credits, setCredits] = useState([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    const response = await fetch(
      "http://localhost:2000/api/purchase/getProducts"
    )
      .then((res) => res.json())
      .then((data) => setCredits(data));
    return response;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBuyClick = (creditId) => {
    // Implement logic to redirect to payment page with credit value
    console.log(`Buying ${creditId} credits`);
    // edit this based on the payment processing page route
    navigate(`/purchase/${creditId}`);
  };

  const purchaseCredit = async (userId, creditId) => {
    const response = await fetch(
      "http://localhost:2000/api/credit/purchase-credit-package",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId, creditPackageId: creditId }),
      }
    );

    const json = await response.json();

    if (!response.ok) {
      return Error(message, "Error purchasing credits!");
    }
    console.log(json, "json returned");
    return json;
  };

  return (
    <div id="Credits">
      <Nav />
      <div className="credits-page">
        <h1>Get Credits</h1>
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
