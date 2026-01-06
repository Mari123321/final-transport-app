// backend/models/extraCharge.js
export default (sequelize, DataTypes) => {
  const ExtraCharge = sequelize.define(
    "ExtraCharge",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      tableName: "extra_charges",
      timestamps: true,
    }
  );

  return ExtraCharge;
};
