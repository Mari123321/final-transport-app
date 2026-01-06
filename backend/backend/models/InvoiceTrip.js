export default (sequelize, DataTypes) => {
  const Invoice = sequelize.define("Invoice", {
    invoice_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW, // auto set today if not provided
    },
    total_amount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    amount_paid: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    pending_amount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    // Optional: if you want a payment_status field
    payment_status: {
      type: DataTypes.STRING,
      defaultValue: "Unpaid",
    },
  });

  return Invoice;
};
