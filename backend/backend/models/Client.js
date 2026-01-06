import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Client = sequelize.define(
    "Client",
    {
      client_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      client_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      client_address: DataTypes.STRING,
      billing_address: DataTypes.STRING, // Billing address (can differ from main address)
      client_gst: DataTypes.STRING,
      client_state: DataTypes.STRING,
      client_city: DataTypes.STRING,
      client_phone: DataTypes.STRING,
      client_email: DataTypes.STRING,
      client_pan: DataTypes.STRING,
      client_type: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',
        allowNull: false,
      },
    },
    {
      tableName: "clients",
      timestamps: true,
    }
  );

  Client.associate = (models) => {
    Client.hasMany(models.Trip, { foreignKey: "client_id", as: "trips" });
    Client.hasMany(models.Invoice, { foreignKey: "client_id", as: "invoices" });
  };

  return Client;
};
