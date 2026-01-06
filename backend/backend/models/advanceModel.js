export default (sequelize, DataTypes) =>
  sequelize.define('Advance', {
    advance_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    driver_id: DataTypes.INTEGER,
    amount: DataTypes.FLOAT,
  }, {
    tableName: 'client_advances',
    timestamps: false,
  });
