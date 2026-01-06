// backend/models/ClientAdvance.js

export default (sequelize, DataTypes) => {
  return sequelize.define('ClientAdvance', {
    advance_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    client_id: DataTypes.INTEGER,
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    remarks: DataTypes.STRING(255),
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'client_advances',
    timestamps: false,
  });
};
