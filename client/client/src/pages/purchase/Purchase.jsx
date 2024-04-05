// TODO: handle not signed in user

import Nav from '/src/components/Nav.jsx'
import { formatCreditCard, getCreditCardType } from 'cleave-zen'
import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import './styles/Purchase.css'

function Purchase() {

  const navigate = useNavigate()

  const { product } = useParams()
  if(!product) {
    navigate('/credits')
  }

  const inputRef = useRef(null)
  const [ccValue, setccValue] = useState('')
  const [ccType, setccType] = useState('')
  const [item, setItem] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  const createTestProducts = async () => {
    await fetch('http://localhost:2000/api/purchase/createTestProducts', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify([
        {
          id: '1',
          name: 'Vbucks 1',
          description: 'Buy a small amount of vbucks for the in-game store',
          price: 10
        },
        {
          id: '2',
          name: 'Vbucks 2',
          description: 'Buy a medium amount of vbucks for the in-game store',
          price: 15
        },
        {
          id: '3',
          name: 'Vbucks 3',
          description: 'Buy a large amount of vbucks for the in-game store',
          price: 25
        }
      ])
    })
    .then(res => res.json())
    .then(data => console.log(data))
  }

  const getItem = async () => {
    const URL = 'http://localhost:2000/api/purchase/getProduct'
    console.log("Product: " + product)

    await fetch(`${URL}/${product}`)
    .then(res => {
      if(res.ok) {
        setIsLoading(false)
      } else {
        navigate('/notfound')
      }
      return res.json()
    })
    .then(data => {
      console.log(data)
      setItem(data)
    })
  }

  useEffect(() => {
    // createTestProducts()
    getItem()
  }, [])

  return (
    <div id="Purchase">
      <Nav />
      { !isLoading && <div className="container">

        <h1>Checkout</h1>

        <div className="purchase-screen">

          <div className="user-input">
            <h3>Payment</h3>
            <div className="input-fields">
              <div className="input-name">
                <input id='input-firstName' type="text" placeholder='First Name' required />
                <input id='input-lastName' type="text" placeholder='Last Name' required />
              </div>
              <input id='input-shippingAddress' type='text' placeholder='Shipping Address' required />
              <div className="input-creditCard">
                <div id="creditCardType">{ccType}</div>
                <input
                  id='input-creditCardNumber'
                  ref={inputRef}
                  value={ccValue}
                  placeholder='Credit Card Number'
                  onChange={e => {
                    const value = e.target.value
                    setccValue(formatCreditCard(value))
                    setccType(getCreditCardType(value))
                  }}
                />
                <input id='input-ccv' type="text" placeholder="123" maxLength="3" required />
              </div>
            </div>
          </div>

          <div className="info">
            <h3>Your item</h3>
            <div className='item-name'>{item.name}</div>
            <div className='item-description'>{item.description}</div>
            <div className='item-price'>{item.totalPrice}</div>
            <button id='submit'>Continue</button>
          </div>

        </div>
      </div> }
    </div>
  )
}

export default Purchase