import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface WorkingMethodItem {
  id: string;
  number: number;
  description: string;
}

interface WorkingMethodScreenProps {
  data: {
    workingMethods: WorkingMethodItem[];
  };
  onChange: (data: Partial<typeof WorkingMethodScreenProps.prototype.data>) => void;
}

export function WorkingMethodScreen({ data, onChange }: WorkingMethodScreenProps) {
  const addMethod = () => {
    const newItem: WorkingMethodItem = {
      id: crypto.randomUUID(),
      number: data.workingMethods.length + 1,
      description: ''
    };

    onChange({
      workingMethods: [...data.workingMethods, newItem]
    });
  };

  const updateMethod = (id: string, description: string) => {
    onChange({
      workingMethods: data.workingMethods.map(method =>
        method.id === id ? { ...method, description } : method
      )
    });
  };

  const removeMethod = (id: string) => {
    onChange({
      workingMethods: data.workingMethods
        .filter(method => method.id !== id)
        .map((method, index) => ({ ...method, number: index + 1 }))
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h3 className="text-lg font-medium text-gray-900">Working Methods</h3>
        <button
          type="button"
          onClick={addMethod}
          className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Method
        </button>
      </div>

      <div className="max-h-[300px] overflow-y-auto pr-2">
        <div className="space-y-4">
          {data.workingMethods.map((method) => (
            <div key={method.id} className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                <span className="text-sm font-medium text-gray-900">#{method.number}</span>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={method.description}
                  onChange={(e) => updateMethod(method.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter working method description"
                />
              </div>
              <button
                type="button"
                onClick={() => removeMethod(method.id)}
                className="text-red-600 hover:text-red-900"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}

          {data.workingMethods.length === 0 && (
            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
              Click "Add Method" to start adding working methods
            </div>
          )}
        </div>
      </div>
    </div>
  );
}