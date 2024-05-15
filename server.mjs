//                                               Zoo Website Server
//                                                   Spring 2024

"use strict";

import cookieParser from "cookie-parser";
import db from "better-sqlite3";
import sqliteStore from 'connect-sqlite3';
import express from "express";
import {engine} from "express-handlebars";
import bcrypt from "bcrypt";
import fs from "fs";
import http from "http";
import fetch from "node-fetch"; // has to be npm installed
import path from "path";
import session from "express-session";

// ================================================ CONFIGURATION =====================================================

const Locale = Object.freeze({EN: Symbol("ENGLISH"), GR: Symbol("GREEK")});
const DEBUG_FUNCTION_CALL = true; const LOCALE = Locale.EN;

const application = express();
const sql = new db("model/storage.sqlite", {fileMustExist: true});
// application.use(express.static(path.join(__dirname, "public")));
// todo ------------------- __dirname is available only in CommonJS, in ES we have to set it manually, I'll do it later
application.use(express.static("public")); // -------------------------------------------------- static files directory
application.use("/images", express.static("images")); // --------------------------------------------- images directory
application.use(cookieParser());
application.use(express.json()); // ------------------------------------ parse incoming JSON data in the request bodies
application.use(express.urlencoded({extended: true})); // ------------------- specify library to parse URL-encoded data
application.engine("hbs", engine({extname: "hbs"}));
// ---------------------------------------- specifies Handlebars extension to 'hbs', otherwise it would be *.handlebars
application.set("view engine", "hbs"); // todo ------------------------------------------------- do we need both lines?
const router = express.Router();
application.use(router);  // forgot to write it, I was crying for an hour
application.use(passport.initialize());
const sqliteStoreSession = sqliteStore(session);
application.use(session({
    secret: "secret",
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24},
    resave: false,
    store: new sqliteStoreSession({db: 'session.sqlite',dir: './model/sessions'})
}));
const PORT = process.env.PORT || "3000"; // env file to store db credentials and port

import passport from "passport";
import {Strategy as LocalStrategy} from "passport-local";

// ================================================== DATABASE ========================================================

class Ticket {
    constructor(name_GR, name_EN, description, price) {
        this.name_GR = name_GR; this.name_EN = name_EN; this.description = description; this.price = price;
    }

    name() {
        if (LOCALE.valueOf() === Locale.GR.valueOf()) return this.name_GR;
        else if (LOCALE.valueOf() === Locale.EN.valueOf()) return this.name_EN;
        else console.error("Please set a Locale")
    }
}

class User {
    constructor(firstname, lastname, address, city, postal_code, birthdate, telephone, email, password) {
        this.firstname = firstname;
        this.lastname = lastname;
        this.address = address;
        this.city = city;
        this.postal_code = postal_code;
        this.birthdate = birthdate;
        this.telephone = telephone;
        this.email = email;  // Primary Key
        this.password = password;
    }
}

class Database {

    tickets = [
        new Ticket("Παιδικό", "Child", "child ticket", 5),
        new Ticket("Ενήλικας", "Adult", "adult ticket", 12),
        new Ticket("ΑμεΑ", "Disabled", "disabled ticket", 8)
    ];

    users = [];

    saveSubscription(user) {
        // todo-- for now it only appends the users array of class Database
        this.users.push(user);
        console.log("The users are: ");
        console.log(this.users);

    }
}

const database = new Database();

passport.use(new LocalStrategy({
    usernameField: "email",
    passwordField: "password"
    },
    (email, password, done) => {
        const user = database.users.find(user => user.email === email);
        console.log("Local Strategy");
        console.log(user);
        // return done(null, user, {message: 'Authorized'});
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                return done(err);
            }
            if (!result) {
                console.log("Incorrect password.");
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        });
    }
));

passport.serializeUser((user, done) => {
    done(null, user.email);
});
passport.deserializeUser((email, done) => {
    const user = database.users.find(user => user.email === email);
    done(null, user);
});

// =================================================== ROUTER =========================================================
// ================================================ GET METHODS =======================================================

function index(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: index rendered");
    console.log("SESSION: ", request.session);
    response.render("index", {layout: "main", title: "Patras Zoo"});
    // ------------------------------------------------------------- with layout you can change the Handlebars template
}

function april(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: april rendered");
    response.render("april", {layout: "main", title: "April"});
}

function about(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: about rendered");
    response.render("about", {layout: "main", title: "About"});
}

function animals(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: animals rendered"); console.log(request.session);
        fs.readdir('images', (err, files) => {
        if (err) {
            console.error('Error reading images directory:', err);
            response.status(500).send('Internal Server Error');
        } else {
            // Render the gallery page and pass the list of image files to it
            let images = files.map(fileName => fileName.replace(/\.jpg$/, ''));
            const imagesToRemove = ['gallery-1','gallery-2','gallery-3','gallery-4','home'];
            images = images.filter(item => !imagesToRemove.includes(item));
            // console.log(images);
            let animals = sql.prepare("select name, description from animal").all();
            // console.log(animals);
            response.render('animals', {layout: "main", title: "Animals", animals });
        }
    });
}

function contact(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: contact rendered");
    response.render("contact", {layout: "main", title: "Contact"});
}

function dashboard(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: dashboard rendered");
    response.render("dashboard", {layout: "main", title: "Dashboard"});
}

function gallery(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: gallery rendered");
}

function login(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: login rendered");
    response.render("login", {layout: "main", title: "Login"});
}

function payment(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: payment rendered");
    response.render("payment", {layout: "main", title: "Payment"}); // https://codepen.io/quinlo/pen/YONMEa
}

function register(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: register rendered");
    response.render("register", {layout: "main", title: "Register"});
}

function registered(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: registered rendered");
    response.render("registered", {layout: "main", title: "Registered"});
}

function tickets(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: tickets rendered");
    // console.log(database.tickets);
    response.render("tickets", {layout: "main", title: "Tickets", tickets: database.tickets});
}

router.route("/").get(index);  // preserve alphabetical order!
router.route("/about").get(about);
router.route("/animals").get(animals);
router.route("/april").get(april);
router.route("/contact").get(contact);
router.route("/dashboard").get(dashboard);
router.route("/gallery").get(gallery);
router.route("/hello").get((request, response) => response.send("Hello World!"));
router.route("/home").get(index);  // -------------------------------------------------------------------------- unused
router.route("/index").get(index);
router.route("/login").get(login);
router.route("/payment").get(payment);
router.route("/register").get(register);
router.route("/registered").get(registered);
router.route("/tickets").get(tickets);

// ==================================================== API ===========================================================

class API {

    static animalDescription(request, response) {
        if (DEBUG_FUNCTION_CALL === true) console.log("API animal description");
        console.log(request.body);
    }

    static login(request, response) {
        if (DEBUG_FUNCTION_CALL === true) console.log("API login");
        console.log(request.body);

        // if (request.body)
        response.status(204).send();
        // todo --------------------------------------------------- there must be a response, not just a OK status code
    }

    static register(request, response) {
        // https://medium.com/@jasondotparse/add-user-authentication-to-your-node-expressjs-application-using-bcrypt-81bb0f618ab3
        if (DEBUG_FUNCTION_CALL === true) console.log("API register");
        console.log("got here");
        // console.log(request.body);  // todo doesn't get birth date, user type and password -> update(by bobotas): it does now!!  nice
        let email = request.body.email;
        let emailPattern =  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // regular expression for email validation
                                                                                //source: https://www.geeksforgeeks.org/javascript-program-to-validate-an-email-address/
        let isValid_email = emailPattern.test(email);
        let enteredPassword = request.body.password;
        let c_enderedPassword = request.body.confirm_password;

        if(isValid_email){
            if (enteredPassword === c_enderedPassword) {
                const saltRounds =  10
                bcrypt.hash(enteredPassword, saltRounds, function(err, hash) {
                    let user = new User(request.body.first_name,
                                         request.body.last_name,
                                         request.body.street,
                                         request.body.town,
                                         request.body.postal_code,
                                         request.body.birthdate,
                                         request.body.phone,
                                         request.body.email,
                                         hash)
                    database.saveSubscription(user); //
                })
            } else {
                // should say sth like: "Passwords dont match" ---TODO
                response.redirect("/register");
            }
        } else {
            // should say sth like: "The email address you provided isnt valid" --TODO
            response.redirect("/register");
        }
        // console.log(email);
        // console.log(enderedPassword);
        //-------------------------------------------------
        // database.saveSubscription(request.body["email"]);
        response.redirect("/registered");
    }

    static subscribe(request, response) {
        if (DEBUG_FUNCTION_CALL === true) console.log("API subscribe");
        console.log(request.body);
        response.status(204).send();
        // response.redirect(request.route);
        // response.sendStatus(200);
    }

    static ticketsSelected(request, response) {
        if (DEBUG_FUNCTION_CALL === true) console.log("API tickets");
        console.log(request.body);
        if (request.isAuthenticated())
            response.redirect(302, "/payment");
        else response.send(404);
    }
}
// let alpha = passport.authenticate("local", {
//         successRedirect: '/index',
//         failureRedirect: '/login'
//         // failureFlash: true
//     })

router.route("/api/animal-description").get(API.animalDescription);
// router.route("/api/login").post(API.login);

router.route("/api/register").post(API.register);
router.route("/api/subscribe").post(API.subscribe);
router.route("/api/tickets-selected").post(API.ticketsSelected);
application.post("/api/login", function (request, response, next) {
    passport.authenticate("local", function (err, user, next) {
        keepSessionInfo: true;
        if (err) {
            return next(err);
        }
        if (!user) {
            return  response.status(204).send();
            ; // ή επιστροφή μηνύματος λάθους
        }
        request.login(user, function (err) {
            if (err) {
                return next(err);
            }
            console.log("You logged in");
            console.log("SESSION: ", request.session);
            return response.status(204).send(); // ή οποιαδήποτε άλλη διαδρομή θέλετε να ανακατευθύνετε τον χρήστη
        });
    })(request, response, next);
});

// ================================================== RUN APP =========================================================

const server = application.listen(PORT, () => { console.log(`Server running on http://127.0.0.1:${PORT}`) });
