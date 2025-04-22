import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '../lib/supabase';
import type { CompanySettings } from '../types/database';

interface GeneratePDFOptions {
  accident: any; // We'll type this properly once we have the full accident type
  companySettings: CompanySettings;
}

export async function generateAccidentPDF({
  accident,
  companySettings
}: GeneratePDFOptions): Promise<string> {
  try {
    // Create new PDF document
    const doc = new jsPDF();
    
    // Define theme colors and styles
    const themeColor = '#6EB348';
    const headerColor = '#edeaea';
    const cellBackgroundColor = '#f7f7f7';
    const borderColor = [211, 211, 211]; // Light gray border
    
    // Set default font
    doc.setFont('helvetica');

    // Add company logo if exists
    if (companySettings.logo_url) {
      try {
        const response = await fetch(companySettings.logo_url);
        if (!response.ok) {
          throw new Error(`Failed to fetch logo: ${response.statusText}`);
        }
        const blob = await response.blob();
        const reader = new FileReader();
        
        await new Promise((resolve, reject) => {
          reader.onload = () => {
            try {
              if (reader.result) {
                // Calculate dimensions to maintain aspect ratio
                const maxWidth = 40;
                const maxHeight = 20;
                const aspectRatio = 300/91; // Default aspect ratio
                let width = maxWidth;
                let height = width / aspectRatio;
                
                if (height > maxHeight) {
                  height = maxHeight;
                  width = height * aspectRatio;
                }

                doc.addImage(
                  reader.result as string,
                  'PNG',
                  15,
                  15,
                  width,
                  height,
                  undefined,
                  'FAST'
                );
              }
              resolve(null);
            } catch (error) {
              reject(new Error(`Failed to add logo to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
          };
          reader.onerror = () => reject(new Error('Failed to read logo file'));
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error loading company logo:', error);
        // Continue without logo
      }
    }

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(themeColor);
    doc.text(accident.report_type === 'nearMiss' ? 'NEAR MISS REPORT' : 'ACCIDENT REPORT', 120, 25, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    let yPos = 45;

    // Company Information (Left Side)
    (doc as any).autoTable({
      startY: yPos,
      body: [
        [{ content: companySettings.name, styles: { fontStyle: 'bold' } }],
        [companySettings.address_line1],
        ...(companySettings.address_line2 ? [[companySettings.address_line2]] : []),
        [`${companySettings.town}, ${companySettings.county}`],
        [companySettings.post_code],
        [`Tel: ${companySettings.phone}`],
        [companySettings.email]
      ],
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 0.5,
        lineWidth: 0
      },
      margin: { left: 15 },
      tableWidth: 80
    });

    // Report Information (Right Side)
    (doc as any).autoTable({
      startY: yPos,
      body: [
        [{ content: 'Report Number:', styles: { fillColor: '#ffffff' } }, { content: accident.report_number, styles: { fontStyle: 'bold', fillColor: cellBackgroundColor } }],
        [{ content: 'Date:', styles: { fillColor: '#ffffff' } }, { content: new Date(accident.incident_date).toLocaleDateString(), styles: { fillColor: cellBackgroundColor } }],
        [{ content: 'Created By:', styles: { fillColor: '#ffffff' } }, { content: accident.created_by_name, styles: { fillColor: cellBackgroundColor } }],
        [{ content: 'Status:', styles: { fillColor: '#ffffff' } }, { content: accident.status.toUpperCase(), styles: { fillColor: cellBackgroundColor } }],
        [{ content: 'RIDDOR Reportable:', styles: { fillColor: '#ffffff' } }, { content: accident.riddor_reportable ? 'Yes' : 'No', styles: { fillColor: cellBackgroundColor } }]
      ],
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 1,
        lineWidth: 0
      },
      columnStyles: {
        0: { fontStyle: 'bold' }
      },
      margin: { left: 120 },
      tableWidth: 80
    });

    yPos = 120;

    // Location Information
    (doc as any).autoTable({
      startY: yPos,
      head: [['LOCATION DETAILS']],
      body: [
        ['Location:', accident.location],
        ['Incident Location:', accident.incident_location]
      ],
      headStyles: {
        fillColor: headerColor,
        textColor: '#000000',
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
        lineWidth: 0.1,
        lineColor: borderColor
      },
      theme: 'plain',
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Description
    (doc as any).autoTable({
      startY: yPos,
      head: [['INCIDENT DESCRIPTION']],
      body: [[accident.description]],
      headStyles: {
        fillColor: headerColor,
        textColor: '#000000',
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
        lineWidth: 0.1,
        lineColor: borderColor
      },
      theme: 'plain',
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Causes
    (doc as any).autoTable({
      startY: yPos,
      head: [['CAUSES']],
      body: [
        ['Basic Cause:', accident.basic_cause],
        ['Hazard Source:', accident.hazard_source],
        ['Root Causes:', Object.entries(accident.root_causes)
          .map(([category, items]) => {
            const formattedCategory = category.replace(/([A-Z])/g, ' $1').trim();
            return `${formattedCategory}: ${(items as string[]).join(', ')}`;
          })
          .join('\n')]
      ],
      headStyles: {
        fillColor: headerColor,
        textColor: '#000000',
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
        lineWidth: 0.1,
        lineColor: borderColor
      },
      theme: 'plain',
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Immediate Actions
    (doc as any).autoTable({
      startY: yPos,
      head: [['IMMEDIATE ACTIONS TAKEN']],
      body: [[accident.immediate_actions]],
      headStyles: {
        fillColor: headerColor,
        textColor: '#000000',
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
        lineWidth: 0.1,
        lineColor: borderColor
      },
      theme: 'plain',
      margin: { left: 15, right: 15 }
    });

    // Add page numbers and footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      
      // Add company details and page number in footer
      const footerParts = [];
      if (companySettings.vat_number) {
        footerParts.push(`VAT Number: ${companySettings.vat_number}`);
      }
      if (companySettings.company_number) {
        footerParts.push(`Company Number: ${companySettings.company_number}`);
      }
      
      if (footerParts.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        
        const footerText = footerParts.join('   ');
        const pageNumberText = `Page ${i} of ${pageCount}`;
        
        // Calculate positions
        const footerWidth = doc.getTextWidth(footerText);
        const pageNumberWidth = doc.getTextWidth(pageNumberText);
        const totalWidth = footerWidth + pageNumberWidth + 20; // 20px spacing between
        const startX = (pageWidth - totalWidth) / 2;
        
        // Draw footer text and page number
        doc.text(footerText, startX, pageHeight - 10);
        doc.text(pageNumberText, startX + footerWidth + 20, pageHeight - 10);
      }
    }

    // Return the PDF as a data URL
    return doc.output('dataurlstring');
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}