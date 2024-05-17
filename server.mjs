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
// import http from "http";
// import fetch from "node-fetch"; // has to be npm installed
import passport from "passport";
// import path from "path";
import session from "express-session";
import {Strategy as LocalStrategy} from "passport-local";

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
    constructor(firstname, lastname, address, town, postal_code, birthdate, phone, email, password) {
        this.firstname = firstname;
        this.lastname = lastname;
        this.address = address;
        this.town = town;
        this.postal_code = postal_code;
        this.birthdate = birthdate;
        this.phone = phone;
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

    exists(email, callback) {
        const statement = sql.prepare("select email from user where email = ?")
        let result;
        try {
            let result = statement.all(email);
            console.log("DATABASE EMAIL EXISTS", email, "\nRESULT", result);
            callback(null, result.length === 1);
        } catch (error) {
            callback(error, null);
        }
    }

    getPass(email) {
        return sql.prepare("select password from user where email = ?").all(email)[0].password;
    }

    saveNewUser(user) {
        const statement = sql.prepare("insert into user (firstname, lastname, address, town, postal_code, " +
              "birthdate, phone, email, password) values (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        try {
            statement.run(user.firstname, user.lastname, user.address, user.town, user.postal_code,
                user.birthdate, user.phone, user.email, user.password);
        } catch (error) {
            console.error(error);
        }
    }
}

const database = new Database();

passport.use(new LocalStrategy({
    usernameField: "email",
    passwordField: "password"
    },
    (email, password, done) => {
        console.log("LOCAL STRATEGY", email, password);
        // return done(null, user, {message: 'Authorized'});

        database.exists(email, function (error, result) {
            if (result && !error) {
                console.log("we are in database.exists, getPass returned this: ", database.getPass(email));
                bcrypt.compare(password, database.getPass(email), (err, result) => {
                    if (err) {
                        return done(err);
                    }
                    if (!result) {
                        console.log("Incorrect password.");
                        return done(null, false, { message: 'Incorrect password.' });
                    }
                    return done(null, email);
                });
            }
        });


            // return done(null, false, { message: 'Incorrect username.' });


    }
));

passport.serializeUser((email, done) => {
    done(null, email);
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

    static login(request, response) {  // deprecated
        if (DEBUG_FUNCTION_CALL === true) console.log("API login");
        console.log(request.body);

        // if (request.body)
        response.status(204).send();
        // todo --------------------------------------------------- there must be a response, not just a OK status code
    }

    static register(request, response, next) {
        // checks if email already exists
        // https://medium.com/@jasondotparse/add-user-authentication-to-your-node-expressjs-application-using-bcrypt-81bb0f618ab3
        if (DEBUG_FUNCTION_CALL === true) console.log("API register");
        // console.log(request.body);  // todo doesn't get birth date, user type and password -> update(by bobotas): it does now!!  nice
        let email = request.body.email;
        // let emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // regular expression for email validation
                                                                               //source: https://www.geeksforgeeks.org/javascript-program-to-validate-an-email-address/
        // let isValid_email = emailPattern.test(email);

        database.exists(email, function (error, result) {
            if (result && !error) {
                response.sendStatus(412);  // todo tell frontend that user already exists
            } else next();

        });
    }

    static registerPlus(request, response) {
        // checks if password and password confirmation are the same
        // let enteredPassword = request.body.password;
        // let c_enderedPassword = request.body.confirm_password;
        if (request.body.password === request.body.confirm_password) {
            const saltRounds =  10;
            bcrypt.hash(request.body.password, saltRounds, function(err, hash) {
                let user = new User(request.body.firstname,
                                     request.body.lastname,
                                     request.body.address,
                                     request.body.town,
                                     request.body.postal_code,
                                     request.body.birthdate,
                                     request.body.phone,
                                     request.body.email,
                                     hash)
                database.saveNewUser(user); //
            })
        } else {
            response.sendStatus(413);  // todo tell frontend that passwords don't match
        }

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

router.route("/api/register").post(API.register, API.registerPlus);
router.route("/api/subscribe").post(API.subscribe);
router.route("/api/tickets-selected").post(API.ticketsSelected);
application.post("/api/login", function (request, response, next) {
    passport.authenticate("local", function (error, user, next) {
        // keepSessionInfo: true;
        if (DEBUG_FUNCTION_CALL === true) console.log("API login");
        console.log(request.body);
        if (error) {
            // return next(err);
            throw error;
        }
        if (!user) {
            return  response.status(204).send();
            // ή επιστροφή μηνύματος λάθους
        }
        request.login(user, function (error) {
            if (error) {
                throw error;
            }
            console.log("You logged in");
            console.log("SESSION: ", request.session);
            console.log("REFERER: ", request.get("referer"));
            // response.session.signed = true;
            return response.sendStatus(200) // ή οποιαδήποτε άλλη διαδρομή θέλετε να ανακατευθύνετε τον χρήστη
        });
    })(request, response, next);
});

// ================================================== RUN APP =========================================================

const server = application.listen(PORT, () => { console.log(`Server running on http://127.0.0.1:${PORT}`) });
