"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Basic Express.js server
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = require("dotenv");
const dbConnection_1 = __importDefault(require("./config/dbConnection"));
(0, dotenv_1.configDotenv)();
const app = (0, express_1.default)();
// DB config
(0, dbConnection_1.default)(); // Uncomment this after adding connection to DB
// Middleware
app.use(express_1.default.json());
const UserRoutes_1 = __importDefault(require("./routes/UserRoutes"));
app.use('/api/Users', UserRoutes_1.default);
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
app.use('/api/products', productRoutes_1.default);
const shipmentRoutes_1 = __importDefault(require("./routes/shipmentRoutes"));
app.use('/api/shipments', shipmentRoutes_1.default);
const nfcPayloadRoutes_1 = __importDefault(require("./routes/nfcPayloadRoutes"));
app.use('/api/nfc-payloads', nfcPayloadRoutes_1.default);
// Routes (Add your routes here)
// Example: app.use('/api', require('./routes/apiRoutes'));
// Server starting
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(process.cwd(), 'index.html')); // Adjust the path to match your file's location
});
// Start the server
const PORT = 8055;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map