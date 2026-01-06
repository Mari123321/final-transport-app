export default (sequelize, DataTypes) => {
  return sequelize.define("Trip", {
    trip_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: { type: DataTypes.DATE, allowNull: false },
    vehicle_id: { type: DataTypes.INTEGER, allowNull: false },
    from_place: { type: DataTypes.STRING, allowNull: false },
    to_place: { type: DataTypes.STRING, allowNull: false },
    driver_id: { type: DataTypes.INTEGER, allowNull: false },
    payment_mode: { type: DataTypes.ENUM("Cash", "UPI", "Cheque"), allowNull: false },
    amount_paid: { type: DataTypes.FLOAT },
    pending_amount: { type: DataTypes.FLOAT },
    diesel_litre: { type: DataTypes.FLOAT },
    diesel_payment: { type: DataTypes.FLOAT },
    client_id: { type: DataTypes.INTEGER },
    goods_id: { type: DataTypes.INTEGER },
    actual_quantity: { type: DataTypes.FLOAT, allowNull: false },  // will always be set = minimum_quantity
    minimum_quantity: { type: DataTypes.FLOAT, allowNull: false }, // main input
    rate_per_tonne: { type: DataTypes.FLOAT, allowNull: false },
    dispatch_date: { type: DataTypes.DATEONLY, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },         // store final computed value (minimum_quantity * rate_per_tonne)
    // Removed tonnage, minimum_charge, total_amount
  });
};
