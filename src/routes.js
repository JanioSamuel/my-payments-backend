const express = require('express');
const routes = express.Router();
const PaymentController = require('./controllers/PaymentController');

routes.post('/payments', PaymentController.index);

module.exports = routes;