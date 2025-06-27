// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors'); // Importa la librería CORS
const path = require('path'); // Importa el módulo path para trabajar con rutas de archivos

const app = express();
const PORT = 3000; // Puedes cambiar el puerto si es necesario

// --- Middleware para servir archivos estáticos ---
// Esto le dice a Express que sirva todos los archivos dentro de la carpeta 'public'
// cuando se solicite la ruta raíz o cualquier ruta que no sea de API.
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para habilitar CORS (Cross-Origin Resource Sharing)
// Esto permite que tu frontend (que se ejecuta en un "origen" diferente, ej. un archivo local)
// pueda comunicarse con este servidor.
app.use(cors());

// Middleware para parsear cuerpos de peticiones JSON
app.use(express.json());

// Conexión a la base de datos SQLite
// Se crea un archivo 'alaska_fashion.db' en la misma carpeta del servidor.
const db = new sqlite3.Database('./alaska_fashion.db', (err) => {
    if (err) {
        console.error('Error abriendo la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        // Crear tablas si no existen
        db.serialize(() => {
            // Tabla de Ventas (Boletas)
            db.run(`CREATE TABLE IF NOT EXISTS sales (
                id TEXT PRIMARY KEY,
                date TEXT,
                seller TEXT,
                originalAmount REAL,
                currency TEXT,
                paymentMethod TEXT,
                paseAmount REAL,
                paseCurrency TEXT,
                netAmount REAL,
                netAmountArs REAL,
                commissionRate REAL,
                grossCommissionArs REAL,
                commissionDepositRate REAL,
                commissionDepositArs REAL,
                commissionArs REAL,
                type TEXT
            )`);
            // Tabla de Cotizaciones
            db.run(`CREATE TABLE IF NOT EXISTS exchange_rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usdToArs REAL,
                pygToArs REAL,
                brlToArs REAL,
                lastUpdated TEXT
            )`);
            // Tabla de Vendedores
            db.run(`CREATE TABLE IF NOT EXISTS sellers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE
            )`);

            // Insertar cotizaciones iniciales si la tabla está vacía
            db.get(`SELECT COUNT(*) as count FROM exchange_rates`, (err, row) => {
                if (err) {
                    console.error('Error al verificar cotizaciones iniciales:', err.message);
                    return;
                }
                if (row.count === 0) {
                    db.run(`INSERT INTO exchange_rates (usdToArs, pygToArs, brlToArs, lastUpdated) VALUES (?, ?, ?, ?)`,
                        [1000, 7692.31, 200, new Date().toISOString()],
                        function(err) {
                            if (err) {
                                console.error('Error insertando cotizaciones iniciales:', err.message);
                            } else {
                                console.log('Cotizaciones iniciales insertadas.');
                            }
                        }
                    );
                }
            });
        });
    }
});

// --- API Endpoints ---

// Ventas (Sales)
// GET all sales
app.get('/api/sales', (req, res) => {
    db.all(`SELECT * FROM sales ORDER BY date DESC, id DESC`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// POST a new sale
app.post('/api/sales', (req, res) => {
    const sale = req.body;
    // Generar un ID único si no viene con la boleta
    sale.id = sale.id || Date.now() + '-' + Math.random().toString(36).substring(2, 9); 
    db.run(`INSERT INTO sales (id, date, seller, originalAmount, currency, paymentMethod, paseAmount, paseCurrency, netAmount, netAmountArs, commissionRate, grossCommissionArs, commissionDepositRate, commissionDepositArs, commissionArs, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [sale.id, sale.date, sale.seller, sale.originalAmount, sale.currency, sale.paymentMethod, sale.paseAmount, sale.paseCurrency, sale.netAmount, sale.netAmountArs, sale.commissionRate, sale.grossCommissionArs, sale.commissionDepositRate, sale.commissionDepositArs, sale.commissionArs, sale.type],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ id: sale.id, message: 'Sale added successfully' });
        }
    );
});

// PUT (update) a sale
app.put('/api/sales/:id', (req, res) => {
    const { id } = req.params;
    const sale = req.body;
    db.run(`UPDATE sales SET date = ?, seller = ?, originalAmount = ?, currency = ?, paymentMethod = ?, paseAmount = ?, paseCurrency = ?, netAmount = ?, netAmountArs = ?, commissionRate = ?, grossCommissionArs = ?, commissionDepositRate = ?, commissionDepositArs = ?, commissionArs = ?, type = ? WHERE id = ?`,
        [sale.date, sale.seller, sale.originalAmount, sale.currency, sale.paymentMethod, sale.paseAmount, sale.paseCurrency, sale.netAmount, sale.netAmountArs, sale.commissionRate, sale.grossCommissionArs, sale.commissionDepositRate, sale.commissionDepositArs, sale.commissionArs, sale.type, id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ message: 'Sale not found or no changes made.' });
            } else {
                res.json({ message: 'Sale updated successfully' });
            }
        }
    );
});

// DELETE a sale
app.delete('/api/sales/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM sales WHERE id = ?`, id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: 'Sale not found.' });
        } else {
            res.json({ message: 'Sale deleted successfully' });
        }
    });
});

// DELETE all sales
app.delete('/api/sales', (req, res) => {
    db.run(`DELETE FROM sales`, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'All sales deleted successfully' });
    });
});

// Cotizaciones (Exchange Rates)
// GET exchange rates
app.get('/api/rates', (req, res) => {
    // Siempre devuelve la última fila insertada (la más reciente)
    db.get(`SELECT * FROM exchange_rates ORDER BY id DESC LIMIT 1`, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            res.json({ usdToArs: row.usdToArs, pygToArs: row.pygToArs, brlToArs: row.brlToArs });
        } else {
            res.json({}); // No rates found
        }
    });
});

// POST/Update exchange rates
app.post('/api/rates', (req, res) => {
    const { usdToArs, pygToArs, brlToArs } = req.body;
    const lastUpdated = new Date().toISOString();
    // Siempre inserta una nueva fila para mantener un historial de cotizaciones
    db.run(`INSERT INTO exchange_rates (usdToArs, pygToArs, brlToArs, lastUpdated) VALUES (?, ?, ?, ?)`,
        [usdToArs, pygToArs, brlToArs, lastUpdated],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ message: 'Exchange rates updated successfully' });
        }
    );
});

// Vendedores (Sellers)
// GET all sellers
app.get('/api/sellers', (req, res) => {
    db.all(`SELECT name FROM sellers ORDER BY name ASC`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows.map(row => row.name)); // Devuelve solo los nombres
    });
});

// POST a new seller
app.post('/api/sellers', (req, res) => {
    const { name } = req.body;
    db.run(`INSERT INTO sellers (name) VALUES (?)`, name, function(err) {
        if (err) {
            // Manejar error de UNIQUE constraint (vendedor ya existe)
            if (err.message.includes('SQLITE_CONSTRAINT: UNIQUE constraint failed')) {
                res.status(409).json({ error: 'Seller already exists' });
            } else {
                res.status(500).json({ error: err.message });
            }
            return;
        }
        res.status(201).json({ message: 'Seller added successfully' });
    });
});

// DELETE a seller
app.delete('/api/sellers/:name', (req, res) => {
    const { name } = req.params;
    db.run(`DELETE FROM sellers WHERE name = ?`, name, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: 'Seller not found.' });
        } else {
            res.json({ message: 'Seller deleted successfully' });
        }
    });
});

// --- Data Backup/Restore Endpoints ---

// Export all data
app.post('/api/backup', (req, res) => {
    db.all(`SELECT * FROM sales`, (errSales, salesData) => {
        if (errSales) return res.status(500).json({ error: errSales.message });

        db.all(`SELECT * FROM exchange_rates ORDER BY id DESC`, (errRates, ratesData) => {
            if (errRates) return res.status(500).json({ error: errRates.message });

            db.all(`SELECT name FROM sellers`, (errSellers, sellersData) => {
                if (errSellers) return res.status(500).json({ error: errSellers.message });

                const backupData = {
                    sales: salesData,
                    exchangeRates: ratesData.length > 0 ? { usdToArs: ratesData[0].usdToArs, pygToArs: ratesData[0].pygToArs, brlToArs: ratesData[0].brlToArs } : {},
                    predefinedSellers: sellersData.map(s => s.name)
                };
                res.json(backupData);
            });
        });
    });
});

// Import all data (Overwrites existing data)
app.post('/api/restore', (req, res) => {
    const { sales, exchangeRates, predefinedSellers } = req.body;

    // Start a transaction for atomicity
    db.serialize(() => {
        db.run('BEGIN TRANSACTION;');

        // Clear existing data
        db.run(`DELETE FROM sales`, (err) => {
            if (err) { db.run('ROLLBACK;'); return res.status(500).json({ error: 'Error clearing sales: ' + err.message }); }
        });
        db.run(`DELETE FROM exchange_rates`, (err) => {
            if (err) { db.run('ROLLBACK;'); return res.status(500).json({ error: 'Error clearing rates: ' + err.message }); }
        });
        db.run(`DELETE FROM sellers`, (err) => {
            if (err) { db.run('ROLLBACK;'); return res.status(500).json({ error: 'Error clearing sellers: ' + err.message }); }
        });

        // Insert new sales
        const insertSaleStmt = db.prepare(`INSERT INTO sales (id, date, seller, originalAmount, currency, paymentMethod, paseAmount, paseCurrency, netAmount, netAmountArs, commissionRate, grossCommissionArs, commissionDepositRate, commissionDepositArs, commissionArs, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        sales.forEach(sale => {
            insertSaleStmt.run(sale.id, sale.date, sale.seller, sale.originalAmount, sale.currency, sale.paymentMethod, sale.paseAmount, sale.paseCurrency, sale.netAmount, sale.netAmountArs, sale.commissionRate, sale.grossCommissionArs, sale.commissionDepositRate, sale.commissionDepositArs, sale.commissionArs, sale.type);
        });
        insertSaleStmt.finalize();

        // Insert new exchange rates
        if (exchangeRates && exchangeRates.usdToArs && exchangeRates.pygToArs && exchangeRates.brlToArs) {
            const lastUpdated = new Date().toISOString();
            db.run(`INSERT INTO exchange_rates (usdToArs, pygToArs, brlToArs, lastUpdated) VALUES (?, ?, ?, ?)`,
                [exchangeRates.usdToArs, exchangeRates.pygToArs, exchangeRates.brlToArs, lastUpdated]);
        }

        // Insert new sellers
        const insertSellerStmt = db.prepare(`INSERT INTO sellers (name) VALUES (?)`);
        predefinedSellers.forEach(sellerName => {
            insertSellerStmt.run(sellerName);
        });
        insertSellerStmt.finalize();

        db.run('COMMIT;', (err) => {
            if (err) {
                res.status(500).json({ error: 'Error committing transaction: ' + err.message });
            } else {
                res.json({ message: 'Data restored successfully.' });
            }
        });
    });
});


// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor Node.js ejecutándose en http://localhost:${PORT}`);
    console.log(`Para acceder desde otra computadora en la misma red, usa http://[IP_DE_LA_COMPUTADORA_SERVIDOR]:${PORT}`);
});
