const express = require("express");
const { showForm } = require("../controllers/rsvpController");

const router = express.Router();

router.get("/", showForm);

module.exports = router;
