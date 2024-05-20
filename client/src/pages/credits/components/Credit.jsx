import React from "react";

function CreditCard({ name, totalCredits, price, onBuyClick }) {
  return (
    <div className="credit-card">
      <h2>{name}</h2>
      <h3>{totalCredits} Credits</h3>
      <p>${price.toFixed(2)}</p>
      <button onClick={onBuyClick}>Buy Now</button>
    </div>
  );
}

export default CreditCard;
