//                                               Zoo Website Server
//                                                   Spring 2024

"use strict";

import cookieParser from "cookie-parser";
// import sqliteStore from 'connect-sqlite3';
import express from "express";
import {engine} from "express-handlebars";
// import fetch from "node-fetch"; // has to be npm installed
// import path from "path";
import router from "./routes/router.mjs";
import session from "express-session";

// ================================================ CONFIGURATION =====================================================

const application = express();
// const sql = new db("model/storage.sqlite", {fileMustExist: true});
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

// const sqliteStoreSession = sqliteStore(session);

application.set('trust proxy', 1);
application.use(session({
    secret: "secret",
    saveUninitialized: false,
    resave: false,
    // cookie: {maxAge: 1000 * 60 * 60 * 24}
    cookie: {expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)}  // expire in one week
    // store: new sqliteStoreSession({db: 'session.sqlite',dir: './model/sessions'})
}));

application.use(router);  // forgot to write it, I was crying for an hour
// note for themis ------------------------- --> https://github.com/expressjs/session/issues/772#issuecomment-660560711
// note tl;dr ------------------------------- --> you have to link router object to the app after session configuration
const PORT = process.env.PORT || "3000";

// note by Wind Tech Support - May 19, 2024.
// const filename = fileURLToPath(import.meta.url);
// const dirname = path.dirname(__filename);

// application.use(passport.session());
 // env file to store db credentials and port

// ================================================== RUN APP =========================================================

const server = application.listen(PORT, () => {console.log(`Server running on http://127.0.0.1:${PORT}`)});
