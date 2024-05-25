import {database} from "../model/database.mjs";
import createInvoice from "./invoice.mjs";

class Accountant {
    DEBUG = true;
    briefcase = [];

    /**
    * Checks if given card number has 16 digits and if expiration date has elapsed, passes boolean result to callback.
    * @param {Number} number the card number
    * @param {String} expiration date in mm/yy format
    * @param {Function[boolean]} callback
    * @return void
    */
    checkCard(number, expiration, callback) {
        if (number.toString().length !== 16 || expiration.length !== 5 || expiration[2] !== "/") callback(false);
        let month = Number(expiration.slice(0, 2)) - 1, year = Number("20" + expiration.slice(3, 5));
        if (year < new Date().getFullYear()) callback(false);
        else if (month > 12) callback(false);
        else if (year === new Date().getFullYear() && month < new Date().getMonth()) callback(false);
        else callback(true);
    }

    /**
    * Returns the seconds elapsed from Jan 1, 1970 (Epoch).
    * @return {String}
    */
    generatePaymentID() {
        let id = Math.round(Date.now() / 1000).toString();
        let display = new Date(0); // The 0 there is the key, which sets the date to the epoch
        display.setUTCSeconds(Number(id));
        console.log("paymentID generated:", display);
        return id
    }

    /**
    * Checks if a record with the provided paymentID already exists in briefcase.
    * @param {String} paymentID
    * @return {boolean}
    */
    existsInBriefcase(paymentID) {
        for (let record of this.briefcase) {
            if (record.paymentID === paymentID) {
                if (this.DEBUG) console.log("accountant found", paymentID, "in briefcase")
                return true;
            }
        }
        if (this.DEBUG) console.log("accountant did not found", paymentID, "in briefcase")
        return false;
    }

    /**
    * Saves email and selected tickets internally. Later, Accountant.invoice() method can be called to create pdf.
    * @param {String} paymentID
    * @param {String} email
    * @param {Object} tickets
    * @return void
    */
    save(paymentID, email, tickets) {
        if (this.DEBUG) console.log("accountant.save() called with", paymentID, email, tickets);
        // if (tickets) {  // -------------------------------------------------- id, email, tickets or id, !email, tickets
        //     this.briefcase.push({paymentID: paymentID, email: email, tickets: tickets});
        // }
        // else if (email && !tickets) {  // --------------------- id, email, !tickets (id and tickets are already stored)
        //     // ------------------------------------------ in case they selected tickets before logging in, so the first
        //     // ------------------------------- accountant.save() call had null email, that is going to be completed now
        //     for (const record of this.briefcase) {
        //         if (record.paymentID === paymentID)
        //             record.email = email;
        //     }
        // }

        if (this.existsInBriefcase(paymentID)) {
            for (const record of this.briefcase) {
                if (record.paymentID === paymentID) {
                    if (email) record.email = email;
                    if (tickets) record.tickets = tickets;
                }
            }
        } else {
            this.briefcase.push({paymentID: paymentID, email: email, tickets: tickets});
        }
        if (this.DEBUG) console.log("ACCOUNTANT BRIEFCASE", this.briefcase);
    }

    /**
    * Creates the invoice pdf for the specified payment ID and stores it.
    * @param {Array[Object]} paymentID
    * @return void
    */
    invoice(paymentID) {
        for (const record of this.briefcase) {
            if (record.paymentID === paymentID) {
                if (this.DEBUG) console.log("ACCOUNTANT IS WRITING PDF", paymentID);
                database.saveTicket(paymentID, record.email, record.tickets);
                createInvoice(this.data(paymentID, record.email, record.tickets));
                return;
            }
        }
        if (this.DEBUG) console.log("Accountant could not create invoice pdf.")
    }

    /**
    * Returns an Invoice object with selected date, client credentials, tickets and total price.
    * @param {Number} paymentID
    * @param {String} email
    * @param  {Array[Object]} tickets
    * @return {Object} Invoice data
    */
    data(paymentID, email, tickets) {
        let invoice;
        if (this.DEBUG) console.log("accountant.data() called with", paymentID, email, tickets);
        invoice = {
            paymentID: paymentID,
            date: "",
            shipping: {
                name: database.firstName(email) + " " + database.lastName(email), address: database.address(email),
                town: database.town(email), country: "Greece", postal_code: database.postal_code(email), email: email
            },
            tickets: [],  // item, description, price, quantity, amount
            total: 0
        }
        for (const [key, value] of Object.entries(tickets)) {
            if (key === "date") {
                invoice.date = value;
                continue;
            }
            let ticket_info;
            try {
                ticket_info = database.ticketInfo(key);
            } catch(err) {
                if (this.DEBUG) console.log(`Could not select ${key} ticket type from database`);
            }
            invoice.tickets.push({item: key, description: ticket_info.description,
                price: ticket_info.price, quantity: value, amount: ticket_info.price * value})
            invoice.total += ticket_info.price * value;
        }
        return invoice;
    }

}

export const accountant = new Accountant();
