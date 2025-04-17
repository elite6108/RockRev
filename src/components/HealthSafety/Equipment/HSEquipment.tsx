import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  ArrowRight,
  PenTool as Tool,
  ClipboardCheck,
  Bell,
  AlertCircle,
} from 'lucide-react';
import { HSEquipmentList } from './HSEquipmentList';
import { HSEquipmentChecklists } from './HSEquipmentChecklists';
import type { Equipment, EquipmentChecklist } from '../../../types/database';

interface Reminder {
  type: 'equipment' | 'checklist';
  title: string;
  date: Date;
  description: string;
  severity: 'warning' | 'danger';
}

export function HSEquipment({ onBack }: { onBack: () => void }) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [checklists, setChecklists] = useState<EquipmentChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEquipmentList, setShowEquipmentList] = useState(false);
  const [showChecklists, setShowChecklists] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Update reminders whenever equipment or checklists change
    setReminders(getReminders());
  }, [equipment, checklists]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [equipmentResponse, checklistsResponse] = await Promise.all([
        supabase
          .from('equipment')
          .select('*')
          .order('name', { ascending: true }),
        supabase
          .from('equipment_checklists')
          .select('*')
          .order('check_date', { ascending: false }),
      ]);

      if (equipmentResponse.error) throw equipmentResponse.error;
      if (checklistsResponse.error) throw checklistsResponse.error;

      setEquipment(equipmentResponse.data || []);
      setChecklists(checklistsResponse.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while fetching data'
      );
    } finally {
      setLoading(false);
    }
  };

  const getReminders = (): Reminder[] => {
    const today = new Date();
    const reminders: Reminder[] = [];

    // Equipment calibration/service reminders
    equipment.forEach((item) => {
      const dates = [
        { name: 'Calibration', date: item.calibration_date },
        { name: 'Service', date: item.service_date },
      ];

      dates.forEach(({ name, date }) => {
        if (date) {
          const expiryDate = new Date(date);
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 30 || diffDays < 0) {
            reminders.push({
              type: 'equipment',
              title: item.name,
              date: expiryDate,
              description:
                diffDays < 0
                  ? `${name} expired - ${expiryDate.toLocaleDateString()}`
                  : `${name} due in ${diffDays} days`,
              severity: diffDays <= 7 ? 'danger' : 'warning',
            });
          }
        }
      });

      // Check for checklist reminders
      const latestChecklist = checklists
        .filter((c) => c.equipment_id === item.id)
        .sort(
          (a, b) =>
            new Date(b.check_date).getTime() - new Date(a.check_date).getTime()
        )[0];

      if (latestChecklist) {
        const lastCheckDate = new Date(latestChecklist.check_date);
        let nextCheckDate = new Date(lastCheckDate);

        // Calculate next check date based on frequency
        switch (latestChecklist.frequency) {
          case 'daily':
            nextCheckDate.setDate(lastCheckDate.getDate() + 1);
            break;
          case 'weekly':
            nextCheckDate.setDate(lastCheckDate.getDate() + 7);
            break;
          case 'monthly':
            nextCheckDate.setMonth(lastCheckDate.getMonth() + 1);
            break;
        }

        const diffTime = nextCheckDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7 || diffDays < 0) {
          reminders.push({
            type: 'checklist',
            title: item.name,
            date: nextCheckDate,
            description:
              diffDays < 0
                ? `${latestChecklist.frequency} checklist overdue by ${Math.abs(
                    diffDays
                  )} days`
                : `${latestChecklist.frequency} checklist due in ${diffDays} days`,
            severity: diffDays < 0 ? 'danger' : 'warning',
          });
        }
      } else {
        // No checklist exists for this equipment
        reminders.push({
          type: 'checklist',
          title: item.name,
          date: today,
          description: 'No checklist records found',
          severity: 'danger',
        });
      }
    });

    // Sort reminders by date
    return reminders.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  if (showEquipmentList) {
    return (
      <HSEquipmentList
        onBack={() => {
          setShowEquipmentList(false);
          fetchData();
        }}
      />
    );
  }

  if (showChecklists) {
    return (
      <HSEquipmentChecklists
        onBack={() => {
          setShowChecklists(false);
          fetchData();
        }}
      />
    );
  }

  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
      >
        <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
        Back to Dashboard
      </button>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => setShowEquipmentList(true)}
            className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Tool className="h-6 w-6 text-gray-400" />
                  <div className="ml-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Equipment
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {equipment.length}
                      </dd>
                    </dl>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowChecklists(true)}
            className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ClipboardCheck className="h-6 w-6 text-gray-400" />
                  <div className="ml-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Checklists
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        View
                      </dd>
                    </dl>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </button>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <Bell className="h-6 w-6 text-gray-400" />
                <div className="ml-5">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Reminders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {reminders.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {reminders.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Upcoming Reminders
              </h3>
              <div className="space-y-4">
                {reminders.map((reminder, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      reminder.severity === 'danger'
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : 'bg-orange-50 dark:bg-orange-900/20'
                    }`}
                  >
                    <div>
                      <p
                        className={`font-medium ${
                          reminder.severity === 'danger'
                            ? 'text-red-800 dark:text-red-200'
                            : 'text-orange-800 dark:text-orange-200'
                        }`}
                      >
                        {reminder.title}
                      </p>
                      <p
                        className={`text-sm ${
                          reminder.severity === 'danger'
                            ? 'text-red-600 dark:text-red-300'
                            : 'text-orange-600 dark:text-orange-300'
                        }`}
                      >
                        {reminder.description}
                      </p>
                    </div>
                    {reminder.severity === 'danger' ? (
                      <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                    ) : (
                      <Bell className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
