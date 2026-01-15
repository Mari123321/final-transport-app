export default (sequelize, DataTypes) => {
  const Bill = sequelize.define(
    "Bill",
    {
      bill_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: "Unique bill identifier",
      },
      bill_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: "Invoice number referenced (e.g., IN-001)",
      },
      invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "invoices",
          key: "invoice_id",
        },
        comment: "Reference to Invoice",
      },
      client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "clients",
          key: "client_id",
        },
        comment: "Client who will be billed",
      },
      vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "vehicles",
          key: "vehicle_id",
        },
        comment: "Vehicle associated with the bill (optional)",
      },
      bill_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "Date bill was generated",
      },
      total_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Total bill amount",
      },
      paid_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Amount paid so far",
      },
      pending_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Remaining amount (total - paid)",
      },
      payment_status: {
        type: DataTypes.ENUM("UNPAID", "PARTIAL", "PAID"),
        defaultValue: "UNPAID",
        comment: "Current payment status",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Additional notes/comments",
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Soft delete timestamp",
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "User who created the bill",
      },
      updated_by: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "User who last updated the bill",
      },
    },
    {
      tableName: "bills",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["invoice_id"] },
        { fields: ["client_id"] },
        { fields: ["vehicle_id"] },
        { fields: ["bill_date"] },
        { fields: ["payment_status"] },
        { fields: ["deleted_at"] },
      ],
    }
  );

  return Bill;
};
