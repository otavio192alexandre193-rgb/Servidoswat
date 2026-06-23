import { getAccessToken } from './google-auth';

interface CalendarEventParams {
  title: string;
  description: string;
  startTime: string; // ISO string 2026-06-22T10:00:00Z
  endTime: string; // ISO string 2026-06-22T11:00:00Z
}

export const createCalendarEvent = async (params: CalendarEventParams) => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('User not authenticated with Google');
  }

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: params.title,
      description: params.description,
      start: {
        dateTime: params.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: params.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Failed to create calendar event:', errorBody);
    throw new Error('Failed to create Google Calendar event');
  }

  return await response.json();
};
