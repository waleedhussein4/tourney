const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/requireAuth"); // Assuming authentication middleware is required

const {
  getCredits,
  getTotalCredits,
  deleteCredit,
  createCredit,
  purchaseCredit,
} = require("../controller/creditController"); // Adjust the path as necessary

// Routes
router.get("/", getCredits);
router.get("/getTotalCredits", auth, getTotalCredits);
router.post("/credit", createCredit);
router.delete("/credit/:id", deleteCredit);
router.post("/credit/purchase-credit-package", purchaseCredit);

module.exports = router;

