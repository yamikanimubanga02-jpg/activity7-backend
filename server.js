const express = require('express');
const cors = require('cors');
const path = require('path');
const timetableRoutes = require('./routes/timetable');

const app = express(); // 1. Initialize Express

// --- MIDDLEWARE (TOP) ---
app.use(cors());
app.use(express.json());

// Instruct Express to serve static files from the 'frontend' folder
app.use(express.static(path.join(__dirname, '../frontend')));

// --- API ROUTES (MIDDLE) ---
app.use('/api/timetable', timetableRoutes);

// --- RENDERING PROCEDURE (BEFORE LISTEN) ---
app.get('/', (req, res) => {
    res.send('Server is running');
});

// ==========================================
// --- APP.LISTEN BLOCK IS HERE (AT THE VERY BOTTOM) ---
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});