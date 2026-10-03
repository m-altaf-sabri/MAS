require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const https = require("https");
const path = require("path");
const contactRoutes = require("./routes/contact");
const { requireClientCertificate } = require("./middleware/requireClientCertificate");

const app = express();
const PORT = Number(process.env.PORT || 5000);

if (!Number.isInteger(PORT) || PORT < 0 || PORT > 65535) {
    throw new Error("PORT must be an integer between 0 and 65535.");
}

// Middleware
app.use(cors());
app.use("/api", requireClientCertificate);
app.use(express.json({ limit: "16kb" }));

// Health Check Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Life Website Backend is running!..."
    });
});

// Routes
app.use("/api/contact", contactRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    if (err.status === 400) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON request body."
        });
    }

    if (err.status === 413) {
        return res.status(413).json({
            success: false,
            message: "Request body is too large."
        });
    }

    console.error("Server Error:", err);
    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});

const readTlsFile = (environmentVariable) => {
    const configuredPath = process.env[environmentVariable];

    if (!configuredPath) {
        throw new Error(`${environmentVariable} must be configured to start the mTLS API.`);
    }

    return fs.readFileSync(path.resolve(__dirname, configuredPath));
};

const server = https.createServer({
    key: readTlsFile("TLS_KEY_PATH"),
    cert: readTlsFile("TLS_CERT_PATH"),
    ca: readTlsFile("TLS_CLIENT_CA_PATH"),
    requestCert: true,
    rejectUnauthorized: false
}, app);

server.listen(PORT, () => {
    console.log(`mTLS API server running on https://localhost:${PORT}`);
});