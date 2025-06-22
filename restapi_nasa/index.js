const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');

mongoose.Promise = global.Promise;

 // mongoose.connect('mongodb://localhost/nasadb', {});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

app.use('/', routes());

app.listen(5000, () => {
    console.log('Servidor escuchando en el puerto 5000');
});

