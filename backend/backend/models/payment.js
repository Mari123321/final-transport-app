export default (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
    {
      payment_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      receipt_number: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
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
      // Financial fields
      total_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      paid_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      balance_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      // Date fields
      bill_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      payment_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      // Payment details
      payment_mode: {
        type: DataTypes.ENUM('CASH', 'CHEQUE', 'BANK', 'UPI'),
        allowNull: true,
        defaultValue: 'CASH',
        set(value) {
          // Normalize to UPPERCASE ENUM
          if (!value) {
            this.setDataValue('payment_mode', 'CASH');
            return;
          }
          const normalized = String(value).toUpperCase();
          // Handle common variations
          const normalizedMap = {
            'BANK TRANSFER': 'BANK',
            'ONLINE': 'BANK',
            'CHECK': 'CHEQUE'
          };
          this.setDataValue('payment_mode', normalizedMap[normalized] || normalized);
        }
      },
      payment_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Pending',
        validate: {
          isIn: [['Paid', 'Partial', 'Pending']]
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
      // Overdue tracking
      is_overdue: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      overdue_days: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: "payments",
      timestamps: true,
      hooks: {
        beforeCreate: async (payment) => {
          // Auto-generate receipt number
          if (!payment.receipt_number) {
            const year = new Date().getFullYear();
            const month = String(new Date().getMonth() + 1).padStart(2, '0');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            payment.receipt_number = `RCP-${year}${month}-${random}`;
          }
          // Calculate balance
          payment.balance_amount = (payment.total_amount || 0) - (payment.paid_amount || 0);
          // Auto-set status
          payment.payment_status = calculateStatus(payment.total_amount, payment.paid_amount);
          // Check overdue
          checkOverdue(payment);
        },
        beforeUpdate: (payment) => {
          // Recalculate balance
          payment.balance_amount = (payment.total_amount || 0) - (payment.paid_amount || 0);
          // Auto-set status
          payment.payment_status = calculateStatus(payment.total_amount, payment.paid_amount);
          // Check overdue
          checkOverdue(payment);
        }
      }
    }
  );

  return Payment;
};

// Helper function to calculate payment status
function calculateStatus(total, paid) {
  const totalAmt = Number(total) || 0;
  const paidAmt = Number(paid) || 0;
  
  if (paidAmt >= totalAmt && totalAmt > 0) {
    return 'Paid';
  } else if (paidAmt > 0 && paidAmt < totalAmt) {
    return 'Partial';
  }
  return 'Pending';
}

// Helper function to check and set overdue status
function checkOverdue(payment) {
  if (payment.due_date && payment.payment_status !== 'Paid') {
    const today = new Date();
    const dueDate = new Date(payment.due_date);
    if (today > dueDate) {
      payment.is_overdue = true;
      payment.overdue_days = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    } else {
      payment.is_overdue = false;
      payment.overdue_days = 0;
    }
  }
}
