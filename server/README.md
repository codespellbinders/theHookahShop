Local server setup

1. Create a `.env` file in `/server` with these values (example):

DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=hookahshop

# Optional Cloudinary settings for persistent product image uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional local fallback for development only
# When Cloudinary is not configured, images are stored under server/uploads/products.

# Optional SMTP settings for real email delivery
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
MAIL_FROM="The Hookah Shop <no-reply@example.com>"

# Optional helper flags
# SMTP_SERVICE=gmail
# SMTP_POOL=false
# SMTP_REQUIRE_TLS=true
# SMTP_TIMEOUT_MS=7000

2. Install dependencies and start server:

```bash
cd server
npm install
node server.js
```

3. For development without SMTP credentials:
- The server will automatically create a disposable Ethereal test mailbox in non-production mode, send the verification email there, and print a preview URL to the server logs.
- If SMTP is not configured and Ethereal cannot be created, the server logs the verification code to the console.

4. To use real email delivery in production:
- Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM`.
- Use an app password or provider-issued SMTP credentials rather than your normal account password.
- Keep `CODE_HASH_SECRET` long and random so stored verification codes cannot be replayed.

5. To keep admin product images after redeploys, configure Cloudinary for uploads:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

- In production, product image uploads require Cloudinary.
- In development, the server can still fall back to local files under `server/uploads/products`.

6. To fully enable persistence and orders, configure MySQL credentials and create the database `hookahshop`.

```sql
CREATE DATABASE hookahshop;
-- create a user and grant privileges as appropriate
```

7. Run DB migrations (required for admin/product management):

```bash
cd server
npm run migrate
```

8. Configure admin auth envs in `.env`:

```env
ADMIN_JWT_SECRET=replace_with_a_long_random_secret
ADMIN_JWT_EXPIRES_IN=12h
# Optional extra protection for first super admin creation:
ADMIN_SETUP_KEY=replace_with_setup_key
```

9. Bootstrap first super admin (run once):

```bash
curl -X POST http://localhost:5000/api/admin/auth/bootstrap-super-admin \
	-H "Content-Type: application/json" \
	-H "x-setup-key: replace_with_setup_key" \
	-d '{"name":"Owner","email":"owner@example.com","password":"Admin@12345"}'
```

10. Phase 1 admin endpoints:

- `POST /api/admin/auth/login`
- `GET /api/admin/auth/me`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `GET /api/admin/products`
- `GET /api/admin/products/:id`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`

Use `Authorization: Bearer <token>` for all `/api/admin/categories` and `/api/admin/products` routes.

11. Public catalog endpoints (used by storefront):

- `GET /api/categories`
- `GET /api/products`
- `GET /api/products?q=search_text`
- `GET /api/products?category=category-slug`
- `GET /api/products/:id`