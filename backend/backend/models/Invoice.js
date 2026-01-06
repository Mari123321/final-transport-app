import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "Invoice",
    {
      invoice_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      client_id: { type: DataTypes.INTEGER, allowNull: false },
      total_amount: { type: DataTypes.FLOAT, defaultValue: 0 },
      amount_paid: { type: DataTypes.FLOAT, defaultValue: 0 },
      pending_amount: { type: DataTypes.FLOAT, defaultValue: 0 },
      payment_status: { type: DataTypes.STRING, defaultValue: "Unpaid" },
      date: { type: DataTypes.DATEONLY, allowNull: false },
    },
    {
      tableName: "invoices",
      timestamps: true,
    }
  );
};
