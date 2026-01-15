import { DriverExpense, Driver, Vehicle } from '../models/index.js';
import { Op, fn, col } from 'sequelize';

// ================== CREATE DRIVER EXPENSE ==================
export const createDriverExpense = async (req, res) => {
  try {
    const { driver_id, vehicle_id, date, litres, price_per_litre, remarks } = req.body;

    // Validation
    if (!driver_id || !date || !litres || !price_per_litre) {
      return res.status(400).json({ 
        success: false,
        message: 'Driver, date, litres, and price per litre are required' 
      });
    }

    if (litres <= 0 || price_per_litre <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Litres and price per litre must be greater than 0' 
      });
    }

    // Calculate total amount
    const total_amount = parseFloat((litres * price_per_litre).toFixed(2));

    const expense = await DriverExpense.create({
      driver_id,
      vehicle_id: vehicle_id || null,
      date,
      litres,
      price_per_litre,
      total_amount,
      remarks: remarks || null,
    });

    // Fetch created expense with associations
    const createdExpense = await DriverExpense.findByPk(expense.expense_id, {
      include: [
        { model: Driver, as: 'driver', attributes: ['id', 'name', 'phone'] },
        { model: Vehicle, as: 'vehicle', attributes: ['vehicle_id', 'vehicle_number'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Driver expense created successfully',
      data: createdExpense
    });
  } catch (error) {
    console.error('❌ Error creating driver expense:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create driver expense',
      error: error.message 
    });
  }
};

// ================== GET ALL DRIVER EXPENSES ==================
export const getDriverExpenses = async (req, res) => {
  try {
    const { driver_id, start_date, end_date } = req.query;
    
    const where = {};
    
    if (driver_id) {
      where.driver_id = driver_id;
    }
    
    if (start_date && end_date) {
      where.date = {
        [Op.between]: [start_date, end_date]
      };
    } else if (start_date) {
      where.date = {
        [Op.gte]: start_date
      };
    } else if (end_date) {
      where.date = {
        [Op.lte]: end_date
      };
    }

    const expenses = await DriverExpense.findAll({
      where,
      include: [
        { model: Driver, as: 'driver', attributes: ['id', 'name', 'phone'] },
        { model: Vehicle, as: 'vehicle', attributes: ['vehicle_id', 'vehicle_number'] }
      ],
      order: [['date', 'DESC'], ['created_at', 'DESC']]
    });

    // Calculate summary
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.total_amount || 0), 0);
    const totalLitres = expenses.reduce((sum, exp) => sum + parseFloat(exp.litres || 0), 0);

    res.status(200).json({
      success: true,
      data: expenses,
      summary: {
        total_expenses: parseFloat(totalExpenses.toFixed(2)),
        total_litres: parseFloat(totalLitres.toFixed(2)),
        count: expenses.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching driver expenses:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch driver expenses',
      error: error.message 
    });
  }
};

// ================== GET DRIVER EXPENSE BY ID ==================
export const getDriverExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await DriverExpense.findByPk(id, {
      include: [
        { model: Driver, as: 'driver', attributes: ['id', 'name', 'phone'] },
        { model: Vehicle, as: 'vehicle', attributes: ['vehicle_id', 'vehicle_number'] }
      ]
    });

    if (!expense) {
      return res.status(404).json({ 
        success: false,
        message: 'Driver expense not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('❌ Error fetching driver expense:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch driver expense',
      error: error.message 
    });
  }
};

// ================== GET EXPENSES BY DRIVER ==================
export const getExpensesByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    const expenses = await DriverExpense.findAll({
      where: { driver_id: driverId },
      include: [
        { model: Driver, as: 'driver', attributes: ['id', 'name', 'phone'] },
        { model: Vehicle, as: 'vehicle', attributes: ['vehicle_id', 'vehicle_number'] }
      ],
      order: [['date', 'DESC']]
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.total_amount || 0), 0);
    const totalLitres = expenses.reduce((sum, exp) => sum + parseFloat(exp.litres || 0), 0);

    res.status(200).json({
      success: true,
      data: expenses,
      summary: {
        driver_id: driverId,
        total_expenses: parseFloat(totalExpenses.toFixed(2)),
        total_litres: parseFloat(totalLitres.toFixed(2)),
        count: expenses.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching driver expenses:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch driver expenses',
      error: error.message 
    });
  }
};

// ================== UPDATE DRIVER EXPENSE ==================
export const updateDriverExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { driver_id, vehicle_id, date, litres, price_per_litre, remarks } = req.body;

    const expense = await DriverExpense.findByPk(id);

    if (!expense) {
      return res.status(404).json({ 
        success: false,
        message: 'Driver expense not found' 
      });
    }

    // Recalculate total if litres or price changed
    let total_amount = expense.total_amount;
    if (litres !== undefined && price_per_litre !== undefined) {
      total_amount = parseFloat((litres * price_per_litre).toFixed(2));
    } else if (litres !== undefined) {
      total_amount = parseFloat((litres * expense.price_per_litre).toFixed(2));
    } else if (price_per_litre !== undefined) {
      total_amount = parseFloat((expense.litres * price_per_litre).toFixed(2));
    }

    await expense.update({
      driver_id: driver_id !== undefined ? driver_id : expense.driver_id,
      vehicle_id: vehicle_id !== undefined ? vehicle_id : expense.vehicle_id,
      date: date || expense.date,
      litres: litres !== undefined ? litres : expense.litres,
      price_per_litre: price_per_litre !== undefined ? price_per_litre : expense.price_per_litre,
      total_amount,
      remarks: remarks !== undefined ? remarks : expense.remarks,
    });

    const updatedExpense = await DriverExpense.findByPk(id, {
      include: [
        { model: Driver, as: 'driver', attributes: ['id', 'name', 'phone'] },
        { model: Vehicle, as: 'vehicle', attributes: ['vehicle_id', 'vehicle_number'] }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Driver expense updated successfully',
      data: updatedExpense
    });
  } catch (error) {
    console.error('❌ Error updating driver expense:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update driver expense',
      error: error.message 
    });
  }
};

// ================== DELETE DRIVER EXPENSE ==================
export const deleteDriverExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await DriverExpense.findByPk(id);

    if (!expense) {
      return res.status(404).json({ 
        success: false,
        message: 'Driver expense not found' 
      });
    }

    await expense.destroy();

    res.status(200).json({
      success: true,
      message: 'Driver expense deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting driver expense:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete driver expense',
      error: error.message 
    });
  }
};

// ================== GET EXPENSE DATES BY DRIVER ==================
// Matches Smart Payments getBillDatesForClient pattern
export const getExpenseDatesByDriver = async (req, res) => {
  try {
    const { driver_id } = req.query;

    console.log('📅 GET EXPENSE DATES REQUEST:', { driver_id });

    if (!driver_id) {
      return res.status(400).json({
        success: false,
        error: 'Driver ID is required',
        detail: 'Please select a driver first'
      });
    }

    // Fetch DISTINCT dates for this driver
    const dates = await DriverExpense.findAll({
      where: { driver_id },
      attributes: [
        [fn('DISTINCT', col('date')), 'date']
      ],
      raw: true,
      order: [['date', 'DESC']]
    });

    console.log('✅ Found dates:', dates);

    // Extract and sort dates
    const sortedDates = dates
      .filter(d => d.date)
      .map(d => d.date)
      .sort((a, b) => new Date(b) - new Date(a)); // Newest first

    console.log('✅ Sorted dates:', sortedDates);

    res.json({
      success: true,
      data: sortedDates,
      count: sortedDates.length
    });
  } catch (error) {
    console.error('❌ Error fetching expense dates by driver:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expense dates',
      detail: error.message
    });
  }
};
