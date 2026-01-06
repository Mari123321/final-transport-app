import PDFDocument from 'pdfkit';
import { Invoice, Client, Vehicle, Trip } from '../models/index.js';

/**
 * Generate professional PDF invoice
 */
export const generateInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch invoice with related data
    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['client_name', 'client_address', 'client_gst', 'client_phone', 'client_email']
        },
        {
          model: Trip,
          as: 'trips',
          attributes: [
            'trip_id', 'date', 'from_place', 'to_place',
            'minimum_quantity', 'actual_quantity', 'rate_per_tonne', 'amount'
          ],
          include: [
            { model: Vehicle, as: 'vehicle', attributes: ['vehicle_number'] }
          ]
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_no || invoice.invoice_id}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Company Header
    doc.fontSize(20).fillColor('#1976d2').text('TRANSPORT COMPANY', 50, 50, { align: 'center' });
    doc.fontSize(10).fillColor('#666').text('Professional Transportation Services', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(9).text('Address: [Your Company Address]', { align: 'center' });
    doc.text('Phone: [Your Phone] | Email: [Your Email]', { align: 'center' });
    doc.text('GST: [Your GST Number]', { align: 'center' });

    // Draw header line
    doc.strokeColor('#1976d2').lineWidth(2)
       .moveTo(50, 140).lineTo(545, 140).stroke();

    doc.moveDown(2);

    // Invoice Title
    doc.fontSize(18).fillColor('#000').text('TAX INVOICE', 50, 160, { align: 'center', underline: true });
    doc.moveDown(2);

    // Invoice details in two columns
    const leftCol = 50;
    const rightCol = 320;
    let yPos = 200;

    // Left: Client details
    doc.fontSize(12).fillColor('#1976d2').text('Bill To:', leftCol, yPos);
    yPos += 20;
    doc.fontSize(10).fillColor('#000')
       .text(invoice.client?.client_name || 'N/A', leftCol, yPos);
    yPos += 15;
    if (invoice.client?.client_address) {
      doc.fontSize(9).text(`Address: ${invoice.client.client_address}`, leftCol, yPos);
      yPos += 12;
    }
    if (invoice.client?.client_gst) {
      doc.text(`GST: ${invoice.client.client_gst}`, leftCol, yPos);
      yPos += 12;
    }
    if (invoice.client?.client_phone) {
      doc.text(`Phone: ${invoice.client.client_phone}`, leftCol, yPos);
    }

    // Right: Invoice details
    yPos = 200;
    doc.fontSize(10).fillColor('#000')
       .text(`Invoice No: ${invoice.invoice_no || invoice.invoice_id}`, rightCol, yPos);
    yPos += 15;
    doc.text(`Date: ${new Date(invoice.invoice_date || invoice.createdAt).toLocaleDateString()}`, rightCol, yPos);
    yPos += 15;
    if (invoice.dispatch_date) {
      doc.text(`Dispatch Date: ${new Date(invoice.dispatch_date).toLocaleDateString()}`, rightCol, yPos);
      yPos += 15;
    }
    doc.text(`Payment Status: ${invoice.payment_status || 'Pending'}`, rightCol, yPos);

    // Table Header
    yPos = 310;
    doc.fontSize(10).fillColor('#1976d2');

    const col1 = 50, col2 = 100, col3 = 200, col4 = 300, col5 = 370, col6 = 440, col7 = 500;
    
    doc.rect(50, yPos - 5, 495, 25).fill('#f0f0f0');
    doc.fillColor('#000')
       .text('S.No', col1, yPos)
       .text('Date', col2, yPos)
       .text('Route', col3, yPos)
       .text('Vehicle', col4, yPos)
       .text('Qty (T)', col5, yPos)
       .text('Rate', col6, yPos)
       .text('Amount', col7, yPos);

    // Draw line under header
    yPos += 20;
    doc.strokeColor('#ccc').lineWidth(1)
       .moveTo(50, yPos).lineTo(545, yPos).stroke();

    // Table Rows - Trips
    yPos += 10;
    const trips = invoice.trips || [];
    let subtotal = 0;

    trips.forEach((trip, index) => {
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      const amount = trip.amount || (trip.actual_quantity * trip.rate_per_tonne);
      subtotal += amount;

      doc.fontSize(9).fillColor('#000')
         .text(index + 1, col1, yPos)
         .text(new Date(trip.date).toLocaleDateString(), col2, yPos)
         .text(`${trip.from_place}-${trip.to_place}`, col3, yPos, { width: 90, ellipsis: true })
         .text(trip.vehicle?.vehicle_number || 'N/A', col4, yPos, { width: 60 })
         .text(trip.actual_quantity?.toFixed(2) || '0', col5, yPos)
         .text(trip.rate_per_tonne?.toFixed(2) || '0', col6, yPos)
         .text(amount.toFixed(2), col7, yPos);

      yPos += 20;
    });

    // Draw line before total
    doc.strokeColor('#ccc').lineWidth(1)
       .moveTo(50, yPos).lineTo(545, yPos).stroke();
    yPos += 15;

    // Totals
    const gstRate = 0; // Adjust as needed
    const gstAmount = subtotal * gstRate;
    const totalAmount = subtotal + gstAmount;

    doc.fontSize(11).fillColor('#000');
    doc.text('Subtotal:', 400, yPos).text(`₹ ${subtotal.toFixed(2)}`, 500, yPos, { align: 'right' });
    
    if (gstRate > 0) {
      yPos += 20;
      doc.text(`GST (${gstRate * 100}%):`, 400, yPos).text(`₹ ${gstAmount.toFixed(2)}`, 500, yPos, { align: 'right' });
    }

    yPos += 25;
    doc.fontSize(13).fillColor('#1976d2');
    doc.rect(380, yPos - 5, 165, 30).stroke();
    doc.text('Total Amount:', 390, yPos)
       .text(`₹ ${totalAmount.toFixed(2)}`, 500, yPos, { align: 'right' });

    // Footer
    const footerY = 750;
    doc.fontSize(9).fillColor('#666');
    doc.text('Terms & Conditions:', 50, footerY);
    doc.fontSize(8).text('1. Payment due within 30 days', 50, footerY + 12);
    doc.text('2. All disputes subject to [Your City] jurisdiction', 50, footerY + 22);

    doc.text('Authorized Signatory', 400, footerY + 20, { align: 'right' });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
};

/**
 * Get all bills with pagination and filters
 */
export const getAllBills = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, clientId } = req.query;
    
    const where = {};
    if (status) where.payment_status = status;
    if (clientId) where.client_id = clientId;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: bills } = await Invoice.findAndCountAll({
      where,
      include: [
        { 
          model: Client, 
          as: 'client', 
          attributes: ['client_name', 'client_gst'] 
        }
      ],
      attributes: [
        ['invoice_id', 'bill_id'],
        'invoice_no',
        ['invoice_date', 'date'],
        'dispatch_date',
        'total_amount',
        'amount_paid',
        'pending_amount',
        'payment_status',
        'particulars',
        'createdAt'
      ],
      order: [['invoice_date', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      bills,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch bills',
      error: error.message 
    });
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    if (!['Pending', 'Paid', 'Partial'].includes(payment_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({ 
        success: false,
        message: 'Invoice not found' 
      });
    }

    await invoice.update({ payment_status });
    
    res.json({ 
      success: true,
      message: 'Payment status updated successfully',
      payment_status 
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update payment status',
      error: error.message 
    });
  }
};

/**
 * Delete invoice
 */
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await invoice.destroy();
    
    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice',
      error: error.message
    });
  }
};