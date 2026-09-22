const express = require("express");
const { getRsvpStats, storeRsvp } = require("../controllers/rsvpController");

const router = express.Router();

router.get("/stats", getRsvpStats);
router.post("/rsvp", storeRsvp);

module.exports = router;
