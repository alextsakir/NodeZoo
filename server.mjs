//                                               Zoo Website Server
//                                                   Spring 2024

"use strict";

import cookieParser from "cookie-parser";
import express from "express";
import {engine} from "express-handlebars";
import router from "./routes/router.mjs";
import session from "express-session";
import {database} from "./model/database.mjs";

// ================================================ CONFIGURATION =====================================================

const application = express();
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
application.set("trust proxy", 1);
application.use(session({
    secret: "secret",
    saveUninitialized: false,
    resave: false,
    cookie: {expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)}  // ------------------------- expires in one week
}));

application.use(router);  // forgot to write it, I was crying for an hour
// note for themis ------------------------- --> https://github.com/expressjs/session/issues/772#issuecomment-660560711
// note tl;dr ------------------------------- --> you have to link router object to the app after session configuration
const PORT = process.env.PORT || "3000";

// ================================================== RUN APP =========================================================

const server = application.listen(PORT, () => {console.log(`Server running on http://127.0.0.1:${PORT}`)}); // ---- RUN

process.on("SIGTERM", () => {
    console.info("SIGTERM signal received: closing server");
    database.connection.close();
    server.close((error) => {
        console.log("server closed");
        process.exit(error ? 1 : 0);
    })
})