/**
 * PaymentTransaction Model
 * Tracks individual payment transactions for audit history
 * Every partial payment creates a new transaction record
 */
export default (sequelize, DataTypes) => {
  const PaymentTransaction = sequelize.define(
    "PaymentTransaction",
    {
      transaction_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      payment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'payments',
          key: 'payment_id'
        }
      },
      client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'client_id'
        }
      },
      invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'invoices',
          key: 'invoice_id'
        }
      },
      // Transaction details
      transaction_type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'payment',
        validate: {
          isIn: [['payment', 'refund', 'adjustment', 'initial']]
        }
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      // Balance tracking
      balance_before: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      balance_after: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      // Payment details
      payment_mode: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Cash',
        validate: {
          isIn: [['Cash', 'Bank', 'UPI', 'Cheque', 'Online', 'Other']]
        }
      },
      reference_no: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Meta
      transaction_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "payment_transactions",
      timestamps: true,
      indexes: [
        { fields: ['payment_id'] },
        { fields: ['client_id'] },
        { fields: ['invoice_id'] },
        { fields: ['transaction_date'] },
      ]
    }
  );

  PaymentTransaction.associate = (models) => {
    PaymentTransaction.belongsTo(models.Payment, {
      foreignKey: 'payment_id',
      as: 'payment'
    });
    PaymentTransaction.belongsTo(models.Client, {
      foreignKey: 'client_id',
      as: 'client'
    });
    PaymentTransaction.belongsTo(models.Invoice, {
      foreignKey: 'invoice_id',
      as: 'invoice'
    });
  };

  return PaymentTransaction;
};
