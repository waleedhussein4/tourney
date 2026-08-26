import Nav from "/src/components/Nav.jsx";
import { formatCreditCard, getCreditCardType } from "cleave-zen";
import { useEffect, useRef, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ConfirmationPopup } from "../../components/ConfirmationPopup";
import { AuthContext } from "../../context/AuthContext";
import "./styles/Purchase.css";

function Purchase() {

  const { loggedIn, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const { product } = useParams();
  if (!product) {
    navigate("/credits");
  }

  const inputRef = useRef(null);
  const [ccValue, setccValue] = useState("");
  const [ccType, setccType] = useState("");
  const [item, setItem] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showPurchaseConfirmation, setShowPurchaseConfirmation] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const getItem = async () => {
    const response = await fetch(`/api/products/${product}`);
    if (!response.ok) {
      navigate("/notfound");
      return;
    }
    const data = await response.json();
    setItem(data.product);
    setIsLoading(false);
  };

  const purchaseItem = () => {
    setShowPurchaseConfirmation(true);
  };

  useEffect(() => {
    getItem();
  }, []);

  useEffect(() => {
    if (loggedIn === undefined) return
    if (!loggedIn) {
      navigate('/signin')
    }
  }, [loggedIn])

  return (
    <>
      <div id="Purchase">
        <Nav />
        {!isLoading && (
          <div className="container">
            <h1>Checkout</h1>
            <div className="purchase-screen">
              <div className="user-input">
                <h3>Payment</h3>
                <p className="demo-notice">
                  <strong>Demo checkout.</strong> These fields are a mock-up. They are
                  never sent anywhere, and no payment is taken.
                </p>
                <div className="input-fields">
                  <div className="input-name">
                    <input
                      id="input-firstName"
                      type="text"
                      placeholder="First Name"
                      required
                    />
                    <input
                      id="input-lastName"
                      type="text"
                      placeholder="Last Name"
                      required
                    />
                  </div>
                  <input
                    id="input-shippingAddress"
                    type="text"
                    placeholder="Shipping Address"
                    required
                  />
                  <div className="input-creditCard">
                    <div id="creditCardType">{ccType}</div>
                    <input
                      id="input-creditCardNumber"
                      ref={inputRef}
                      value={ccValue}
                      placeholder="Credit Card Number"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setccValue(formatCreditCard(value));
                        setccType(getCreditCardType(value));
                      }}
                      required
                    />
                    <input
                      id="input-ccv"
                      type="text"
                      placeholder="CCV"
                      maxLength="3"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="info">
                <h3>Your item</h3>
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-description">
                    Amount: {item.credits} credits
                  </div>
                  <div className="item-price">Price: ${item.price}</div>
                </div>
                <div className="total-highlight">
                  <span>Total Cost: ${item.price}</span>
                </div>
                <button id="submit" onClick={purchaseItem}>
                  Continue
                </button>
                {checkoutError && <p className="error">{checkoutError}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
      {showPurchaseConfirmation && (
        <ConfirmationPopup
          message="Are you sure you want purchase this package?"
          onConfirm={async () => {
            setShowPurchaseConfirmation(false);
            setCheckoutError("");

            // The card fields above are a mock-up. Nothing from them is read
            // here, and the request carries no body at all.
            const response = await fetch(`/api/credits/checkout/${product}`, {
              method: "POST",
              credentials: "include",
            });

            if (!response.ok) {
              const data = await response.json().catch(() => null);
              setCheckoutError(data?.error?.message ?? "Could not complete the demo purchase");
              return;
            }

            await refreshUser();
            navigate("/credits");
          }}
          onCancel={() => setShowPurchaseConfirmation(false)}
        />
      )}
    </>
  );
}

export default Purchase;
