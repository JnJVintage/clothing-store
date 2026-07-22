const express = require('express');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. MIDDLEWARE SETUP (Everything a modern web server needs)
app.use(express.urlencoded({ extended: true })); // Parses form submissions
app.use(express.json()); // Parses JSON data
app.use(session({
    secret: 'super-secret-clothing-store-key',
    resave: false,
    saveUninitialized: true
}));

// 2. THE DATABASE (Mock database tracking persistent store data)
let storeInventory = [
    { id: 1, name: "Heavyweight Graphic Hoodie", price: 65.00, img: "👕" },
    { id: 2, name: "Relaxed Fit Cargo Pants", price: 80.00, img: "👖" },
    { id: 3, name: "Classic Boxy Tee", price: 35.00, img: "👔" }
];

let storeSettings = {
    storeName: "THREADS & CO.",
    heroTitle: "Season Essentials",
    heroSubtitle: "Premium streetwear, engineered for daily comfort."
};

// 3. SECURE ADMINISTRATIVE PRIVILEGES
const ADMIN_PASSWORD = "adminsecret2026";

function checkAdminPrivileges(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next(); // Authorization allowed, proceed to admin request
    }
    res.status(403).send("Access Denied: You do not have administrator permissions to edit this website.");
}

// 4. FRONT-END HTML INTERFACE DESIGN WITH BACKEND INJECTION
const renderHTML = (sessionData) => {
    const cartCount = sessionData.cart ? sessionData.cart.length : 0;
    const isAdmin = sessionData.isAdmin || false;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${storeSettings.storeName}</title>
        <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 0; background: #f9f9f9; color: #222; }
            nav { background: #fff; padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; }
            .logo { font-size: 1.5rem; font-weight: bold; }
            .nav-actions a, .nav-actions button { background: #222; color: #fff; border: none; padding: 10px 15px; text-decoration: none; border-radius: 4px; cursor: pointer; margin-left: 10px; font-weight: bold; }
            .container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
            .hero { text-align: center; margin-bottom: 50px; background: #fff; padding: 40px; border-radius: 8px; border: 1px solid #eee; }
            .products-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; }
            .product-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center; position: relative; }
            .prod-icon { font-size: 4rem; margin: 20px 0; }
            .price { font-size: 1.2rem; font-weight: bold; color: #666; margin: 10px 0; }
            .btn-buy { width: 100%; background: #222; color: white; border: none; padding: 12px; border-radius: 4px; cursor: pointer; font-weight: bold; }
            .admin-bar { background: #007bff; color: white; padding: 15px; text-align: center; font-weight: bold; }
            .admin-panel { background: #e3f2fd; border: 2px dashed #007bff; padding: 20px; margin-bottom: 30px; border-radius: 8px; }
            .admin-input { padding: 8px; margin: 5px; border: 1px solid #ccc; border-radius: 4px; }
            .btn-admin { background: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; }
            .btn-danger { background: #dc3545 !important; }
        </style>
    </head>
    <body>

        ${isAdmin ? `<div class="admin-bar">🛠️ Logged In As Administrator. Full Privileges Granted.</div>` : ''}

        <nav>
            <div class="logo">${storeSettings.storeName}</div>
            <div class="nav-actions">
                <span>Cart Items: <strong>${cartCount}</strong></span>
                ${isAdmin ? `<a href="/logout" class="btn-danger">Exit Admin Mode</a>` : `<a href="/login-page">Admin Login</a>`}
            </div>
        </nav>

        <div class="container">
            <!-- 5. SYSTEM ADMIN INTERFACE CONTROLS -->
            ${isAdmin ? `
                <div class="admin-panel">
                    <h3>Modify Website Global Content</h3>
                    <form action="/admin/update-store" method="POST">
                        <input class="admin-input" type="text" name="storeName" value="${storeSettings.storeName}" placeholder="Store Name">
                        <input class="admin-input" type="text" name="heroTitle" value="${storeSettings.heroTitle}" placeholder="Hero Banner Title">
                        <input class="admin-input" type="text" name="heroSubtitle" value="${storeSettings.heroSubtitle}" placeholder="Hero Subtitle" style="width:300px;">
                        <button class="btn-admin" type="submit">Save Changes</button>
                    </form>
                    <hr style="border:0; border-top:1px solid #90caf9; margin:20px 0;">
                    <h3>Upload New Inventory Item</h3>
                    <form action="/admin/add-product" method="POST">
                        <input class="admin-input" type="text" name="name" placeholder="Item Name" required>
                        <input class="admin-input" type="number" step="0.01" name="price" placeholder="Price ($)" required>
                        <input class="admin-input" type="text" name="img" placeholder="Emoji Icon (e.g. 🧥)" required>
                        <button class="btn-admin" type="submit">Publish to Live Store</button>
                    </form>
                </div>
            ` : ''}

            <!-- Banner Showcase -->
            <div class="hero">
                <h1>${storeSettings.heroTitle}</h1>
                <p>${storeSettings.heroSubtitle}</p>
            </div>

            <!-- Customer Facing Catalog -->
            <main class="products-grid">
                ${storeInventory.map(item => `
                    <div class="product-card">
                        <div class="prod-icon">${item.img}</div>
                        <h3>${item.name}</h3>
                        <div class="price">$${item.price.toFixed(2)}</div>
                        
                        <!-- Customer Interaction -->
                        <form action="/add-to-cart" method="POST">
                            <input type="hidden" name="productId" value="${item.id}">
                            <button type="submit" class="btn-buy">Add to Cart</button>
                        </form>

                        <!-- Admin Privilege: Delete Item completely from live database -->
                        ${isAdmin ? `
                            <form action="/admin/delete-product" method="POST" style="margin-top:10px;">
                                <input type="hidden" name="productId" value="${item.id}">
                                <button type="submit" class="btn-buy btn-danger">Delete Item Permanently</button>
                            </form>
                        ` : ''}
                    </div>
                `).join('')}
            </main>
        </div>
    </body>
    </html>`;
};

// 6. ROUTE ACTIONS (Handling actions between Admin and Customer)

// Homepage Display
app.get('/', (req, res) => {
    res.send(renderHTML(req.session));
});

// Customer Feature: Add to Checkout Cart
app.post('/add-to-cart', (req, res) => {
    if (!req.session.cart) req.session.cart = [];
    req.session.cart.push(req.body.productId);
    res.redirect('/');
});

// Render Secure Admin Login Form
app.get('/login-page', (req, res) => {
    res.send(`
        <div style="max-width:300px; margin:100px auto; text-align:center; font-family:sans-serif;">
            <h2>Admin Security Vault</h2>
            <form action="/login" method="POST">
                <input type="password" name="password" placeholder="Enter System Password" style="padding:10px; width:100%; margin-bottom:10px;"><br>
                <button type="submit" style="padding:10px 20px; background:#007bff; color:white; border:none; cursor:pointer;">Authenticate</button>
            </form>
            <p><a href="/">Back to Store</a></p>
        </div>
    `);
});

// Process Credentials Verification
app.post('/login', (req, res) => {
    if (req.body.password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.redirect('/');
    } else {
        res.send("Incorrect system access password. <a href='/login-page'>Try again</a>");
    }
});

// Admin Log Out
app.get('/logout', (req, res) => {
    req.session.isAdmin = false;
    res.redirect('/');
});

// Admin Control Action: Change Store Text
app.post('/admin/update-store', checkAdminPrivileges, (req, res) => {
    storeSettings.storeName = req.body.storeName;
    storeSettings.heroTitle = req.body.heroTitle;
    storeSettings.heroSubtitle = req.body.heroSubtitle;
    res.redirect('/');
});

// Admin Control Action: Append New Item to Production Database
app.post('/admin/add-product', checkAdminPrivileges, (req, res) => {
    const newItem = {
        id: storeInventory.length + 1,
        name: req.body.name,
        price: parseFloat(req.body.price),
        img: req.body.img
    };
    storeInventory.push(newItem);
    res.redirect('/');
});

// Admin Control Action: Erase Product completely
app.post('/admin/delete-product', checkAdminPrivileges, (req, res) => {
    const prodId = parseInt(req.body.productId);
    storeInventory = storeInventory.filter(item => item.id !== prodId);
    res.redirect('/');
});
// Serve Main Store Homepage
app.get('/', (req, res) => {
    res.send('<h1>J N J Vintages is Live!</h1>');
});
// Start the Backend Web Server
app.listen(PORT, () => {
    console.log(`Application running securely at http://localhost:${PORT}`);
});
