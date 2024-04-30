//                                               Zoo Website Server
//                                                   Spring 2024

"use strict";

import express from "express";
import {engine} from "express-handlebars";
import bcrypt from "bcrypt";
import fs from "fs";
import http from "http";
import fetch from "node-fetch"; // has to be npm installed
import path from "path";

// ================================================ CONFIGURATION =====================================================

const Locale = Object.freeze({EN: Symbol("ENGLISH"), GR: Symbol("GREEK")});
const DEBUG_FUNCTION_CALL = true; const LOCALE = Locale.EN;

const application = express();
// application.use(express.static(path.join(__dirname, "public")));
// todo ------------------- __dirname is available only in CommonJS, in ES we have to set it manually, I'll do it later
application.use(express.static("public")); // -------------------------------------------------- static files directory
application.use("/images", express.static("images")); // --------------------------------------------- images directory
application.use(express.json()); // ------------------------------------ parse incoming JSON data in the request bodies
application.use(express.urlencoded({extended: true})); // ------------------- specify library to parse URL-encoded data
application.engine("hbs", engine({extname: "hbs"}));
// ---------------------------------------- specifies Handlebars extension to 'hbs', otherwise it would be *.handlebars
application.set("view engine", "hbs"); // todo ------------------------------------------------- do we need both lines?
const router = express.Router();
application.use(router);  // forgot to write it, I was crying for an hour
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

class User{
    constructor(firstname, lastname, address, city, postal_code, birthdate, telephone, email, password){
        this.firstname = firstname;
        this.lastname = lastname;
        this.address = address;
        this.city = city;
        this.postal_code = postal_code;
        this.birthdate = birthdate;
        this.telephone = telephone;
        this.email = email;
        this.password = password;
    }

    
}

class Database {

    tickets = [
        new Ticket("Παιδικό", "Child", "child ticket", 5),
        new Ticket("Ενήλικας", "Adult", "adult ticket", 12),
        new Ticket("ΑμΕΑ", "Disabled", "disabled ticket", 8)
    ]

    users = [    ]

    saveSubscription(user) {
        // todo-- for now it only appends the users array of class Database
        this.users.push(user);
        console.log("The users are: ");
        console.log(this.users);

    }
}

const database = new Database();

// =================================================== ROUTER =========================================================
// ================================================ GET METHODS =======================================================

function index(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: index rendered");
    response.render("index", {layout: "main"});  // ---------------- with layout you can change the Handlebars template
}

function april(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: april rendered");
    response.render("april");
}

function about(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: about rendered");
    response.render("about");
}

function animals(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: animals rendered");
    response.render("animals");
}

function contact(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: contact rendered");
    response.render("contact");
}

function dashboard(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: dashboard rendered");
    response.render("dashboard");
}

function gallery(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: gallery rendered");
    response.render("gallery");
}

function login(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: login rendered");
    response.render("login");
}

function payment(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: payment rendered");
    response.render("payment"); // https://codepen.io/quinlo/pen/YONMEa
}

function register(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: register rendered");
    response.render("register");
}

function registered(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: registered rendered");
    response.render("registered");
}

function tickets(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: tickets rendered");
    // console.log(database.tickets);
    response.render("tickets", {tickets: database.tickets});
}

router.route("/").get(index);  // preserve alphabetical order!
router.route("/about").get(about);
router.route("/animals").get(animals);
router.route("/april").get(april);
router.route("/contact").get(contact);
router.route("/dashboard").get(dashboard);
router.route("/gallery").get(gallery);
router.route("/hello").get((request, response) => response.send("Hello World!"));
router.route("/home").get(index);
router.route("/index").get(index);
router.route("/login").get(login);
router.route("/payment").get(payment);
router.route("/register").get(register);
router.route("/registered").get(registered);
router.route("/tickets").get(tickets);

// ==================================================== API ===========================================================
// =============================================== POST METHODS =======================================================

class API {

    static login(request, response) {
        if (DEBUG_FUNCTION_CALL === true) console.log("API login");
        console.log(request.body);
        response.redirect(request.route);
        // todo --------------------------------------------------- there must be a response, not just a OK status code
    }

    static register(request, response) {
        // https://medium.com/@jasondotparse/add-user-authentication-to-your-node-expressjs-application-using-bcrypt-81bb0f618ab3
        if (DEBUG_FUNCTION_CALL === true) console.log("API register");
        console.log("got here");
        console.log(request.body);  // todo ---------------------------- doesn't get birth date, user type and password -> update(by bobotas): it does now!!
        let email = request.body.email;
        let enderedPassword = request.body.password;
        let c_enderedPassword = request.body.confirm_password;

        

        if (enderedPassword == c_enderedPassword){
            const saltRounds =  10
            bcrypt.hash(enderedPassword, saltRounds, function(err, hash){
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
            } )


            

        } else{
            // should say sth like: "Passwords dont match" ---TODO
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
        response.redirect(request.route);
        // response.sendStatus(200);
    }

    static ticketsSelected(request, response) {
        if (DEBUG_FUNCTION_CALL === true) console.log("API tickets");
        console.log(request.body);
        response.redirect("/payment");
    }
}

router.route("/api/login").post(API.login);
router.route("/api/register").post(API.register);
router.route("/api/subscribe").post(API.subscribe);
router.route("/api/tickets-selected").post(API.ticketsSelected);

// ================================================== RUN APP =========================================================

const server = application.listen(PORT, () => { console.log(`Server running on http://127.0.0.1:${PORT}`) });
