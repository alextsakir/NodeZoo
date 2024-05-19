import fs from "fs";

import express from "express";

const router = express.Router();
import database from "../controller/controller.mjs";

const DEBUG_FUNCTION_CALL = true;

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
            let animals = database.animals();
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

// application.get('/', index);  // preserve alphabetical order!
// application.get("/about", about);
// application.get("/animals", animals);
// application.get("/april", april);
// application.get("/contact", contact);
// application.get("/dashboard", dashboard);
// application.get("/gallery", gallery);
// application.get("/hello", (request, response) => response.send("Hello World!"));
// application.get("/home", index);  // -------------------------------------------------------------------------- unused
// application.get("/index", index);
// application.get("/login", login);
// application.get("/payment", payment);
// application.get("/register", register);
// application.get("/registered", registered);
// application.get("/tickets", tickets);

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

// application.get("/api/animal-description", API.animalDescription);
// application.post("/api/register", API.register);
// application.post("/api/subscribe", API.subscribe);
// application.post("/api/tickets-selected", API.ticketsSelected);
router.route("/api/animal-description").get(API.animalDescription);
router.route("/api/register").post(API.register);
router.route("/api/subscribe").post(API.subscribe);
router.route("/api/tickets-selected").post(API.ticketsSelected);
// application.post("/api/login", (request, response) => {
router.route("/api/login").post((request, response) => {
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

// application.delete("/api/login", function(request, response, next) {  // fixme
//     request.session.destroy();
//     response.sendStatus(200);
// });
//
// application.post("/api/logout", function(request, response, next) {
//     request.session.destroy();
//     response.sendStatus(200);
// });

export default router;
