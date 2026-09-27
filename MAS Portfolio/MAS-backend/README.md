# Portfolio Backend API

Backend API for my personal portfolio website. It handles contact form submissions and sends messages to my Gmail using Node.js, Express, and Nodemailer.

## Features

- Contact form API endpoint
- Sends contact messages through Gmail
- Uses Nodemailer for email delivery
- Uses Google App Password authentication
- Keeps sensitive credentials secure with environment variables
- CORS enabled for frontend-backend communication

## Technologies Used

- Node.js
- Express.js
- Nodemailer
- dotenv
- cors
- MySQL2

## Project Structure

```text
backend/
├── routes/
│   └── contact.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Installation

Clone the repository:

```bash
git clone [https://github.com/your-github-username/your-repository-name.git](https://github.com/your-github-username/your-repository-name.git)
```

Open the project folder:

```bash
cd your-repository-name
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root folder and add the following values:

```env
PORT=5000
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_16_digit_google_app_password
```

> Do not upload your `.env` file to GitHub.

## Run the Server

Start the backend server:

```bash
node server.js
```

If you use Nodemon:

```bash
nodemon server.js
```

The server will run at:

```text
http://localhost:5000
```

## Contact API

### Send Contact Message

**Endpoint:**

```text
POST /api/contact
```

**Full local URL:**

```text
http://localhost:5000/api/contact
```

**Request body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I would like to contact you."
}
```

**Success response:**

```json
{
  "success": true,
  "message": "Your message was sent successfully."
}
```

## Security

- Never upload `.env` to GitHub.
- Never expose your Gmail App Password in frontend code.
- Store credentials only in environment variables.
- Add `.env` and `node_modules` to `.gitignore`.

## Author

Your Name

## License

This project is for personal portfolio use.
