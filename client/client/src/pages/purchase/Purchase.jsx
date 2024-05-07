import Nav from "/src/components/Nav.jsx";
import { formatCreditCard, getCreditCardType } from "cleave-zen";
import { useEffect, useRef, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ConfirmationPopup } from "../../components/ConfirmationPopup";
import { AuthContext } from "../../context/AuthContext";
import "./styles/Purchase.css";

function Purchase() {

  const { loggedIn } = useContext(AuthContext);
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
  const [showPurchaseConfirmation, setShowPurchaseConfirmation] =
    useState(false);

  const createTestProducts = async () => {
    // remove for production
    await fetch("http://localhost:2000/api/purchase/createTestProducts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify([
        {
          id: "1",
          name: "Bronze Package",
          amount: 5,
          price: 5,
        },
        {
          id: "2",
          name: "Silver Package",
          amount: 10,
          price: 10,
        },
        {
          id: "3",
          name: "Gold Package",
          amount: 20,
          price: 20,
        },
        {
          id: "4",
          name: "Diamond Package",
          amount: 50,
          price: 50,
        },
        {
          id: "5",
          name: "Ultra Package",
          amount: 100,
          price: 100,
        },
      ]),
    })
      .then((res) => res.json())
      .then((data) => console.log(data));
  };

  const getItem = async () => {
    const URL = "http://localhost:2000/api/purchase/getProduct";
    console.log("Product: " + product);

    await fetch(`${URL}/${product}`)
      .then((res) => {
        if (res.ok) {
          setIsLoading(false);
        } else {
          navigate("/notfound");
        }
        return res.json();
      })
      .then((data) => {
        console.log(data);
        setItem(data);
      });
  };

  const purchaseItem = () => {
    setShowPurchaseConfirmation(true);
  };

  useEffect(() => {
    createTestProducts();
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
                    Amount: {item.amount} credits
                  </div>
                  <div className="item-price">Price: ${item.price}</div>
                </div>
                <div className="total-highlight">
                  <span>Total Cost: ${item.price}</span>
                </div>
                <button id="submit" onClick={purchaseItem}>
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {showPurchaseConfirmation && (
        <ConfirmationPopup
          message="Are you sure you want purchase this package?"
          onConfirm={() => {
            const URL = "http://localhost:2000/api/purchase";
            const firstName = document.getElementById("input-firstName").value;
            const lastName = document.getElementById("input-lastName").value;
            const shippingAddress = document.getElementById(
              "input-shippingAddress"
            ).value;
            const creditCardNumber = document.getElementById(
              "input-creditCardNumber"
            ).value;
            const ccv = document.getElementById("input-ccv").value;

            fetch(`${URL}/${product}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                firstName,
                lastName,
                shippingAddress,
                creditCardNumber,
                ccv,
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                console.log(data);
                navigate("/");
                navigate(0);
              })
              .catch((error) => console.error("Error:", error));
          }}
          onCancel={() => setShowPurchaseConfirmation(false)}
        />
      )}
    </>
  );
}

export default Purchase;
