import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { CPP, CompanySettings } from '../types/database';

interface GeneratePDFOptions {
  cpp: CPP;
  companySettings: CompanySettings;
}

// Helper function to format section content
const formatContent = (content: any): string => {
  if (!content) return '';
  if (typeof content === 'string') return content;
  
  if (Array.isArray(content)) {
    return content.map(item => {
      if (typeof item === 'string') return item;
      return Object.values(item).join(': ');
    }).join('\n');
  }
  
  return Object.entries(content)
    .map(([key, value]) => {
      if (value === null || value === undefined) return '';
      
      // Convert camelCase to Title Case
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      
      if (Array.isArray(value)) {
        return `${formattedKey}:\n${value.map(item => `  • ${item}`).join('\n')}`;
      }
      if (typeof value === 'object') {
        return `${formattedKey}:\n${Object.entries(value)
          .map(([subKey, subValue]) => {
            const formattedSubKey = subKey
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
            return `  ${formattedSubKey}: ${subValue}`;
          })
          .join('\n')}`;
      }
      return `${formattedKey}: ${value}`;
    })
    .filter(text => text)
    .join('\n\n');
};

export async function generateCPPPDF({
  cpp,
  companySettings
}: GeneratePDFOptions): Promise<string> {
  try {
    console.log('Starting PDF generation with CPP data:', cpp); // Debug log for entire CPP object
    console.log('Contractors data:', cpp.contractors); // Debug log specifically for contractors

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
    doc.text('CPP', 195, 25, { align: 'right' });
    
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

    // CPP Details (Right Box)
    (doc as any).autoTable({
      startY: yPos,
      head: [[{ content: 'CPP Details', colSpan: 2, styles: { fillColor: '#edeaea' } }]],
      body: [
        [{ content: 'CPP NO:', styles: { fontStyle: 'bold' } }, cpp.cpp_number],
        [{ content: 'CREATION:', styles: { fontStyle: 'bold' } }, new Date(cpp.created_at).toLocaleDateString()],
        [{ content: 'PROJECT:', styles: { fontStyle: 'bold' } }, cpp.front_cover?.projectName || ''],
        [{ content: 'APPROVED', styles: { fontStyle: 'bold' } }, 'R. Stewart'],
        [{ content: 'VERSION:', styles: { fontStyle: 'bold' } }, cpp.front_cover?.version || '']
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

    // CPP Sections
    const sections = [
      { title: 'Site Information', data: cpp.site_information, fields: [
        'address',
        'siteManager',
        'siteManagerEmail',
        'siteManagerPhone',
        'principalDesigner',
        'principalDesignerEmail',
        'principalDesignerPhone',
        'principalDesignerCompany',
        'principalContractor',
        'principalContractorEmail',
        'principalContractorPhone',
        'principalContractorCompany',
        'accessRestrictions',
        'parkingArrangements',
        'existingEnvironment',
        'surroundingLandUse',
        'existingServices'
      ]},
      { title: 'Project Description', data: cpp.project_description, fields: [
        'workType',
        'description',
        'startDate',
        'endDate',
        'duration',
        'orderReference'
      ]},
      { title: 'Hours & Team', data: cpp.hours_team, fields: [
        'hours',
        'workingDays',
        'keyMembers'
      ]},
      { title: 'Management of Work', data: cpp.management_work, fields: [
        'healthAndSafetyAims',
        'supervisionArrangements',
        'trainingArrangements',
        'consultationArrangements'
      ]},
      { title: 'Management Structure', data: cpp.management_structure, fields: [
        'roles'
      ]},
      { title: 'Site Rules', data: cpp.site_rules, fields: [
        'generalRules',
        'ppeRequirements',
        'otherPPE',
        'permitToWork',
        'trafficManagement'
      ]},
      { title: 'Arrangements', data: cpp.arrangements, fields: [
        'items',
        'storage',
        'lighting',
        'security',
        'deliveries',
        'electricity'
      ]},
      { title: 'Site Induction', data: cpp.site_induction, fields: [
        'arrangements',
        'inductionTopics',
        'inductionProcess',
        'recordKeeping'
      ]},
      { title: 'Welfare Arrangements', data: cpp.welfare_arrangements, fields: [
        'other',
        'toilets',
        'restAreas',
        'dryingRooms',
        'drinking',
        'handwashing',
        'selectedOptions'
      ]},
      { title: 'First Aid Arrangements', data: cpp.first_aid_arrangements, fields: [
        'arrangements',
        'assemblyArea',
        'firstAiderName',
        'nearestMedical',
        'emergencySignal',
        'firstAiderPhone',
        'safetyManagerName',
        'safetyManagerPhone',
        'firstAidKitLocation',
        'fireEquipmentLocation'
      ]},
      { title: 'Rescue Plan', data: cpp.rescue_plan, fields: [
        'arrangements',
        'emergencyProcedures',
        'assemblyPoints',
        'contactNumbers'
      ]},
      { title: 'Specific Measures', data: cpp.specific_measures, fields: [
        'items'
      ]},
      { title: 'Hazard Identification', data: cpp.hazard_identification, fields: [
        'workingAtHeight',
        'scaffolding',
        'mewp',
        'demolitionAsbestos',
        'demolitionNoAsbestos',
        'excavations',
        'heavyMachinery',
        'concrete',
        'hotWorks',
        'temporarySupports',
        'handlingGlass',
        'hazardousSubstances',
        'crampedConditions',
        'confinedSpace'
      ]},
      { title: 'Hazards', data: cpp.hazards, fields: [
        'id',
        'title',
        'beforeTotal',
        'afterTotal',
        'beforeSeverity',
        'afterSeverity',
        'beforeLikelihood',
        'afterLikelihood',
        'controlMeasures',
        'howMightBeHarmed',
        'whoMightBeHarmed'
      ]},
      { title: 'High Risk Construction Work', data: cpp.high_risk_work, fields: [
        'activities',
        'selectedOptions'
      ]},
      { title: 'Notifiable Work', data: cpp.notifiable_work, fields: [
        'isNotifiable',
        'selectedOptions'
      ]},
      { title: 'Contractors', data: cpp.contractors, fields: [
        'companyName',
        'trade',
        'firstName',
        'lastName',
        'phone',
        'email'
      ]},
      { title: 'Monitoring & Review', data: cpp.monitoring, fields: [
        'cooperation',
        'recordKeeping',
        'reviewProcess',
        'riskArrangements',
        'responsiblePerson',
        'inspectionSchedule',
        'siteReviewFrequency',
        'toolboxTalkFrequency'
      ]}
    ];

    // Before processing sections
    console.log('About to process sections. Total sections:', sections.length); // Debug log for sections array

    // Helper function to format address
    const formatAddress = (address: any) => {
      if (!address) return '';
      const parts = [
        address.line1,
        address.line2,
        address.town,
        address.county,
        address.postCode
      ].filter(part => part);
      return parts.join(', ');
    };

    // Helper function to format hazard identification checkboxes
    const formatHazardIdentification = (hazardId: any) => {
      if (!hazardId) return '';
      
      const sections: any = {
        workingAtHeight: {
          title: 'Working at height - This includes roof work, any work off a scaffold or out of a MEWP',
          options: {
            fenceOff: 'Fence off underneath the work area',
            isolateHazard: 'Isolate the hazard using methods such as scaffolding, guarded work Platforms, mewps and edge protection',
            useCatchment: 'Use catchment methods such as netting to catch tools and debris',
            equipmentFitForPurpose: 'Working at height equipment must be fit for purpose and in good condition',
            useFallRestraint: 'Fall restraint equipment to be used eg harness'
          }
        },
        scaffolding: {
          title: 'Erecting or dismantling scaffolding (portable or fixed)',
          options: {
            competentInstaller: 'To be installed and tagged by a competent installer',
            regularlyChecked: 'Regularly checked (weekly) as safe for use and current tag is on display',
            fitForPurpose: 'Ensure scaffold is fit for purpose eg correct load rating'
          }
        },
        mewp: {
          title: 'Using a mobile elevated working platform (MEWPs, man-cage, cherry picker)',
          options: {
            certified: 'Ensure equipment is certified and fit for purpose',
            competentPerson: 'Must be operated by a competent person',
            preStartChecks: 'Daily pre-start checks to be done',
            useHarness: 'Use a harness when required'
          }
        },
        demolitionAsbestos: {
          title: 'Demolition Asbestos Survey required carried out by a qualified and competent surveyor',
          options: {
            enclosures: 'Enclosures and negative pressure units are required for Licensed asbestos removal',
            managementPlan: 'An asbestos management plan that identifies all asbestos types and locations must be in place',
            controlPlan: 'An asbestos control plan has been prepared for the work and is attached to this CPP',
            certificates: 'All operatives must hold a certificate for specified class of asbestos work undertaken at the very least an Asbestos Awareness',
            airMonitoring: 'Air monitoring is required for licensed and non licensed asbestos removal control limit is .03 of a fibre per cubic centimetre of air',
            clearanceInspection: 'An independent clearance inspection is required where any asbestos fibres have or may have been released and a re-occupation certificate obtained',
            hseNotification: 'Ensure that HSE is notified at least 14 days prior to any licensed asbestos removal work and an online (HSE) notification of non licensed work must take place prior to work commencing',
            decontamination: 'Ensure site, equipment and ppe is decontaminated or disposed of correctly',
            deenergiseServices: 'Services to be de-energised',
            dampenArea: 'Dampen down or enclose work area to minimise dust',
            wasteDisposal: 'Removal of debris and waste to be disposed of following local council requirements',
            weatherConditions: 'Monitor adverse weather conditions'
          }
        },
        demolitionNoAsbestos: {
          title: 'Conducting any demolition works where asbestos is not present',
          options: {
            deenergiseServices: 'Services to be de-energised',
            dampenArea: 'Dampen down or enclose work area to minimise dust',
            wasteDisposal: 'Removal of debris and waste to be disposed of following local council requirements',
            weatherConditions: 'Monitor adverse weather conditions'
          }
        },
        excavations: {
          title: 'Conducting excavations - This includes any work that may come in contact with overhead/underground utilities',
          options: {
            coverHoles: 'Cover/fence/barricade holes',
            identifyServices: 'All services to be identified before work starts, implement lockout/tagout process to ensure safe isolation',
            useShoring: 'Use shoring for excavations greater than or equal to 1.5m or in unstable ground',
            keepClear: 'Keep other workers/visitors clear and stay visible to operator',
            regularServicing: 'Ensure regular equipment servicing',
            appropriateWeather: 'Dig in appropriate weather conditions',
            dailyInspection: 'Inspect the excavation daily before work starts or after any adverse weather conditions'
          }
        },
        heavyMachinery: {
          title: 'Using heavy machinery or cranes',
          options: {
            turnOffAndLower: 'When not in use ensure all plant, machinery and equipment is turned off and lowered',
            keepClear: 'Keep clear of swing radius',
            lowerBucket: 'Bucket and attachments lowered before approach',
            stayVisible: 'Stay visible to operator',
            regularInspections: 'Regular inspections/servicing, daily pre-starts to be conducted',
            weightLimits: 'Do not exceed weight limits',
            equipmentRegister: 'A plant, machinery and equipment register must be up-to-date and available on site'
          }
        },
        concrete: {
          title: 'Working with concrete',
          options: {
            noWorkAbove: 'Do not work above reinforcing steel',
            capExposed: 'Cap all exposed reinforcing steel',
            eyewashFacilities: 'Eye wash facilities must be available on site',
            regularServicing: 'Ensure regular equipment servicing',
            hazardousRegister: 'Complete a hazardous substance register and attach to this CPP',
            msdsAvailable: 'Ensure Material safety data sheets (msds) are available on site'
          }
        },
        hotWorks: {
          title: 'Carrying out any hot works (welding, brazing)',
          options: {
            clearArea: 'Clear area of all combustible materials',
            secureGasBottles: 'Secure all gas bottles',
            fireExtinguisher: 'Clean water and fire extinguisher must be available at all times',
            permitRequired: 'A permit to work process is required'
          }
        },
        temporarySupports: {
          title: 'Using temporary supports (Acrow props)',
          options: {
            approvedProps: 'Use approved props installed to engineer\'s design',
            goodCondition: 'Ensure props are in good condition'
          }
        },
        handlingGlass: {
          title: 'Handling glass',
          options: {
            keepClear: 'All visitors and other workers to keep clear',
            noWorkUnderneath: 'Do not work underneath where glass is being installed',
            correctDisposal: 'Glass to be disposed of correctly',
            immediateCleanup: 'All broken glass to be cleaned up immediately'
          }
        },
        hazardousSubstances: {
          title: 'Hazardous Substances',
          options: {
            correctStorage: 'Ensure correct storage, handling and disposal',
            licensedHandlers: 'Ensure licensed handlers for prescribed types and quantities',
            coshhAssessment: 'Complete a task specific COSHH assessment and attach to this CPP',
            sdsAvailable: 'Ensure safety data sheets (sds) available on site and are followed'
          }
        },
        crampedConditions: {
          title: 'Working in cramped conditions (underfloor, roof spaces)',
          options: {
            comfortableExit: 'Do not enter areas not large enough to comfortably exit',
            standbyPerson: 'Use a standby person',
            ventilationLighting: 'Ensure sufficient ventilation and lighting'
          }
        },
        confinedSpace: {
          title: 'Conducting any confined space work - A confined space is an enclosed or partially enclosed space, not intended for primary human occupancy. It is generally not a ceiling space or underfloor space (restricted space)',
          options: {
            authorizedOnly: 'Do not enter a confined space unless authorised to do so',
            testingAndPermit: 'Atmospheric testing/monitoring and entry permit in place',
            responseplan: 'High risk response plan to be put in place before works commence'
          }
        }
      };

      const result: string[] = [];
      
      // Iterate through each section in hazardId
      Object.entries(hazardId).forEach(([sectionKey, sectionData]: [string, any]) => {
        // Check if this section is selected
        if (sectionData.selected && sections[sectionKey]) {
          const section = sections[sectionKey];
          const selectedOptions = Object.entries(sectionData)
            .filter(([optKey, value]) => 
              value === true && 
              optKey !== 'selected' && 
              section.options[optKey]
            )
            .map(([optKey, _]) => section.options[optKey]);
          
          if (selectedOptions.length > 0) {
            result.push(`${section.title}\n${selectedOptions.map(opt => `• ${opt}`).join('\n')}`);
          }
        }
      });

      return result.join('\n\n');
    };

    // Modify the formatContent function to handle special cases
    const formatContent = (content: any, sectionTitle: string): string => {
      if (!content) return '';

      // Special case for Front Cover
      if (sectionTitle === 'Front Cover') {
        const labels = {
          version: 'Version',
          fileName: 'File Name',
          projectId: 'Project ID',
          clientName: 'Client Name',
          preparedBy: 'Prepared By',
          projectName: 'Project Name',
          preparedDate: 'Prepared Date',
          contractorName: 'Contractor Name',
          projectLocation: 'Project Location',
          projectReference: 'Project Reference',
          principalContractor: 'Principal Contractor'
        };
        return Object.entries(content)
          .filter(([_, value]) => value !== null && value !== undefined && value !== '')
          .map(([key, value]) => `${labels[key as keyof typeof labels]}: ${value}`)
          .join('\n\n');
      }

      // Special case for Site Information
      if (sectionTitle === 'Site Information') {
        const fieldLabels = {
          address: 'Site Address:',
          principalContractorCompany: 'Principal Contractor Company:',
          principalContractor: 'Principal Contractor:',
          principalContractorPhone: 'Principal Contractor Phone:',
          principalContractorEmail: 'Principal Contractor Email:',
          principalDesignerCompany: 'Principal Designer Company:',
          principalDesigner: 'Principal Designer:',
          principalDesignerPhone: 'Principal Designer Phone:',
          principalDesignerEmail: 'Principal Designer Email:',
          siteManager: 'Site Manager:',
          siteManagerPhone: 'Site Manager Phone:',
          siteManagerEmail: 'Site Manager Email:'
        };

        const orderedFields = [
          'address',
          'principalContractorCompany',
          'principalContractor',
          'principalContractorPhone',
          'principalContractorEmail',
          'principalDesignerCompany',
          'principalDesigner',
          'principalDesignerPhone',
          'principalDesignerEmail',
          'siteManager',
          'siteManagerPhone',
          'siteManagerEmail'
        ];

        return orderedFields
          .map(field => {
            let value = content[field];
            if (field === 'address') {
              value = formatAddress(content.address);
            }
            if (value === null || value === undefined || value === '') return '';
            return `${fieldLabels[field]}\n${value}`;
          })
          .filter(text => text)
          .join('\n\n');
      }

      // Special case for Site Induction
      if (sectionTitle === 'Site Induction') {
        const fieldLabels = {
          arrangements: 'What are the arrangements for site induction?',
          inductionTopics: 'What topics will be covered in the site induction?',
          inductionProcess: 'What is the induction process?',
          recordKeeping: 'How will induction records be kept?'
        };

        const parts: string[] = [];
        if (content.arrangements) {
          parts.push(`${fieldLabels.arrangements}\n${content.arrangements}`);
        }
        if (content.inductionTopics?.length) {
          parts.push(`${fieldLabels.inductionTopics}`);
          content.inductionTopics.forEach((topic: string) => parts.push(`  • ${topic}`));
        }
        if (content.inductionProcess) {
          parts.push(`${fieldLabels.inductionProcess}\n${content.inductionProcess}`);
        }
        if (content.recordKeeping) {
          parts.push(`${fieldLabels.recordKeeping}\n${content.recordKeeping}`);
        }
        return parts.join('\n\n');
      }

      // Special case for First Aid Arrangements
      if (sectionTitle === 'First Aid Arrangements') {
        const fieldLabels = {
          arrangements: 'What are the first aid arrangements for this site?',
          safetyManagerName: 'Safety Manager Name:',
          safetyManagerPhone: 'Safety Manager Phone:',
          firstAiderName: 'Trained First Aider Name:',
          firstAiderPhone: 'Trained First Aider Phone:',
          firstAidKitLocation: 'First Aid Kit Location:',
          fireEquipmentLocation: 'Fire Fighting Equipment Location:',
          emergencySignal: 'Emergency Signal:',
          assemblyArea: 'Emergency Area:',
          nearestMedical: 'Nearest A&E or Medical Centre:'
        };

        const orderedFields = [
          'arrangements',
          'safetyManagerName',
          'safetyManagerPhone',
          'firstAiderName',
          'firstAiderPhone',
          'firstAidKitLocation',
          'fireEquipmentLocation',
          'emergencySignal',
          'assemblyArea',
          'nearestMedical'
        ];

        return orderedFields
          .map(field => {
            const value = content[field];
            if (value === null || value === undefined || value === '') return '';
            return `${fieldLabels[field]}\n${value}`;
          })
          .filter(text => text)
          .join('\n\n');
      }

      // Special case for Rescue Plan
      if (sectionTitle === 'Rescue Plan') {
        const parts: string[] = [];
        const mainQuestion = 'What are the rescue plan arrangements for this site?';
        
        if (content.arrangements) {
          parts.push(`${mainQuestion}\n${content.arrangements}`);
        }
        if (content.emergencyProcedures) {
          parts.push(`Emergency Procedures:\n${content.emergencyProcedures}`);
        }
        if (content.assemblyPoints?.length) {
          parts.push('Assembly Points:');
          content.assemblyPoints.forEach((point: string) => parts.push(`  • ${point}`));
        }
        if (content.contactNumbers?.length) {
          parts.push('Emergency Contact Numbers:');
          content.contactNumbers.forEach((contact: any) => {
            parts.push(`  • ${contact.name}: ${contact.number} (${contact.purpose})`);
          });
        }
        return parts.join('\n\n');
      }

      // Special case for Specific Measures
      if (sectionTitle === 'Specific Measures') {
        const parts: string[] = [];
        if (content.items?.length) {
          content.items.forEach((item: any) => {
            parts.push(`Code: ${item.code}`);
            parts.push(`Category: ${item.category}`);
            parts.push(`Title: ${item.title}`);
            parts.push(`Description: ${item.description}`);
            parts.push(`Control Measures: ${item.controlMeasure}\n`);
          });
        }
        return parts.join('\n');
      }

      // Special case for High Risk Construction Work
      if (sectionTitle === 'High Risk Construction Work') {
        const mainQuestion = 'The following is the list of high risk construction work (HRCW) that require a Risk Assessment Method Statement (RAMS) to be prepared, submitted and reviewed prior to work beginning. Select which work applies to the site:';
        
        const hrcwOptions = {
          option1: 'Work which puts workers at risk of burial under earthfalls, engulfment in swampland or falling from a height, where the risk is particularly aggravated by the nature of the work or processes used or by the environment at the place of work or site',
          option2: 'Work which puts workers at risk from chemical or biological substances constituting a particular danger to the health or safety of workers or involving a legal requirement for health monitoring',
          option3: 'Work with ionizing radiation requiring the designation of controlled or supervised areas under regulation 16 of the Ionising Radiations Regulations 1999(17)',
          option4: 'Work near high voltage power lines',
          option5: 'Work exposing workers to the risk of drowning',
          option6: 'Work on wells, underground earthworks and tunnels',
          option7: 'Work carried out by divers having a system of air supply',
          option8: 'Work carried out by workers in caissons with a compressed air atmosphere',
          option9: 'Work involving the use of explosives',
          option10: 'Work involving the assembly or dismantling of heavy prefabricated components',
          option11: 'Work involving entry to confined spaces'
        };

        let optionsList = '• No high risk construction work selected';
        
        if (Array.isArray(content.selectedOptions) && content.selectedOptions.length > 0) {
          optionsList = content.selectedOptions
            .map((optionKey: string) => {
              const optionText = hrcwOptions[optionKey as keyof typeof hrcwOptions];
              if (optionText) {
                return `• ${optionText}`;
              }
              return null;
            })
            .filter(Boolean)
            .join('\n');
        }
        
        return `${mainQuestion}|${optionsList}`;
      }

      // Special case for Notifiable Work
      if (sectionTitle === 'Notifiable Work') {
        const mainQuestion = 'Select the Notifiable Work that will take place on your site:';
        
        const notifiableOptions = {
          option1: 'The project will last more than 30 days, and more than 20 workers working simultaneously on site at any point during the project',
          option2: 'The project will exceed 500 person days',
          option3: 'Licenced Asbestos Work',
          option4: 'Non-licenced Asbestos Work'
        };

        const parts = [];
        
        if (Array.isArray(content.selectedOptions)) {
          const optionsList = content.selectedOptions
            .map((optionKey: string) => {
              const optionText = notifiableOptions[optionKey as keyof typeof notifiableOptions];
              if (optionText) {
                return `• ${optionText}`;
              }
              return null;
            })
            .filter(Boolean)
            .join('\n');
          parts.push(`${mainQuestion}\n${optionsList || '• No notifiable work selected'}`);
        } else {
          parts.push(`${mainQuestion}\n• No notifiable work selected`);
        }
        
        return parts.join('\n\n');
      }

      // Special case for Hazard Identification
      if (sectionTitle === 'Hazard Identification') {
        return formatHazardIdentification(content);
      }

      // Special case for Monitoring & Review section
      if (sectionTitle === 'Monitoring & Review') {
        const fieldLabels = {
          riskArrangements: 'What are the arrangements for monitoring and reviewing the effectiveness of the plan for addressing risk?',
          cooperation: 'How does the PC co-operate with the contractors to ensure the plan remains fit for purpose through the construction phase?',
          siteReviewFrequency: 'How often will you conduct site reviews on this job?',
          toolboxTalkFrequency: 'How often will you conduct workplace toolbox talks on this job?'
        };

        const orderedEntries = [
          ['riskArrangements', content.riskArrangements],
          ['cooperation', content.cooperation],
          ['siteReviewFrequency', content.siteReviewFrequency],
          ['toolboxTalkFrequency', content.toolboxTalkFrequency]
        ];

        return orderedEntries
          .map(([key, value]) => {
            if (value === null || value === undefined || value === '') return '';
            const label = fieldLabels[key as keyof typeof fieldLabels];
            return `${label}\n${value}`;
          })
          .filter(text => text)
          .join('\n\n');
      }

      // Special case for Project Description
      if (sectionTitle === 'Project Description') {
        const fieldLabels = {
          workType: 'What type of work will be carried out?',
          startDate: 'When will the work start?',
          endDate: 'When will the work end?',
          description: 'Please provide a description of the work:',
          orderReference: 'What is the order reference?'
        };

        const orderedFields = [
          'workType',
          'startDate',
          'endDate',
          'description',
          'orderReference'
        ];

        return orderedFields
          .map(field => {
            const value = content[field];
            if (value === null || value === undefined || value === '') return '';
            return `${fieldLabels[field as keyof typeof fieldLabels]}\n${value}`;
          })
          .filter(text => text)
          .join('\n\n');
      }

      // Special case for Hours & Team
      if (sectionTitle === 'Hours & Team') {
        const parts: string[] = [];
        const fieldLabels = {
          workingDays: 'What days will work be carried out?',
          hours: 'What are the working hours?',
          keyMembers: 'Who are the key team members?'
        };

        if (content.workingDays?.length) {
          parts.push(`${fieldLabels.workingDays}\n${content.workingDays.join(', ')}`);
        }
        if (content.hours) {
          parts.push(`${fieldLabels.hours}\n${content.hours}`);
        }
        if (content.keyMembers?.length) {
          const membersList = content.keyMembers.map((member: any) => {
            if (member.name && member.role) {
              return `• ${member.name} - ${member.role}${member.contact ? ` (${member.contact})` : ''}`;
            }
            return '';
          }).filter(Boolean).join('\n');
          parts.push(`${fieldLabels.keyMembers}\n${membersList}`);
        }
        return parts.join('\n\n');
      }

      // Special case for Management of Work
      if (sectionTitle === 'Management of Work') {
        const parts: string[] = [];
        
        if (content.healthAndSafetyAims) {
          parts.push(`What are the Health and Safety aims of this project?\n${content.healthAndSafetyAims}`);
        }
        if (content.supervisionArrangements) {
          parts.push(`Supervision Arrangements:\n${content.supervisionArrangements}`);
        }
        if (content.trainingArrangements) {
          parts.push(`Training Arrangements:\n${content.trainingArrangements}`);
        }
        if (content.consultationArrangements) {
          parts.push(`Consultation Arrangements:\n${content.consultationArrangements}`);
        }
        return parts.join('\n\n');
      }

      // Special case for Management Structure
      if (sectionTitle === 'Management Structure' && content.roles) {
        const parts: string[] = [];
        content.roles.forEach((role: any) => {
          parts.push(`Role: ${role.role}`);
          parts.push(`Name: ${role.name}`);
          parts.push(`Contact Number: ${role.contact}\n`);
        });
        return parts.join('\n');
      }

      // Special case for Site Rules
      if (sectionTitle === 'Site Rules') {
        const parts: string[] = [];
        
        if (content.ppeRequirements?.length) {
          const ppeList = content.ppeRequirements.map((ppe: string) => `• ${ppe}`).join('\n');
          parts.push(`PPE Requirements:\n${ppeList}`);
        }
        if (content.otherPPE) {
          parts.push(`Other PPE Required:\n${content.otherPPE}`);
        }
        if (content.generalRules?.length) {
          const rulesList = content.generalRules.map((rule: string) => `• ${rule}`).join('\n');
          parts.push(`Additional/General Rules:\n${rulesList}`);
        }
        return parts.join('\n\n');
      }

      // Special case for Arrangements
      if (sectionTitle === 'Arrangements') {
        const parts: string[] = [];
        if (content.items?.length) {
          content.items.forEach((item: any) => {
            parts.push(`Arrangement: ${item.type}`);
            parts.push(`Arrangement Cover: ${item.cover}\n`);
          });
        }
        return parts.join('\n');
      }

      // Special case for Welfare Arrangements
      if (sectionTitle === 'Welfare Arrangements') {
        const parts: string[] = [];
        const welfareOptions = {
          option1: 'Groundhog/Oasis Integrated Welfare Unit',
          option2: 'Mobile Welfare Unit',
          option3: 'Portaloo WC Facilities',
          option4: 'Welfare and Office units, containing, WC closets (Male & Female), hand washing, hot and cold water, drying room, canteen/break out room, means to heat food'
        };

        if (Array.isArray(content.selectedOptions)) {
          const optionsList = content.selectedOptions
            .map((optionKey: string) => {
              const optionText = welfareOptions[optionKey as keyof typeof welfareOptions];
              if (optionText) {
                return `• ${optionText}`;
              }
              return null;
            })
            .filter(Boolean)
            .join('\n');
          parts.push(`Selected Welfare Arrangements:\n${optionsList}`);
        }

        if (content.other) parts.push(`Other Arrangements:\n${content.other}`);
        if (content.toilets) parts.push(`Toilets:\n${content.toilets}`);
        if (content.restAreas) parts.push(`Rest Areas:\n${content.restAreas}`);
        if (content.dryingRooms) parts.push(`Drying Rooms:\n${content.dryingRooms}`);
        if (content.drinking) parts.push(`Drinking Water:\n${content.drinking}`);
        if (content.handwashing) parts.push(`Hand Washing:\n${content.handwashing}`);
        
        return parts.filter(p => p).join('\n\n');
      }

      // Special case for Hazards
      if (sectionTitle === 'Hazards') {
        console.log('Processing Hazards section with data:', content);
        
        // Ensure content is treated as an array
        let hazardsArray;
        if (Array.isArray(content)) {
          hazardsArray = content;
        } else if (content && typeof content === 'object') {
          hazardsArray = [content];
        } else {
          console.log('No valid hazards data found');
          return 'No hazards listed';
        }
        
        if (!hazardsArray || hazardsArray.length === 0) {
          console.log('No hazards in array');
          return 'No hazards listed';
        }

        // Store the starting Y position
        const startingY = yPos;
        let currentY = startingY;

        // Create tables for each hazard
        hazardsArray.forEach((hazard: any, index: number) => {
          if (!hazard) return;

          // Add extra spacing between hazards
          if (index > 0) {
            currentY += 10;
          }

          // Check if we need a page break before starting this hazard
          if (currentY > doc.internal.pageSize.height - 100) {
            doc.addPage();
            currentY = 15;
          }

          (doc as any).autoTable({
            startY: currentY,
            head: [
              [{
                content: `HAZARD: ${hazard.title}`,
                colSpan: 6,
                styles: {
                  fillColor: '#004EA8',
                  textColor: '#ffffff'
                }
              }]
            ],
            body: [
              [
                {
                  content: 'WHO MIGHT BE HARMED:',
                  colSpan: 2,
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                },
                {
                  content: hazard.whoMightBeHarmed || '',
                  colSpan: 4,
                  styles: {
                    fillColor: '#ffffff'
                  }
                }
              ],
              [
                {
                  content: 'HOW MIGHT THEY BE HARMED:',
                  colSpan: 2,
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                },
                {
                  content: hazard.howMightBeHarmed || '',
                  colSpan: 4,
                  styles: {
                    fillColor: '#ffffff'
                  }
                }
              ],
              [
                {
                  content: 'Risk Calculation (Before Control Measures)',
                  colSpan: 6,
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                }
              ],
              [
                {
                  content: 'LIKELIHOOD',
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                },
                {
                  content: hazard.beforeLikelihood || '',
                  styles: {
                    fillColor: '#ffffff'
                  }
                },
                {
                  content: 'SEVERITY',
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                },
                {
                  content: hazard.beforeSeverity || '',
                  styles: {
                    fillColor: '#ffffff'
                  }
                },
                {
                  content: 'TOTAL RISK',
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                },
                {
                  content: hazard.beforeTotal || '',
                  styles: {
                    fillColor: '#ffffff'
                  }
                }
              ],
              [
                {
                  content: 'Control Measures',
                  colSpan: 6,
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                }
              ],
              ...(hazard.controlMeasures?.map((measure: any) => [
                {
                  content: `• ${measure.description || ''}`,
                  colSpan: 6,
                  styles: {
                    fillColor: '#ffffff'
                  }
                }
              ]) || []),
              [
                {
                  content: 'Risk Calculation (After Control Measures)',
                  colSpan: 6,
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                }
              ],
              [
                {
                  content: 'LIKELIHOOD',
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                },
                {
                  content: hazard.afterLikelihood || '',
                  styles: {
                    fillColor: '#ffffff'
                  }
                },
                {
                  content: 'SEVERITY',
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                },
                {
                  content: hazard.afterSeverity || '',
                  styles: {
                    fillColor: '#ffffff'
                  }
                },
                {
                  content: 'TOTAL RISK',
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                },
                {
                  content: hazard.afterTotal || '',
                  styles: {
                    fillColor: '#ffffff'
                  }
                }
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
              fontSize: 10,
              cellPadding: 4
            },
            styles: {
              fontSize: 10,
              cellPadding: 4,
              lineWidth: 0.1,
              lineColor: borderColor
            },
            theme: 'grid',
            margin: { left: 15, right: 15 }
          });

          currentY = (doc as any).lastAutoTable.finalY;
        });

        // Update yPos to continue from the last hazard table
        yPos = currentY + 10; // Add a small spacing after the last hazard table
        return ''; // Return empty string since we've already added the tables
      }

      // Special handling for sections after Hazards
      if (['High Risk Construction Work', 'Notifiable Work', 'Contractors', 'Monitoring & Review'].includes(sectionTitle)) {
        // Ensure proper spacing at the top of the page for these sections
        if (yPos < 5) { // Also adjusted from 15 to 10 to match the new spacing
          yPos = 5;
        }
      }

      // Special case for Contractors
      if (sectionTitle === 'Contractors') {
        console.log('Contractors section data:', content); // Debug log
        const parts: string[] = [];
        if (Array.isArray(content)) {
          content.forEach((contractor: any) => {
            if (!contractor) return;
            
            const details = [
              `Company Name: ${contractor.companyName || ''}`,
              `Trade: ${contractor.trade || ''}`,
              `First Name: ${contractor.firstName || ''}`,
              `Last Name: ${contractor.lastName || ''}`,
              `Phone: ${contractor.phone || ''}`,
              `Email: ${contractor.email || ''}`
            ].filter(detail => !detail.endsWith(': '));
            
            if (details.length > 0) {
              parts.push(details.join('\n'));
            }
          });
        }
        const result = parts.join('\n\n') || 'No contractors listed';
        console.log('Formatted contractors result:', result); // Debug log
        return result;
      }

      if (typeof content === 'string') return content;
      
      if (Array.isArray(content)) {
        return content.map(item => {
          if (typeof item === 'string') return item;
          return Object.values(item).join(': ');
        }).join('\n');
      }
      
      return Object.entries(content)
        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => {
          const formattedKey = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
          
          if (Array.isArray(value)) {
            return `${formattedKey}:\n${value.map(item => `  • ${item}`).join('\n')}`;
          }
          if (typeof value === 'object' && value !== null) {
            return `${formattedKey}:\n${Object.entries(value)
              .map(([subKey, subValue]) => {
                const formattedSubKey = subKey
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim();
                return `  ${formattedSubKey}: ${subValue}`;
              })
              .join('\n')}`;
          }
          return `${formattedKey}: ${value}`;
        })
        .join('\n\n');
    };

    for (const section of sections) {
      if (!section.data) {
        console.log(`Skipping section ${section.title} - no data`); // Debug log for skipped sections
        continue;
      }

      // Special handling for Hazards section
      if (section.title === 'Hazards') {
        console.log('Processing Hazards section with data:', section.data);
        
        // Ensure content is treated as an array
        let hazardsArray;
        if (Array.isArray(section.data)) {
          hazardsArray = section.data;
        } else if (section.data && typeof section.data === 'object') {
          hazardsArray = [section.data];
        } else {
          console.log('No valid hazards data found');
          continue;
        }
        
        if (!hazardsArray || hazardsArray.length === 0) {
          console.log('No hazards in array');
          continue;
        }

        // Store the starting Y position
        const startingY = yPos;
        let currentY = startingY;

        // Create tables for each hazard
        hazardsArray.forEach((hazard: any, index: number) => {
          if (!hazard) return;

          // Add extra spacing between hazards
          if (index > 0) {
            currentY += 10;
          }

          // Check if we need a page break before starting this hazard
          if (currentY > doc.internal.pageSize.height - 100) {
            doc.addPage();
            currentY = 15;
          }

          (doc as any).autoTable({
            startY: currentY,
            head: [
              [{
                content: `HAZARD: ${hazard.title}`,
                colSpan: 6,
                styles: {
                  fillColor: '#004EA8',
                  textColor: '#ffffff'
                }
              }]
            ],
            body: [
              [
                {
                  content: 'WHO MIGHT BE HARMED:',
                  colSpan: 2,
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                },
                {
                  content: hazard.whoMightBeHarmed || '',
                  colSpan: 4,
                  styles: {
                    fillColor: '#ffffff'
                  }
                }
              ],
              [
                {
                  content: 'HOW MIGHT THEY BE HARMED:',
                  colSpan: 2,
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                },
                {
                  content: hazard.howMightBeHarmed || '',
                  colSpan: 4,
                  styles: {
                    fillColor: '#ffffff'
                  }
                }
              ],
              [
                {
                  content: 'Risk Calculation (Before Control Measures)',
                  colSpan: 6,
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                }
              ],
              [
                {
                  content: 'LIKELIHOOD',
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                },
                {
                  content: hazard.beforeLikelihood || '',
                  styles: {
                    fillColor: '#ffffff'
                  }
                },
                {
                  content: 'SEVERITY',
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                },
                {
                  content: hazard.beforeSeverity || '',
                  styles: {
                    fillColor: '#ffffff'
                  }
                },
                {
                  content: 'TOTAL RISK',
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                },
                {
                  content: hazard.beforeTotal || '',
                  styles: {
                    fillColor: '#ffffff'
                  }
                }
              ],
              [
                {
                  content: 'Control Measures',
                  colSpan: 6,
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                }
              ],
              ...(hazard.controlMeasures?.map((measure: any) => [
                {
                  content: `• ${measure.description || ''}`,
                  colSpan: 6,
                  styles: {
                    fillColor: '#ffffff'
                  }
                }
              ]) || []),
              [
                {
                  content: 'Risk Calculation (After Control Measures)',
                  colSpan: 6,
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                }
              ],
              [
                {
                  content: 'LIKELIHOOD',
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                },
                {
                  content: hazard.afterLikelihood || '',
                  styles: {
                    fillColor: '#ffffff'
                  }
                },
                {
                  content: 'SEVERITY',
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                },
                {
                  content: hazard.afterSeverity || '',
                  styles: {
                    fillColor: '#ffffff'
                  }
                },
                {
                  content: 'TOTAL RISK',
                  styles: {
                    fontStyle: 'bold',
                    fillColor: '#EDEDED'
                  }
                },
                {
                  content: hazard.afterTotal || '',
                  styles: {
                    fillColor: '#ffffff'
                  }
                }
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
              fontSize: 10,
              cellPadding: 4
            },
            styles: {
              fontSize: 10,
              cellPadding: 4,
              lineWidth: 0.1,
              lineColor: borderColor
            },
            theme: 'grid',
            margin: { left: 15, right: 15 }
          });

          currentY = (doc as any).lastAutoTable.finalY;
        });

        // Update yPos to continue from the last hazard table
        yPos = currentY + 10; // Add a small spacing after the last hazard table
        continue; // Skip the regular table processing
      }

      // Check if any field in the section has data
      const hasData = section.fields.some(field => {
        const value = section.data[field];
        // Special handling for Contractors and Hazards sections since they're arrays
        if (section.title === 'Hazards') {
          return Array.isArray(section.data) && section.data.length > 0;
        }
        if (section.title === 'Contractors' && Array.isArray(section.data)) {
          return section.data.length > 0;
        }
        return value !== null && value !== undefined && 
               ((Array.isArray(value) && value.length > 0) || 
                (typeof value === 'object' && Object.keys(value).length > 0) ||
                (typeof value === 'string' && value.trim() !== '') ||
                (typeof value === 'boolean') ||
                (typeof value === 'number'));
      });

      if (!hasData) {
        console.log(`Skipping section ${section.title} - no valid data`);
        continue;
      }

      console.log(`Processing section: ${section.title}`);

      // Filter out empty fields before formatting
      const filteredData = section.title === 'Hazards' 
        ? section.data
        : section.title === 'Contractors' && Array.isArray(section.data)
        ? section.data
        : Object.fromEntries(
            Object.entries(section.data)
              .filter(([key, value]) => {
                if (!section.fields.includes(key)) return false;
                return value !== null && value !== undefined && 
                       ((Array.isArray(value) && value.length > 0) || 
                        (typeof value === 'object' && Object.keys(value).length > 0) ||
                        (typeof value === 'string' && value.trim() !== '') ||
                        (typeof value === 'boolean') ||
                        (typeof value === 'number'));
              })
          );

      // List of sections that should use the two-column layout
      const twoColumnSections = [
        'Site Information',
        'Project Description',
        'Hours & Team',
        'Management of Work',
        'Site Rules',
        'Arrangements',
        'Site Induction',
        'Welfare Arrangements',
        'First Aid Arrangements',
        'Rescue Plan',
        'Monitoring & Review',
        'Hazard Identification',
        'Notifiable Work',
        'High Risk Construction Work'
      ];

      if (twoColumnSections.includes(section.title)) {
        // Split content into label-value pairs for two-column layout
        const formattedContent = formatContent(filteredData, section.title);
        const rows = formattedContent.split('\n\n').map(pair => {
          // Special handling for Hazard Identification
          if (section.title === 'Hazard Identification') {
            const [title, ...options] = pair.split('\n');
            const optionsList = options.join('\n').trim();
            return [
              { 
                content: title,
                styles: {
                  fontStyle: 'bold',
                  fillColor: '#EDEDED',
                  cellWidth: (doc.internal.pageSize.width - 30) / 2,
                  cellPadding: 3
                }
              },
              {
                content: optionsList,
                styles: {
                  fillColor: '#ffffff',
                  cellWidth: (doc.internal.pageSize.width - 30) / 2,
                  cellPadding: 3
                }
              }
            ];
          }
          
          // Special handling for sections with bullet points
          if (section.title === 'Hours & Team' && pair.includes('Who are the key team members?')) {
            const [label, ...members] = pair.split('\n');
            const membersList = members.join('\n').trim();
            return [
              { 
                content: 'Who are the key team members?',
                styles: {
                  fontStyle: 'bold',
                  fillColor: '#EDEDED',
                  cellWidth: (doc.internal.pageSize.width - 30) / 2,
                  cellPadding: 3
                }
              },
              {
                content: membersList,
                styles: {
                  fillColor: '#ffffff',
                  cellWidth: (doc.internal.pageSize.width - 30) / 2,
                  cellPadding: 3
                }
              }
            ];
          }
          
          // Special handling for Site Rules PPE Requirements
          if (section.title === 'Site Rules' && pair.includes('PPE Requirements:')) {
            const [label, ...items] = pair.split('\n');
            const itemsList = items.join('\n').trim();
            return [
              { 
                content: 'PPE Requirements:',
                styles: {
                  fontStyle: 'bold',
                  fillColor: '#EDEDED',
                  cellWidth: (doc.internal.pageSize.width - 30) / 2,
                  cellPadding: 3
                }
              },
              {
                content: itemsList,
                styles: {
                  fillColor: '#ffffff',
                  cellWidth: (doc.internal.pageSize.width - 30) / 2,
                  cellPadding: 3
                }
              }
            ];
          }

          // Special handling for Site Rules Additional/General Rules
          if (section.title === 'Site Rules' && pair.includes('Additional/General Rules:')) {
            const [label, ...items] = pair.split('\n');
            const itemsList = items.join('\n').trim();
            return [
              { 
                content: 'Additional/General Rules:',
                styles: {
                  fontStyle: 'bold',
                  fillColor: '#EDEDED',
                  cellWidth: (doc.internal.pageSize.width - 30) / 2,
                  cellPadding: 3
                }
              },
              {
                content: itemsList,
                styles: {
                  fillColor: '#ffffff',
                  cellWidth: (doc.internal.pageSize.width - 30) / 2,
                  cellPadding: 3
                }
              }
            ];
          }

          // Special handling for Welfare Arrangements
          if (section.title === 'Welfare Arrangements' && pair.includes('Selected Welfare Arrangements:')) {
            const [label, ...items] = pair.split('\n');
            return [
              { 
                content: label,
                styles: {
                  fontStyle: 'bold',
                  fillColor: '#EDEDED',
                  cellWidth: (doc.internal.pageSize.width - 30) / 2,
                  cellPadding: 3
                }
              },
              {
                content: items.join('\n'),
                styles: {
                  fillColor: '#ffffff',
                  cellWidth: (doc.internal.pageSize.width - 30) / 2,
                  cellPadding: 3
                }
              }
            ];
          }

          // Special handling for Notifiable Work
          if (section.title === 'Notifiable Work' && pair.includes('Select the Notifiable Work')) {
            const [label, ...items] = pair.split('\n');
            const itemsList = items.join('\n').trim();
            return [
              { 
                content: 'Select the Notifiable Work that will take place on your site:',
                styles: {
                  fontStyle: 'bold',
                  fillColor: '#EDEDED',
                  cellWidth: (doc.internal.pageSize.width - 30) / 2,
                  cellPadding: 3
                }
              },
              {
                content: itemsList,
                styles: {
                  fillColor: '#ffffff',
                  cellWidth: (doc.internal.pageSize.width - 30) / 2,
                  cellPadding: 3
                }
              }
            ];
          }

          // Special handling for High Risk Construction Work
          if (section.title === 'High Risk Construction Work' && pair.includes('|')) {
            const [label, items] = pair.split('|');
            return [
              { 
                content: label,
                styles: {
                  fontStyle: 'bold',
                  fillColor: '#EDEDED',
                  cellWidth: (doc.internal.pageSize.width - 30) / 2,
                  cellPadding: 3
                }
              },
              {
                content: items,
                styles: {
                  fillColor: '#ffffff',
                  cellWidth: (doc.internal.pageSize.width - 30) / 2,
                  cellPadding: 3
                }
              }
            ];
          }

          // Default handling for other content
          const [label, ...valueParts] = pair.split('\n');
          return [
            { 
              content: label,
              styles: {
                fontStyle: 'bold',
                fillColor: '#EDEDED',
                cellWidth: (doc.internal.pageSize.width - 30) / 2,
                cellPadding: 3
              }
            },
            {
              content: valueParts.join('\n'),
              styles: {
                fillColor: '#ffffff',
                cellWidth: (doc.internal.pageSize.width - 30) / 2,
                cellPadding: 3
              }
            }
          ];
        });

        (doc as any).autoTable({
          startY: yPos,
          head: [[{ 
            content: section.title,
            colSpan: 2,
            styles: { 
              fillColor: headerColor,
              textColor: '#000000',
              halign: 'left',
              fontStyle: 'bold',
              cellPadding: 3,
              fontSize: 12
            }
          }]],
          body: rows,
          styles: {
            fontSize: 10,
            lineWidth: 0.1,
            lineColor: borderColor,
            overflow: 'linebreak',
            cellPadding: 3
          },
          theme: 'grid',
          margin: { left: 15, right: 15 }
        });
      } else {
        // Use original single-column layout for other sections
        (doc as any).autoTable({
          startY: yPos,
          head: [[{ 
            content: section.title,
            styles: { 
              fillColor: headerColor,
              textColor: '#000000',
              halign: 'left',
              fontStyle: 'bold',
              cellPadding: 3,
              fontSize: 12
            }
          }]],
          body: [[{ 
            content: formatContent(filteredData, section.title),
            styles: { 
              fillColor: cellBackgroundColor,
              cellPadding: 3,
              lineHeight: 1.5,
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
      }

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