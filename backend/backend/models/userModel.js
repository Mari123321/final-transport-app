export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // ✅ only once
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // ✅ only once
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("admin", "staff"),
        defaultValue: "staff",
      },
    },
    {
      tableName: "users",
      timestamps: true,
    }
  );

  return User;
};
