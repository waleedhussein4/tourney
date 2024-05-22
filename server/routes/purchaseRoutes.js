const express = require('express');
const { getProduct, purchase, getProducts } = require('../controller/purchaseController');
const { auth, getAuth } = require('../middleware/requireAuth'); 
const router = express.Router();

router.get('/getProduct/:paramID', getProduct);

router.post('/:paramID', auth, purchase);

router.get('/getProducts', getProducts);



module.exports = router;