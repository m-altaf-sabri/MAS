const requireClientCertificate = (req, res, next) => {
    if (!req.socket.authorized) {
        return res.status(401).json({
            success: false,
            message: "A trusted client certificate is required."
        });
    }

    next();
};

module.exports = {
    requireClientCertificate
};
