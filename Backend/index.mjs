import express from "express";
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import {v4 as generatePassword} from 'uuid';
import cors from "cors";
import dotenv from 'dotenv';

dotenv.config();

const allowedOrigin = process.env.FRONTEND_URL || '*';
const corsOptions = { origin: allowedOrigin, credentials: true, optionsSuccessStatus: 200 };

// Create app and middleware first
const app = express();
app.use(express.json());
app.use(cors(corsOptions));

// setting path to database
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '/taskListDatabase.db');
let db = null;

const convertSnakeCaseToCamelCase = (array) => {
    return array.map((eachItem) => ({
        id: eachItem.id,
        taskDetail: eachItem.task_detail,
        lastDate: eachItem.last_date
    }));
}

async function databaseSetup () {
    try {
        db = await open({ filename: dbPath, driver: sqlite3.Database });

        // Ensure the Task table exists on startup
        const createTableQuery = `
        CREATE TABLE IF NOT EXISTS Task (
            id TEXT PRIMARY KEY,
            task_detail TEXT,
            last_date TEXT
        );`;
        await db.exec(createTableQuery);
        console.log("database initialized — Task table is ready");

        // Seed sample data if table is empty (SEED_DB=false to disable)
        try {
            const row = await db.get(`SELECT COUNT(*) as count FROM Task;`);
            const count = (row && row.count) ? row.count : 0;
            const seedEnabled = (process.env.SEED_DB || 'true').toString().toLowerCase() !== 'false';
            if (seedEnabled && count === 0) {
                const sampleTasks = [
                    { id: generatePassword(), task_detail: 'Welcome! Add your first task.', last_date: '2025-12-31' },
                    { id: generatePassword(), task_detail: 'Example: try update & delete', last_date: '2026-01-05' }
                ];
                const insert = `INSERT INTO Task (id, task_detail, last_date) VALUES (?, ?, ?);`;
                for (const t of sampleTasks) {
                    await db.run(insert, [t.id, t.task_detail, t.last_date]);
                }
                console.log('Inserted sample tasks into DB');
            }
        } catch (seedErr) {
            console.warn('Seeding skipped/failed:', seedErr.message);
        }

        const port = process.env.SERVER_PORT || 8082;
        app.listen(port, '0.0.0.0', () => console.log(`server listening on port ${port}`));
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

// initialize DB and start server
databaseSetup();

// Health check
app.get('/health', (req, res) => res.json({status: 'ok'}));

// Keep /createTable for backward compatibility but make it idempotent
app.get('/createTable', async (req, res) => {
    try {
        const createTableQuery = `
        CREATE TABLE IF NOT EXISTS Task (
            id TEXT PRIMARY KEY,
            task_detail TEXT,
            last_date TEXT
        );`;
        await db.exec(createTableQuery);
        res.status(201).json({message: 'table created'});
    } catch (e) {
        console.error(e.message);
        res.status(500).json({error: e.message});
    }
});

app.post('/insertData', async (req, res) => {
    try {
        const {taskDetail, lastDate} = req.body;
        const id = generatePassword();
        await db.run(`INSERT INTO Task (id, task_detail, last_date) VALUES (?, ?, ?);`, [id, taskDetail, lastDate]);
        const data = await db.all(`SELECT * FROM Task ORDER BY last_date ASC;`);
        res.status(201).json(convertSnakeCaseToCamelCase(data));
    } catch (e) {
        console.error(e.message);
        res.status(500).json({error: e.message});
    }
});

app.get('/printTable', async (req, res) => {
    try {
        const data = await db.all(`SELECT * FROM Task ORDER BY last_date ASC;`);
        res.json(convertSnakeCaseToCamelCase(data));
    } catch (e) {
        console.error(e.message);
        res.status(500).json({error: e.message});
    }
});

app.put('/change/task/:taskId', async (req, res) => {
    try {
        const {taskId} = req.params;
        const {taskDetail, lastDate} = req.body;
        await db.run(`UPDATE Task SET task_detail = ?, last_date = ? WHERE id = ?;`, [taskDetail, lastDate, taskId]);
        const data = await db.all(`SELECT * FROM Task ORDER BY last_date ASC;`);
        res.json(convertSnakeCaseToCamelCase(data));
    } catch (e) {
        console.error(e.message);
        res.status(500).json({error: e.message});
    }
});

app.delete('/delete/task/:taskId', async (req, res) => {
    try {
        const {taskId} = req.params;
        await db.run(`DELETE FROM Task WHERE id = ?;`, [taskId]);
        const data = await db.all(`SELECT * FROM Task ORDER BY last_date ASC;`);
        res.json(convertSnakeCaseToCamelCase(data));
    } catch (e) {
        console.error(e.message);
        res.status(500).json({error: e.message});
    }
});