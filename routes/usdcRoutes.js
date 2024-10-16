const express = require("express");
const { mintUSDC, createNewWallet, collectUSDC, burnUSDC, getTreasuryWallet, checkHealth } = require("../controllers/usdcController");
const router = express.Router();

router.get("/", checkHealth);
router.get("/getTreasuryWallet", getTreasuryWallet);
router.post("/mintUSDC", mintUSDC);
router.post("/createNewWallet", createNewWallet);
router.post("/collectUSDC", collectUSDC);
router.post("/burnUSDC", burnUSDC);

module.exports = router;
