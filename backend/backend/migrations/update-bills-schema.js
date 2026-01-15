import db from "../models/index.js";

export const updateBillsSchema = async () => {
  try {
    console.log("🔄 Updating bills table schema...");
    const sequelize = db.sequelize;

    // Get the Bill model
    const { Bill } = db;

    // Sync the Bill model with force to recreate the table
    await Bill.sync({ alter: true });

    console.log("✅ Bills table schema updated successfully");
    return true;
  } catch (error) {
    console.error("❌ Error updating bills schema:", error.message);
    return false;
  }
};

// Run migration if executed directly
updateBillsSchema().then(() => {
  console.log("Migration complete");
  process.exit(0);
});
