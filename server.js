const express = require('express');
const handlebars = require('express-handlebars');

const path = require('path');
const http = require('http');
const PORT = 3000;
const fs = require('fs');

const hbs = handlebars.create({
    defaultLayout: 'base',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    extname: '.hbs',

    // helpers: require('./controllers/helpers.js')
});

const app = express();
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

const server = http.createServer(app);
app.use(express.static(path.join(__dirname, "public")));
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use(require('./routes/route_home.js'));


