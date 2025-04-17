import { jsPDF } from 'jspdf';
import type { RAMSFormData } from '../../../types/rams';

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
  'Wear safety belts': 'https://xrjwzlwtublkapjzbljg.supabase.co/storage/v1/object/public/ppe-icons/wear-safety-belts.png'
};

export async function generateRAMSPDF4(
  doc: jsPDF,
  rams: RAMSFormData,
  yPos: number
): Promise<number> {
  const headerColor = '#edeaea';
  const cellBackgroundColor = '#f7f7f7';
  const borderColor = [211, 211, 211];
  const pageWidth = doc.internal.pageSize.width;

  if (rams.ppe && rams.ppe.length > 0) {
    const maxColumns = 4;
    const priorityPPE = rams.ppe.filter(item => PRIORITY_PPE.includes(item));
    const otherPPE = rams.ppe.filter(item => OTHER_PPE.includes(item));
    const allPPE = [...priorityPPE, ...otherPPE];
    const tableBody = [];

    // Process PPE items in groups of 4
    for (let i = 0; i < allPPE.length; i += maxColumns) {
      const rowItems = allPPE.slice(i, i + maxColumns);
      const row = await Promise.all(rowItems.map(async (item) => {
        const imageUrl = PPE_ICON_URLS[item];
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
          const response = await fetch(imageUrl);
          if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

          const blob = await response.blob();
          const reader = new FileReader();
          const imageData = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          // Create cell with image and text
          return {
            content: `\n\n\n${item}`,
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
              x: 0,
              y: 0,
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
      head: [[{ content: 'PPE REQUIREMENTS', colSpan: maxColumns, styles: { halign: 'center' } }]],
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
        fillColor: headerColor,
        textColor: '#000000',
        fontStyle: 'bold',
        cellPadding: 5, // Reduced header cell padding
      minCellHeight: 12, // Reduced header height
      },
      styles: {
        fontSize: 10,
        lineWidth: 0.1,
        lineColor: borderColor,
        minCellHeight: 40
      },
      theme: 'plain',
      margin: { left: 15, right: 15 }
    });

    return (doc as any).lastAutoTable.finalY + 10;
  }

  return yPos;
}