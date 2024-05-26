import db from "better-sqlite3";
import bcrypt from "bcrypt";

const Locale = Object.freeze({EN: Symbol("ENGLISH"), GR: Symbol("GREEK")});
const LOCALE = Locale.EN;

// ================================================== DATABASE ========================================================

export class Ticket {  // note ----------------------------------------------------------------------------- deprecated
    constructor(name_GR, name_EN, description, price) {
        this.name_GR = name_GR; this.name_EN = name_EN; this.description = description; this.price = price;
    }

    name() {
        if (LOCALE.valueOf() === Locale.GR.valueOf()) return this.name_GR;
        else if (LOCALE.valueOf() === Locale.EN.valueOf()) return this.name_EN;
        else console.error("Please set a Locale");
    }
}

export class User {
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
    DEBUG = false;
    connection = new db("model/storage.sqlite", {fileMustExist: true});
    cacheIntentionalLogout = [];

    /**
    * Animals are stored in a table with their name, description.
    * @return {Array} objects containing a name and a description property
    */
    get animals() {
        return this.connection.prepare("select name, description from animal").all();
    }

    /**
    * Returns password for the provided email address.
    * @param {String} email the email to search for
    * @return {String} password
    */
    getPassword(email) {
        return this.connection.prepare("select password from user where email = ?").all(email)[0].password;
    }

    /**
    * Checks if the provided password matches with the one in the database.
     * Note, callback will be called with null, user if login is successful, otherwise message, null.
    * @param {String} email
    * @param {String} password
    * @param {function[message: Union[String, Error], user: User]} callback to be called after
    * @return void
    */
    checkUser(email, password, callback) {  // fixme docstring
        let user;
        try {
            user = this.connection.prepare(("select * from user where email = ? and password is not null")).get(email);
            if (user) {
                const match = bcrypt.compareSync(password, user.password);
                if (match) {
                    callback(null, user);  // successful login
                } else {
                    callback('Wrong Password', null);
                }
            } else {
                callback('User not found', null);
            }
        } catch (error) {
            callback(error, null);
        }
    }

    /**
    * Checks if an email already exists in the table, it is primary key.
    * @param {String} email to check
    * @param {function[error: Error, result: boolean]} callback
    * @return void
    */
    exists(email, callback) {
        try {
            let result = this.connection.prepare("select email from user where email = ?").all(email);
            if (this.DEBUG) console.log("DATABASE EMAIL EXISTS", email, "\t\t\tRESULT", result.length === 1);
            callback(null, result.length === 1);
        } catch (error) {
            callback(error, null);
        }
    }

    /**
    * Checks if a user has cookie in client side to get logged in automatically, but preferred to log out.
    *
    * *Note: When an email is stored in database cache, it means that there is a cookie in their browser giving them
    * the opportunity to get logged in automatically.*
    * @param {String} email
    * @return boolean
    */
    hasIntentionallyLogout(email) {
        if (this.DEBUG) console.log("DATABASE hasIntentionallyLogout() called");
        if (this.DEBUG) console.log(email, "found in database cache", this.cacheIntentionalLogout.includes(email));
        return this.cacheIntentionalLogout.includes(email);
    }

    /**
    * Gets called when a user is disconnected and stores his email in database cache.
    *
    * *Note: When an email is stored in database cache, it means that there is a cookie in their browser giving them
    * the opportunity to get logged in automatically.*
    * @param {String} email
    * @return void
    */
    intentionalLogout(email) {
        console.log("DATABASE intentionalLogout() called");
        this.cacheIntentionalLogout.push(email);
        console.log("database cache", this.cacheIntentionalLogout);
    }

    /**
    * Checks if a user is newsletter, meaning its record in user table contains only email.
    * Note: Returns true if there is no password stored.
    * @param {String} email
    * @return boolean
    */
    isNewsletter(email) {
        return !this.connection.prepare("select password from user where email = ?").all(email)[0].password.length;
    }

    firstName(email) {
        return this.connection.prepare("select firstname from user where email = ?").all(email)[0].firstname;
    }

    lastName(email) {
        return this.connection.prepare("select lastname from user where email = ?").all(email)[0].lastname;
    }

    address(email) {
        return this.connection.prepare("select address from user where email = ?").all(email)[0].address;
    }

    town(email) {
        return this.connection.prepare("select town from user where email = ?").all(email)[0].town;
    }

    postal_code(email) {
        return this.connection.prepare("select postal_code from user where email = ?").all(email)[0].postal_code;
    }

    price(ticket){
        return this.connection.prepare("select price from ticketType where name = ?").all(ticket)[0].price;
    }

    /**
    * Returns an array of all tickets a specific user has bought.
    * @param {String} email
    * @return {Array}
    */
    userTickets(email) {
        this.exists(email, (error, result) => {
            if (error && this.DEBUG) console.log(error);
            else if (result) return null;
            else if (!result) {
                try {
                    return this.connection.prepare("select * from ticket where email = ?").all(email);
                } catch (error) {
                    if (this.DEBUG) console.log(error);
                }
            }
        });
    }

    /**
    * Saves a new user in the namesake table, unless it already exists.
    * @param {User} user to save
    * @return void
    */
    saveNewUser(user) {
        this.exists(user.email, (error, result) => {
            if (!result) {
                const statement = this.connection.prepare("insert into user " +
                    "(firstname, lastname, address, town, postal_code, birthdate, phone, email, password) " +
                    "values (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                try {
                    statement.run(user.firstname, user.lastname, user.address, user.town, user.postal_code,
                        user.birthdate, user.phone, user.email, user.password);
                } catch (error) {
                    if (this.DEBUG) console.error(error);
                }
            }
        });
    }

    /**
    * Saves an email in user table, unless it already exists. Database differentiates between users and subscribers,
    * the former have passed all their credentials and the latter only their emails.
    * @param {String} email the address we want to save
    * @param {function[error: Error, result: boolean]} callback
    * @return void
    */
    saveSubscription(email, callback) {
        this.exists(email, (error, result) => {
            if (error) callback(error, false);
            else if (result) callback(null, false);
            else if (!result) {
                try {
                    this.connection.prepare("insert into user (email) values (?)").run(email);
                    callback(null, true);
                } catch (error) {
                    if (this.DEBUG) console.log(error);
                }
            }
        });
    }

    /**
    * Subscribers are stored in user table, only with their email address.
    * @param {String} paymentID
    * @param {String} email
    * @param {Object} tickets
    * @return void
    */
    saveTicket(paymentID, email, tickets) {
        console.log("database.saveTicket() called with", paymentID, email, tickets);
        console.log(JSON.stringify(tickets));
        let statement = this.connection.prepare("insert into ticket (paymentID, email, data) values (?, ?, ?)");
        try {
            statement.run(paymentID, email, JSON.stringify(tickets));
        } catch (error) {
            if (this.DEBUG) console.log(error);
        }
    }

    /**
    * Subscribers are stored in user table, only with their email address.
    * @return {Array[String]} newsletter emails
    */
    get subscribers() {
        let out = [];
        try {
            for (let address of this.connection.prepare("select email from user where password is null").all())
                out.push(address.email);
        } catch (error) {
            if (this.DEBUG) console.log(error);
        }
        return out;
    }

    /**
    * Returns ticket amount.
    * @return {Number}
    */
    get ticketAmount() {
        try {
            return this.connection.prepare("select count(*) from ticket").all();
        } catch (error) {
            if (this.DEBUG) console.log(error);
        }
    }

    /**
    * Returns description and price for the specified ticket name
    * @param {String} name
    * @return {Array[String]}
    */
    ticketInfo(name) {
        try {
            return this.connection.prepare("select description, price from ticketType where name = ?").all(name)[0];
        } catch (error) {
            if (this.DEBUG) console.log(error);
        }
    }

    /**
    * Returns an array of tickets stored in the namesake table.
    * @return {Array[Object]} of objects containing a name, description and a price property
    */
    get ticketTypes() {
        try {
            return this.connection.prepare("select name, description, price from ticketType order by price").all();
        } catch (error) {
            if (this.DEBUG) console.log(error);
        }
    }
}
export const database = new Database();


