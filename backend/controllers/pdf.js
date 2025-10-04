const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Route = require('../models/Route');
const Student = require('../models/Student');

exports.generateRoutePDF = async (req, res) => {
  try {
    const route = await Route.findById(req.params.routeId).populate('driver');
    const students = await Student.find({ route: req.params.routeId });

    if (!route) {
      return res.status(404).json({ success: false, msg: 'Route not found' });
    }

    // Create PDF document with larger margins for better aesthetics
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `Route Report - ${route.routeName}`,
        Author: 'D.Y. Patil Transport Facility',
        Creator: 'Transport Management System'
      }
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${route.routeName}-report.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Header Section with improved design
    doc.rect(0, 0, doc.page.width, 80)
       .fill('#1a237e');
    
    doc.fontSize(24)
       .fillColor('white')
       .font('Helvetica-Bold')
       .text('D.Y. Patil Transport Facility', 50, 30, { align: 'center' });
    
    doc.fontSize(14)
       .fillColor('#e3f2fd')
       .font('Helvetica')
       .text('Bus Route Report', { align: 'center' })
       .moveDown(2);

    // Add decorative element
    doc.moveTo(50, 90)
       .lineTo(doc.page.width - 50, 90)
       .lineWidth(2)
       .strokeColor('#ff9800')
       .stroke();

    // Driver Details Section with improved layout
    doc.y = 110;
    doc.fontSize(16)
       .fillColor('#1a237e')
       .font('Helvetica-Bold')
       .text('Driver Information', { underline: false })
       .moveDown(0.5);

    // Add driver info box with background
    const driverInfoY = doc.y;
    doc.rect(50, driverInfoY, doc.page.width - 100, 80)
       .fill('#f5f7ff')
       .stroke('#e0e0e0');
    
    const driverInfo = [
      ['Driver Name:', route.driver?.name || 'Not Assigned'],
      ['Email:', route.driver?.email || 'N/A'],
      ['Route Name:', route.routeName],
    ];

    let yPosition = driverInfoY + 15;
    driverInfo.forEach(([label, value]) => {
      doc.fontSize(11)
         .fillColor('#455a64')
         .font('Helvetica-Bold')
         .text(label, 60, yPosition, { width: 120 })
         .fillColor('#37474f')
         .font('Helvetica')
         .text(value, 170, yPosition, { width: 300 });
      yPosition += 20;
    });

    doc.y = driverInfoY + 90;

    // Students Table Section with improved design
    doc.fontSize(16)
       .fillColor('#1a237e')
       .font('Helvetica-Bold')
       .text('Student List', { underline: false })
       .moveDown(0.5);

    // Table Headers with improved styling
    const tableTop = doc.y;
    const tableHeaders = ['Student Name', 'Department', 'Mobile No.', 'Fee Status'];
    const columnWidths = [150, 120, 100, 80];
    let xPosition = 50;

    // Draw header background with rounded corners
    doc.roundedRect(50, tableTop, doc.page.width - 100, 25, 3)
       .fill('#1a237e');

    // Header text
    tableHeaders.forEach((header, i) => {
      doc.fontSize(11)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text(header, xPosition + 10, tableTop + 7, { width: columnWidths[i] });
      xPosition += columnWidths[i];
    });

    // Table Rows with improved styling
    let rowY = tableTop + 25;
    students.forEach((student, index) => {
      xPosition = 50;
      
      // Alternate row colors
      if (index % 2 === 0) {
        doc.rect(50, rowY, doc.page.width - 100, 20)
           .fill('#f8f9ff');
      }

      const rowData = [
        student.name,
        student.department || 'N/A',
        student.mobileNumber || 'N/A',
        student.feeStatus || 'Not Paid'
      ];

      rowData.forEach((data, i) => {
        doc.fontSize(10)
           .fillColor('#263238')
           .font('Helvetica')
           .text(data, xPosition + 10, rowY + 5, { 
             width: columnWidths[i],
             ellipsis: true 
            });
        xPosition += columnWidths[i];
      });

      rowY += 20;
      
      // Add page break if needed
      if (rowY > doc.page.height - 100) {
        doc.addPage();
        rowY = 50;
        
        // Redraw table headers on new page
        xPosition = 50;
        doc.roundedRect(50, rowY, doc.page.width - 100, 25, 3)
           .fill('#1a237e');
        
        tableHeaders.forEach((header, i) => {
          doc.fontSize(11)
             .fillColor('white')
             .font('Helvetica-Bold')
             .text(header, xPosition + 10, rowY + 7, { width: columnWidths[i] });
          xPosition += columnWidths[i];
        });
        
        rowY += 25;
      }
    });

    // Draw table borders
    doc.roundedRect(50, tableTop, doc.page.width - 100, rowY - tableTop, 3)
       .stroke('#b0bec5');

    // Summary section with improved design
    doc.y = rowY + 30;
    doc.rect(50, doc.y, doc.page.width - 100, 40)
       .fill('#e8f5e9')
       .stroke('#c8e6c9');
    
    const paidStudents = students.filter(s => s.feeStatus === 'Paid').length;
    
    doc.fontSize(12)
       .fillColor('#2e7d32')
       .font('Helvetica-Bold')
       .text(`Total Students: ${students.length}`, doc.page.width - 220, doc.y + 12)
       .text(`Paid: ${paidStudents} | Pending: ${students.length - paidStudents}`, doc.page.width - 220, doc.y + 32);

    // Footer with improved design
    const footerY = doc.page.height - 50;
    
    doc.moveTo(50, footerY)
       .lineTo(doc.page.width - 50, footerY)
       .lineWidth(1)
       .strokeColor('#e0e0e0')
       .stroke();
    
    doc.fontSize(9)
       .fillColor('#757575')
       .text(`Generated on: ${new Date().toLocaleDateString('en-IN', {
         weekday: 'long',
         year: 'numeric',
         month: 'long',
         day: 'numeric'
       })}`, 50, footerY + 10);
    
    doc.text('Page 1 of 1', 0, footerY + 10, { align: 'right' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// @desc    Generate CSV report for a route
// @route   GET /api/v1/pdf/route/:routeId/csv
// @access  Private
exports.generateRouteCSV = async (req, res) => {
  try {
    const route = await Route.findById(req.params.routeId).populate('driver');
    const students = await Student.find({ route: req.params.routeId });

    if (!route) {
      return res.status(404).json({ success: false, msg: 'Route not found' });
    }

    // Set response headers for CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${route.routeName}-report.csv"`);

    // CSV Header
    let csvContent = 'Student Name,Department,Mobile No,Fee Status\n';

    // CSV Data
    students.forEach(student => {
      csvContent += `"${student.name}","${student.department || 'N/A'}","${student.mobileNumber || 'N/A'}","${student.feeStatus || 'Not Paid'}"\n`;
    });

    res.send(csvContent);

  } catch (error) {
    console.error('CSV Generation Error:', error);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// @desc    Generate PDF report for all routes (Admin only)
// @route   GET /api/v1/pdf/all-routes
// @access  Private
exports.generateAllRoutesPDF = async (req, res) => {
  try {
    const routes = await Route.find().populate('driver');
    
    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="all-routes-report.pdf"');
    
    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill('#1a237e');
    doc.fontSize(24).fillColor('white').font('Helvetica-Bold')
       .text('D.Y. Patil Transport Facility', 50, 30, { align: 'center' });
    doc.fontSize(14).fillColor('#e3f2fd').font('Helvetica')
       .text('All Routes Summary Report', { align: 'center' }).moveDown(2);

    // Routes summary
    doc.y = 110;
    doc.fontSize(16).fillColor('#1a237e').font('Helvetica-Bold')
       .text('Routes Summary', { underline: false }).moveDown(0.5);

    for (const route of routes) {
      const students = await Student.find({ route: route._id });
      const paidStudents = students.filter(s => s.feeStatus === 'Paid').length;

      doc.fontSize(12).fillColor('#263238').font('Helvetica')
         .text(`Route: ${route.routeName}`, 50)
         .text(`Driver: ${route.driver?.name || 'Not Assigned'}`, 50)
         .text(`Total Students: ${students.length} | Paid: ${paidStudents} | Pending: ${students.length - paidStudents}`, 50)
         .moveDown(1);
    }

    // Footer
    const footerY = doc.page.height - 50;
    doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY)
       .lineWidth(1).strokeColor('#e0e0e0').stroke();
    doc.fontSize(9).fillColor('#757575')
       .text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 50, footerY + 10);

    doc.end();

  } catch (error) {
    console.error('All Routes PDF Generation Error:', error);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};