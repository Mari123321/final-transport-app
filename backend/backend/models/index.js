import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models
import UserModel from "./userModel.js";
import ClientModel from "./clientModel.js";
import DriverModel from "./driver.js";
import VehicleModel from "./vehicle.js";
import TripModel from "./trip.js";
import InvoiceModel from "./invoice.js";
import InvoiceTripModel from "./invoiceTrip.js";
import ExpenseModel from "./expense.js";
import PaymentModel from "./payment.js";
import AdvanceModel from "./advance.js";
import TransactionModel from "./transaction.js";
import DispatchModel from "./dispatch.js";
import ExtraChargeModel from "./extraCharge.js";
import DriverExpenseModel from "./driverExpense.js";
import BillModel from "./bills.js";
import PaymentTransactionModel from "./PaymentTransaction.js";

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../database.sqlite"),
  logging: false,
});

// Initialize models
const User = UserModel(sequelize, DataTypes);
const Client = ClientModel(sequelize, DataTypes);
const Driver = DriverModel(sequelize, DataTypes);
const Vehicle = VehicleModel(sequelize, DataTypes);
const Trip = TripModel(sequelize, DataTypes);
const Invoice = InvoiceModel(sequelize, DataTypes);
const InvoiceTrip = InvoiceTripModel(sequelize, DataTypes);
const Expense = ExpenseModel(sequelize, DataTypes);
const Payment = PaymentModel(sequelize, DataTypes);
const Advance = AdvanceModel(sequelize, DataTypes);
const Transaction = TransactionModel(sequelize, DataTypes);
const Dispatch = DispatchModel(sequelize, DataTypes);
const ExtraCharge = ExtraChargeModel(sequelize, DataTypes);
const DriverExpense = DriverExpenseModel(sequelize, DataTypes);
const Bill = BillModel(sequelize, DataTypes);
const PaymentTransaction = PaymentTransactionModel(sequelize, DataTypes);

/* Define Associations */

// Client ↔ Invoice (1-to-many)
Client.hasMany(Invoice, { foreignKey: "client_id", as: "invoices" });
Invoice.belongsTo(Client, { foreignKey: "client_id", as: "client" });

// Client ↔ Vehicle (1-to-many)
Client.hasMany(Vehicle, { foreignKey: "client_id", as: "vehicles" });
Vehicle.belongsTo(Client, { foreignKey: "client_id", as: "client" });

// Client ↔ Trip (1-to-many)
Client.hasMany(Trip, { foreignKey: "client_id", as: "trips" });
Trip.belongsTo(Client, { foreignKey: "client_id", as: "client" });

// Driver ↔ Trip (1-to-many)
Driver.hasMany(Trip, { foreignKey: "driver_id", as: "trips" });
Trip.belongsTo(Driver, { foreignKey: "driver_id", as: "driver" });

// Vehicle ↔ Trip (1-to-many)
Vehicle.hasMany(Trip, { foreignKey: "vehicle_id", as: "trips" });
Trip.belongsTo(Vehicle, { foreignKey: "vehicle_id", as: "vehicle" });

// Driver ↔ Vehicle (1-to-many)
Driver.hasMany(Vehicle, { foreignKey: "driver_id", as: "vehicles" });
Vehicle.belongsTo(Driver, { foreignKey: "driver_id", as: "driver" });

// Invoice ↔ Vehicle (1-to-many)
Vehicle.hasMany(Invoice, { foreignKey: "vehicle_id", as: "invoices" });
Invoice.belongsTo(Vehicle, { foreignKey: "vehicle_id", as: "vehicle" });

// Invoice ↔ Trip (many-to-many via InvoiceTrip)
Trip.belongsToMany(Invoice, {
  through: InvoiceTrip,
  foreignKey: "trip_id",
  otherKey: "invoice_id",
  as: "invoices",
});
Invoice.belongsToMany(Trip, {
  through: InvoiceTrip,
  foreignKey: "invoice_id",
  otherKey: "trip_id",
  as: "trips",
});

// Trip ↔ InvoiceTrip (1-to-many)
Trip.hasMany(InvoiceTrip, { foreignKey: "trip_id", as: "invoiceTrips" });
InvoiceTrip.belongsTo(Trip, { foreignKey: "trip_id", as: "trip" });

// Client ↔ Payment (1-to-many)
Client.hasMany(Payment, { foreignKey: "client_id", as: "payments" });
Payment.belongsTo(Client, { foreignKey: "client_id", as: "client" });

// Invoice ↔ Payment (1-to-many)
Invoice.hasMany(Payment, { foreignKey: "invoice_id", as: "payments" });
Payment.belongsTo(Invoice, { foreignKey: "invoice_id", as: "invoice" });

// Invoice ↔ Dispatch (1-to-many)
Invoice.hasMany(Dispatch, { foreignKey: "invoice_id", as: "dispatches" });
Dispatch.belongsTo(Invoice, { foreignKey: "invoice_id", as: "invoice" });

// Invoice ↔ ExtraCharge (1-to-many)
Invoice.hasMany(ExtraCharge, { foreignKey: "invoice_id", as: "extraCharges" });
ExtraCharge.belongsTo(Invoice, { foreignKey: "invoice_id", as: "invoice" });

// Driver ↔ DriverExpense (1-to-many)
Driver.hasMany(DriverExpense, { foreignKey: "driver_id", as: "expenses" });
DriverExpense.belongsTo(Driver, { foreignKey: "driver_id", as: "driver" });

// Vehicle ↔ DriverExpense (1-to-many)
Vehicle.hasMany(DriverExpense, { foreignKey: "vehicle_id", as: "driverExpenses" });
DriverExpense.belongsTo(Vehicle, { foreignKey: "vehicle_id", as: "vehicle" });

// Payment ↔ PaymentTransaction (1-to-many)
Payment.hasMany(PaymentTransaction, { foreignKey: "payment_id", as: "transactions" });
PaymentTransaction.belongsTo(Payment, { foreignKey: "payment_id", as: "payment" });

// Client ↔ PaymentTransaction (1-to-many)
Client.hasMany(PaymentTransaction, { foreignKey: "client_id", as: "paymentTransactions" });
PaymentTransaction.belongsTo(Client, { foreignKey: "client_id", as: "client" });

// Invoice ↔ PaymentTransaction (1-to-many)
Invoice.hasMany(PaymentTransaction, { foreignKey: "invoice_id", as: "paymentTransactions" });
PaymentTransaction.belongsTo(Invoice, { foreignKey: "invoice_id", as: "invoice" });

// Diagnostic logs to confirm associations loaded correctly
console.log("Invoice associations:", Object.keys(Invoice.associations));
console.log("Vehicle associations:", Object.keys(Vehicle.associations));

/* Export Models and Sequelize */

export {
  sequelize,
  User,
  Client,
  Driver,
  Vehicle,
  Trip,
  Invoice,
  InvoiceTrip,
  Expense,
  Payment,
  Advance,
  Transaction,
  Dispatch,
  ExtraCharge,
  DriverExpense,
  Bill,
  PaymentTransaction,
};

export default {
  sequelize,
  User,
  Client,
  Driver,
  Vehicle,
  Trip,
  Invoice,
  InvoiceTrip,
  Expense,
  Payment,
  Advance,
  Transaction,
  Dispatch,
  ExtraCharge,
  DriverExpense,
  Bill,
  PaymentTransaction,
};
