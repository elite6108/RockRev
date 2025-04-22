import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { Subcontractor, CompanySettings, Review } from '../types/database';

interface GeneratePDFOptions {
  contractor: Subcontractor;
  companySettings: CompanySettings;
}

export const generateBasicContractorPDF = (subcontractor: Subcontractor): void => {
  // This function is kept as a backup
  const doc = new jsPDF();
  doc.save(`${subcontractor.company_name}_review.pdf`);
};

export async function generateContractorPDF({
  contractor,
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

    // Add company logo if exists (top left)
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

    // Title (top right)
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(themeColor);
    doc.text('CONTRACTOR DETAILS', 195, 25, { align: 'right' });
    
    // Reset text color and font
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
      head: [[{ content: 'COMPANY INFORMATION', styles: { fillColor: headerColor } }]],
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

    // Contractor Details (Right Box) - Single cell format with multiple lines
    (doc as any).autoTable({
      startY: yPos,
      head: [[{ content: 'CONTRACTOR DETAILS', styles: { fillColor: headerColor } }]],
      body: [[{
        content: [
          { text: contractor.company_name, styles: { fontStyle: 'bold' } },
          { text: '\n' + contractor.address },
          { text: '\nTel: ' + contractor.phone },
          { text: '\n' + contractor.email },
          { text: '\n\nReview Date: ' + new Date(contractor.review_date).toLocaleDateString() },
          { text: '\nServices: ' + contractor.services_provided },
          { text: '\nNature of Business: ' + contractor.nature_of_business }
        ].map(item => item.text).join(''),
        styles: { cellWidth: 'auto', halign: 'left' }
      }]],
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
      margin: { left: rightColumnX, right: 15 },
      tableWidth: boxWidth
    });

    // Ensure we start after both boxes
    yPos = Math.max(
      (doc as any).lastAutoTable.finalY + 10,
      (doc as any).previousAutoTable.finalY + 10
    );

    // Insurance Details - Cross-tabulation table
    const insuranceTypes = [
      { key: 'employers_liability', title: 'Employers Liability', data: contractor.employers_liability },
      { key: 'public_liability', title: 'Public Liability', data: contractor.public_liability },
      { key: 'professional_negligence', title: 'Professional Negligence', data: contractor.professional_negligence },
      { key: 'contractors_all_risk', title: 'Contractors All Risk', data: contractor.contractors_all_risk }
    ];

    // Add custom insurance types if they exist
    if (contractor.custom_insurance_types) {
      Object.entries(contractor.custom_insurance_types).forEach(([key, value]) => {
        insuranceTypes.push({
          key: key,
          title: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          data: value
        });
      });
    }

    // Create the cross-tabulation table for insurance
    (doc as any).autoTable({
      startY: yPos,
      head: [
        [{ content: 'INSURANCE DETAILS', colSpan: 5, styles: { fillColor: headerColor } }],
        [
          { content: '', styles: { fillColor: headerColor } },
          { content: 'Insurer', styles: { fillColor: headerColor } },
          { content: 'Policy Number', styles: { fillColor: headerColor } },
          { content: 'Renewal Date', styles: { fillColor: headerColor } },
          { content: 'Limit of Indemnity', styles: { fillColor: headerColor } }
        ]
      ],
      body: insuranceTypes.map(insurance => [
        { content: insurance.title, styles: { fillColor: headerColor, fontStyle: 'bold' } },
        insurance.data?.insurer || 'N/A',
        insurance.data?.policy_no || 'N/A',
        insurance.data?.renewal_date ? new Date(insurance.data.renewal_date).toLocaleDateString() : 'N/A',
        insurance.data?.limit_of_indemnity || 'N/A'
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: headerColor,
        textColor: '#000000',
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: borderColor,
        halign: 'left'
      },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: headerColor, cellWidth: 60 }
      },
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Health & Safety Section
    (doc as any).autoTable({
      startY: yPos,
      head: [[{ content: 'HEALTH & SAFETY', colSpan: 2, styles: { fillColor: headerColor } }]],
      body: [
        [{ content: 'Has the contractor submitted a SWMS?', styles: { fontStyle: 'bold' } }, contractor.swms ? 'Yes' : 'No'],
        [{ content: 'Health & Safety Policy?', styles: { fontStyle: 'bold' } }, contractor.health_safety_policy_url ? 'Yes' : 'No']
      ],
      headStyles: {
        fillColor: headerColor,
        textColor: '#000000',
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
        fillColor: cellBackgroundColor,
        lineWidth: 0.1,
        lineColor: borderColor
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 60, halign: 'center' }
      },
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Review Details Section
    if (contractor.review) {
      // Review Requirements and Timeframes
      (doc as any).autoTable({
        startY: yPos,
        head: [[{ content: 'REVIEW DETAILS', colSpan: 2, styles: { fillColor: headerColor } }]],
        body: [
          [{ content: 'Review Date:', styles: { fontStyle: 'bold' } }, new Date(contractor.review.date).toLocaleDateString()],
          [{ content: 'Requirements & Scope:', styles: { fontStyle: 'bold' } }, contractor.review.requirements_scope || 'N/A'],
          [{ content: 'Agreed Timeframe:', styles: { fontStyle: 'bold' } }, contractor.review.agreed_timeframe || 'N/A'],
          [{ content: 'Total Time Taken:', styles: { fontStyle: 'bold' } }, contractor.review.total_time_taken || 'N/A']
        ],
        headStyles: {
          fillColor: headerColor,
          textColor: '#000000',
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
          fillColor: cellBackgroundColor,
          lineWidth: 0.1,
          lineColor: borderColor
        },
        columnStyles: {
          0: { cellWidth: 'auto', fontStyle: 'bold' },
          1: { cellWidth: 'auto' }
        },
        margin: { left: 15, right: 15 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Satisfaction Ratings Table
      const satisfactionRatings = [
        { label: 'Overall Quality of Delivered Project', rating: contractor.review.quality_rating },
        { label: 'Timeliness of Project Delivery', rating: contractor.review.timeliness_rating },
        { label: 'Communication', rating: contractor.review.communication_rating },
        { label: 'Understanding of Requirements', rating: contractor.review.understanding_rating },
        { label: 'Cooperativeness', rating: contractor.review.cooperativeness_rating },
        { label: 'Overall Satisfaction', rating: contractor.review.overall_satisfaction_rating }
      ];

      (doc as any).autoTable({
        startY: yPos,
        head: [[{ content: 'SATISFACTION RATINGS', colSpan: 2, styles: { fillColor: headerColor } }]],
        body: satisfactionRatings.map(({ label, rating }) => [
          { content: label, styles: { fontStyle: 'bold' } },
          rating ? rating.rating.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'N/A'
        ]),
        headStyles: {
          fillColor: headerColor,
          textColor: '#000000',
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
          fillColor: cellBackgroundColor,
          lineWidth: 0.1,
          lineColor: borderColor
        },
        columnStyles: {
          0: { cellWidth: 'auto', fontStyle: 'bold' },
          1: { cellWidth: 'auto', halign: 'center' }
        },
        margin: { left: 15, right: 15 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Safety and Compliance Checklist
      const safetyChecklist = [
        ['Authority to Work', contractor.review.authority_to_work ? 'Yes' : 'No'],
        ['Relevant Permits', contractor.review.relevant_permits ? 'Yes' : 'No'],
        ['Risk Assessments', contractor.review.risk_assessments ? 'Yes' : 'No'],
        ['Documents Legible', contractor.review.documents_legible ? 'Yes' : 'No'],
        ['Time Limit Clear', contractor.review.time_limit_clear ? 'Yes' : 'No'],
        ['Control Measures', contractor.review.control_measures ? 'Yes' : 'No'],
        ['Work in Line', contractor.review.work_in_line ? 'Yes' : 'No'],
        ['Right People', contractor.review.right_people ? 'Yes' : 'No'],
        ['Emergency Knowledge', contractor.review.emergency_knowledge ? 'Yes' : 'No'],
        ['PPE Condition', contractor.review.ppe_condition ? 'Yes' : 'No'],
        ['Tools Condition', contractor.review.tools_condition ? 'Yes' : 'No'],
        ['Housekeeping Standards', contractor.review.housekeeping_standards ? 'Yes' : 'No']
      ];

      (doc as any).autoTable({
        startY: yPos,
        head: [[{ content: 'SAFETY AND COMPLIANCE CHECKLIST', colSpan: 2, styles: { fillColor: headerColor } }]],
        body: safetyChecklist,
        headStyles: {
          fillColor: headerColor,
          textColor: '#000000',
          fontStyle: 'bold',
          halign: 'left'
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
          fillColor: cellBackgroundColor,
          lineWidth: 0.1,
          lineColor: borderColor,
          valign: 'middle'
        },
        columnStyles: {
          0: { 
            cellWidth: 'auto',
            fontStyle: 'bold'
          },
          1: { 
            cellWidth: 60,
            halign: 'center'
          }
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