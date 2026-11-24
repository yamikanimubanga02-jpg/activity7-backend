// Creates and exports the PostgreSQL connection pool.
require("dotenv").config();
const { Pool } = require("pg");

const url = process.env.DATABASE_URL;
if (!url) console.error("DATABASE_URL is not set. Add it to .env or the host's environment settings.");

// Hosted databases need SSL; a local database does not.
const isLocal = /(localhost|127\.0\.0\.1)/.test(url || "");

const pool = new Pool({
  connectionString: url,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

// An idle connection can drop; log it instead of crashing the server.
pool.on("error", (error) => console.error("Database pool error:", error.message));

module.exports = pool;
