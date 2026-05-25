// Função serverless única para servir o backend Express
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Importar o app compilado
const app = require('../api-server/dist/index.mjs').default;

// Exportar como handler da Vercel
module.exports = app;
