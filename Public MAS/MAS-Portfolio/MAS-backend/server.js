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

app.use("/api", contactRoutes);
// Railway MySQL connection 

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.getConnection()
  .then((connection) => {
    console.log("MySQL connected successfully!");
    connection.release();
  })
  .catch((error) => {
    console.error("MySQL connection failed:", error.message);
  });

// Gmail configuration

const transporter = nodemailer.createTransport
  ({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
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

    await transporter.sendMail({
      from: `"MAS Portfolio Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      replyTo: email,
      subject: `Portfolio Contact: ${subject}`,
      text: `
New message received from your portfolio.

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
      `,
      html: `
        <h2>New Portfolio Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `
    });

    console.log(`Message saved. Database ID: ${result.insertId}`);
    console.log("Email notification sent.");

    res.status(201).json({
      success: true,
      message: "Thank you! Your message was sent successfully."
    });
  } catch (error) {
    console.error("Contact form error:", error);

    res.status(500).json({
      success: false,
      message: "Server error. Your message could not be sent."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});