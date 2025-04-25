import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { RiskAssessment, CompanySettings } from '../types/database';

const PRIORITY_PPE = [
  'Face Shield',
  'Hard Hat', 
  'Hearing Protection',
  'Hi Vis Clothing',
  'P3 Masks',
  'Protective Clothing',
  'Respirator Hoods',
  'Safety Footwear',
  'Safety Gloves',
  'Safety Goggles'
];

const OTHER_PPE = [
  'Connect an earth terminal to the ground',
  'Disconnect before carrying out maintenance or repair',
  'Disconnect mains plug from electrical outlet',
  'Disinfect surface',
  'Disinfect your hands',
  'Ensure continuous ventilation',
  'Entry only with supervisor outside',
  'General mandatory action sign',
  'Install locks and keep locked',
  'Install or check guard',
  'Opaque eye protection must be worn',
  'Place trash in the bin',
  'Refer to instruction manual',
  'Secure gas cylinders',
  'Sound your horn',
  'Use barrier cream',
  'Use breathing equipment',
  'Use footbridge',
  'Use footwear with antistatic or antispark features',
  'Use gas detector',
  'Use guard to protect from injury from the table saw',
  'Use handrail',
  'Use protective apron',
  'Use this walkway',
  'Ventilate before and during entering',
  'Wash your hands',
  'Wear a safety harness',
  'Wear a welding mask',
  'Wear safety belts'
];

const PPE_ICON_URLS = {
  'Safety Gloves': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-protective-gloves.png',
  'Safety Footwear': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-foot-protection.png',
  'Hi Vis Clothing': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-high-visibility-clothing.png',
  'Hard Hat': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-head-protection.png',
  'Safety Goggles': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-eye-protection.png',
  'Hearing Protection': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-ear-protection.png',
  'Protective Clothing': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-protective-clothing.png',
  'P3 Masks': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-a-mask.png',
  'Face Shield': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-a-face-shield.png',
  'Respirator Hoods': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-a-safety-harness.png',
  'Connect an earth terminal to the ground': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/connect-an-earth-terminal-to-the-ground.png',
  'Disconnect before carrying out maintenance or repair': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/disconnect-before-carrying-out-maintenance-or-repair.png',
  'Disconnect mains plug from electrical outlet': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/disconnect-mains-plug-from-electrical-outlet.png',
  'Disinfect surface': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/disinfect-surface.png',
  'Disinfect your hands': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/disinfect-your-hands.png',
  'Ensure continuous ventilation': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/ensure-continuous-ventilation.png',
  'Entry only with supervisor outside': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/entry-only-with-supervisor-outside.png',
  'General mandatory action sign': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/general-mandatory-action-sign.png',
  'Install locks and keep locked': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/install-locks-and-keep-locked.png',
  'Install or check guard': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/install-or-check-guard.png',
  'Opaque eye protection must be worn': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/opaque-eye-protection-must-be-worn.png',
  'Place trash in the bin': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/place-trash-in-the-bin.png',
  'Refer to instruction manual': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/refer-to-instruction-manual.png',
  'Secure gas cylinders': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/secure-gas-cylinders.png',
  'Sound your horn': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/sound-your-horn.png',
  'Use barrier cream': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-barrier-cream.png',
  'Use breathing equipment': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-breathing-equipment.png',
  'Use footbridge': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-footbridge.png',
  'Use footwear with antistatic or antispark features': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-footwear-with-anti-static-or-anti-spark-features.png',
  'Use gas detector': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-gas-detector.png',
  'Use guard to protect from injury from the table saw': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-guard-to-protect-from-injury-from-the-table-saw.png',
  'Use handrail': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-handrail.png',
  'Use protective apron': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-protective-apron.png',
  'Use this walkway': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/use-this-walkway.png',
  'Ventilate before and during entering': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/ventilate-before-and-during-entering.png',
  'Wash your hands': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wash-your-hands.png',
  'Wear a safety harness': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-a-safety-harness.png',
  'Wear a welding mask': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-a-welding-mask.png',
  'Wear safety belts': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-safety-belts.png',
};

interface GeneratePDFOptions {
  assessment: RiskAssessment;
  companySettings: CompanySettings;
}

export async function generateRiskAssessmentPDF({
  assessment,
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
    doc.text('RISK ASSESSMENT', 190, 25, { align: 'right' });
    
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
    
    // Assessment Details (Right Box)
    (doc as any).autoTable({
      startY: yPos,
      head: [[{ content: 'ASSESSMENT DETAILS', colSpan: 2, styles: { fillColor: '#edeaea' } }]],
      body: [
        [{ content: 'RA Number:', styles: { fontStyle: 'bold' } }, assessment.ra_id],
        [{ content: 'CREATED:', styles: { fontStyle: 'bold' } }, new Date(assessment.creation_date).toLocaleDateString()],
        [{ content: 'LOCATION:', styles: { fontStyle: 'bold' } }, assessment.location],
        [{ content: 'ASSESSOR:', styles: { fontStyle: 'bold' } }, assessment.assessor]
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

    // Ensure we start after both boxes
    yPos = Math.max(
      (doc as any).lastAutoTable.finalY + 10,
      (doc as any).previousAutoTable.finalY + 10
    );

    // Risk Rating Table
    const riskRatingTableHeaders = [['#', 'LIKELIHOOD (A)', '#', 'SEVERITY (B)', 'RISK RATING (A×B)']];
    const riskRatingTableBody = [
      [
        '1',
        'Highly unlikely',
        '1',
        'Trivial',
        { content: 'No action required (1)', styles: { fillColor: '#00B050', textColor: '#ffffff' } }
      ],
      [
        '2',
        'Unlikely',
        '2',
        'Minor Injury',
        { content: 'Low priority (2 to 6)', styles: { fillColor: '#00B050', textColor: '#ffffff' } }
      ],
      [
        '3',
        'Possible',
        '3',
        'Over 3 Day Injury',
        { content: 'Medium priority (7 to 9)', styles: { fillColor: '#FFC000', textColor: '#000000' } }
      ],
      [
        '4',
        'Probable',
        '4',
        'Major Injury',
        { content: 'High priority (10 to 14)', styles: { fillColor: '#C00000', textColor: '#ffffff' } }
      ],
      [
        '5',
        'Certain',
        '5',
        'Incapacity or Death',
        { content: 'Urgent action (15+)', styles: { fillColor: '#C00000', textColor: '#ffffff' } }
      ]
    ];

    (doc as any).autoTable({
      startY: yPos,
      head: riskRatingTableHeaders,
      body: riskRatingTableBody,
      headStyles: {
        fillColor: headerColor,
        textColor: '#000000',
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 'auto' }
      },
      styles: {
        fontSize: 10,
        cellPadding: 2,
        lineWidth: 0.1,
        lineColor: borderColor,
        halign: 'left'
      },
      theme: 'plain',
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // PPE Requirements
if (assessment.ppe.length > 0) {
  const maxColumns = 4; // Changed to 4 columns
  const ppeItems = assessment.ppe;
  const tableBody = [];

  // Process PPE items in groups of 4
  for (let i = 0; i < ppeItems.length; i += maxColumns) {
    const rowItems = ppeItems.slice(i, i + maxColumns);
    const row = await Promise.all(rowItems.map(async (item) => {
      const imageUrl = PPE_ICON_URLS[item]; // Get the preloaded URL for the PPE item
      if (!imageUrl) {
        console.error(`No URL found for PPE item: ${item}`);
        return {
          content: item,
          styles: {
            fillColor: cellBackgroundColor,
            halign: 'center',
            valign: 'middle',
            cellPadding: 5,
            cellWidth: (pageWidth - 30) / maxColumns
          }
        };
      }

      try {
        // Fetch and add the image
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

        const blob = await response.blob();
        const reader = new FileReader();
        const imageData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        return {
          content: `\n\n\n${item}`, // Add space for image
          styles: {
            fillColor: cellBackgroundColor,
            halign: 'center',
            valign: 'middle',
            cellPadding: { top: 25, bottom: 5, left: 3, right: 3 },
            cellWidth: (pageWidth - 30) / maxColumns
          },
          image: imageData,
          imageOptions: {
            imageData,
            x: 0, // Will be calculated during cell rendering
            y: 0, // Will be calculated during cell rendering
            width: 20,
            height: 20
          }
        };
      } catch (error) {
        console.error(`Error loading PPE image for ${item}:`, error);
        return {
          content: item,
          styles: {
            fillColor: cellBackgroundColor,
            halign: 'center',
            valign: 'middle',
            cellPadding: 5,
            cellWidth: (pageWidth - 30) / maxColumns
          }
        };
      }
    }));

    // Pad the row with empty cells if needed
    while (row.length < maxColumns) {
      row.push({
        content: '',
        styles: {
          fillColor: cellBackgroundColor,
          cellWidth: (pageWidth - 30) / maxColumns
        }
      });
    }

    tableBody.push(row);
  }

  (doc as any).autoTable({
    startY: yPos,
    head: [[{ content: 'PPE REQUIREMENTS', colSpan: maxColumns, styles: { halign: 'LEFT' } }]],
    body: tableBody,
    didDrawCell: function(data: any) {
      if (data.cell.raw.image && data.cell.raw.imageOptions) {
        const cell = data.cell;
        const opts = cell.raw.imageOptions;
        const x = cell.x + (cell.width - opts.width) / 2;
        const y = cell.y + 5;
        doc.addImage(opts.imageData, 'PNG', x, y, opts.width, opts.height);
      }
    },
    headStyles: {
      fillColor: '#edeaea',
      textColor: '#000000',
      fontStyle: 'bold',
      cellPadding: 3, // Reduced header cell padding
      minCellHeight: 12, // Reduced header height
    },
    styles: {
      fontSize: 10,
      lineWidth: 0.1,
      lineColor: borderColor,
      minCellHeight: 40, // Increased to accommodate image + text
      cellWidth: (pageWidth - 30) / maxColumns
    },
    theme: 'plain',
    margin: { left: 15, right: 15 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
}
    // Guidelines
    if (assessment.guidelines) {
      (doc as any).autoTable({
        startY: yPos,
        head: [['GUIDELINES']],
        body: [[assessment.guidelines]],
        headStyles: {
          fillColor: '#edeaea',
          textColor: '#000000',
          fontStyle: 'bold'
        },
        bodyStyles: {
          fillColor: cellBackgroundColor
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: borderColor
        },
        theme: 'plain',
        margin: { left: 15, right: 15 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Working Methods
    if (assessment.working_methods.length > 0) {
      (doc as any).autoTable({
        startY: yPos,
        head: [['#', 'WORKING METHOD']],
        body: assessment.working_methods.map((method: any) => [
          method.number,
          method.description
        ]),
        headStyles: {
          fillColor: '#edeaea',
          textColor: '#000000',
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 'auto' }
        },
        bodyStyles: {
          fillColor: cellBackgroundColor
        },
        alternateRowStyles: {
          fillColor: '#ffffff'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: borderColor
        },
        theme: 'plain',
        margin: { left: 15, right: 15 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Hazards
    if (assessment.hazards.length > 0) {
      for (const hazard of assessment.hazards) {
        // Hazard Title Header
        (doc as any).autoTable({
          startY: yPos,
          head: [[{ content: `HAZARD: ${hazard.title}`, colSpan: 6, styles: { fillColor: '#004EA8', textColor: '#ffffff' } }]],
          body: [
            [{ content: 'WHO MIGHT BE HARMED:', colSpan: 2, styles: { fontStyle: 'bold', fillColor: '#EDEDED' } }, { content: hazard.whoMightBeHarmed, colSpan: 4, styles: { fillColor: '#ffffff' } }],
            [{ content: 'HOW MIGHT THEY BE HARMED:', colSpan: 2, styles: { fontStyle: 'bold', fillColor: '#EDEDED' } }, { content: hazard.howMightBeHarmed, colSpan: 4, styles: { fillColor: '#ffffff' } }],
            [{ content: 'RISK CALCULATION (BEFORE CONTROL MEASURES)', colSpan: 6, styles: { fontStyle: 'bold', fillColor: '#EDEDED' } }],
            [
              { content: 'LIKELIHOOD', styles: { fontStyle: 'bold', fillColor: '#EDEDED' } },
              { content: hazard.beforeLikelihood, styles: { fontStyle: 'bold', fillColor: '#EDEDED' } },
              { content: 'SEVERITY', styles: { fontStyle: 'bold', fillColor: '#EDEDED' } },
              { content: hazard.beforeSeverity, styles: { fontStyle: 'bold', fillColor: '#EDEDED' } },
              { content: 'TOTAL RISK', styles: { fontStyle: 'bold', fillColor: '#EDEDED' } },
              { content: hazard.beforeTotal, styles: { fontStyle: 'bold', fillColor: '#EDEDED' } }
            ],
            [{ content: 'EXISTING CONTROL MEASURES', colSpan: 6, styles: { fontStyle: 'bold', fillColor: '#EDEDED' } }],
            ...hazard.controlMeasures.map(m => [{ content: `• ${m.description}`, colSpan: 6, styles: { fillColor: '#ffffff' } }]),
            [{ content: 'RISK CALCULATION (AFTER CONTROL MEASURES)', colSpan: 6, styles: { fontStyle: 'bold', fillColor: '#EDEDED' } }],
            [
              { content: 'LIKELIHOOD', styles: { fontStyle: 'bold', fillColor: '#EDEDED' } },
              { content: hazard.afterLikelihood, styles: { fontStyle: 'bold', fillColor: '#EDEDED' } },
              { content: 'SEVERITY', styles: { fontStyle: 'bold', fillColor: '#EDEDED' } },
              { content: hazard.afterSeverity, styles: { fontStyle: 'bold', fillColor: '#EDEDED' } },
              { content: 'TOTAL RISK', styles: { fontStyle: 'bold', fillColor: '#EDEDED' } },
              { content: hazard.afterTotal, styles: { fontStyle: 'bold', fillColor: '#EDEDED' } }
            ]
          ],
          headStyles: {
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 20 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 20 },
            4: { cellWidth: 'auto' },
            5: { cellWidth: 20 }
          },
          bodyStyles: {
            fillColor: cellBackgroundColor
          },
          styles: {
            fontSize: 10,
            cellPadding: 4,
            lineWidth: 0.1,
            lineColor: borderColor
          },
          theme: 'plain',
          margin: { left: 15, right: 15 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;

        // Add page break if there's not enough space for next hazard
        if (yPos > doc.internal.pageSize.height - 100 && hazard !== assessment.hazards[assessment.hazards.length - 1]) {
          doc.addPage();
          yPos = 15;
        }
      }
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