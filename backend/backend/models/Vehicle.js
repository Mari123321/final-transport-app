// models/vehicle.js
export default (sequelize, DataTypes) => {
  return sequelize.define(
    "Vehicle",
    {
      vehicle_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      vehicle_number: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      permit_number: { type: DataTypes.STRING },
      rc_status: { type: DataTypes.STRING, defaultValue: "Current" },
      rc_book_number: { type: DataTypes.STRING },
      rc_expiry_date: { type: DataTypes.DATE },
      driver_id: { type: DataTypes.INTEGER },
      client_id: { type: DataTypes.INTEGER },
      status: { 
        type: DataTypes.ENUM('Active', 'Inactive'), 
        defaultValue: 'Active',
        allowNull: false,
      },
    },
    {
      tableName: "vehicles", // ✅ match existing DB table
      timestamps: false,     // ✅ stop Sequelize from adding createdAt/updatedAt
    }
  );
};
