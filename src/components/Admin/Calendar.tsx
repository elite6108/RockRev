import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';

// Zoho Calendar API Configuration
const ZOHO_CONFIG = {
  clientId: '1000.SZS5EZNISPE47DXV10AEFEVBW6LPHN',
  clientSecret: 'b508ffe0a03956496840b4b594e63f2e339360b0fc',
  calendarId: '084f8152b4a5428197f4431dcd1937ca',
  redirectUri: 'https://onpointgroundworks.netlify.app/callback',
  refreshToken: localStorage.getItem('zoho_refresh_token') || ''
};

// OAuth endpoints
const ZOHO_AUTH_URL = 'https://accounts.zoho.eu/oauth/v2/auth';
const ZOHO_CALENDAR_API = 'https://calendar.zoho.eu/api/v1';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  attendees?: string[];
}

interface CalendarProps {
  onBack: () => void;
}

export function Calendar({ onBack }: CalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!ZOHO_CONFIG.refreshToken);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    start: '',
    end: '',
    description: '',
    location: '',
    attendees: []
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
    }
  }, [isAuthenticated]);

  const initiateOAuth = () => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: ZOHO_CONFIG.clientId,
      redirect_uri: ZOHO_CONFIG.redirectUri,
      scope: 'ZohoCalendar.calendar.ALL',
      access_type: 'offline',
      prompt: 'consent'
    });

    window.location.href = `${ZOHO_AUTH_URL}?${params.toString()}`;
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${ZOHO_CALENDAR_API}/calendars/${ZOHO_CONFIG.calendarId}/events`, {
        headers: {
          'Authorization': `Bearer ${ZOHO_CONFIG.refreshToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${ZOHO_CALENDAR_API}/calendars/${ZOHO_CONFIG.calendarId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ZOHO_CONFIG.refreshToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEvent)
      });

      if (!response.ok) {
        throw new Error('Failed to add event');
      }

      setShowAddForm(false);
      setNewEvent({
        title: '',
        start: '',
        end: '',
        description: '',
        location: '',
        attendees: []
      });
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add event');
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Calendar</h2>
          {isAuthenticated ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Event
            </button>
          ) : (
            <button
              onClick={initiateOAuth}
              className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Connect to Zoho Calendar
            </button>
          )}
        </div>

        {!isAuthenticated ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Please connect your Zoho Calendar to view and manage events</p>
            <button
              onClick={initiateOAuth}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Connect to Zoho Calendar
            </button>
          </div>
        ) : (
          <>
            {showAddForm && (
              <div className="mb-6 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Add New Event</h3>
                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start</label>
                      <input
                        type="datetime-local"
                        value={newEvent.start}
                        onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End</label>
                      <input
                        type="datetime-local"
                        value={newEvent.end}
                        onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                      type="text"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Add Event
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading && <div className="text-gray-600">Loading events...</div>}
            {error && <div className="text-red-600 mb-4">{error}</div>}
            
            {!loading && !error && (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600">
                      Start: {new Date(event.start).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      End: {new Date(event.end).toLocaleString()}
                    </p>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                    )}
                    {event.location && (
                      <p className="text-sm text-gray-600">Location: {event.location}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
