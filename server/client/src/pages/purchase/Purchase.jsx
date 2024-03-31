import Nav from '/src/components/Nav.jsx'
import { formatCreditCard, getCreditCardType } from 'cleave-zen'
import { useRef, useState } from 'react'

import './styles/Purchase.css'

function Purchase() {

  const inputRef = useRef(null)
  const [ccValue, setccValue] = useState('')
  const [ccType, setccType] = useState('')

  return (
    <div id="Purchase">
      <Nav />
      <div className="container">

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
            <div className='item-name'>Item Name</div>
            <div className='item-description'>Item Description</div>
            <div className='item-price'>Total Price</div>
            <button id='submit'>Confirm</button>
          </div>

        </div>
      </div>
    </div>
  )
}

// const creditCardInput = document.getElementById('input-creditCardNumber')
// const creditCardType = document.getElementById('input-creditCardType')

// creditCardInput.addEventListener('input', e => {
//   const value = e.target.value
//   creditCardInput.value = formatCreditCard(value)
//   creditCardType.innerHTML = getCreditCardType(value)
// })

export default Purchase