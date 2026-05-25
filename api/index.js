// Função serverless única para servir o backend Express
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { db } = require('../api-server/dist/prisma.js');

// Importar rotas
const authRouter = require('../api-server/dist/routes/auth.js');
const clientesRouter = require('../api-server/dist/routes/clientes.js');
const produtosRouter = require('../api-server/dist/routes/produtos.js');
const usuariosRouter = require('../api-server/dist/routes/usuarios.js');
const orcamentosRouter = require('../api-server/dist/routes/orcamentos.js');
const vendasRouter = require('../api-server/dist/routes/vendas.js');
const osRouter = require('../api-server/dist/routes/os.js');
const financeiroRouter = require('../api-server/dist/routes/financeiro.js');
const dashboardRouter = require('../api-server/dist/routes/dashboard.js');
const notificacoesRouter = require('../api-server/dist/routes/notificacoes.js');
const healthRouter = require('../api-server/dist/routes/health.js');

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Rotas
app.use('/api', authRouter);
app.use('/api', clientesRouter);
app.use('/api', produtosRouter);
app.use('/api', usuariosRouter);
app.use('/api', orcamentosRouter);
app.use('/api', vendasRouter);
app.use('/api', osRouter);
app.use('/api', financeiroRouter);
app.use('/api', dashboardRouter);
app.use('/api', notificacoesRouter);
app.use('/api', healthRouter);

// Exportar como handler da Vercel
module.exports = app;
