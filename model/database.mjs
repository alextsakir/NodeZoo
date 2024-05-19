import db from "better-sqlite3";
import bcrypt from "bcrypt";

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
        else console.error("Please set a Locale")
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

    tickets = [
        new Ticket("Παιδικό", "Child", "child ticket", 5),
        new Ticket("Ενήλικας", "Adult", "adult ticket", 12),
        new Ticket("ΑμεΑ", "Disabled", "disabled ticket", 8)
    ];

    users = [];

    saveSubscription(email, callback) {
        this.exists(email, (error, result) => {
            if (error) callback(error, false);
            else if (!result) {
                this.connection.prepare("insert into user (email) values (?)").run(email);
                callback(null, true)
            }
        });

    }

    get animals() {
        return this.connection.prepare("select name, description from animal").all();
    }

    exists(email, callback) {
        const statement = this.connection.prepare("select email from user where email = ?")
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
            const statement = this.connection.prepare(('Select * from USER where email = ?'));
            user = statement.get(email);
            if(user){
                const match  = bcrypt.compareSync(password, user.password);
                if (match) {
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
        return this.connection.prepare("select password from user where email = ?").all(email)[0].password;
    }

    saveNewUser(user) {
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
}

export const database = new Database();


