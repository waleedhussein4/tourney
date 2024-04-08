const express = require('express');
const { getProduct, purchase, createTestProducts } = require('../controller/purchaseController');
const router = express.Router();

router.get('/getProduct/:paramID', getProduct);

router.post('/createTestProducts', createTestProducts)

router.post('/:paramID', purchase);



module.exports = router;