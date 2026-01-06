export default (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
    {
      paymentId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      paidAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      // other fields...
    },
    {
      tableName: "payments",
      timestamps: true,
    }
  );

  return Payment;
};
