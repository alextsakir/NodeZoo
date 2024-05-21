import db from "better-sqlite3";
import bcrypt from "bcrypt";
import { stat } from "fs";

const Locale = Object.freeze({EN: Symbol("ENGLISH"), GR: Symbol("GREEK")});
const LOCALE = Locale.EN;

// ================================================== DATABASE ========================================================

export class Ticket {
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
    connection = new db("model/storage.sqlite", {fileMustExist: true});

    pendingPayments = [];

    ticketsDISABLED = [
        new Ticket("Παιδικό", "Child", "child ticket", 5),
        new Ticket("Ενήλικας", "Adult", "adult ticket", 12),
        new Ticket("ΑμεΑ", "Disabled", "disabled ticket", 8)
    ];

    /**
    * Animals are stored in a table with their name, description.
    * @return {Array} objects containing a name and a description property.
    */
    get animals() {
        return this.connection.prepare("select name, description from animal").all();
    }

    /**
    * Returns password for the provided email address.
    * @param {String} email the email to search for.
    * @return {String} password.
    */
    getPassword(email) {
        return this.connection.prepare("select password from user where email = ?").all(email)[0].password;
    }

    /**
    * Checks if the provided password matches with the one in the database.
    * @param {String} email
    * @param {String} password
    * @param {function[message: Union[String, Error], user: User]} callback to be called after.
    */
    checkUser(email, password, callback) {  // fixme docstring
        let user;
        try {
            const statement = this.connection.prepare(("select * from user where email = ?"));
            user = statement.get(email);
            if (user) {
                const match  = bcrypt.compareSync(password, user.password);
                if (match) {
                    callback(null, user);
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
    * @param {String} email to check.
    * @param {function[error: Error, result: boolean]} callback to be called after.
    */
    exists(email, callback) {
        try {
            let result = this.connection.prepare("select email from user where email = ?").all(email);
            console.log("DATABASE EMAIL EXISTS", email, "\t\t\tRESULT", result.length === 1);
            callback(null, result.length === 1);
        } catch (error) {
            callback(error, null);
        }
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
    * Saves a new user in the namesake table, unless it already exists.
    * @param {User} user to save.
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
                    console.error(error);
                }
            }
        });
    }

    /**
    * Saves an email in user table, unless it already exists. Database differentiates between users and subscribers,
    * the former have passed all their credentials and the latter only their emails.
    * @param {String} email the address we want to save.
    * @param {function[error: Error, result: boolean]} callback to be called after.
    */
    saveSubscription(email, callback) {
        this.exists(email, (error, result) => {
            if (error) callback(error, false);
            else if (result) callback(null, false);
            else if (!result) {
                this.connection.prepare("insert into user (email) values (?)").run(email);
                callback(null, true);
            }
        });
    }

    /**
    * Subscribers are stored in user table, only with their email address.
    * @return {Array[String]} of subscribers' emails.
    */
    get subscribers() {
        let out = [];
        for (let address of this.connection.prepare("select email from user where password is null").all())
            out.push(address.email);
        return out;
    }

    /**
    * Returns an array of tickets stored in the namesake table.
    * @return {Array[Object]} of objects containing a name, description and a price property.
    */
    get ticketTypes() {
        return this.connection.prepare("select name, description, price from ticketType").all();
    }

    /**
    * Returns an Invoice object with selected date, client credentials, tickets and total price.
    * @param email String
    * @param tickets Array[Object]
    * @return {Object} Invoice
    */
    ticketInvoice(email, tickets) {
        const statement = this.connection.prepare(("select name, description, price from ticketType where name = ?"));
        let invoice = {};
        invoice = {
            date: "",
            shipping: {
                name: this.firstName(email) + " " + this.lastName(email), address: this.address(email),
                town: this.town(email), country: "Greece", postal_code: this.postal_code(email), email: email
            },
            tickets: [],  // item, description, price, quantity, amount
            total: 0
        }
        for (const [key, value] of Object.entries(tickets)) {
            console.log(key);
            if (key === "date") {
                invoice.date = value;
                continue;
            }
            let ticket_info;
            try {
                ticket_info = statement.all(key)[0];
            } catch(err) {
                console.log(`Could not select ${key} ticket type from database`);
            }
            invoice.tickets.push({item: key, description: ticket_info.description,
                price: ticket_info.price, quantity: value, amount: ticket_info.price * value})
            invoice.total += ticket_info.price * value;
        }
        // console.log(invoice);
        return invoice;
    }
}
export const database = new Database();


