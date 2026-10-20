import fs from 'fs';
import path from 'path';
import { JWT } from 'google-auth-library';
import { User } from './db.js';

export interface RegistrationRow {
  registrationId: string;
  userId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  college: string;
  course: string;
  branch: string;
  academicYear: string;
  semester: string;
  preferredLanguage: string;
  registrationMethod: 'Email/Password' | 'Google OAuth';
  emailVerificationStatus: 'Verified' | 'Unverified';
  accountStatus: 'Active' | 'Suspended' | 'Deleted';
  registrationDate: string;
  lastLoginDate: string;
  lastUpdatedDate: string;
}

export interface SheetsOutboxEvent {
  id: string;
  type: 'NEW_REGISTRATION' | 'UPDATE_LOGIN' | 'UPDATE_PROFILE';
  userId: string;
  payload: Partial<RegistrationRow>;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

const OUTBOX_FILE = path.resolve(process.cwd(), 'data', 'sheets_outbox.json');

function readOutbox(): SheetsOutboxEvent[] {
  try {
    if (fs.existsSync(OUTBOX_FILE)) {
      return JSON.parse(fs.readFileSync(OUTBOX_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn('[Google Sheets] Error reading outbox file:', err);
  }
  return [];
}

function writeOutbox(events: SheetsOutboxEvent[]): void {
  try {
    const dir = path.dirname(OUTBOX_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(OUTBOX_FILE, JSON.stringify(events, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Google Sheets] Error writing outbox file:', err);
  }
}

export function queueSheetsOutbox(event: Omit<SheetsOutboxEvent, 'id' | 'createdAt' | 'attempts'>): void {
  const events = readOutbox();
  // Idempotency: don't duplicate pending registration event for same user
  const existingIdx = events.findIndex(
    (e) => e.userId === event.userId && e.type === event.type
  );

  const newEvent: SheetsOutboxEvent = {
    ...event,
    id: `outbox_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  if (existingIdx >= 0) {
    events[existingIdx] = {
      ...events[existingIdx],
      payload: { ...events[existingIdx].payload, ...event.payload },
    };
  } else {
    events.push(newEvent);
  }

  writeOutbox(events);
}

/**
 * Returns configuration status of Google Sheets integration
 */
export function getSheetsIntegrationStatus() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';
  const worksheetName = process.env.GOOGLE_SHEETS_WORKSHEET_NAME || 'User Registrations';
  const hasServiceAccount = !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  );
  const hasAppsScript = !!process.env.GOOGLE_APPS_SCRIPT_ENDPOINT;
  const outboxCount = readOutbox().length;

  return {
    isConfigured: !!(spreadsheetId && (hasServiceAccount || hasAppsScript)),
    method: hasServiceAccount ? 'Google Sheets API (Service Account)' : hasAppsScript ? 'Google Apps Script Webhook' : 'Unconfigured / Local Outbox Queue',
    spreadsheetId: spreadsheetId ? `${spreadsheetId.slice(0, 8)}...` : null,
    worksheetName,
    pendingOutboxCount: outboxCount,
    ready: !!((hasServiceAccount && spreadsheetId) || hasAppsScript),
  };
}

/**
 * Get authenticated Google Sheets token via Service Account
 */
async function getGoogleAuthToken(): Promise<string | null> {
  const credsRaw =
    process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!credsRaw) return null;

  try {
    let creds: any;
    if (credsRaw.trim().startsWith('{')) {
      creds = JSON.parse(credsRaw);
    } else if (fs.existsSync(credsRaw)) {
      creds = JSON.parse(fs.readFileSync(credsRaw, 'utf-8'));
    } else {
      return null;
    }

    const client = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const tokenRes = await client.getAccessToken();
    return tokenRes.token || null;
  } catch (err) {
    console.warn('[Google Sheets] Service account authentication failed:', err);
    return null;
  }
}

/**
 * Appends or updates registration row in Google Sheets via REST API or Apps Script
 */
export async function syncUserToGoogleSheets(
  user: User,
  method: 'Email/Password' | 'Google OAuth' = 'Email/Password',
  isLoginUpdate = false
): Promise<{ success: boolean; message: string }> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';
  const worksheetName = process.env.GOOGLE_SHEETS_WORKSHEET_NAME || 'User Registrations';
  const appsScriptEndpoint = process.env.GOOGLE_APPS_SCRIPT_ENDPOINT || '';

  const rowData: RegistrationRow = {
    registrationId: `REG-${user.id}`,
    userId: user.id,
    fullName: user.name,
    email: user.email,
    mobileNumber: user.phone || (user.phoneCountryCode && user.phoneNumber ? `${user.phoneCountryCode}${user.phoneNumber}` : ''),
    college: user.college || '',
    course: user.course || 'B.Tech',
    branch: user.branch || 'Computer Science',
    academicYear: user.year || '1st Year',
    semester: user.semester || '1st Semester',
    preferredLanguage: user.preferredLanguage || 'English',
    registrationMethod: user.googleId ? 'Google OAuth' : method,
    emailVerificationStatus: user.emailVerified ? 'Verified' : 'Unverified',
    accountStatus: 'Active',
    registrationDate: user.createdAt || new Date().toISOString(),
    lastLoginDate: user.lastActiveDate || new Date().toISOString(),
    lastUpdatedDate: new Date().toISOString(),
  };

  // Option B: Google Apps Script Webhook
  if (appsScriptEndpoint) {
    try {
      const webhookSecret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET || '';
      const response = await fetch(appsScriptEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookSecret ? { 'X-Webhook-Secret': webhookSecret } : {}),
        },
        body: JSON.stringify({
          action: isLoginUpdate ? 'update_login' : 'register_user',
          data: rowData,
        }),
      });

      if (response.ok) {
        console.log(`[Google Sheets] Apps Script synchronized successfully for user ${user.id}`);
        return { success: true, message: 'Google Sheets synchronized via Apps Script' };
      }
    } catch (err: any) {
      console.warn('[Google Sheets] Apps Script webhook error:', err?.message || err);
    }
  }

  // Option A: Google Sheets REST API v4 using Service Account
  if (spreadsheetId) {
    const accessToken = await getGoogleAuthToken();
    if (accessToken) {
      try {
        const range = `${worksheetName}!A:Q`;
        // First, check if row exists by reading user_ids (Column B)
        const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
        const checkRes = await fetch(checkUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          const rows: string[][] = checkData.values || [];
          let existingRowIndex = -1;

          for (let i = 1; i < rows.length; i++) {
            if (rows[i] && rows[i][1] === user.id) {
              existingRowIndex = i + 1; // 1-indexed for Sheets
              break;
            }
          }

          if (existingRowIndex > 0) {
            // Update existing row
            const updateRange = `${worksheetName}!A${existingRowIndex}:Q${existingRowIndex}`;
            const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(updateRange)}?valueInputOption=USER_ENTERED`;
            const updatedValues = [
              [
                rowData.registrationId,
                rowData.userId,
                rowData.fullName,
                rowData.email,
                rowData.mobileNumber,
                rowData.college,
                rowData.course,
                rowData.branch,
                rowData.academicYear,
                rowData.semester,
                rowData.preferredLanguage,
                rowData.registrationMethod,
                rowData.emailVerificationStatus,
                rowData.accountStatus,
                rows[existingRowIndex - 1][14] || rowData.registrationDate,
                rowData.lastLoginDate,
                rowData.lastUpdatedDate,
              ],
            ];

            const updateRes = await fetch(updateUrl, {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ values: updatedValues }),
            });

            if (updateRes.ok) {
              console.log(`[Google Sheets] Updated row for user ${user.id} at index ${existingRowIndex}`);
              return { success: true, message: 'Google Sheets row updated successfully' };
            }
          } else {
            // Append new row
            const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
            const rowValues = [
              [
                rowData.registrationId,
                rowData.userId,
                rowData.fullName,
                rowData.email,
                rowData.mobileNumber,
                rowData.college,
                rowData.course,
                rowData.branch,
                rowData.academicYear,
                rowData.semester,
                rowData.preferredLanguage,
                rowData.registrationMethod,
                rowData.emailVerificationStatus,
                rowData.accountStatus,
                rowData.registrationDate,
                rowData.lastLoginDate,
                rowData.lastUpdatedDate,
              ],
            ];

            const appendRes = await fetch(appendUrl, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ values: rowValues }),
            });

            if (appendRes.ok) {
              console.log(`[Google Sheets] Appended registration row for user ${user.id}`);
              return { success: true, message: 'Google Sheets registration row appended successfully' };
            }
          }
        }
      } catch (err: any) {
        console.warn('[Google Sheets] REST API caught error:', err?.message || err);
      }
    }
  }

  // If external Sheets is unreachable or credentials not configured:
  // Add to persistent Outbox queue so no data is ever lost!
  queueSheetsOutbox({
    type: isLoginUpdate ? 'UPDATE_LOGIN' : 'NEW_REGISTRATION',
    userId: user.id,
    payload: rowData,
  });

  return {
    success: false,
    message: 'Google Sheets credentials not yet active. Registration queued in persistent outbox.',
  };
}

/**
 * Flushes pending outbox events when credentials become available
 */
export async function flushSheetsOutbox(): Promise<{ processed: number; remaining: number }> {
  const events = readOutbox();
  if (events.length === 0) return { processed: 0, remaining: 0 };

  let processed = 0;
  const remainingEvents: SheetsOutboxEvent[] = [];

  for (const event of events) {
    try {
      const dummyUser = {
        id: event.userId,
        name: event.payload.fullName || 'User',
        email: event.payload.email || '',
        college: event.payload.college,
        course: event.payload.course,
        branch: event.payload.branch,
        year: event.payload.academicYear,
        semester: event.payload.semester,
        preferredLanguage: event.payload.preferredLanguage as any,
        phone: event.payload.mobileNumber,
        googleId: event.payload.registrationMethod === 'Google OAuth' ? 'google' : undefined,
        createdAt: event.payload.registrationDate || new Date().toISOString(),
        lastActiveDate: event.payload.lastLoginDate || new Date().toISOString(),
        emailVerified: event.payload.emailVerificationStatus === 'Verified',
        xp: 50,
        level: 1,
        currentStreak: 1,
        longestStreak: 1,
        activeDates: [],
        privacyShareStats: true,
      };

      const result = await syncUserToGoogleSheets(
        dummyUser,
        event.payload.registrationMethod,
        event.type === 'UPDATE_LOGIN'
      );

      if (result.success) {
        processed++;
      } else {
        remainingEvents.push({
          ...event,
          attempts: event.attempts + 1,
          lastError: result.message,
        });
      }
    } catch (e: any) {
      remainingEvents.push({
        ...event,
        attempts: event.attempts + 1,
        lastError: e?.message || 'Flush error',
      });
    }
  }

  writeOutbox(remainingEvents);
  return { processed, remaining: remainingEvents.length };
}
