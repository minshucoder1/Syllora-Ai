# Syllora AI — Google Sheets User Registration Setup Guide

This guide describes how to configure real-time user registration recording into a designated Google Spreadsheet for Syllora AI.

---

## 1. Spreadsheet & Worksheet Setup

1. Open [Google Sheets](https://sheets.new) and create a new spreadsheet named:  
   **`Syllora AI — User Registrations`**
2. Note your **Spreadsheet ID** from the browser URL:  
   `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`
3. Rename the first tab (worksheet) to:  
   **`User Registrations`**
4. Set up the exact header row in **Row 1** (Columns A through P):

| Column | Header | Description |
|:---|:---|:---|
| **A** | `Registration ID` | Unique registration code (e.g., `REG-usr_1234567890`) |
| **B** | `User ID` | Stable unique user identifier |
| **C** | `Full Name` | Student's full name |
| **D** | `Email` | User's registered email |
| **E** | `College / University` | Enrolled institution |
| **F** | `Course` | Academic degree/course (e.g., B.Tech, BCA, B.Sc) |
| **G** | `Branch` | Academic specialization/department |
| **H** | `Academic Year` | e.g. 1st Year, 2nd Year, 3rd Year |
| **I** | `Semester` | Current semester |
| **J** | `Preferred Language` | English, Hindi, or Hinglish |
| **K** | `Registration Method` | `Email/Password` or `Google OAuth` |
| **L** | `Email Verification Status` | `Verified` or `Unverified` |
| **M** | `Account Status` | `Active` |
| **N** | `Registration Date` | UTC ISO 8601 timestamp |
| **O** | `Last Login Date` | UTC ISO 8601 timestamp (updated on logins) |
| **P** | `Last Updated Date` | UTC ISO 8601 timestamp (updated on profile changes) |

---

## 2. Integration Method A: Google Cloud Service Account (Recommended)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Sheets API**.
3. Create a **Service Account** under **IAM & Admin > Service Accounts**.
4. Create and download a **JSON Key** for the Service Account.
5. Copy the `client_email` address from the service account (e.g., `syllora-sync@your-project.iam.gserviceaccount.com`).
6. In Google Sheets, click **Share** and grant **Editor** access to that `client_email`.
7. Configure the following environment variables in `.env` or your hosting secrets:

```env
GOOGLE_SHEETS_SPREADSHEET_ID="your_spreadsheet_id_here"
GOOGLE_SHEETS_WORKSHEET_NAME="User Registrations"
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

---

## 3. Integration Method B: Google Apps Script Webhook

If using a lightweight webhook endpoint:

1. In your Google Spreadsheet, click **Extensions > Apps Script**.
2. Paste the following script:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("User Registrations");
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("User Registrations");
    }
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var d = body.data;

    var rows = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][1] === d.userId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex > 0) {
      // Update existing user row
      sheet.getRange(rowIndex, 15).setValue(d.lastLoginDate);
      sheet.getRange(rowIndex, 16).setValue(d.lastUpdatedDate);
      sheet.getRange(rowIndex, 3).setValue(d.fullName);
      sheet.getRange(rowIndex, 5).setValue(d.college);
      sheet.getRange(rowIndex, 6).setValue(d.course);
      sheet.getRange(rowIndex, 7).setValue(d.branch);
    } else {
      // Append new registration
      sheet.appendRow([
        d.registrationId,
        d.userId,
        d.fullName,
        d.email,
        d.college,
        d.course,
        d.branch,
        d.academicYear,
        d.semester,
        d.preferredLanguage,
        d.registrationMethod,
        d.emailVerificationStatus,
        d.accountStatus,
        d.registrationDate,
        d.lastLoginDate,
        d.lastUpdatedDate
      ]);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```
3. Click **Deploy > New Deployment > Web App**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the deployment Web App URL and configure in environment:

```env
GOOGLE_APPS_SCRIPT_ENDPOINT="https://script.google.com/macros/s/your_app_script_id/exec"
```

---

## 4. Reliability & Outbox Queue

- If Google Sheets is temporarily unreachable, registrations are preserved in `data/sheets_outbox.json` with exponential backoff and retry capabilities.
- To check sync status from the backend:
  - `GET /api/admin/sheets/status`
  - `POST /api/admin/sheets/sync-outbox` (forces flushing queued registration rows)
