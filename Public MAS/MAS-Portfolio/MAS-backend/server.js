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

const databaseUrl =
  process.env.DATABASE_URL || process.env.MYSQL_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or MYSQL_URL is missing. Add your Railway MySQL URL in .env."
  );
}

const db = mysql.createPool(databaseUrl);

db.getConnection()
  .then((connection) => {
    console.log("MySQL connected successfully!");
    connection.release();
  })
  .catch((error) => {
    console.error("MySQL connection failed:", error.message);
  });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.locals.db = db;
app.locals.transporter = transporter;

app.get("/", (req, res) => {
  res.send("Portfolio backend is running");
});

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT 1 AS databaseConnected"
    );

    return res.status(200).json({
      success: true,
      message: "MySQL database is connected successfully.",
      data: rows
    });
  } catch (error) {
    console.error("DATABASE TEST ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
});

app.get("/api/test-email", async (req, res) => {
  try {
    await transporter.verify();

    return res.status(200).json({
      success: true,
      message: "Email connection is working successfully."
    });
  } catch (error) {
    console.error("EMAIL TEST ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
});

app.use("/api/contact", contactRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});