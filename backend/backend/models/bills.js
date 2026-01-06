export default (sequelize, DataTypes) => {
  const Bill = sequelize.define("Bill", {
    bill_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    invoice_no: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    invoice_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    client_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    vehicle_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    particulars: DataTypes.STRING,
    qty: DataTypes.FLOAT,
    min_charge_qty: DataTypes.FLOAT,
    rate: DataTypes.FLOAT,
    total_amount: DataTypes.FLOAT,
    payment_status: {
      type: DataTypes.STRING,
      defaultValue: "Pending",
    },
  }, {
    tableName: "bills",
    timestamps: false,
  });
  return Bill;
};
