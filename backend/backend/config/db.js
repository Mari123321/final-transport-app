// D:/transport-app/backend/config/database.js
import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  "transportation_company", // database name
  "root",                   // MySQL username
  "Lokesh@210905",          // MySQL password
  {
    host: "localhost",
    dialect: "mysql",
    logging: false, // disable SQL logs for cleaner output
  }
);

export default sequelize;
