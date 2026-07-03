const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./websites.db');

db.serialize(() => {
    db.run(`ALTER TABLE websites ADD COLUMN created_at DATETIME`, (err) => {
        console.log('created_at:', err ? err.message : 'ok');
        db.run(`UPDATE websites SET created_at = datetime('now') WHERE created_at IS NULL`, (err2) => {
            console.log('backfill:', err2 ? err2.message : 'ok');
            db.close();
        });
    });
});
