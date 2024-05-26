import fs from "fs";
import PDFDocument from "pdfkit";

function createInvoice(invoice) {
    console.log("creating invoice...");
    let invoiceID = invoice.paymentID;
    let doc = new PDFDocument({ size: "A4", margin: 50 });
    generateHeader(doc);
    generateCustomerInformation(doc, invoice, invoiceID);
    generateInvoiceTable(doc, invoice);
    generateFooter(doc);
    doc.end();
    if (!fs.existsSync("./invoices")) {
        fs.mkdirSync("./invoices");
    }
    doc.pipe(fs.createWriteStream("./invoices/" + invoiceID + ".pdf"));
    }

function generateHeader(doc) {
    doc
      .image("./public/logo.png", 50, 50, { width: 50 })
      .fillColor("#444444")
      .fontSize(20)
      .text("Patras Zoo", 110, 57)
      .fontSize(10)
      .text("Patras Zoo", 200, 50, { align: "right" })
      .text("245 Dimitrios Gounaris Avenue", 200, 65, { align: "right" })
      .text("Patras, GR, 26225", 200, 80, { align: "right" })
      .moveDown();
  }
  
function generateCustomerInformation(doc, invoice, invoiceID) {
    doc.fillColor("#444444").fontSize(20).text("Receipt", 50, 160);
    generateHr(doc, 185);
    const customerInformationTop = 200;
  
    doc
      .fontSize(10)
      .text("Invoice Number:", 50, customerInformationTop)
      .font("Helvetica-Bold")
      .text(invoiceID, 150, customerInformationTop)
      .font("Helvetica")
      .text("Invoice Date:", 50, customerInformationTop + 15)
      .text(formatDate(new Date(invoice.date)), 150, customerInformationTop + 15)
      .text("Balance Due:", 50, customerInformationTop + 30)
      .text(formatCurrency(invoice.total), 150, customerInformationTop + 30)
      .font("Helvetica-Bold")
      .text(invoice.shipping.name, 300, customerInformationTop)
      .font("Helvetica")
      .text(invoice.shipping.address, 300, customerInformationTop + 15)
      .text(invoice.shipping.town, 300, customerInformationTop + 30)
      .moveDown();
  
    generateHr(doc, 252);
}
  
function generateInvoiceTable(doc, invoice) {
    let i;
    const invoiceTableTop = 330;
  
    doc.font("Helvetica-Bold");
    generateTableRow(doc, invoiceTableTop, "Item", "Description", "Unit Cost", "Quantity", "Line Total");
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");
  
    for (i = 0; i < invoice.tickets.length; i++) {
        const ticket = invoice.tickets[i];
        const position = invoiceTableTop + (i + 1) * 30;
        generateTableRow(doc, position, ticket.item, ticket.description, ticket.price, ticket.quantity, ticket.amount);
        generateHr(doc, position + 20);
    }
  
    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    const paidToDatePosition = subtotalPosition + 20;
    const duePosition = paidToDatePosition + 25;
    doc.font("Helvetica-Bold");
    generateTableRow(doc, duePosition, "", "", "Balance Due", "", formatCurrency(invoice.total));
    doc.font("Helvetica");
}
  
function generateFooter(doc) {
    doc.fontSize(10).text("Payment is made to Patras Zoo. Thank you for your visit.", 50, 780,
        { align: "center", width: 500 }
      );
}
  
function generateTableRow(doc, y, item, description, unitCost, quantity, lineTotal) {
    doc.fontSize(10).text(item, 50, y).text(description, 150, y).text(unitCost, 280, y, { width: 90, align: "right" })
      .text(quantity, 370, y, { width: 90, align: "right" }).text(lineTotal, 0, y, { align: "right" });
}
  
function generateHr(doc, y) {
    doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}
  
function formatCurrency(cents) {
    return "€" + cents.toFixed(2);
}

function formatDate(date) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Mov", "Dec"];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return [days[date.getDay()], date.getDate(), monthNames[date.getMonth()], date.getFullYear()].join(" ");
}

export default createInvoice;
