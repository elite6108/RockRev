import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '../../../lib/supabase';

interface DSEAssessment {
  id: string;
  full_name: string;
  submitted_date: string;
  next_due_date: string;
  user_id: string;
  keyboard_separate_from_screen: boolean;
  keyboard_tilt_legs: boolean;
  keyboard_posture: string;
  keyboard_comfortable: boolean;
  keyboard_characters_clear: boolean;
  mouse_position: string;
  wrist_forearm_support: boolean;
  mouse_smooth_speed: boolean;
  screen_characters_clear: boolean;
  screen_text_size_comfortable: boolean;
  screen_brightness_contrast_suitable: boolean;
  screen_swivel_tilt: boolean;
  screen_free_glare: boolean;
  vision_straining: boolean;
  desk_large_enough: boolean;
  reach_files_comfortably: boolean;
  chair_posture: string;
  chair_castor_wheels: boolean;
  chair_height_adjustment: boolean;
  chair_depth_adjustment: boolean;
  chair_lumbar_support: boolean;
  chair_adjustable_backrest: boolean;
  chair_adjustable_armrests: boolean;
  chair_backrest_support: boolean;
  forearms_horizontal: boolean;
  feet_flat_floor: boolean;
  room_change_position: boolean;
  lighting_suitable: boolean;
  heat_comfortable: boolean;
  noise_comfortable: boolean;
  experienced_discomfort: boolean;
  interested_eye_test: boolean;
  regular_breaks: boolean;
  notes: string;
}

export async function generateDSEPDF(
  assessment: DSEAssessment
): Promise<string> {
  try {
    // Create new PDF document
    const doc = new jsPDF();

    // Define theme colors and styles
    const themeColor = '#000000';
    const headerColor = '#edeaea';
    const cellBackgroundColor = '#f7f7f7';
    const detailsHeaderColor = '#edeaea';
    const borderColor = [211, 211, 211]; // Light gray border

    // Set default font
    doc.setFont('helvetica');

    // Fetch company settings for logo
    const { data: companySettings, error: companyError } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (companyError)
      throw new Error(
        `Failed to load company settings: ${companyError.message}`
      );
    if (!companySettings) throw new Error('Company settings not found');

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
                const aspectRatio = 300 / 91; // Default aspect ratio
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
              reject(
                new Error(
                  `Failed to add logo to PDF: ${
                    error instanceof Error ? error.message : 'Unknown error'
                  }`
                )
              );
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
    doc.text('DSE ASSESSMENT', 195, 25, { align: 'right' });

    // Reset text color and font
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const pageWidth = doc.internal.pageSize.width;
    const leftColumnX = 15; // Left margin
    const rightColumnX = pageWidth / 2 + 5; // Adjusted for proper spacing
    const boxWidth = pageWidth / 2 - 20; // Box width for equal spacing

    let yPos = 45;

    // Employee Information (Left Box)
    (doc as any).autoTable({
      startY: yPos,
      head: [
        [
          {
            content: 'EMPLOYEE INFORMATION',
            styles: { fillColor: detailsHeaderColor },
          },
        ],
      ],
      body: [
        [
          {
            content: [
              { text: assessment.full_name, styles: { fontStyle: 'bold' } },
              {
                text:
                  '\nSubmitted: ' +
                  new Date(assessment.submitted_date).toLocaleDateString(),
              },
              {
                text:
                  '\nNext Due: ' +
                  new Date(assessment.next_due_date).toLocaleDateString(),
              },
            ]
              .map((item) => item.text)
              .join(''),
            styles: { cellWidth: 'auto', halign: 'left' },
          },
        ],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: headerColor,
        textColor: 'black',
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        fillColor: cellBackgroundColor,
        lineWidth: 0.1,
        lineColor: borderColor,
      },
      margin: { left: leftColumnX, right: rightColumnX },
      tableWidth: boxWidth,
    });

    // Assessment Details (Right Box)
    (doc as any).autoTable({
      startY: yPos,
      head: [
        [
          {
            content: 'ASSESSMENT DETAILS',
            styles: { fillColor: detailsHeaderColor },
          },
        ],
      ],
      body: [
        [
          {
            content: [
              {
                text: 'Assessment ID: ' + assessment.id,
                styles: { fontStyle: 'bold' },
              },
              {
                text:
                  '\nDate: ' +
                  new Date(assessment.submitted_date).toLocaleDateString(),
              },
            ]
              .map((item) => item.text)
              .join(''),
            styles: { cellWidth: 'auto', halign: 'left' },
          },
        ],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: headerColor,
        textColor: 'black',
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        fillColor: cellBackgroundColor,
        lineWidth: 0.1,
        lineColor: borderColor,
      },
      margin: { left: rightColumnX, right: 15 },
      tableWidth: boxWidth,
    });

    // Ensure we start after both boxes
    yPos = Math.max(
      (doc as any).lastAutoTable.finalY + 10,
      (doc as any).previousAutoTable.finalY + 10
    );

    // Keyboard Assessment
    (doc as any).autoTable({
      startY: yPos,
      head: [['KEYBOARD ASSESSMENT', 'RESULT']],
      body: [
        [
          'Keyboard separate from screen',
          assessment.keyboard_separate_from_screen ? 'Yes' : 'No',
        ],
        ['Keyboard tilt legs', assessment.keyboard_tilt_legs ? 'Yes' : 'No'],
        [
          'Which of the following images best describes your posture?',
          assessment.keyboard_posture,
        ],
        [
          'Keyboard comfortable',
          assessment.keyboard_comfortable ? 'Yes' : 'No',
        ],
        [
          'Keyboard characters clear',
          assessment.keyboard_characters_clear ? 'Yes' : 'No',
        ],
      ],
      headStyles: {
        fillColor: headerColor,
        textColor: '#000000',
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        fillColor: cellBackgroundColor,
        lineWidth: 0.1,
        lineColor: borderColor,
      },
      theme: 'grid',
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Mouse Assessment
    (doc as any).autoTable({
      startY: yPos,
      head: [['MOUSE ASSESSMENT', 'RESULT']],
      body: [
        [
          'Which of the following images best describes your mouse position?',
          assessment.mouse_position,
        ],
        [
          'Wrist/forearm support',
          assessment.wrist_forearm_support ? 'Yes' : 'No',
        ],
        ['Mouse smooth speed', assessment.mouse_smooth_speed ? 'Yes' : 'No'],
      ],
      headStyles: {
        fillColor: headerColor,
        textColor: '#000000',
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        fillColor: cellBackgroundColor,
        lineWidth: 0.1,
        lineColor: borderColor,
      },
      theme: 'grid',
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Screen Assessment
    (doc as any).autoTable({
      startY: yPos,
      head: [['SCREEN ASSESSMENT', 'RESULT']],
      body: [
        [
          'Are the characters on the screen clear?',
          assessment.screen_characters_clear ? 'Yes' : 'No',
        ],
        [
          'Is the text size comfortable to read?',
          assessment.screen_text_size_comfortable ? 'Yes' : 'No',
        ],
        [
          'Is the brightness and contrast suitable?',
          assessment.screen_brightness_contrast_suitable ? 'Yes' : 'No',
        ],
        [
          'Can the screen swivel and tilt?',
          assessment.screen_swivel_tilt ? 'Yes' : 'No',
        ],
        [
          'Is the screen free from glare?',
          assessment.screen_free_glare ? 'Yes' : 'No',
        ],
      ],
      headStyles: {
        fillColor: headerColor,
        textColor: '#000000',
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        fillColor: cellBackgroundColor,
        lineWidth: 0.1,
        lineColor: borderColor,
      },
      theme: 'grid',
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Vision Assessment
    (doc as any).autoTable({
      startY: yPos,
      head: [['VISION ASSESSMENT', 'RESULT']],
      body: [
        [
          'Are you straining your vision to see and use the computer?',
          assessment.vision_straining ? 'Yes' : 'No',
        ],
      ],
      headStyles: {
        fillColor: headerColor,
        textColor: '#000000',
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        fillColor: cellBackgroundColor,
        lineWidth: 0.1,
        lineColor: borderColor,
      },
      theme: 'grid',
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Furniture Assessment
    (doc as any).autoTable({
      startY: yPos,
      head: [['FURNITURE ASSESSMENT', 'RESULT']],
      body: [
        [
          'Is your desk large enough for your tasks?',
          assessment.desk_large_enough ? 'Yes' : 'No',
        ],
        [
          'Can you reach all the files, trays on your desk comfortably?',
          assessment.reach_files_comfortably ? 'Yes' : 'No',
        ],
        [
          'Which describes your posture on the chair?',
          assessment.chair_posture,
        ],
        [
          'Does your chair have castor wheels?',
          assessment.chair_castor_wheels ? 'Yes' : 'No',
        ],
        [
          'Does your chair have height adjustment?',
          assessment.chair_height_adjustment ? 'Yes' : 'No',
        ],
        [
          'Does your chair have depth adjustment?',
          assessment.chair_depth_adjustment ? 'Yes' : 'No',
        ],
        [
          'Does your chair have lumbar support?',
          assessment.chair_lumbar_support ? 'Yes' : 'No',
        ],
        [
          'Does your chair have adjustable backrest?',
          assessment.chair_adjustable_backrest ? 'Yes' : 'No',
        ],
        [
          'Does your chair have adjustable or padded armrests?',
          assessment.chair_adjustable_armrests ? 'Yes' : 'No',
        ],
        [
          'Do you find the chair backrest support your lower back?',
          assessment.chair_backrest_support ? 'Yes' : 'No',
        ],
        [
          'Do you find your forearms are horizontal and eyes at roughly the same height as the top of the screen?',
          assessment.forearms_horizontal ? 'Yes' : 'No',
        ],
        [
          'Are your feet flat on the floor without too much pressure from the seat?',
          assessment.feet_flat_floor ? 'Yes' : 'No',
        ],
      ],
      headStyles: {
        fillColor: headerColor,
        textColor: '#000000',
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        fillColor: cellBackgroundColor,
        lineWidth: 0.1,
        lineColor: borderColor,
      },
      theme: 'grid',
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Environment Assessment
    (doc as any).autoTable({
      startY: yPos,
      head: [['ENVIRONMENT ASSESSMENT', 'RESULT']],
      body: [
        [
          'Is there enough room to change position and vary movement?',
          assessment.room_change_position ? 'Yes' : 'No',
        ],
        [
          'Is the lighting suitable?',
          assessment.lighting_suitable ? 'Yes' : 'No',
        ],
        [
          'Are the levels of heat comfortable?',
          assessment.heat_comfortable ? 'Yes' : 'No',
        ],
        [
          'Are the levels of noise comfortable?',
          assessment.noise_comfortable ? 'Yes' : 'No',
        ],
      ],
      headStyles: {
        fillColor: headerColor,
        textColor: '#000000',
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        fillColor: cellBackgroundColor,
        lineWidth: 0.1,
        lineColor: borderColor,
      },
      theme: 'grid',
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Feedback
    (doc as any).autoTable({
      startY: yPos,
      head: [['FEEDBACK', 'RESULT']],
      body: [
        [
          'Have you experienced any discomfort or other symptoms from using your computer or laptop?',
          assessment.experienced_discomfort ? 'Yes' : 'No',
        ],
        [
          'Would you be interested in having your eye and vision tested?',
          assessment.interested_eye_test ? 'Yes' : 'No',
        ],
        [
          'Do you regularly take breaks working away from screens?',
          assessment.regular_breaks ? 'Yes' : 'No',
        ],
      ],
      headStyles: {
        fillColor: headerColor,
        textColor: '#000000',
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        fillColor: cellBackgroundColor,
        lineWidth: 0.1,
        lineColor: borderColor,
      },
      theme: 'grid',
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Notes
    if (assessment.notes) {
      (doc as any).autoTable({
        startY: yPos,
        head: [['NOTES']],
        body: [[assessment.notes]],
        headStyles: {
          fillColor: headerColor,
          textColor: '#000000',
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
          fillColor: cellBackgroundColor,
          lineWidth: 0.1,
          lineColor: borderColor,
        },
        theme: 'grid',
        margin: { left: 15, right: 15 },
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
        doc.text(
          pageNumberText,
          pageWidth - pageNumberWidth - 15,
          pageHeight - 10
        ); // Right margin of 15px
      }
    }

    // Instead of returning dataurlstring, return blob URL
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    return pdfUrl;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error(
      `Failed to generate PDF: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
