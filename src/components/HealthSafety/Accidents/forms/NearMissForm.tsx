import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface NearMissFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const BASIC_CAUSES = [
  'Asphyxiation',
  'Collision',
  'Contact with electricity',
  'Contact with flying particles',
  'Contact with tool/equipment/machinery',
  'Contact with/exposed to air/water pressure',
  'Contact with/exposed to hazardous substance',
  'Contact with/exposed to heat/acid',
  'Drowning',
  'Explosion',
  'Exposure to noise/vibration',
  'Fall down stairs/steps',
  'Fall from height',
  'Fall on the same level',
  'Fire',
  'Loss of containment/unintentional release',
  'Manual Handling',
  'Repetitive motion/action',
  'Step on/struck against stationary object',
  'Struck by falling object',
  'Struck by moving object',
  'Struck or trapped by something collapsing/overturning',
  'Trapped between objects',
];

const HAZARD_SOURCES = [
  'Cold',
  'Dust',
  'Excavation',
  'Floor/ground condition',
  'Flying particle',
  'Hand tool',
  'Hazardous substance',
  'Heat/hot work',
  'Lack of oxygen',
  'Ladder',
  'Lifting equipment',
  'Materials',
  'Moving parts of machinery',
  'Power tool',
  'Proximity to water',
  'Scaffold',
  'Stairs/steps',
  'Static equipment/machinery',
  'Structure',
  'Temporary works',
  'Vehicle/mobile equipment',
  'Working surface',
  'Workstation layout',
];

const ROOT_CAUSES = {
  workEnvironment: [
    'Access/Egress',
    'Defective workplace',
    'Design/Layout',
    'Housekeeping',
    'Lack of room',
    'Lighting',
    'Noise/distraction',
    'Weather',
  ],
  humanFactors: [
    'Error of judgement',
    'Failure to adhere to the RAs',
    'Failure to follow rules',
    'Fatigue',
    'Horseplay',
    'Instructions misunderstood',
    'Lack of experience',
    'Lapse in concentration',
    'Undue haste',
    'Unsafe attitude',
    'Working without authorisation',
  ],
  ppe: [
    'Design',
    'Maintenance/defective',
    'Not provided/unavailable',
    'Not used',
    'Work type',
  ],
  management: [
    'RAMS not communicated',
    'Supervision',
    'System Failure',
    'Training',
  ],
  plantEquipment: [
    'Construction/design',
    'Installation',
    'Maintenance',
    'Mechanical failure',
    'Operation/use',
    'Safety device',
  ],
};

export function NearMissForm({ onClose, onSubmit }: NearMissFormProps) {
  const [formData, setFormData] = useState({
    reportId: `NM-${Date.now()}`,
    location: '',
    incident_location: '',
    incident_date: '',
    photosTaken: false,
    photos: [] as File[],
    description: '',
    basic_cause: '',
    hazard_source: '',
    root_causes: {
      workEnvironment: [] as string[],
      humanFactors: [] as string[],
      ppe: [] as string[],
      management: [] as string[],
      plantEquipment: [] as string[],
    },
    immediate_actions: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos],
      }));
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleBasicCauseSelect = (cause: string) => {
    setFormData((prev) => ({
      ...prev,
      basic_cause: prev.basic_cause === cause ? '' : cause,
    }));
  };

  const handleHazardSourceSelect = (source: string) => {
    setFormData((prev) => ({
      ...prev,
      hazard_source: prev.hazard_source === source ? '' : source,
    }));
  };

  const handleRootCauseToggle = (
    category: keyof typeof ROOT_CAUSES,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      root_causes: {
        ...prev.root_causes,
        [category]: prev.root_causes[category].includes(value)
          ? prev.root_causes[category].filter((item) => item !== value)
          : [...prev.root_causes[category], value],
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const validateForm = () => {
    if (currentStep === 1) {
      if (!formData.location) return 'Location is required';
      if (!formData.incident_location) return 'Incident location is required';
      if (!formData.incident_date) return 'Date is required';
    } else if (currentStep === 2) {
      if (!formData.description) return 'Description is required';
    } else if (currentStep === 3) {
      if (!formData.basic_cause) return 'Basic cause is required';
      if (!formData.hazard_source) return 'Hazard source is required';
    } else if (currentStep === 4) {
      if (!formData.immediate_actions) return 'Immediate actions are required';
    }
    return null;
  };

  const nextStep = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const previousStep = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                In these circumstances, luck or emergency intervention prevented
                the incident from resulting in personal injury. If the incident
                does not fall under any of the categories of Dangerous
                Occurrences then it is not classified as RIDDOR Reportable.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report ID
              </label>
              <input
                type="text"
                value={formData.reportId}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Location
              </label>
              <textarea
                id="location"
                name="location"
                rows={3}
                required
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="incident_location"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Where did the incident occur?
              </label>
              <input
                type="text"
                id="incident_location"
                name="incident_location"
                required
                value={formData.incident_location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="incident_date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Incident Date
              </label>
              <input
                type="date"
                id="incident_date"
                name="incident_date"
                value={formData.incident_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="photosTaken"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Were photographs taken?
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, photosTaken: true }))
                  }
                  className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    formData.photosTaken
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, photosTaken: false }))
                  }
                  className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    !formData.photosTaken
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  No
                </button>
              </div>

              {formData.photosTaken && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Photos
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                  />
                  {formData.photos.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 p-1 bg-red-100 rounded-full text-red-600 hover:bg-red-200"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Describe what happened and how
              </label>
              <p className="text-sm text-gray-500 mb-2">
                In the case of an injury, state what the injured person was
                doing at the time and side of the body (left or right). (Where
                possible, take photographs of the general area but not of the
                injured persons.) In the case of an environmental incident,
                state the events that caused the incident (details of plant
                involved, photographs, wherever practicable, must be taken). In
                the case of damage, indicate if the damage is to permanent
                works, temporary works, plant, temporary buildings/contents, and
                employee's permanent effects. (Take photographs)
              </p>
              <textarea
                id="description"
                name="description"
                rows={6}
                required
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">
              Health & Safety - Details of Incident
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Basic cause of incident
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {BASIC_CAUSES.map((cause) => (
                  <button
                    key={cause}
                    type="button"
                    onClick={() => handleBasicCauseSelect(cause)}
                    className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      formData.basic_cause === cause
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cause}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source of hazard
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {HAZARD_SOURCES.map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => handleHazardSourceSelect(source)}
                    className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      formData.hazard_source === source
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Root Causes</h3>

            {Object.entries(ROOT_CAUSES).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-md font-medium text-gray-700 mb-2 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        handleRootCauseToggle(
                          category as keyof typeof ROOT_CAUSES,
                          item
                        )
                      }
                      className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        formData.root_causes[
                          category as keyof typeof ROOT_CAUSES
                        ].includes(item)
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label
                htmlFor="immediate_actions"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                What immediate actions have been taken to prevent a similar
                incident?
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Please outline below what has been done to prevent a similar
                incident from recurring in the future. Note. The details enter
                here are not designed to replace the detailed actions and
                recommendations arising out of a through incident investigation,
                but to indicate to interested parties what interim measures have
                been put in place, whilst such investigations are ongoing. In
                some circumstances, the information entered here may be
                sufficient to close out the report in full, such as near miss,
                minor accidents etc.
              </p>
              <textarea
                id="immediate_actions"
                name="immediate_actions"
                rows={6}
                required
                value={formData.immediate_actions}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Near Miss Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`w-1/4 h-2 rounded-full mx-1 ${
                    index + 1 <= currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="text-right text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {renderStep()}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-md">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={previousStep}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
              >
                Cancel
              </button>
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Submit Report
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
