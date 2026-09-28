require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const nodemailer = require("nodemailer");

const contactRoutes = require("./routes/contact");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


// Railway MySQL connection 
const db = mysql.createPool(process.env.DATABASE_URL);
 ({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then((connection) => {
    console.log("MySQL connected successfully!");
    connection.release();
  })
  .catch((error) => {
    console.error("MySQL connection failed:", error.message);
  });


// Gmail configuration

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// Store pool and transporter in app.locals for route access
app.locals.pool = pool;
app.locals.transporter = transporter;

app.get("/", (req, res) => {
  res.send("Portfolio backend is running");
});

// Mount contact routes at /api/contact
// The route handler in contact.js uses POST / which becomes POST /api/contact
app.use("/api/contact", contactRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
