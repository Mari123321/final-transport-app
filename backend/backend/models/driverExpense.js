// models/driverExpense.js
export default (sequelize, DataTypes) => {
  return sequelize.define(
    "DriverExpense",
    {
      expense_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      driver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'drivers',
          key: 'id'
        }
      },
      vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'vehicles',
          key: 'vehicle_id'
        }
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      litres: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      price_per_litre: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      total_amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "driver_expenses",
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );
};
