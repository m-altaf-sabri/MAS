const assert = require("node:assert/strict");
const test = require("node:test");
const { requireClientCertificate } = require("../middleware/requireClientCertificate");
const { validateRequest } = require("../middleware/validateRequest");
const contactSchema = require("../schemas/contact");

const createResponse = () => ({
    statusCode: undefined,
    body: undefined,
    status(statusCode) {
        this.statusCode = statusCode;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    }
});

test("mTLS middleware denies requests without an authorized client certificate", () => {
    const res = createResponse();
    let continued = false;

    requireClientCertificate({ socket: { authorized: false } }, res, () => {
        continued = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(continued, false);
});

test("mTLS middleware allows requests with an authorized client certificate", () => {
    const res = createResponse();
    let continued = false;

    requireClientCertificate({ socket: { authorized: true } }, res, () => {
        continued = true;
    });

    assert.equal(continued, true);
    assert.equal(res.statusCode, undefined);
});

test("contact schema accepts the supported contact payload", () => {
    const middleware = validateRequest(contactSchema);
    const req = {
        body: {
            name: "Morgan Example",
            email: "morgan@example.com",
            message: "I'd like to discuss a project."
        }
    };
    const res = createResponse();
    let continued = false;

    middleware(req, res, () => {
        continued = true;
    });

    assert.equal(continued, true);
    assert.equal(res.statusCode, undefined);
});

test("contact schema rejects malformed, incomplete, and unexpected fields", () => {
    const middleware = validateRequest(contactSchema);
    const req = {
        body: {
            name: " ",
            email: "not-an-email",
            extra: true
        }
    };
    const res = createResponse();
    let continued = false;

    middleware(req, res, () => {
        continued = true;
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.errors.length > 0, true);
    assert.equal(continued, false);
});
