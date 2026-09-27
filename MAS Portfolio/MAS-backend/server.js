const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "mas_portfolio",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get("/", (req, res) => {
  res.send("Portfolio backend is running");
});

app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all fields."
    });
  }

  try {
    const sql = `
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [
      name,
      email,
      subject,
      message
    ]);

    console.log(`Message saved. Database ID: ${result.insertId}`);

    res.status(201).json({
      success: true,
      message: "Thank you! Your message was saved successfully."
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      success: false,
      message: "Server error. Message could not be saved."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});