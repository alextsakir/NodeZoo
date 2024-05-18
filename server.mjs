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
// const router = express.Router();
// application.use(router);  // forgot to write it, I was crying for an hour

const PORT = process.env.PORT || "3000";
// passport.serializeUser((email, done) => {
//     console.log("serializeUser");
//     done(null, email);
// });

// passport.deserializeUser((email, done) => {
//     console.log("deserializeUser");
//     database.exists(email, done(null, email));
// });
// application.use(passport.authenticate('session'));
// application.use(passport.initialize());

const sqliteStoreSession = sqliteStore(session);

application.set('trust proxy', 1);
application.use(session({
    secret: "secret",
    saveUninitialized: false,
    resave: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24}
    // store: new sqliteStoreSession({db: 'session.sqlite',dir: './model/sessions'})
}));


// application.use(passport.session());
 // env file to store db credentials and port

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
            console.log("DATABASE EMAIL EXISTS", email, "\t\t\tRESULT", result.length === 1);
            callback(null, result.length === 1);
        } catch (error) {
            callback(error, null);
        }
    }

    checkUser(email, password, callback) {
        let user;

        try {
            const statement = sql.prepare(('Select * from USER where email = ?'));
            user = statement.get(email);
            if(user){
                const match  = bcrypt.compareSync(password, user.password);
                if (match){
                    callback(null, user);
                }
                else {
                    callback('Wrong Password', null);
                }
            } else {
                callback('User not found', null);
            }
        }
        catch (error) {
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

// =================================================== ROUTER =========================================================
// ================================================ GET METHODS =======================================================

function index(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: index rendered");
    if (request.session.signedIn === undefined)
        request.session.signedIn = false;

    response.render("index", {layout: "main", title: "Patras Zoo", signedIn: request.session.signedIn});
    console.log("SESSION: ", request.session);
    // ------------------------------------------------------------- with layout you can change the Handlebars template
}

function april(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: april rendered");
    response.render("april", {layout: "main", title: "April", signedIn: request.session.signedIn});
}

function about(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: about rendered");
    response.render("about", {layout: "main", title: "About", signedIn: request.session.signedIn});
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
            response.render("animals", {layout: "main", title: "Animals", animals, signedIn: request.session.signedIn});
        }
    });
}

function contact(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: contact rendered");
    response.render("contact", {layout: "main", title: "Contact", signedIn: request.session.signedIn});
}

function dashboard(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: dashboard rendered");
    response.render("dashboard", {layout: "main", title: "Dashboard", signedIn: request.session.signedIn});
}

function gallery(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: gallery rendered");
}

function login(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: login rendered");
    response.render("login", {layout: "main", title: "Login", signedIn: request.session.signedIn});
}

function payment(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: payment rendered");
    response.render("payment", {layout: "main", title: "Payment", signedIn: request.session.signedIn}); // https://codepen.io/quinlo/pen/YONMEa
}

function register(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: register rendered");
    response.render("register", {layout: "main", title: "Register", signedIn: request.session.signedIn});
}

function registered(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: registered rendered");
    response.render("registered", {layout: "main", title: "Registered", signedIn: request.session.signedIn});
}

function tickets(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: tickets rendered");
    // console.log(database.tickets);
    console.log("SESSION: ", request.session);
    response.render("tickets", {layout: "main", title: "Tickets", tickets: database.tickets, signedIn: request.session.signedIn});
}

application.get('/', index);  // preserve alphabetical order!
application.get("/about", about);
application.get("/animals", animals);
application.get("/april", april);
application.get("/contact", contact);
application.get("/dashboard", dashboard);
application.get("/gallery", gallery);
application.get("/hello", (request, response) => response.send("Hello World!"));
application.get("/home", index);  // -------------------------------------------------------------------------- unused
application.get("/index", index);
application.get("/login", login);
application.get("/payment", payment);
application.get("/register", register);
application.get("/registered", registered);
application.get("/tickets", tickets);

// ==================================================== API ===========================================================

class API {

    static animalDescription(request, response) {
        if (DEBUG_FUNCTION_CALL === true) console.log("API animal description");
        console.log(request.body);
    }

    // static login(request, response) {  // deprecated
    //     if (DEBUG_FUNCTION_CALL === true) console.log("API login");
    //     console.log(request.body);
    //
    //     // if (request.body)
    //     response.status(204).send();
    //     // todo --------------------------------------------------- there must be a response, not just a OK status code
    // }

    static register(request, response, next) {
        // checks if email already exists
        // https://medium.com/@jasondotparse/add-user-authentication-to-your-node-expressjs-application-using-bcrypt-81bb0f618ab3
        if (DEBUG_FUNCTION_CALL === true) console.log("API register");
        // console.log(request.body);  // todo doesn't get birth date, user type and password -> update(by bobotas): it does now!!  nice

        console.log("EMAIL TO REGISTER", request.body.email);

        database.exists(request.body.email, function (error, result) {
            if (result && !error) {
                console.log("user already exists");
                response.sendStatus(412);  // todo tell them that user already exists
            } else {
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
                        database.saveNewUser(user); console.log(user.email, "IS PUT INTO DATABASE");
                    })
                } else {
                    console.log("problem with password")
                    response.sendStatus(413);  // tell them that passwords don't match
                }
                response.sendStatus(200); // tells them they successfully registered
            }
        });
    }

    static subscribe(request, response) {
        if (DEBUG_FUNCTION_CALL === true) console.log("API subscribe");
        console.log(request.body);
        response.sendStatus(204);  // fixme show dialog here
        // response.redirect(request.route);
        // response.sendStatus(200);
    }

    static ticketsSelected(request, response) {
        if (DEBUG_FUNCTION_CALL === true) console.log("API tickets");
        console.log(request.body);
        if (request.session.signedIn)
            response.sendStatus(200);
        else response.sendStatus(300);
    }
}

application.get("/api/animal-description", API.animalDescription);
application.post("/api/register", API.register);
application.post("/api/subscribe", API.subscribe);
application.post("/api/tickets-selected", API.ticketsSelected);
application.post("/api/login", (request, response) => {
    console.log(request.body.email, request.body.password, request.body.wantToPay);
    database.checkUser(request.body.email, request.body.password, (message, user) => {
        if (message) {
            console.log(message);
            // response.redirect(request.get('referer'));
        } else {
            if (!user) {
                request.session.alert_message = 'Wrong email or password';
                response.sendStatus(205);
            } else {
                request.session.signedIn = true;
                request.session.email = user.email;
                // console.log("Success with session:"+ request.session);
                if (request.body.wantToPay)
                    response.sendStatus(202);
                else response.sendStatus(200);
            }
        }
    })
});

application.delete("/api/login", function(request, response, next) {  // fixme
    request.session.destroy();
    response.sendStatus(200);
});

application.post("/api/logout", function(request, response, next) {
    request.session.destroy();
    response.sendStatus(200);
});

// ================================================== RUN APP =========================================================

const server = application.listen(PORT, () => { console.log(`Server running on http://127.0.0.1:${PORT}`) });
