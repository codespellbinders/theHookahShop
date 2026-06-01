const path = require('path');
// Explicitly load .env from server directory
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require("mysql2");

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'hookahshop';

console.log('[DB Config]', { host: DB_HOST, user: DB_USER, password: DB_PASS ? '***set***' : '***empty***', database: DB_NAME });

const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.isConnected = true;

db.promise()
  .query("SELECT 1")
  .then(() => {
    console.log("MySQL Connected ✅");
  })
  .catch((err) => {
    console.log("DB Warning:", err.message || err);
  });

module.exports = db;