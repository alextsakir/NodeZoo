import {database} from "../model/database.mjs";
import createInvoice from "./invoice.mjs";

class Accountant {
    DEBUG = true;
    briefcase = [];

    /**
    * Returns the seconds elapsed from Jan 1, 1970 (Epoch).
    * @return {String}
    */
    generatePaymentID() {
        return Math.round(Date.now() / 1000).toString();
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
        if (tickets) {  // -------------------------------------------------- id, email, tickets or id, !email, tickets
            this.briefcase.push({paymentID: paymentID, email: email, tickets: tickets});
        }
        else if (email && !tickets) {  // --------------------- id, email, !tickets (id and tickets are already stored)
            // ------------------------------------------ in case they selected tickets before logging in, so the first
            // ------------------------------- accountant.save() call had null email, that is going to be completed now
            for (const record of this.briefcase) {
                if (record.paymentID === paymentID)
                    record.email = email
            }
        }
        if (this.DEBUG) console.log("BRIEFCASE", this.briefcase);
    }

    /**
    * Creates the invoice pdf for the specified payment ID and stores it.
    * @param {Array[Object]} paymentID
    * @return void
    */
    invoice(paymentID) {
        for (const record of this.briefcase) {
            if (record.paymentID === paymentID)
                if (this.DEBUG) console.log("ACCOUNTANT IS WRITING PDF", paymentID)
                createInvoice(this.data(paymentID, record.email, record.tickets));
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
        if (this.DEBUG) console.log("accountant.data() called with", email);
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
            if (this.DEBUG) console.log(key);
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
