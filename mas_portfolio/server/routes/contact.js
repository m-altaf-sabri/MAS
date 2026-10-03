const express = require("express");
const router = express.Router();
const { submitContact } = require("../controllers/contactController");
const { validateRequest } = require("../middleware/validateRequest");
const contactSchema = require("../schemas/contact");

// POST /api/contact
router.post("/", validateRequest(contactSchema), submitContact);

module.exports = router;