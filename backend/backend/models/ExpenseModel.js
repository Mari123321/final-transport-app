// models/ExpenseModel.js
export default (sequelize, DataTypes) => {
  const Expense = sequelize.define('Expense', {
    expense_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tripId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
    },
    date: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'expenses',
    timestamps: false,
  });

  return Expense;
};
