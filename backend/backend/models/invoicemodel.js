import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "Invoice",
    {
      invoice_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      invoice_number: { 
        type: DataTypes.STRING, 
        allowNull: true,
        unique: true 
      },
      client_id: { type: DataTypes.INTEGER, allowNull: false },
      vehicle_id: { type: DataTypes.INTEGER, allowNull: true },
      total_amount: { type: DataTypes.FLOAT, defaultValue: 0 },
      amount_paid: { type: DataTypes.FLOAT, defaultValue: 0 },
      pending_amount: { type: DataTypes.FLOAT, defaultValue: 0 },
      payment_status: { 
        type: DataTypes.STRING, 
        defaultValue: "Unpaid",
        validate: {
          isIn: [["Paid", "Partial", "Unpaid", "Pending"]]
        }
      },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      due_date: { type: DataTypes.DATEONLY, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: "invoices",
      timestamps: true,
      hooks: {
        beforeCreate: async (invoice) => {
          // Auto-generate invoice number if not provided
          if (!invoice.invoice_number) {
            const year = new Date().getFullYear();
            const month = String(new Date().getMonth() + 1).padStart(2, '0');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            invoice.invoice_number = `INV-${year}${month}-${random}`;
          }
        },
        beforeUpdate: (invoice) => {
          // Auto-calculate payment status based on amounts
          const total = invoice.total_amount || 0;
          const paid = invoice.amount_paid || 0;
          invoice.pending_amount = total - paid;
          
          if (paid >= total && total > 0) {
            invoice.payment_status = "Paid";
          } else if (paid > 0 && paid < total) {
            invoice.payment_status = "Partial";
          } else {
            invoice.payment_status = "Unpaid";
          }
        }
      }
    }
  );
};
