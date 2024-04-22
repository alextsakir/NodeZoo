//                                               Zoo Website Server
//                                                   Spring 2024

import express from "express";
import fs from "fs";
import {engine} from "express-handlebars";
import http from "http";
import path from "path";

// ================================================ CONFIGURATION =====================================================

const DEBUG_FUNCTION_CALL = true;

const application = express();
// application.use(express.static(path.join(__dirname, "public")));
// __dirname is available only in CommonJS, in ES we have to set it manually, I'll do it later
application.use(express.static("public")); // static files directory
application.use('/images', express.static('images')); // images directory
application.use(express.json()); // parse incoming JSON data in the request bodies
application.use(express.urlencoded({extended: true})); // handle URL-encoded data
application.engine("hbs", engine({ extname: "hbs" }));
application.set("view engine", "hbs"); // todo ------------------------------------------------- do we need both lines?
const router = express.Router();
application.use(router);  // forgot to write it, I was crying for an hour
const PORT = process.env.PORT || "3000"; // env file to store db credentials and port

// =================================================== ROUTER =========================================================
// ================================================ GET METHODS =======================================================

function index(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: index rendered");
    response.render("index");
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

function register(request, response) {
    if (DEBUG_FUNCTION_CALL === true) console.log("router: register rendered");
    response.render("register");
}

router.route("/").get(index);  // preserve alphabetical order!
router.route("/about").get(about);
router.route("/animals").get(animals);
router.route("/april").get(april);
router.route("/contact").get(contact);
router.route("/dashboard").get(dashboard);
router.route("/gallery").get(gallery);
router.route("/hello").get((req, res) => res.send("Hello World!"));
router.route("/home").get(index);
router.route("/index").get(index);
router.route("/login").get(login);
router.route("/register").get(register);

// ==================================================== API ===========================================================
// =============================================== POST METHODS =======================================================

class API {

    static login(request, response) {
        if (DEBUG_FUNCTION_CALL === true) console.log("API login");
        console.log(request.body);
        // todo --------------------------------------------------- there must be a response, not just a OK status code
    }

    static register(request, response) {
        if (DEBUG_FUNCTION_CALL === true) console.log("API register");
        console.log(request.body);  // todo ---------------------------- doesn't get birth date, user type and password
        response.redirect("/register");
    }

    static subscribe(request, response) {
        if (DEBUG_FUNCTION_CALL === true) console.log("API subscribe");
        console.log(request.body);
        // response.sendStatus(200);
    }
}

router.route("/api/login").post(API.login);
router.route("/api/register").post(API.register);
router.route("/api/subscribe").post(API.subscribe);

// ================================================== RUN APP =========================================================

const server = application.listen(PORT, () => { console.log(`Server running on http://127.0.0.1:${PORT}`) });
