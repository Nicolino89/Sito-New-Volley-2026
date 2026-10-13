/**
 * Utility for exporting team match schedules to standard iCalendar (.ics) format
 * and generating 1-click Google Calendar / Apple Calendar sync links.
 */

import { PartitaCampionato, IncontroGara } from '../firebase-societa';

type UnifiedMatch = {
  id?: string;
  giornata?: string;
  data: string; // e.g. "18/10/2026" or "18/10" or "2026-10-18"
  ora?: string;  // e.g. "20:30"
  avversario: string;
  casa: boolean;
  luogo?: string;
};

/**
 * Parse an Italian date string (dd/mm/yyyy or dd/mm) and time (hh:mm) into Date object
 */
function parseMatchDateTime(dateStr: string, timeStr?: string): { start: Date; end: Date } {
  const now = new Date();
  let day = now.getDate();
  let month = now.getMonth();
  let year = now.getFullYear();

  // Try parsing dd/mm/yyyy or dd/mm
  const slashParts = dateStr.split('/');
  if (slashParts.length >= 2) {
    day = parseInt(slashParts[0], 10);
    month = parseInt(slashParts[1], 10) - 1;
    if (slashParts.length >= 3) {
      year = parseInt(slashParts[2], 10);
      if (year < 100) year += 2000;
    }
  } else if (dateStr.includes('-')) {
    // ISO format yyyy-mm-dd
    const isoParts = dateStr.split('-');
    if (isoParts.length >= 3) {
      year = parseInt(isoParts[0], 10);
      month = parseInt(isoParts[1], 10) - 1;
      day = parseInt(isoParts[2], 10);
    }
  }

  let hours = 20;
  let minutes = 30;
  if (timeStr && timeStr.includes(':')) {
    const timeParts = timeStr.split(':');
    hours = parseInt(timeParts[0], 10) || 20;
    minutes = parseInt(timeParts[1], 10) || 30;
  }

  const start = new Date(year, month, day, hours, minutes, 0);
  // Default match duration: 2 hours (120 minutes)
  const end = new Date(start.getTime() + 120 * 60 * 1000);

  return { start, end };
}

/**
 * Format a Date object to iCalendar date string: YYYYMMDDTHHmmss
 */
function formatIcsDate(date: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/**
 * Generates the full .ics iCalendar file content for a team's championship matches.
 */
export function generateIcsCalendar(teamName: string, matches: UnifiedMatch[], customDisplayName?: string): string {
  const myName = customDisplayName || 'NVA';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//New Volley Academy//Calendario Gare//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${myName} - ${teamName}`,
    'X-WR-TIMEZONE:Europe/Rome'
  ];

  matches.forEach((match, idx) => {
    const { start, end } = parseMatchDateTime(match.data, match.ora);
    const summary = match.casa 
      ? `${myName} vs ${match.avversario} (${teamName})` 
      : `${match.avversario} vs ${myName} (${teamName})`;
    
    const location = match.luogo || (match.casa ? 'PalaMaroncelli, Forlì' : 'Palasport Avversario');
    const description = `Partita ufficiale: ${match.giornata || `${idx + 1}ª Giornata`}\\nSquadra: ${teamName}\\nLe Pantere - New Volley Academy Forlì`;
    const uid = `nva-match-${match.id || idx}-${start.getTime()}@newvolleyacademy.it`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatIcsDate(new Date())}Z`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Triggers a browser download for the .ics calendar file.
 */
export function downloadIcsCalendar(teamName: string, matches: UnifiedMatch[], customDisplayName?: string): void {
  const icsContent = generateIcsCalendar(teamName, matches, customDisplayName);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const sanitizedTeamName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const a = document.createElement('a');
  a.href = url;
  a.download = `calendario_${sanitizedTeamName}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Creates a 1-click Google Calendar add link for a single match.
 */
export function getGoogleCalendarLink(match: UnifiedMatch, teamName: string, customDisplayName?: string): string {
  const { start, end } = parseMatchDateTime(match.data, match.ora);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const myName = customDisplayName || 'NVA';
  
  const formatUtc = (d: Date) => {
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  };

  const title = encodeURIComponent(match.casa ? `${myName} vs ${match.avversario}` : `${match.avversario} vs ${myName}`);
  const details = encodeURIComponent(`Campionato ${teamName} - ${match.giornata || 'Gara Ufficiale'}\nNew Volley Academy Forlì`);
  const location = encodeURIComponent(match.luogo || (match.casa ? 'PalaMaroncelli, Forlì' : 'Palasport'));
  const dates = `${formatUtc(start)}/${formatUtc(end)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}
