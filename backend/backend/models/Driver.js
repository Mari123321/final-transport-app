import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "Driver",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      serial_number: { type: DataTypes.STRING(3), allowNull: true, unique: true },
      driver_code: { type: DataTypes.STRING(10), allowNull: true, unique: true },
      name: { type: DataTypes.STRING, allowNull: false },
      license_number: { type: DataTypes.STRING(15), allowNull: false, unique: true },
      phone: { type: DataTypes.STRING(15), allowNull: true },
      aadhaar_no: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      address: { type: DataTypes.TEXT, allowNull: true },
      joining_date: { type: DataTypes.DATEONLY, allowNull: true },
      license_expiry_date: { type: DataTypes.DATEONLY, allowNull: true },
      status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
    },
    {
      tableName: "drivers",
      timestamps: false,
    }
  );
};
