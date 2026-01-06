// src/components/InvoicePDF.jsx
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#222",
  },
  header: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  subheader: {
    textAlign: "center",
    fontSize: 10,
    marginBottom: 10,
    color: "#555",
    lineHeight: 1.2,
  },
  billTitle: {
    textAlign: "center",
    fontSize: 14,
    margin: 2,
    fontWeight: "bold",
    textDecoration: "underline",
  },
  billInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    marginTop: 6,
  },
  billTo: {
    marginBottom: 6,
    fontSize: 11,
  },
  table: {
    display: "table",
    width: "auto",
    marginTop: 7,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#888",
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: { flexDirection: "row" },
  tableColHeader: {
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#bbb",
    backgroundColor: "#f3f3f3",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 11,
    padding: 5,
  },
  colDate: { width: "15%" },
  colVehicle: { width: "18%" },
  colParticulars: { width: "23%" },
  colQty: { width: "10%" },
  colMinQty: { width: "10%" },
  colRate: { width: "12%" },
  colAmount: { width: "12%" },
  tableCell: {
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#bbb",
    padding: 4,
    textAlign: "center",
    fontSize: 11,
  },
  otherCharges: {
    marginTop: 9,
    marginBottom: 2,
    fontSize: 9,
    fontStyle: "italic",
  },
  paymentBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#bbb",
    minHeight: 29,
    minWidth: 330,
    padding: 7,
    alignSelf: "center",
    fontSize: 9.5,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 7,
    fontWeight: "bold",
  },
  totalLabel: {
    width: "74%",
    fontWeight: "bold",
    fontSize: 11.5,
    paddingRight: 10,
    textAlign: "right",
  },
  totalValue: {
    width: "12%",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#bbb",
    padding: 2,
    backgroundColor: "#f3f3f3",
  },
  terms: {
    fontSize: 9,
    marginTop: 15,
    lineHeight: 1.5,
  },
  receivedRow: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 10.5,
  },
  signatureBox: {
    borderTop: 1,
    borderColor: "#000",
    width: 126,
    textAlign: "center",
    fontSize: 11,
    marginTop: 12,
    paddingTop: 4,
    alignSelf: "flex-end",
  },
  computerInvoice: {
    textAlign: "center",
    marginTop: 35,
    fontSize: 9,
    color: "#888",
  },
});

// Main component
const InvoicePDF = ({
  invoiceNo,
  invoiceDate,
  clientName,
  clientCity,
  dispatchRows,
  totalAmount,
  receivedDate,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>R.K.S. BRO'S</Text>
      <Text style={styles.subheader}>
        Fleet Owners & Transport Contractors{'\n'}
        Old No.9C, New No.27, G.A.Road, Old Washermenpet, Chennai - 21{'\n'}
        Ph: 044-25954891 / 25958853 | Cell: 9840128603, 9841242086
      </Text>
      <Text style={styles.billTitle}>BILL</Text>
      <View style={styles.billInfo}>
        <Text>Invoice No: {invoiceNo}</Text>
        <Text>Invoice Date: {invoiceDate}</Text>
      </View>
      <Text style={styles.billTo}>
        <Text>To:{'\n'}</Text>
        <Text>{clientName}{clientCity ? `, ${clientCity}` : ""}</Text>
      </Text>

      {/* Dispatch/Trips Table */}
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={[styles.tableColHeader, styles.colDate]}>Date of Dispatch</Text>
          <Text style={[styles.tableColHeader, styles.colVehicle]}>Vehicle No</Text>
          <Text style={[styles.tableColHeader, styles.colParticulars]}>Particulars</Text>
          <Text style={[styles.tableColHeader, styles.colQty]}>Actual Qty</Text>
          <Text style={[styles.tableColHeader, styles.colMinQty]}>Min Charge Qty</Text>
          <Text style={[styles.tableColHeader, styles.colRate]}>Rate/Tonne</Text>
          <Text style={[styles.tableColHeader, styles.colAmount]}>Amount</Text>
        </View>
        {dispatchRows.map((row, idx) => (
          <View style={styles.tableRow} key={idx}>
            <Text style={[styles.tableCell, styles.colDate]}>{row.dateOfDispatch}</Text>
            <Text style={[styles.tableCell, styles.colVehicle]}>{row.vehicleNumber}</Text>
            <Text style={[styles.tableCell, styles.colParticulars]}>{row.particulars}</Text>
            <Text style={[styles.tableCell, styles.colQty]}>{row.actualQty}</Text>
            <Text style={[styles.tableCell, styles.colMinQty]}>{row.minQty}</Text>
            <Text style={[styles.tableCell, styles.colRate]}>₹{row.rate}</Text>
            <Text style={[styles.tableCell, styles.colAmount]}>₹{row.amount}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.otherCharges}>
        Driver manual, loading charges, handling charges
      </Text>

      <View style={styles.paymentBox}>
        <Text>PC/PNC            BILL PASSED FOR PAYMENT</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 9 }}>
          <Text>Accountant       Manager       Date</Text>
        </View>
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalValue}>₹{Number(totalAmount || 0).toLocaleString()}</Text>
      </View>

      <View style={styles.terms}>
        <Text>Terms & Conditions:</Text>
        <Text>1. Subject to Chennai Jurisdiction.</Text>
        <Text>2. Interest @ 24% per annum will be charged if not paid within due date from the date bill.</Text>
        <Text>3. Payment should be made by a/c payee Cheque / draft payable at Chennai.</Text>
      </View>

      <View style={styles.receivedRow}>
        <Text>Received {receivedDate || ""}</Text>
        <View>
          <Text>For R.K.S. BRO'S</Text>
          <Text style={styles.signatureBox}>Authorized Signatory</Text>
        </View>
      </View>

      <Text style={styles.computerInvoice}>
        This is a computer-generated invoice.
      </Text>
    </Page>
  </Document>
);

export default InvoicePDF;
