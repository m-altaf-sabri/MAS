# Portfolio API

## Run locally

Install dependencies, copy `.env.example` to `.env`, and provide the database,
mail, and TLS settings. Start the API from this directory:

```sh
npm install
npm start
```

The service listens over HTTPS. Startup fails if any TLS path is unset or the
referenced file cannot be read; it does not fall back to plain HTTP. Relative
TLS paths are resolved from this directory.

`TLS_KEY_PATH` and `TLS_CERT_PATH` must identify the server's private key and
certificate. `TLS_CLIENT_CA_PATH` must identify a PEM CA certificate (or bundle)
trusted to issue client certificates. Install a client certificate issued by
that CA in each API client's TLS certificate store. The `/api` routes require a
valid client certificate; the root health endpoint does not. Never commit
private keys or client certificates.

The contact form currently calls `https://localhost:5000/api/contact`, so local
browsers must trust the server certificate and have an authorized client
certificate installed. Before production deployment, change the frontend URL
to the deployed HTTPS API origin and issue client certificates to the intended
users. Visitors without one cannot submit the public contact form.

## Contact request schema

`POST /api/contact` accepts a JSON object with exactly these fields:

| Field     | Requirements                                    |
| --------- | ----------------------------------------------- |
| `name`    | Non-whitespace string, at most 100 characters   |
| `email`   | Email-shaped string, at most 254 characters     |
| `message` | Non-whitespace string, at most 5,000 characters |

Invalid JSON or schema violations return `400`; request bodies larger than
16 KiB return `413`. Schema errors include a list of invalid fields.
