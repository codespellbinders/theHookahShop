Local server setup

1. Create a `.env` file in `/server` with these values (example):

DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=hookahshop

# Optional SMTP settings for real email delivery
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
MAIL_FROM="The Hookah Shop <no-reply@example.com>"

2. Install dependencies and start server:

```bash
cd server
npm install
node server.js
```

3. For development without MySQL or SMTP:
- The server will fallback to an in-memory verification code store when the DB is unavailable. This allows the email verification pages to work during local dev, but data won't be persisted across restarts.
- Server will log verification codes to the console when SMTP is not configured.

4. To fully enable persistence and orders, configure MySQL credentials and create the database `hookahshop`.

```sql
CREATE DATABASE hookahshop;
-- create a user and grant privileges as appropriate
```