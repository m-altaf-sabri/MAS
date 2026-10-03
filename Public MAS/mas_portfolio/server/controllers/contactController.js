const db = require("../config/db");
const nodemailer = require("nodemailer");

// Gmail Transporter Setup
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const submitContact = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Validate fields
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all fields."
            });
        }

        // Save message to MySQL
        const sql = `
      INSERT INTO contacts (name, email, message)
      VALUES (?, ?, ?)
    `;

        await db.execute(sql, [name, email, message]);

        // Send email notification
        await transporter.sendMail({
            from: `"Life Portfolio" <${process.env.EMAIL_USER}>`,
            to: process.env.RECEIVER_EMAIL,
            subject: `New Contact Message - ${name}`,
            text: `You received a new message from your portfolio website.\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}\n\n--------------------------------\nLife Website Contact Form`
        });

        res.status(201).json({
            success: true,
            message: "Message sent successfully! Thank you."
        });
    } catch (error) {
        console.error("Contact form error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to send message. Please try again."
        });
    }
};

module.exports = {
    submitContact
};