import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface HazardItem {
  id: string;
  title: string;
  whoMightBeHarmed: string;
  howMightBeHarmed: string;
  beforeLikelihood: number;
  beforeSeverity: number;
  beforeTotal: number;
  controlMeasures: { id: string; description: string }[];
  afterLikelihood: number;
  afterSeverity: number;
  afterTotal: number;
}

interface HazardsScreenProps {
  data: {
    hazards: HazardItem[];
  };
  onChange: (data: Partial<typeof HazardsScreenProps.prototype.data>) => void;
}

export function HazardsScreen({ data, onChange }: HazardsScreenProps) {
  const addHazard = () => {
    const newHazard: HazardItem = {
      id: crypto.randomUUID(),
      title: '',
      whoMightBeHarmed: '',
      howMightBeHarmed: '',
      beforeLikelihood: 1,
      beforeSeverity: 1,
      beforeTotal: 1,
      controlMeasures: [],
      afterLikelihood: 1,
      afterSeverity: 1,
      afterTotal: 1
    };

    onChange({
      hazards: [...data.hazards, newHazard]
    });
  };

  const updateHazard = (id: string, updates: Partial<HazardItem>) => {
    onChange({
      hazards: data.hazards.map(hazard =>
        hazard.id === id
          ? {
              ...hazard,
              ...updates,
              beforeTotal: updates.beforeLikelihood !== undefined || updates.beforeSeverity !== undefined
                ? (updates.beforeLikelihood || hazard.beforeLikelihood) * (updates.beforeSeverity || hazard.beforeSeverity)
                : hazard.beforeTotal,
              afterTotal: updates.afterLikelihood !== undefined || updates.afterSeverity !== undefined
                ? (updates.afterLikelihood || hazard.afterLikelihood) * (updates.afterSeverity || hazard.afterSeverity)
                : hazard.afterTotal
            }
          : hazard
      )
    });
  };

  const removeHazard = (id: string) => {
    onChange({
      hazards: data.hazards.filter(hazard => hazard.id !== id)
    });
  };

  const addControlMeasure = (hazardId: string) => {
    onChange({
      hazards: data.hazards.map(hazard =>
        hazard.id === hazardId
          ? {
              ...hazard,
              controlMeasures: [
                ...hazard.controlMeasures,
                { id: crypto.randomUUID(), description: '' }
              ]
            }
          : hazard
      )
    });
  };

  const updateControlMeasure = (hazardId: string, measureId: string, description: string) => {
    onChange({
      hazards: data.hazards.map(hazard =>
        hazard.id === hazardId
          ? {
              ...hazard,
              controlMeasures: hazard.controlMeasures.map(measure =>
                measure.id === measureId
                  ? { ...measure, description }
                  : measure
              )
            }
          : hazard
      )
    });
  };

  const removeControlMeasure = (hazardId: string, measureId: string) => {
    onChange({
      hazards: data.hazards.map(hazard =>
        hazard.id === hazardId
          ? {
              ...hazard,
              controlMeasures: hazard.controlMeasures.filter(measure => measure.id !== measureId)
            }
          : hazard
      )
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h3 className="text-lg font-medium text-gray-900">Hazards</h3>
        <button
          type="button"
          onClick={addHazard}
          className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Hazard
        </button>
      </div>

      <div className="max-h-[calc(100vh-16rem)] overflow-y-auto pr-2">
        <div className="space-y-8">
          {data.hazards.map((hazard) => (
            <div key={hazard.id} className="bg-gray-50 p-6 rounded-lg space-y-6">
              <div className="flex justify-between">
                <h4 className="text-lg font-medium text-gray-900">Hazard Details</h4>
                <button
                  type="button"
                  onClick={() => removeHazard(hazard.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hazard Title
                  </label>
                  <input
                    type="text"
                    value={hazard.title}
                    onChange={(e) => updateHazard(hazard.id, { title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Who Might Be Harmed
                  </label>
                  <input
                    type="text"
                    value={hazard.whoMightBeHarmed}
                    onChange={(e) => updateHazard(hazard.id, { whoMightBeHarmed: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How Might They Be Harmed
                  </label>
                  <textarea
                    value={hazard.howMightBeHarmed}
                    onChange={(e) => updateHazard(hazard.id, { howMightBeHarmed: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Risk Calculation (Before Control Measures)
                  </h5>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-full sm:w-auto flex flex-col gap-1">
                      <label className="block text-xs text-gray-500">Likelihood</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={hazard.beforeLikelihood}
                        onChange={(e) => updateHazard(hazard.id, { beforeLikelihood: parseInt(e.target.value) })}
                        className="w-full sm:w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="w-full sm:w-auto flex flex-col gap-1">
                      <label className="block text-xs text-gray-500">Severity</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={hazard.beforeSeverity}
                        onChange={(e) => updateHazard(hazard.id, { beforeSeverity: parseInt(e.target.value) })}
                        className="w-full sm:w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="w-full sm:w-auto flex flex-col gap-1">
                      <label className="block text-xs text-gray-500">Total Risk</label>
                      <input
                        type="number"
                        value={hazard.beforeTotal}
                        disabled
                        className="w-full sm:w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-sm font-medium text-gray-700">Control Measures</h5>
                    <button
                      type="button"
                      onClick={() => addControlMeasure(hazard.id)}
                      className="inline-flex items-center px-2 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Measure
                    </button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto pr-2">
                    <div className="space-y-2">
                      {hazard.controlMeasures.map((measure) => (
                        <div key={measure.id} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={measure.description}
                            onChange={(e) => updateControlMeasure(hazard.id, measure.id, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter control measure"
                          />
                          <button
                            type="button"
                            onClick={() => removeControlMeasure(hazard.id, measure.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Risk Calculation (After Control Measures)
                  </h5>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-full sm:w-auto flex flex-col gap-1">
                      <label className="block text-xs text-gray-500">Likelihood</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={hazard.afterLikelihood}
                        onChange={(e) => updateHazard(hazard.id, { afterLikelihood: parseInt(e.target.value) })}
                        className="w-full sm:w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="w-full sm:w-auto flex flex-col gap-1">
                      <label className="block text-xs text-gray-500">Severity</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={hazard.afterSeverity}
                        onChange={(e) => updateHazard(hazard.id, { afterSeverity: parseInt(e.target.value) })}
                        className="w-full sm:w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="w-full sm:w-auto flex flex-col gap-1">
                      <label className="block text-xs text-gray-500">Total Risk</label>
                      <input
                        type="number"
                        value={hazard.afterTotal}
                        disabled
                        className="w-full sm:w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {data.hazards.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Click "Add Hazard" to start adding hazards</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}