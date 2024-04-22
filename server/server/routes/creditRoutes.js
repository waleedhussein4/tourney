const express = require("express");
const router = express.Router();
const {
  getCredits,
  deleteCredit,
  createCredit,
  purchaseCredit,
} = require("../controller/creditController"); // Adjust the path as necessary

// router.use(requireAuth);

// Routes
router.get("/", getCredits);
router.post("/credit", createCredit);
router.delete("/credit/:id", deleteCredit);
router.post("/credit/purchase-credit-package", purchaseCredit);

module.exports = router;
