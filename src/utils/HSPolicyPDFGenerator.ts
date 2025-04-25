import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { CompanySettings } from '../types/database';

interface GeneratePDFOptions {
  title: string;
  content: string;
  policyNumber?: number;
  companySettings: CompanySettings;
}

interface Section {
  header: string;
  content: string;
}

export async function generateHSPolicyPDF({
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
    
    // Helper function to parse content into sections
    const parseSections = (htmlContent: string): Section[] => {
      const sections: Section[] = [];
      const sectionRegex = /<h[1-6]>(.*?)<\/h[1-6]>([\s\S]*?)(?=<h[1-6]>|$)/gi;
      let match;

      while ((match = sectionRegex.exec(htmlContent)) !== null) {
        sections.push({
          header: match[1].trim(),
          content: cleanAndFormatContent(match[2])
        });
      }

      return sections;
    };

    // Helper function to clean HTML and format text
    const cleanAndFormatContent = (htmlContent: string) => {
      return htmlContent
        // Handle HTML entities first
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Handle paragraphs with double line breaks
        .replace(/<p\s*[^>]*>/gi, '')
        .replace(/<\/p>/gi, '\n\n')
        // Handle unordered lists with bottom margin
        .replace(/<ul\s*[^>]*>/gi, '\n')
        .replace(/<\/ul>/gi, '\n\n')  // Added extra \n for bottom margin
        // Handle ordered lists with bottom margin
        .replace(/<ol\s*[^>]*>/gi, '\n')
        .replace(/<\/ol>/gi, '\n\n')  // Added extra \n for bottom margin
        // Handle list items with proper indentation, bullets and spacing
        .replace(/<li\s*[^>]*>/gi, '\n    • ')
        .replace(/<\/li>/gi, '\n')  // Add newline after each list item for spacing
        // Handle line breaks
        .replace(/<br\s*\/?>/gi, '\n')
        // Handle divs with line breaks
        .replace(/<div\s*[^>]*>/gi, '')
        .replace(/<\/div>/gi, '\n')
        // Remove any other HTML tags
        .replace(/<[^>]+>/g, '')
        // Fix multiple consecutive line breaks (more than 2)
        .replace(/\n\s*\n\s*\n+/g, '\n\n')
        // Ensure proper indentation for list items that might have lost formatting
        .replace(/^•/gm, '    •')
        // Remove any trailing/leading whitespace
        .trim();
    };
    
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
                const maxWidth = 40;
                const maxHeight = 20;
                const aspectRatio = 300/91;
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
      }
    }

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(themeColor);
    doc.text('HEALTH & SAFETY POLICY', 195, 25, { align: 'right' });
    
    // Reset text color
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    let yPos = 45;

    const pageWidth = doc.internal.pageSize.width;
    const leftColumnX = 15;
    const rightColumnX = pageWidth / 2 + 5;
    const boxWidth = pageWidth / 2 - 20;

    // Company Information (Left Box)
    (doc as any).autoTable({
      startY: yPos,
      head: [[{ content: 'COMPANY INFORMATION', styles: { fillColor: '#edeaea' } }]],
      body: [[{
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
      }]],
      theme: 'grid',
      headStyles: {
        fillColor: '#6dd187',
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

    // Policy Details (Right Box)
    (doc as any).autoTable({
      startY: yPos,
      head: [[{ content: 'POLICY DETAILS', colSpan: 2, styles: { fillColor: '#edeaea' } }]],
      body: [
        [{ content: 'POLICY ID:', styles: { fontStyle: 'bold' } }, `HSPOL-${String(policyNumber || '0').padStart(3, '0')}`],
        [{ content: 'TITLE:', styles: { fontStyle: 'bold' } }, title],
        [{ content: 'CREATED:', styles: { fontStyle: 'bold' } }, new Date().toLocaleDateString()],
        [{ content: 'EDITED:', styles: { fontStyle: 'bold' } }, new Date().toLocaleDateString()]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: '#6dd187',
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

    yPos = (doc as any).lastAutoTable.finalY + 20;

    // Parse content into sections and create separate tables
    const sections = parseSections(content);
    
    for (const section of sections) {
      (doc as any).autoTable({
        startY: yPos,
        head: [[{ 
          content: section.header.toUpperCase(),
          styles: { 
            fillColor: '#edeaea',
            textColor: '#000000',
            halign: 'left',
            fontStyle: 'bold',
            cellPadding: 3,
            fontSize: 10  // Increased font size for headers
          }
        }]],
        body: [[{ 
          content: section.content,
          styles: { 
            fillColor: cellBackgroundColor,
            cellPadding: 5,  // Reduced padding
            lineHeight: 2,   // Increased line height for better readability
            minCellHeight: 20,
            cellWidth: 'auto',
            halign: 'left',
            valign: 'top',
            fontSize: 10
          }
        }]],
        styles: {
          fontSize: 10,
          lineWidth: 0.1,
          lineColor: borderColor,
          overflow: 'linebreak'
        },
        theme: 'grid',
        margin: { left: 15, right: 15 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
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

    return doc.output('dataurlstring');
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}