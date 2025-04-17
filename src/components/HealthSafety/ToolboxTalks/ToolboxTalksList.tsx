import React, { useState } from 'react';
import { ArrowRight, Plus, Search } from 'lucide-react';
import { ToolboxTalkForm } from './ToolboxTalkForm';
import { CompletedTalksList } from './CompletedTalksList';

interface ToolboxTalksListProps {
  onBack: () => void;
}

const TOOLBOX_TALKS = [
  { id: 'TBT34', title: 'Alcohol & Drugs - Use & Misuse' },
  { id: 'TBT33', title: 'Asbestos' },
  { id: 'TBT39', title: 'Asthma' },
  { id: 'TBT35', title: 'Behavioural Safety' },
  { id: 'TBT04', title: 'Bodily Fluids & Needlestick Injuries' },
  { id: 'TBT40', title: 'Buried Services' },
  { id: 'TBT01', title: 'Cartridge Hammer or Rivet Guns' },
  { id: 'TBT41', title: 'Cement and Concrete' },
  { id: 'TBT02', title: 'Compressed Gas Cylinders' },
  { id: 'TBT03', title: 'Confined Spaces' },
  { id: 'TBT23', title: 'Construction Scaffold Safety' },
  { id: 'TBT88', title: 'Control of Dust and Fumes' },
  {
    id: 'TBT90',
    title: 'Dangerous Substances & Explosive Atmospheres (DSEAR) Awareness',
  },
  { id: 'TBT05', title: 'Demolition' },
  { id: 'TBT06', title: 'Dermatitis' },
  { id: 'TBT42', title: 'Diabetes' },
  { id: 'TBT43', title: 'Driving Safely' },
  { id: 'TBT44', title: 'Electricity' },
  { id: 'TBT45', title: 'Epilepsy' },
  { id: 'TBT07', title: 'Excavations' },
  { id: 'TBT08', title: 'Eye Protection' },
  { id: 'TBT46', title: 'Fall Arrest and Suspension Equipment' },
  { id: 'TBT09', title: 'Falling Materials' },
  { id: 'TBT10', title: 'Fire Precautions' },
  { id: 'TBT47', title: 'First Aid' },
  { id: 'TBT11', title: 'Foot Protection' },
  { id: 'TBT91', title: 'General Housekeeping on Site' },
  { id: 'TBT48', title: 'Hand Protection' },
  { id: 'TBT49', title: 'Hazardous Substances' },
  { id: 'TBT12', title: 'Head Protection' },
  { id: 'TBT50', title: 'Health on Site' },
  { id: 'TBT51', title: 'Hearing Protection' },
  { id: 'TBT13', title: 'High Visibility Clothing' },
  { id: 'TBT52', title: 'Histoplasmosis, Cryptococcosis & Psittacosis' },
  { id: 'TBT36', title: 'Hoodies & Beanies under Safety Helmets' },
  { id: 'TBT14', title: 'Lifting Equipment' },
  { id: 'TBT53', title: 'Lifting Operations' },
  { id: 'TBT15', title: 'Lifting Tackle' },
  { id: 'TBT92', title: 'Lone Working in Construction' },
  { id: 'TBT16', title: 'Manual Handling' },
  { id: 'TBT54', title: 'Mental Health, Stress & Anger' },
  { id: 'TBT55', title: 'Mobile Elevating Work Platforms' },
  { id: 'TBT56', title: 'Mobile Plant' },
  { id: 'TBT57', title: 'Mobile Towers & Podium Steps' },
  { id: 'TBT58', title: 'Opening in Floors' },
  { id: 'TBT59', title: 'Overhead Lines' },
  { id: 'TBT17', title: 'Permit to Work System' },
  { id: 'TBT60', title: 'Personal Protective Equipment' },
  { id: 'TBT18', title: 'Personal Safety' },
  { id: 'TBT19', title: 'Portable Electrical Appliances' },
  { id: 'TBT61', title: 'Preventing Arson' },
  { id: 'TBT62', title: 'Protecting the Public from Construction Activities' },
  { id: 'TBT63', title: 'Protecting the Public in Property Maintenance' },
  { id: 'TBT64', title: 'Respiratory Protection' },
  { id: 'TBT65', title: 'Risk Assessments & Method Statements' },
  { id: 'TBT66', title: 'Road & Streetworks' },
  { id: 'TBT20', title: 'Roof Work' },
  { id: 'TBT21', title: 'Safe Stacking of Materials' },
  { id: 'TBT89', title: 'Safe Use of Bench Saws' },
  { id: 'TBT22', title: 'Safe Use of Chemicals' },
  { id: 'TBT67', title: 'Safe Use of Crushers' },
  { id: 'TBT68', title: 'Safe Use of Harnesses' },
  { id: 'TBT69', title: 'Safe Use of Hop Ups & Trestles' },
  { id: 'TBT70', title: 'Safe Use of Ladders & Step Ladders' },
  { id: 'TBT71', title: 'Safe Use of Podiums' },
  { id: 'TBT72', title: 'Site Dumpers' },
  { id: 'TBT25', title: 'Site Welfare' },
  { id: 'TBT26', title: 'Slips Trips & Falls' },
  { id: 'TBT73', title: 'Smoking in the Workplace' },
  { id: 'TBT74', title: 'Steelwork' },
  { id: 'TBT75', title: 'Sun Protection' },
  { id: 'TBT76', title: 'Tipping Lorries' },
  { id: 'TBT77', title: 'Traffic Management' },
  { id: 'TBT24', title: 'Transport Safety' },
  { id: 'TBT78', title: 'Use of Cut-Off Saws' },
  { id: 'TBT79', title: 'Use of Forklift Trucks' },
  { id: 'TBT80', title: 'Use of Hand Tools' },
  { id: 'TBT27', title: 'Use of Hand Tools including Power Tools' },
  { id: 'TBT81', title: 'Use of Material Storage' },
  { id: 'TBT82', title: 'Use of Spill Kits' },
  { id: 'TBT28', title: 'Vibration' },
  { id: 'TBT29', title: "Weil's Disease" },
  { id: 'TBT30', title: 'Welding & Hot Work' },
  { id: 'TBT38', title: 'Wood Dust' },
  { id: 'TBT83', title: 'Woodworking Machinery' },
  { id: 'TBT31', title: 'Working at Height' },
  { id: 'TBT84', title: 'Working Near Mobile Plant' },
  { id: 'TBT32', title: 'Working Outdoors' },
  { id: 'TBT85', title: 'Working Over or Near Water' },
  { id: 'TBT86', title: 'Working with Lead' },
  { id: 'TBT87', title: 'Working with Wet Cement' },
];

export function ToolboxTalksList({ onBack }: ToolboxTalksListProps) {
  const [showTalkModal, setShowTalkModal] = useState(false);
  const [showCompletedTalks, setShowCompletedTalks] = useState(false);
  const [selectedTalk, setSelectedTalk] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTalkClick = (talk: { id: string; title: string }) => {
    setSelectedTalk(talk);
    setShowTalkModal(true);
  };

  const filteredTalks = TOOLBOX_TALKS.filter((talk) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      talk.id.toLowerCase().includes(searchLower) ||
      talk.title.toLowerCase().includes(searchLower)
    );
  });

  if (showCompletedTalks) {
    return <CompletedTalksList onBack={() => setShowCompletedTalks(false)} />;
  }

  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
      >
        <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
        Back to Toolbox Talks
      </button>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Toolbox Talks
          </h2>

          {/* Search Box */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or ID..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredTalks.map((talk) => (
              <button
                key={talk.id}
                onClick={() => handleTalkClick(talk)}
                className="text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150 ease-in-out"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {talk.title}
                    </h3>
                    <p className="text-sm text-gray-500">{talk.id}</p>
                  </div>
                  <Plus className="h-5 w-5 text-gray-400" />
                </div>
              </button>
            ))}

            {filteredTalks.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  No toolbox talks found matching your search
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showTalkModal && selectedTalk && (
        <ToolboxTalkForm
          talk={selectedTalk}
          onClose={() => {
            setShowTalkModal(false);
            setSelectedTalk(null);
          }}
          onNavigateToCompletedTalks={() => setShowCompletedTalks(true)}
        />
      )}
    </>
  );
}
