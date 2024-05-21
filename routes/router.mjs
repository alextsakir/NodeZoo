import {accountant} from "../controller/accountant.mjs";
import bcrypt from "bcrypt";
import {database, User} from "../model/database.mjs";
import express from "express";
import fs from "fs";
import url from "url";

const router = express.Router();
const DEBUG_ROUTE_CALL = true;
const DEBUG_API_CALL = true;

// class counter extends Function {
//     log = [];
//     constructor(request, response, next) {
//         console.log("counter called");
//         super();
//         this.log.push(request);
//         console.log("request count:", this.log.length);
//         // response.sendStatus(429);
//         next(request, response);
//     }
// }

// function counter(request, response, next) {
//     this.log.push(request);
//     console.log("request count:", this.log.length);
//     // response.sendStatus(429);
//     next(request, response);
// }
// counter.log = [];

// let counter = (function () {
//
//     let counter = function (request, response, next) {
//         this.log = [];
//         this.log.push(request);
//         console.log("request count:", this.log.length);
//         // response.sendStatus(429);
//         next(request, response);
//     }
//
//     counter.greet = function () {
//         console.log("Hello!");
//     }
//
//     counter.prototype = {
//         greet: function () {
//             console.log('Hello, my name is ' + this.log);
//         }
//     };
//     return counter;
// })();

// function counter(target, key, descriptor) {
//     const originalMethod = descriptor.value;
//     descriptor.value = function (...args) {
//         console.log(`Before ${key} is called`);
//         const result = originalMethod.apply(this, args);
//         console.log(`After ${key} is called`);
//         return result;
//     };
//     return descriptor;
// }

// ==================================================== ROUTE =========================================================

/**
* ROUTE functions render pages.
*/
class ROUTE {

    static counter (request, response) {
        console.log(request.socket.remoteAddress);
    }

    static index(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: index rendered");
        if (request.session.signedIn === undefined)
            request.session.signedIn = false;  // todo ------------------------------------------------- is it useless?
        console.log("SESSION: ", request.session);
        response.render("index", {layout: "main", title: "Patras Zoo", signedIn: request.session.signedIn,
            admin: request.session.admin});  // -------------------- with layout you can change the Handlebars template
    }

    static april(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: april rendered");
        response.render("april", {layout: "main", title: "April", signedIn: request.session.signedIn,
            admin: request.session.admin});
    }

    static about(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: about rendered");
        response.render("about", {layout: "main", title: "About", signedIn: request.session.signedIn,
            admin: request.session.admin});
    }

    static animals(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: animals rendered");
        response.render("animals", {
            layout: "main", title: "Animals", animals: database.animals,
            signedIn: request.session.signedIn, admin: request.session.admin});
    }

    static contact(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: contact rendered");
        response.render("contact", {layout: "main", title: "Contact", signedIn: request.session.signedIn,
            admin: request.session.admin});
    }

    static dashboard(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: dashboard rendered");
        response.render("dashboard", {
            layout: "main", title: "Dashboard",
            signedIn: request.session.signedIn, email: request.session.email, admin: request.session.admin
        });
    }

    static gallery(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: gallery rendered");
        response.sendStatus(404);
    }

    static invoice(request, response) {
        console.log(request.query.file);
        response.contentType("application/pdf");
        response.send(fs.readFileSync("./invoices/" + request.query.file.toString()));
    }

    static login(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: login rendered");
        response.render("login", {layout: "main", title: "Login", signedIn: request.session.signedIn,
            admin: request.session.admin});
    }

    static payment(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: payment rendered");
        if (!request.session.signedIn) response.redirect("index");
        else {
            let cardName = request.session.email ? database.firstName(request.session.email)[0] + ". " +
                database.lastName(request.session.email) : "YOUR NAME";
            response.render("payment", {
                layout: "main", title: "Payment", signedIn: request.session.signedIn,
                admin: request.session.admin, cardName: cardName
            });  // note ------------------------------------------------- SOURCE: https://codepen.io/quinlo/pen/YONMEa
        }
    }

    static register(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: register rendered");
        response.render("register", {layout: "main", title: "Register",
            signedIn: request.session.signedIn, admin: request.session.admin});
    }

    static registered(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: registered rendered");
        response.render("registered", {layout: "main", title: "Registered",
            signedIn: request.session.signedIn, admin: request.session.admin});
    }

    static hello(request, response) {
        response.send("Hello World!");
    }

    static tickets(request, response) {
        if (DEBUG_ROUTE_CALL) console.log("router: tickets rendered");
        let today = new Date(), yyyy = today.getFullYear();
        let mm = String(today.getMonth() + 1).padStart(2, "0"), dd = String(today.getDate()).padStart(2, "0");
        response.render("tickets", {
            layout: "main", title: "Tickets", tickets: database.ticketTypes,
            signedIn: request.session.signedIn, admin: request.session.admin,
            minDate: yyyy + "-" + mm + "-" + dd, maxDate: (yyyy + 1) + "-" + mm + "-" + dd
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
router.route("/hello").get(ROUTE.hello);
router.route("/home").get(ROUTE.index);
router.route("/index").get(ROUTE.index);
router.route("/invoice/").get(ROUTE.invoice);
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
        if (DEBUG_API_CALL) console.log(request.body.email, "is trying to log in");
        database.checkUser(request.body.email, request.body.password, (message, user) => {
            if (message) {
                if (DEBUG_API_CALL) console.log(message);
            } else {
                if (!user) {
                    if (DEBUG_API_CALL) console.log("wrong email or password");
                    response.sendStatus(406);
                } else {
                    if (DEBUG_API_CALL) console.log("SUCCESSFUL LOGIN");
                    request.session.signedIn = true;
                    request.session.email = user.email;
                    if (user.email === "alexandros.tsakiridis2@gmail.com" || user.email === "themispan2002@gmail.com")
                        request.session.admin = true;
                    if (DEBUG_API_CALL) console.log("Success with session", request.session);  // fixme it doesn't work
                    if (request.session.paymentID > 0) {  // paymentID
                        if (DEBUG_API_CALL) console.log("THEY WANT TO PAY, paymentID:", request.session.paymentID)
                        accountant.save(request.session.paymentID, request.session.email, null);
                        response.redirect("/payment");
                    } else response.sendStatus(200);  // --------------------------------------------- successful login
                }
            }
        })
    }

    static logout(request, response) {
        if (DEBUG_API_CALL) console.log("API log out");
        if (request.session.signedIn) {
            if (DEBUG_API_CALL) console.log(request.session.email, "is logging out");
            request.session.destroy();
            if (request.headers.referer === "/dashboard") response.redirect("/index");
            response.sendStatus(200);  // ----------------------------------------------------------- successful logout
        } else response.sendStatus(400);  // ---------------------------------------- normally it should be unreachable
    }

    static payment(request, response) {
        if (DEBUG_API_CALL) console.log("API payment");
        console.log("PAYMENT ACCEPTED paymentID:", request.session.paymentID);  // payment is always successful for now
        console.log("PRINTING YOUR RECEIPT");
        accountant.invoice(request.session.paymentID);
        API.document(request, response);
    }

    static register(request, response) {
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
            else if (!result) response.sendStatus(406);
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
        if (DEBUG_API_CALL) console.log(request.session.email, request.body);

        request.session.paymentID = accountant.generatePaymentID();
        if (request.session.signedIn) {
            accountant.save(request.session.paymentID, request.session.email, request.body);
            response.sendStatus(200);  // -------------------------------------- tell them to proceed to payment screen
        } else {
            accountant.save(request.session.paymentID, null, request.body);
            response.sendStatus(300);  // ----------------------------------------------------------- ask them to login
        }
    }

    static document(request, response) {  // ------------------------------------------------------ send pdf to browser
        if (DEBUG_API_CALL) console.log("API document");
        response.status(200).setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({file: request.session.paymentID + ".pdf"}));
        request.session.paymentID = 0;  // --------------------------------- tickets are bought, remove ID from session
        response.send();
    }
    static notAllowed(request, response) {
        if (DEBUG_API_CALL) console.log("API document");
        response.sendStatus(405);
    }
}

router.route("/api/animal-description").get(API.animalDescription).post(API.notAllowed);  // note -------------- UNUSED
router.route("/api/register").get(API.notAllowed).post(API.register);
router.route("/api/subscribe").get(API.notAllowed).post(API.subscribe);

router.route("/api/subscribers").get(API.subscribers).post(API.notAllowed);
router.route("/api/tickets-selected").get(API.notAllowed).post(API.ticketsSelected);
router.route("/api/login").get(API.notAllowed).post(API.login).delete(API.logout);

router.route("/api/payment").get(API.payment).post(API.notAllowed);
router.route("/api/document").get(API.notAllowed).post(API.notAllowed);
router.route("/api/").get(API.notAllowed).post(API.notAllowed);

export default router;
// note: ---------------- We can specify a default export in each module, so it won't have to be imported within braces
// note: -------------- https://developer.mozilla.org/en-US/docs/web/javascript/reference/statements/export#description
