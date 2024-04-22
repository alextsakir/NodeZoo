const express = require('express');
const path = require('path');
const handlebars = require('handlebars');
const router = express.Router();

router.get('/',
    (req, res, next) => {
        // res.render('index', {
        //     style: 'style.css',
        //     title: 'Home',
        //     // signedIn: req.session.signedIn,
        // });
        // res.end();

        res.sendFile(path.join(__dirname + '/../views/' + 'index.html'))
    });

router.get('/home', (req, res, next) => {
    res.redirect('/');
});

router.get('/index', (req, res, next) => {
    res.redirect('/');
});

router.get('/april', (req, res, next) => {
    res.render('/april', {style: "theme.css"});
});

module.exports = router;
