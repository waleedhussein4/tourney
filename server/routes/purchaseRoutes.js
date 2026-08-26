import express from 'express'
import { getProduct, purchase, getProducts } from '../controller/purchaseController.js'
import { auth, getAuth } from '../middleware/requireAuth.js'
const router = express.Router();

router.get('/getProduct/:paramID', getProduct);

router.post('/:paramID', auth, purchase);

router.get('/getProducts', getProducts);



export default router