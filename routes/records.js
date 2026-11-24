// The five record routes. All input is validated here, never trusted from the frontend.
const router = require("express").Router();
const pool = require("../db");

const STATUSES = ["Pending", "In progress", "Completed"];
const MAX_ID = 2147483647; // largest value of a PostgreSQL integer id
const COLUMNS = "id, title, category, description, status";

/** Build an error that the error middleware turns into a JSON response. */
function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/** Id must be a positive whole number. A valid but impossible id simply does not exist. */
function parseId(raw) {
  if (!/^[1-9]\d*$/.test(raw)) throw httpError(400, "Id must be a positive whole number.");
  const id = Number(raw);
  if (id > MAX_ID) throw httpError(404, "Record not found.");
  return id;
}

/** Check the four editable fields and return trimmed values. Any client id is ignored. */
function validateBody(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw httpError(400, "Request body must be a JSON object.");
  }
  const rules = [
    ["title", "Title", 3, 80],
    ["category", "Category", 2, 40],
    ["description", "Description", 5, 300],
  ];
  const clean = {};
  for (const [key, label, min, max] of rules) {
    if (typeof body[key] !== "string") throw httpError(400, `${label} is required and must be text.`);
    const value = body[key].trim();
    const length = [...value].length;
    if (length < min || length > max) throw httpError(400, `${label} must have ${min} to ${max} characters.`);
    clean[key] = value;
  }
  const status = typeof body.status === "string" ? body.status.trim() : "";
  if (!STATUSES.includes(status)) throw httpError(400, "Status must be Pending, In progress or Completed.");
  clean.status = status;
  return clean;
}

const notFound = () => httpError(404, "Record not found.");

// GET /api/records
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT ${COLUMNS} FROM records ORDER BY id`);
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/records/:id
router.get("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const result = await pool.query(`SELECT ${COLUMNS} FROM records WHERE id = $1`, [id]);
    if (result.rowCount === 0) throw notFound();
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/records
router.post("/", async (req, res, next) => {
  try {
    const r = validateBody(req.body);
    const result = await pool.query(
      `INSERT INTO records (title, category, description, status)
       VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [r.title, r.category, r.description, r.status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PUT /api/records/:id (replaces all four fields; never creates a missing record)
router.put("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const r = validateBody(req.body);
    const result = await pool.query(
      `UPDATE records SET title = $1, category = $2, description = $3, status = $4
       WHERE id = $5 RETURNING ${COLUMNS}`,
      [r.title, r.category, r.description, r.status, id]
    );
    if (result.rowCount === 0) throw notFound();
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/records/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const result = await pool.query("DELETE FROM records WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) throw notFound();
    res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
