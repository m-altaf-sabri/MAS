module.exports = {
    type: "object",
    additionalProperties: false,
    required: ["name", "email", "message"],
    properties: {
        name: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            pattern: "\\S"
        },
        email: {
            type: "string",
            minLength: 3,
            maxLength: 254,
            pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
        },
        message: {
            type: "string",
            minLength: 1,
            maxLength: 5000,
            pattern: "\\S"
        }
    }
};
