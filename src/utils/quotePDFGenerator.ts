import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '../lib/supabase';
import type { Quote, CompanySettings } from '../types/database';

interface GeneratePDFOptions {
  quote: Quote;
  companySettings: CompanySettings;
  customerName: string;
  customerAddress: string;
  projectName: string;
}

export async function generateQuotePDF({
  quote,
  companySettings,
  customerName,
  customerAddress,
  projectName
}: GeneratePDFOptions): Promise<string> {
  try {
    // Validate required data
    if (!quote || !companySettings || !customerName || !customerAddress || !projectName) {
      throw new Error('Missing required data for PDF generation');
    }

    // Fetch bank details
    const { data: bankDetails } = await supabase
      .from('payment_terms')
      .select('bank_name, account_number, sort_code, terms')
      .limit(1)
      .maybeSingle();

    if (!bankDetails) {
      throw new Error('Bank details not found');
    }

    // Create new PDF document
    const doc = new jsPDF();
    
    // Define theme colors and styles
    const themeColor = '#000000';
    const headerColor = '#edeaea';
    const cellBackgroundColor = '#f7f7f7';
    const itemsHeaderColor = '#edeaea';
    const detailsHeaderColor = '#edeaea';
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

    // Quote Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(themeColor);
    doc.text('QUOTE', 195, 25, { align: 'right' });
    
    // Reset text color
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const pageWidth = doc.internal.pageSize.width;
const leftColumnX = 15; // Left margin
const rightColumnX = pageWidth / 2 + 5; // Adjusted for proper spacing
const boxWidth = pageWidth / 2 - 20; // Box width for equal spacing

let yPos = 45;

// Company Information (Left Box)
(doc as any).autoTable({
  startY: yPos,
  head: [[{ content: 'COMPANY INFORMATION', styles: { fillColor: detailsHeaderColor } }]],
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
    fillColor: detailsHeaderColor,
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

// Quote Details (Right Box)
(doc as any).autoTable({
  startY: yPos,
  head: [[{ content: 'QUOTE DETAILS', colSpan: 2, styles: { fillColor: detailsHeaderColor } }]],
  body: [
    [{ content: 'QUOTE NO:', styles: { fontStyle: 'bold' } }, quote.quote_number],
    [{ content: 'DATE:', styles: { fontStyle: 'bold' } }, new Date(quote.quote_date).toLocaleDateString()],
    [{ content: 'PROJECT:', styles: { fontStyle: 'bold' } }, projectName],
    [{ content: 'CREATED BY:', styles: { fontStyle: 'bold' } }, quote.created_by_name]
  ],
  theme: 'grid',
  headStyles: {
    fillColor: detailsHeaderColor,
    textColor: 'black',
    fontStyle: 'bold',
    halign: 'left'
  },
  styles: {
    fontSize: 10,
    cellPadding: 3,
    fillColor: cellBackgroundColor,
    lineWidth: 0.1,
    lineColor: borderColor
  },
  columnStyles: { 
    0: { cellWidth: boxWidth * 0.4 },
    1: { cellWidth: boxWidth * 0.6 }
  },
  margin: { left: rightColumnX, right: 15 },
  tableWidth: boxWidth
});

// Ensure we start after both boxes
yPos = Math.max(
  (doc as any).lastAutoTable.finalY + 10,
  (doc as any).previousAutoTable.finalY + 10
);

// Customer Information
(doc as any).autoTable({
  startY: yPos,
  head: [['CUSTOMER']],
  body: [
    [
      {
        content: [
          { text: customerName, styles: { fontStyle: 'bold' } },
          { text: customerAddress }
        ].map(item => item.text).join('\n'),
        styles: { cellPadding: { top: 5, bottom: 5, left: 5, right: 5 }, fillColor: cellBackgroundColor }
      }
    ]
  ],
  headStyles: {
    fillColor: detailsHeaderColor,
    textColor: '#000000',
    fontStyle: 'bold'
  },
  styles: {
    fontSize: 10,
    cellPadding: 3,
    overflow: 'linebreak',
    lineWidth: 0.1,
    lineColor: borderColor
  },
  margin: { left: 15 },
  tableWidth: 85
});

// Project Location
if (quote.project_location) {
  (doc as any).autoTable({
    startY: yPos, // Start at the same Y position as the Customer table
    head: [['PROJECT LOCATION']],
    body: [[{ content: quote.project_location, styles: { fillColor: cellBackgroundColor } }]],
    headStyles: {
      fillColor: detailsHeaderColor,
      textColor: '#000000',
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineWidth: 0.1,
      lineColor: borderColor
    },
    margin: { left: 110 }, // Adjusted to align beside the Customer table
    tableWidth: 85
  });
}

    // Items Table
    const tableHeaders = [[
      { content: '#', styles: { halign: 'left' } },
      { content: 'DESCRIPTION', styles: { halign: 'left' } },
      { content: 'AMOUNT', styles: { halign: 'right' } }
    ]];

    // Calculate subtotal and VAT
    const subtotal = quote.items.reduce((sum, item) => {
      const price = item.price === null ? 0 : item.price;
      return sum + price;
    }, 0);
    const vat = quote.amount > subtotal ? quote.amount - subtotal : 0;

    const tableData = quote.items.map(item => [
      { content: item.number, styles: { fillColor: cellBackgroundColor } },
      { content: item.description, styles: { fillColor: cellBackgroundColor } },
      { content: item.price === null ? '-' : `£${item.price.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, styles: { halign: 'right', fillColor: cellBackgroundColor } }
    ]);

    (doc as any).autoTable({
      startY: 150,
      head: tableHeaders,
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: itemsHeaderColor,
        textColor: '#000000',
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 40 }
      },
      bodyStyles: {
        lineWidth: 0.1,
        lineColor: borderColor
      },
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      didDrawCell: (data: any) => {
        // Add bottom border to each row in the body
        if (data.section === 'body') {
          const cell = data.cell;
          const doc = data.doc;
          
          // Draw bottom border for each cell
          doc.setDrawColor(...borderColor);
          doc.setLineWidth(0.1);
          doc.line(
            cell.x,
            cell.y + cell.height,
            cell.x + cell.width,
            cell.y + cell.height
          );
        }
      }
    });

    // New Summary Table
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 10,
      body: [
        [
          { content: '', styles: { fillColor: '#ffffff', lineWidth: 0 } },
          { content: '', styles: { fillColor: '#ffffff', lineWidth: 0 } },
          { content: '', styles: { fillColor: '#ffffff', lineWidth: 0 } },
          { content: '', styles: { fillColor: '#ffffff', lineWidth: 0 } },
          { content: 'Subtotal:', styles: { halign: 'right', fillColor: '#f9f9f9', lineWidth: 0.1, lineColor: borderColor, fontStyle: 'bold' } },
          { content: `£${subtotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, styles: { halign: 'right', fillColor: '#f9f9f9', lineWidth: 0.1, lineColor: borderColor, fontStyle: 'bold' } }
        ],
        [
          { content: '', styles: { fillColor: '#ffffff', lineWidth: 0 } },
          { content: '', styles: { fillColor: '#ffffff', lineWidth: 0 } },
          { content: '', styles: { fillColor: '#ffffff', lineWidth: 0 } },
          { content: '', styles: { fillColor: '#ffffff', lineWidth: 0 } },
          { content: 'VAT:', styles: { halign: 'right', fillColor: '#f9f9f9', lineWidth: 0.1, lineColor: borderColor, fontStyle: 'bold' } },
          { content: `£${vat.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, styles: { halign: 'right', fillColor: '#f9f9f9', lineWidth: 0.1, lineColor: borderColor, fontStyle: 'bold' } }
        ],
        [
          { content: '', styles: { fillColor: '#ffffff', lineWidth: 0 } },
          { content: '', styles: { fillColor: '#ffffff', lineWidth: 0 } },
          { content: '', styles: { fillColor: '#ffffff', lineWidth: 0 } },
          { content: '', styles: { fillColor: '#ffffff', lineWidth: 0 } },
          { content: 'Total:', styles: { halign: 'right', fillColor: '#f9f9f9', lineWidth: 0.1, lineColor: borderColor, fontStyle: 'bold' } },
          { content: `£${quote.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, styles: { halign: 'right', fillColor: '#f9f9f9', lineWidth: 0.1, lineColor: borderColor, fontStyle: 'bold' } }
        ]
      ],
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: borderColor
      },
      margin: { left: 15, right: 15 }
    });
    
    // Add notes if they exist
    let finalY = (doc as any).lastAutoTable.finalY + 10;

    if (quote.notes) {
      (doc as any).autoTable({
        startY: finalY,
        head: [['NOTES']],
        body: [[{ content: quote.notes, styles: { fillColor: cellBackgroundColor } }]],
        headStyles: {
          fillColor: itemsHeaderColor,
          textColor: '#000000',
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: borderColor
        },
        margin: { left: 15, right: 15 }
      });

      finalY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Add Due & Payable section
    if (quote.due_payable) {
      (doc as any).autoTable({
        startY: finalY,
        head: [['DUE & PAYABLE']],
        body: [[{ content: quote.due_payable, styles: { fillColor: cellBackgroundColor } }]],
        headStyles: {
          fillColor: itemsHeaderColor,
          textColor: '#000000',
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: borderColor
        },
        margin: { left: 15, right: 15 }
      });

      finalY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Add Payment Terms section if custom terms exist
    // Get payment terms - either custom or default
    const paymentTermsContent = quote.payment_terms || bankDetails?.terms;
    
    if (paymentTermsContent) {
      (doc as any).autoTable({
        startY: finalY,
        head: [['PAYMENT TERMS']],
        body: [[{ content: paymentTermsContent, styles: { fillColor: cellBackgroundColor } }]],
        headStyles: {
          fillColor: itemsHeaderColor,
          textColor: '#000000',
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: borderColor
        },
        margin: { left: 15, right: 15 }
      });

      finalY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Add Bank Details section as a table
    if (bankDetails) {
      (doc as any).autoTable({
        startY: finalY,
        head: [['BANK DETAILS']],
        body: [
          [
            { 
              content: `Bank Name: ${bankDetails.bank_name}\nAccount No: ${bankDetails.account_number}\nSort Code: ${bankDetails.sort_code}`,
              styles: { fillColor: cellBackgroundColor }
            }
          ]
        ],
        headStyles: {
          fillColor: itemsHeaderColor,
          textColor: '#000000',
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: borderColor
        },
        margin: { left: 15, right: 15 }
      });

      finalY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Add Terms & Conditions on a new page
    const { data: quoteTerms } = await supabase
      .from('quote_terms')
      .select('terms')
      .limit(1)
      .single();

    if (quoteTerms?.terms) {
      doc.addPage();

      (doc as any).autoTable({
        startY: 15,
        head: [['TERMS & CONDITIONS']],
        body: [[{ content: quoteTerms.terms, styles: { fillColor: cellBackgroundColor } }]],
        headStyles: {
          fillColor: itemsHeaderColor,
          textColor: '#000000',
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
          lineWidth: 0.1,
          lineColor: borderColor
        },
        margin: { left: 15, right: 15 }
      });
    }

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