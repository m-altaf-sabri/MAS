const Ajv = require("ajv");

const ajv = new Ajv({ allErrors: true, strict: true });

const validateRequest = (schema) => {
    const validate = ajv.compile(schema);

    return (req, res, next) => {
        if (!validate(req.body)) {
            return res.status(400).json({
                success: false,
                message: "Invalid request body.",
                errors: validate.errors.map(({ instancePath, message }) => ({
                    field: instancePath || "body",
                    message
                }))
            });
        }

        next();
    };
};

module.exports = {
    validateRequest
};
