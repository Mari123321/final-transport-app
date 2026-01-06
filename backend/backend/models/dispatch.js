export default (sequelize, DataTypes) => {
  const Dispatch = sequelize.define("Dispatch", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    date: DataTypes.DATE,
    vehicle: DataTypes.STRING,
    particulars: DataTypes.STRING,
    qty: DataTypes.FLOAT,
    minQty: DataTypes.FLOAT,
    rate: DataTypes.FLOAT,
    amount: DataTypes.FLOAT,
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "invoices",
        key: "invoice_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  }, {
    tableName: "Dispatches",
    timestamps: true,
  });

  return Dispatch;
};
