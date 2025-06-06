import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { CompanySettings } from '../types/database';

interface GeneratePDFOptions {
  title: string;
  content: string;
  policyNumber: number;
  companySettings: CompanySettings;
}

export async function generateOtherPolicyPDF({
  title,
  content,
  policyNumber,
  companySettings
}: GeneratePDFOptions): Promise<string> {
  try {
    // Create new PDF document
    const doc = new jsPDF();
    
    // Define theme colors and styles
    const themeColor = '#000000';
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
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(themeColor);
    doc.text(`POL-${String(policyNumber).padStart(3, '0')}`, 195, 25, { align: 'right' });
    
    // Reset text color
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    let yPos = 45;

    const pageWidth = doc.internal.pageSize.width;
    const leftColumnX = 15; // Left margin
    const rightColumnX = pageWidth / 2 + 5; // Adjusted for proper spacing
    const boxWidth = pageWidth / 2 - 20; // Box width for equal spacing
    
   // Policy Details (Right Box with Two Columns)
(doc as any).autoTable({
  startY: yPos,
  head: [[{ content: 'POLICY DETAILS', colSpan: 2 }]],
  body: [
    [{ content: 'POLICY NAME:', styles: { fontStyle: 'bold' } }, title],
    [{ content: 'CREATED DATE:', styles: { fontStyle: 'bold' } }, new Date().toLocaleDateString()],
    [{ content: 'LAST EDITED:', styles: { fontStyle: 'bold' } }, new Date().toLocaleDateString()],
    [{ content: 'POLICY ID:', styles: { fontStyle: 'bold' } }, `POL-${String(policyNumber).padStart(3, '0')}`]
  ],
  theme: 'grid',
  headStyles: {
    fillColor: headerColor,
    textColor: 'black',
    fontStyle: 'bold',
    halign: 'left'
  },
  styles: {
    fontSize: 10,
    cellPadding: 3, // Updated to match Company Information table
    fillColor: cellBackgroundColor,
    lineWidth: 0.1,
    lineColor: borderColor
  },
  margin: { left: rightColumnX, right: 15 },
  tableWidth: boxWidth,
  columnStyles: {
    0: { cellWidth: boxWidth * 0.4 },
    1: { cellWidth: boxWidth * 0.6 }
  },
});
    
  // Company Information (Left Box)
(doc as any).autoTable({
  startY: yPos,
  head: [['COMPANY INFORMATION']],
  body: [
    [{
      content: [
        { text: companySettings.name, styles: { fontStyle: 'bold' } },
        { text: '\n' + companySettings.address_line1 },
        { text: companySettings.address_line2 ? '\n' + companySettings.address_line2 : '' },
        { text: `\n${companySettings.town}, ${companySettings.county}` },
        { text: '\n' + companySettings.post_code },
        { text: '\n\nTel: ' + companySettings.phone },
        { text: '\n' + companySettings.email }
      ].map(item => item.text).join(''),
      styles: { cellWidth: 'auto', halign: 'left' }
    }]
  ],
  theme: 'grid',
  headStyles: {
    fillColor: headerColor,
    textColor: 'black',
    fontStyle: 'bold'
  },
  styles: {
    fontSize: 10,
    cellPadding: 3,
    fillColor: cellBackgroundColor,
    lineWidth: 0.1,
    lineColor: borderColor
  },
  margin: { left: leftColumnX, right: rightColumnX },
  tableWidth: boxWidth
});

    // Policy Content
    yPos = (doc as any).lastAutoTable.finalY + 10;
    (doc as any).autoTable({
      startY: yPos,
      body: [[{ content: content.replace(/<[^>]+>/g, ''), styles: { fillColor: cellBackgroundColor } }]],
      styles: {
        fontSize: 10,
        cellPadding: 3,
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
      if (companySettings.company_number) {
        footerParts.push(`Company Number: ${companySettings.company_number}`);
      }
      if (companySettings.vat_number) {
        footerParts.push(`VAT Number: ${companySettings.vat_number}`);
      }
      
      if (footerParts.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        
        const footerText = footerParts.join('   ');
        const pageNumberText = `Page ${i} of ${pageCount}`;
        
        // Calculate positions
        const footerWidth = doc.getTextWidth(footerText);
        const pageNumberWidth = doc.getTextWidth(pageNumberText);
        
        // Draw footer text on the left and page number on the right
        doc.text(footerText, 15, pageHeight - 10); // Left margin of 15px
        doc.text(pageNumberText, pageWidth - pageNumberWidth - 15, pageHeight - 10); // Right margin of 15px
      }
    }

    // Return the PDF as a data URL
    return doc.output('dataurlstring');
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
