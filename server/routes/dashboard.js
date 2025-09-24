const express = require("express");
const router = express.Router();
const { protect, auditLog } = require("../middleware/auth");
const { getStats, getActivity } = require("../controllers/dashboard");

router.use(protect);

router.get("/stats", auditLog("READ", "System"), getStats);
router.get("/activity", auditLog("READ", "System"), getActivity);

module.exports = router;
