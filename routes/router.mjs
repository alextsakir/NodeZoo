import bcrypt from "bcrypt";
import {database, User} from "../model/database.mjs";
import express from "express";
import fs from "fs";

const router = express.Router();
const DEBUG_ROUTE_CALL = true;
const DEBUG_API_CALL = true;

// ==================================================== ROUTE =========================================================

/**
* ROUTE functions render pages.
*/
class ROUTE {
    
    static index(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: index rendered");
        if (request.session.signedIn === undefined)
            request.session.signedIn = false;

        console.log("SESSION: ", request.session);
        response.render("index", {layout: "main", title: "Patras Zoo", signedIn: request.session.signedIn});
        // --------------------------------------------------------- with layout you can change the Handlebars template
    }
    
    static april(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: april rendered");
        response.render("april", {layout: "main", title: "April", signedIn: request.session.signedIn});
    }
    
    static about(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: about rendered");
        response.render("about", {layout: "main", title: "About", signedIn: request.session.signedIn});
    }
    
    static animals(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: animals rendered");
        console.log(request.session);
        fs.readdir('images', (err, files) => {  // fixme themis --------------------- there is no need for readdir call
            if (err) {
                console.error('Error reading images directory:', err);
                response.sendStatus(500);
            } else {
                // Render the gallery page and pass the list of image files to it
                // let images = files.map(fileName => fileName.replace(/\.jpg$/, ''));
                // const imagesToRemove = ['gallery-1','gallery-2','gallery-3','gallery-4','home'];  // fixme -- themis
                // images = images.filter(item => !imagesToRemove.includes(item));  // fixme ------------------- UNUSED
                // let animals = database.animals;
                response.render("animals", {
                    layout: "main", title: "Animals", animals: database.animals,
                    signedIn: request.session.signedIn
                });
            }
        });
    }
    
    static contact(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: contact rendered");
        response.render("contact", {layout: "main", title: "Contact", signedIn: request.session.signedIn});
    }
    
    static dashboard(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: dashboard rendered");
        response.render("dashboard", {
            layout: "main", title: "Dashboard",
            signedIn: request.session.signedIn, email: request.session.email
        });
    }
    
    static gallery(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: gallery rendered");
    }
    
    static login(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: login rendered");
        response.render("login", {layout: "main", title: "Login", signedIn: request.session.signedIn});
    }
    
    static payment(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: payment rendered");
        response.render("payment", {layout: "main", title: "Payment", signedIn: request.session.signedIn});
        // note SOURCE: https://codepen.io/quinlo/pen/YONMEa
    }
    
    static register(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: register rendered");
        response.render("register", {layout: "main", title: "Register", signedIn: request.session.signedIn});
    }
    
    static registered(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: registered rendered");
        response.render("registered", {layout: "main", title: "Registered", signedIn: request.session.signedIn});
    }
    
    static test(request, response) {
        response.send("Hello World!");
    }
    
    static tickets(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: tickets rendered");
        if (DEBUG_ROUTE_CALL) console.log(database.tickets);
        console.log("SESSION: ", request.session);
        response.render("tickets", {
            layout: "main", title: "Tickets", tickets: database.tickets,
            signedIn: request.session.signedIn
        });
    }
}

router.route("/").get(ROUTE.index);  // PLEASE preserve URL alphabetical order!
router.route("/about").get(ROUTE.about);
router.route("/animals").get(ROUTE.animals);
router.route("/april").get(ROUTE.april);
router.route("/contact").get(ROUTE.contact);
router.route("/dashboard").get(ROUTE.dashboard);
router.route("/gallery").get(ROUTE.gallery);
router.route("/hello").get(ROUTE.test);
router.route("/home").get(ROUTE.index);
router.route("/index").get(ROUTE.index);
router.route("/login").get(ROUTE.login);
router.route("/payment").get(ROUTE.payment);
router.route("/register").get(ROUTE.register);
router.route("/registered").get(ROUTE.registered);
router.route("/tickets").get(ROUTE.tickets);

// ==================================================== API ===========================================================

/**
* API functions are used for functionality.
*/
class API {

    static animalDescription(request, response) {
        if (DEBUG_API_CALL) console.log("API animal description");
        if (DEBUG_API_CALL) console.log(request.body);
        response.sendStatus(400); // todo --------------------------------------------------------------- to be removed
    }

    static login(request, response) {
        if (DEBUG_API_CALL) console.log("API login");
        console.log(request.body.email, request.body.password, request.body.wantToPay);
        database.checkUser(request.body.email, request.body.password, (message, user) => {
            if (message) {
                if (DEBUG_API_CALL) console.log(message);
            } else {
                if (!user) {
                    request.session.alert_message = 'Wrong email or password';  // fixme --------- themis to be removed
                    response.sendStatus(205);
                } else {
                    request.session.signedIn = true;
                    request.session.email = user.email;
                    if (DEBUG_API_CALL) console.log("Success with session", request.session);  // fixme it doesn't work
                    if (request.body.wantToPay) response.sendStatus(202);
                    else response.sendStatus(200);
                }
            }
        })
    }

    static logout(request, response, next) {
        if (DEBUG_API_CALL) console.log("API log out");
        if (request.session.signedIn) {
            if (DEBUG_API_CALL) console.log(request.session.email, "is logging out");
            request.session.destroy();
            if (request.headers.referer === "/dashboard") response.redirect("/index");
            response.sendStatus(200);
        } else response.sendStatus(400);  // normally it should be unreachable
    }

    static register(request, response, next) {
        if (DEBUG_API_CALL) console.log("API register");
        if (DEBUG_API_CALL) console.log("EMAIL TO REGISTER", request.body.email);
        database.exists(request.body.email, function (error, result) {
            if (result && !error) {
                if (DEBUG_API_CALL) console.log("user already exists");
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
                        database.saveNewUser(user);
                        if (DEBUG_API_CALL) console.log(user.email, "IS PUT INTO DATABASE");
                    })
                } else {
                    if (DEBUG_API_CALL) console.log("problem with password");
                    response.sendStatus(413);  // tell them that passwords don't match
                }
                response.sendStatus(200); // tells them they successfully registered
            }
        });
    }

    static subscribe(request, response) {
        if (DEBUG_API_CALL) console.log("API subscribe");
        if (DEBUG_API_CALL) console.log(request.body, request.body.email);
        database.saveSubscription(request.body.email, (error, result) => {
            if (error) response.sendStatus(400);
            else if (result) response.sendStatus(200);
        });
    }

    static subscribers(request, response) {
        if (DEBUG_API_CALL) console.log("API subscribers");
        response.status(200).setHeader("Content-Type", "application/json");
        response.end(JSON.stringify(database.subscribers), null, 2);
        response.send();
    }

    static ticketsSelected(request, response) {
        if (DEBUG_API_CALL) console.log("API tickets selected");
        if (DEBUG_API_CALL) console.log(request.body);
        if (request.session.signedIn) {
            response.sendStatus(200);
        } else response.sendStatus(300);
    }

    static document(request, response) {
        if (DEBUG_API_CALL) console.log("API document");
        response.contentType("application/pdf");
        response.send(fs.readFileSync("./public/Back_In_The_USSR.pdf"));
    }
}

router.route("/api/animal-description").get(API.animalDescription);  // note UNUSED
router.route("/api/register").post(API.register);
router.route("/api/subscribe").post(API.subscribe);
router.route("/api/subscribers").get(API.subscribers);
router.route("/api/tickets-selected").post(API.ticketsSelected);
router.route("/api/login").post(API.login).delete(API.logout);  // they are now API static methods
router.route("/api/document").get(API.document);

export default router;
// note: We can specify a default export in each module, so it won't have to be imported within braces
// note: https://developer.mozilla.org/en-US/docs/web/javascript/reference/statements/export#description
