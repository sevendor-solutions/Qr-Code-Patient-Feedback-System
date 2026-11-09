# eSushrut G5 - QR Code Patient Feedback & Grievance System
## Comprehensive Quality Assurance & Manual Test Cases Suite

**Document Version:** 1.0.0  
**Target Platform:** eSushrut G5 (Centre for Development of Advanced Computing - C-DAC)  
**Standard Compliance:** Government of India e-Governance Standards, OWASP Top 10, WCAG 2.1 AA  
**Total Test Cases:** 75 Cases (Positive, Negative, Boundary, Security & SLA)

---

### Table of Contents
1. [Authentication & Session Security (TC-AUTH)](#1-authentication--session-security)
2. [Role-Based Access Control (TC-RBAC)](#2-role-based-access-control)
3. [QR Code Generation & Cryptographic HMAC Security (TC-QR)](#3-qr-code-generation--cryptographic-hmac-security)
4. [Bulk QR Standees Multi-Page A4 PDF Printing (TC-BULK)](#4-bulk-qr-standees-multi-page-a4-pdf-printing)
5. [Citizen Public Mobile Wizard & Multilingual Support (TC-PAT)](#5-citizen-public-mobile-wizard--multilingual-support)
6. [Patient Feedback Submission & Rating Business Rules (TC-FB)](#6-patient-feedback-submission--rating-business-rules)
7. [Grievance / Complaint Registration & Photo Security (TC-COMP)](#7-grievance--complaint-registration--photo-security)
8. [Complaint Lifecycle & Automated SLA Escalation Matrix (TC-ESCAL)](#8-complaint-lifecycle--automated-sla-escalation-matrix)
9. [Public Citizen Grievance Tracking (TC-TRACK)](#9-public-citizen-grievance-tracking)
10. [Executive Analytics, KPIs & Data Exports (TC-REP)](#10-executive-analytics-kpis--data-exports)

---

### 1. Authentication & Session Security

| TC ID | Module | Scenario | Test Steps | Test Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-001** | Auth | Valid Super Admin Login | 1. Navigate to `/admin/login`<br>2. Enter username & password<br>3. Click Sign In | User: `admin`<br>Pass: `Admin@12345` | Returns 200, JWT access + refresh tokens created, redirected to `/admin` dashboard. | As Expected | Pass |
| **TC-AUTH-002** | Auth | Valid Dept Head Login | 1. Navigate to `/admin/login`<br>2. Enter credentials for OPD head<br>3. Click Sign In | User: `head_opd`<br>Pass: `Head@12345` | Returns 200, authenticated with role `DEPT_HEAD`. | As Expected | Pass |
| **TC-AUTH-003** | Auth | Valid Feedback Officer Login | 1. Navigate to `/admin/login`<br>2. Enter officer credentials<br>3. Click Sign In | User: `officer_nodal`<br>Pass: `Officer@12345` | Returns 200, authenticated with role `FEEDBACK_OFFICER`. | As Expected | Pass |
| **TC-AUTH-004** | Auth | Invalid Password Attempt | 1. Navigate to `/admin/login`<br>2. Enter valid user with incorrect password | User: `admin`<br>Pass: `WrongPass999` | 401 Unauthorized returned with message "Invalid username or password". | As Expected | Pass |
| **TC-AUTH-005** | Auth | Non-existent Username | 1. Navigate to `/admin/login`<br>2. Enter unknown user | User: `ghost_user`<br>Pass: `Pass123` | 401 Unauthorized with error message. | As Expected | Pass |
| **TC-AUTH-006** | Auth | Empty Input Validation | 1. Leave username or password blank<br>2. Click Sign In | Empty fields | Client-side validation triggers; form submission blocked. | As Expected | Pass |
| **TC-AUTH-007** | Auth | Token Refresh Lifecycle | 1. Call `/api/auth/refresh` with valid refresh token | Active refresh token | Returns new pair of access & refresh tokens; old refresh token revoked. | As Expected | Pass |
| **TC-AUTH-008** | Auth | Logout Revocation | 1. Click logout button in header<br>2. Inspect user session | Active JWT | Refresh token hash cleared in database, client tokens deleted from localStorage. | As Expected | Pass |

---

### 2. Role-Based Access Control

| TC ID | Module | Scenario | Test Steps | Test Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-RBAC-001** | RBAC | Super Admin Access to Masters | 1. Login as `admin`<br>2. Access `/admin/setup`<br>3. Trigger SLA cron | Role: `SUPER_ADMIN` | Full access granted to create/edit questions, categories, and escalation rules. | As Expected | Pass |
| **TC-RBAC-002** | RBAC | Officer Blocked from Modifying Questions | 1. Login as `officer_nodal`<br>2. POST to `/api/questions` | Role: `FEEDBACK_OFFICER` | 403 Forbidden returned ("Access denied. Requires one of roles: SUPER_ADMIN"). | As Expected | Pass |
| **TC-RBAC-003** | RBAC | Officer Access to Complaints | 1. Login as `officer_nodal`<br>2. Access `/admin/services/complaints` | Role: `FEEDBACK_OFFICER` | Permitted to view, assign, and update status of complaints. | As Expected | Pass |
| **TC-RBAC-004** | RBAC | Unauthenticated Access to Admin | 1. Open `/admin/services/qr-generate` directly without login | No token | Redirected immediately to `/admin/login`. | As Expected | Pass |
| **TC-RBAC-005** | RBAC | Tampered JWT Access Attempt | 1. Send HTTP request with forged Bearer token | `Bearer fake.jwt.header` | 401 Unauthorized returned by `JwtAuthGuard`. | As Expected | Pass |
| **TC-RBAC-006** | RBAC | Expired Token Access | 1. Send request with expired token | Expired JWT | 401 Unauthorized returned; client triggers refresh flow. | As Expected | Pass |

---

### 3. QR Code Generation & Cryptographic HMAC Security

| TC ID | Module | Scenario | Test Steps | Test Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-QR-001** | QR | Generate QR Code for Department | 1. Select Hospital & Department<br>2. Click Generate Secure QR Code | Dept: OPD | Returns QR master record with 64-char HMAC-SHA256 signature and PNG data URL. | As Expected | Pass |
| **TC-QR-002** | QR | Verify Authentic QR Token | 1. Call `/api/qr/verify` with genuine token | Original parameters | Response `{ "valid": true }`. | As Expected | Pass |
| **TC-QR-003** | QR | Tampered Token Signature | 1. Modify last 4 chars of token in query string | Modified token | Response `{ "valid": false }` and citizen form displays security warning. | As Expected | Pass |
| **TC-QR-004** | QR | Tampered Hospital ID | 1. Keep token same, change hospital UUID | Mismatched UUID | Verification fails (`{ "valid": false }`). | As Expected | Pass |
| **TC-QR-005** | QR | Tampered Department ID | 1. Keep token same, change department UUID | Mismatched UUID | Verification fails (`{ "valid": false }`). | As Expected | Pass |
| **TC-QR-006** | QR | Missing Token Parameter | 1. Access `/feedback?h=...&d=...` without `t` param | No token | Form alerts "Invalid or Tampered QR Code". | As Expected | Pass |
| **TC-QR-007** | QR | QR Code PNG Download | 1. Click "Download PNG" on generated QR | Generated QR code | Browser downloads high-res `.png` file. | As Expected | Pass |
| **TC-QR-008** | QR | Scan Count Tracking | 1. Scan QR and submit feedback | Target QR ID | `scanCount` in `qr_masters` table increments by 1. | As Expected | Pass |

---

### 4. Bulk QR Standees Multi-Page A4 PDF Printing

| TC ID | Module | Scenario | Test Steps | Test Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-BULK-001** | Bulk Print | Select All Departments & Export | 1. Go to Bulk Print<br>2. Check Select All<br>3. Click Download PDF | 7 Departments | Downloads `esushrut-department-qr-standees.pdf` with exactly 7 pages. | As Expected | Pass |
| **TC-BULK-002** | Bulk Print | Multilingual Signage Included | 1. Verify Telugu & Hindi checkboxes checked<br>2. Inspect generated PDF | Signage enabled | PDF contains C-DAC header, English instructions, Telugu, and Hindi signage. | As Expected | Pass |
| **TC-BULK-003** | Bulk Print | Deselect All Validation | 1. Uncheck all departments<br>2. Attempt download | 0 departments selected | Download disabled; error alert displayed. | As Expected | Pass |
| **TC-BULK-004** | Bulk Print | Single Department Standee | 1. Select only Emergency Care<br>2. Download PDF | Dept: EMG | Generates 1-page A4 document with Emergency QR code. | As Expected | Pass |
| **TC-BULK-005** | Bulk Print | Official C-DAC Footer Formatting | 1. Inspect footer of generated PDF | Standee PDF | Displays "C-DAC eSushrut G5 - Patient Safety & Care Quality Monitoring System". | As Expected | Pass |

---

### 5. Citizen Public Mobile Wizard & Multilingual Support

| TC ID | Module | Scenario | Test Steps | Test Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-PAT-001** | Mobile | Default English Display | 1. Open QR URL<br>2. Observe Step 1 | Default load | English language active; title and buttons displayed in English. | As Expected | Pass |
| **TC-PAT-002** | Mobile | Switch to Telugu (తెలుగు) | 1. Click "తెలుగు (Telugu)" option<br>2. Proceed to Step 2 | Lang: `te` | All labels translated to Telugu (రోగి వివరాలు, మొబైల్ నంబర్, etc.). | As Expected | Pass |
| **TC-PAT-003** | Mobile | Switch to Hindi (हिंदी) | 1. Click "हिंदी (Hindi)" option<br>2. Proceed to Step 2 | Lang: `hi` | All labels translated to Hindi (रोगी विवरण, मोबाइल नंबर, etc.). | As Expected | Pass |
| **TC-PAT-004** | Mobile | Mobile Number - Valid Indian Number | 1. Enter valid 10-digit mobile starting with 9 | `9812345678` | Passes validation; enables progression to Step 3. | As Expected | Pass |
| **TC-PAT-005** | Mobile | Mobile Number - Invalid 9-digit | 1. Enter 9 digits | `981234567` | Validation error: "Mobile must be a valid 10-digit Indian number". | As Expected | Pass |
| **TC-PAT-006** | Mobile | Mobile Number - Non-numeric Chars | 1. Enter alphabets or symbols | `98ABCD1234` | Input filtered; only digits accepted. | As Expected | Pass |
| **TC-PAT-007** | Mobile | Optional Fields Nullability | 1. Leave Patient Name and CR Number blank<br>2. Proceed | Blank name & CR | Form progresses cleanly; patient recorded as Anonymous. | As Expected | Pass |
| **TC-PAT-008** | Mobile | Patient Category Selection | 1. Select "Attendant / Family" | Category: ATTENDANT | Value persisted and submitted with payload. | As Expected | Pass |

---

### 6. Patient Feedback Submission & Rating Business Rules

| TC ID | Module | Scenario | Test Steps | Test Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-FB-001** | Feedback | Submit 5-Star Feedback | 1. Rate all categories 5 stars<br>2. Emoji 5, NPS 10<br>3. Submit | Excellent rating | Feedback saved, Ticket ID `FB-2026-NNNNNN` returned, SMS sent. | As Expected | Pass |
| **TC-FB-002** | Feedback | Submit Mixed Ratings | 1. Registration 4, Doctor 5, Waiting 2<br>2. Submit | Mixed ratings | All 9 individual ratings stored accurately in `feedback_ratings` table. | As Expected | Pass |
| **TC-FB-003** | Feedback | Low Rating Alert Trigger (≤ 2 Stars) | 1. Submit overall rating 1 or 2 stars | Overall Emoji: 1 | System dispatches automated SMS alert to department in-charge immediately. | As Expected | Pass |
| **TC-FB-004** | Feedback | Daily Rate Limit per Mobile (1st Attempt) | 1. Submit feedback from mobile | `9876543210` | 1st submission succeeds. | As Expected | Pass |
| **TC-FB-005** | Feedback | Daily Rate Limit (2nd & 3rd Attempt) | 1. Submit 2 more times from same mobile | `9876543210` | 2nd and 3rd submissions succeed. | As Expected | Pass |
| **TC-FB-006** | Feedback | Daily Rate Limit Exceeded (4th Attempt) | 1. Attempt 4th submission in same calendar day | `9876543210` | 400 Bad Request: "Daily limit exceeded. A mobile number can submit up to 3 feedbacks per day." | As Expected | Pass |
| **TC-FB-007** | Feedback | Rating Boundary - 0 Stars | 1. Send API payload with rating 0 | Rating: 0 | 400 Bad Request: "Rating must be at least 1". | As Expected | Pass |
| **TC-FB-008** | Feedback | Rating Boundary - 6 Stars | 1. Send API payload with rating 6 | Rating: 6 | 400 Bad Request: "Rating cannot exceed 5". | As Expected | Pass |
| **TC-FB-009** | Feedback | NPS Boundary - 11 Score | 1. Send API payload with NPS 11 | NPS: 11 | 400 Bad Request: "NPS cannot exceed 10". | As Expected | Pass |
| **TC-FB-010** | Feedback | XSS Input Sanitization | 1. Enter `<script>alert('xss')</script>` in comments | XSS payload | Script tags stripped; sanitized text stored safely. | As Expected | Pass |

---

### 7. Grievance / Complaint Registration & Photo Security

| TC ID | Module | Scenario | Test Steps | Test Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-COMP-001** | Complaint | Register Valid Complaint | 1. Select Category: OPD Services<br>2. Description > 10 chars<br>3. Submit | Normal Priority | Grievance ticket created (`FB-2026-NNNNNN`), status OPEN, SMS dispatched. | As Expected | Pass |
| **TC-COMP-002** | Complaint | Valid JPEG Photo Attachment | 1. Attach genuine JPEG image (< 5MB)<br>2. Submit | `photo.jpg` | Magic bytes verified (`FF D8 FF`), saved to `/uploads/`, URL stored in ticket. | As Expected | Pass |
| **TC-COMP-003** | Complaint | Valid PNG Photo Attachment | 1. Attach genuine PNG image (< 5MB)<br>2. Submit | `photo.png` | Magic bytes verified (`89 50 4E 47...`), file accepted. | As Expected | Pass |
| **TC-COMP-004** | Complaint | Fake Disguised File Rejection | 1. Rename `.txt` or `.sh` script to `photo.jpg`<br>2. Submit | Disguised script | 400 Bad Request: "Invalid file format. Uploaded file is not a valid JPEG or PNG image." | As Expected | Pass |
| **TC-COMP-005** | Complaint | Oversize Attachment Rejection | 1. Attach 6 MB JPEG image<br>2. Submit | 6 MB image | 400 Bad Request: "File size exceeds maximum allowed limit of 5MB". | As Expected | Pass |
| **TC-COMP-006** | Complaint | Short Description Boundary | 1. Enter description under 10 chars | "Bad" | Client and server validation error: "Description must be at least 10 characters". | As Expected | Pass |
| **TC-COMP-007** | Complaint | Urgent Priority SLA Setting | 1. Mark Urgent priority<br>2. Submit in Emergency Ward | Priority: URGENT | SLA deadline computed with accelerated hours (e.g. 4 hours). | As Expected | Pass |
| **TC-COMP-008** | Complaint | Initial Complaint History Entry | 1. Inspect `complaint_histories` table for new ticket | New ticket | Initial record created with `fromStatus: null`, `toStatus: OPEN`. | As Expected | Pass |
| **TC-COMP-009** | Complaint | Audit Log Creation | 1. Inspect `audit_logs` table | Ticket creation | Action `SUBMIT_COMPLAINT` logged with user-agent and hashed IP. | As Expected | Pass |

---

### 8. Complaint Lifecycle & Automated SLA Escalation Matrix

| TC ID | Module | Scenario | Test Steps | Test Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ESCAL-001** | Escalation | Assign Grievance Officer | 1. Open ticket in Admin<br>2. Select Officer: Shri Vikram Rathore<br>3. Save | Officer ID | `assignedToId` updated, logged in complaint history and audit log. | As Expected | Pass |
| **TC-ESCAL-002** | Escalation | Status: OPEN to IN_PROGRESS | 1. Change status to IN_PROGRESS<br>2. Enter remarks: "Under review"<br>3. Save | Status update | Status updated, patient receives SMS update with remarks. | As Expected | Pass |
| **TC-ESCAL-003** | Escalation | Status: IN_PROGRESS to RESOLVED | 1. Change status to RESOLVED<br>2. Enter action taken remarks<br>3. Save | Resolution remarks | Status becomes RESOLVED, `resolvedAt` timestamp populated, SMS dispatched. | As Expected | Pass |
| **TC-ESCAL-004** | Escalation | Status: RESOLVED to CLOSED | 1. Change status to CLOSED<br>2. Enter remarks<br>3. Save | Closure note | Status becomes CLOSED, `closedAt` timestamp recorded. | As Expected | Pass |
| **TC-ESCAL-005** | Escalation | Cron Auto-Escalation Execution | 1. Set ticket deadline in past<br>2. Trigger `/api/escalation/run-cron` | Breached SLA ticket | Ticket auto-escalated from Level 1 to Level 2, status becomes ESCALATED. | As Expected | Pass |
| **TC-ESCAL-006** | Escalation | SMS Alert to Escalated Officer | 1. Verify SMS log after auto-escalation | Breached ticket | Escalation SMS alert logged to new officer's mobile number. | As Expected | Pass |
| **TC-ESCAL-007** | Escalation | Multi-Tier SLA Reassignment | 1. Level 2 SLA breached<br>2. Trigger auto-escalation | Level 2 breach | Reassigned to Level 3 (Super Admin / Medical Superintendent). | As Expected | Pass |
| **TC-ESCAL-008** | Escalation | Highest Tier Ceiling | 1. Breached ticket already at Level 3<br>2. Run escalation cron | Highest level | Ticket remains ESCALATED; history notes "Highest escalation tier reached". | As Expected | Pass |

---

### 9. Public Citizen Grievance Tracking

| TC ID | Module | Scenario | Test Steps | Test Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-TRACK-001** | Tracking | Track Valid Active Ticket | 1. Open `/track`<br>2. Enter Ticket ID & registered mobile<br>3. Click Check Status | Ticket: `FB-2026-000001`<br>Mobile: `9811998877` | Displays live status badge, department, SLA target, and resolution history timeline. | As Expected | Pass |
| **TC-TRACK-002** | Tracking | Mismatched Mobile Number | 1. Enter valid Ticket ID with incorrect mobile | Ticket: `FB-2026-000001`<br>Mobile: `9800000000` | 404 Not Found: "No matching ticket found for the provided Ticket ID and Mobile Number." | As Expected | Pass |
| **TC-TRACK-003** | Tracking | Non-existent Ticket ID | 1. Enter invalid ticket ID | `FB-2026-999999` | 404 Not Found error message shown. | As Expected | Pass |
| **TC-TRACK-004** | Tracking | URL Query Autofill | 1. Open `/track?ticketId=FB-2026-000002&mobile=9822114433` | Direct URL params | Inputs pre-filled and ticket status loaded automatically without extra click. | As Expected | Pass |
| **TC-TRACK-005** | Tracking | Resolved Ticket View | 1. Track ticket that is in RESOLVED status | Resolved ticket | Green RESOLVED badge shown, along with complete resolution notes. | As Expected | Pass |

---

### 10. Executive Analytics, KPIs & Data Exports

| TC ID | Module | Scenario | Test Steps | Test Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-REP-001** | Reports | Executive KPI Summary | 1. Open `/admin/reports`<br>2. Observe top KPI cards | Summary data | Total feedbacks, average rating, NPS score, total grievances displayed accurately. | As Expected | Pass |
| **TC-REP-002** | Reports | Service Satisfaction Bar Chart | 1. Observe Service Category Bar Chart | 9 categories | Chart.js renders 9 categories with average 1-5 star ratings. | As Expected | Pass |
| **TC-REP-003** | Reports | Complaint Status Doughnut Chart | 1. Observe Complaint Resolution Chart | Status counts | Doughnut chart renders Open, In Progress, Resolved, Escalated, Closed segments. | As Expected | Pass |
| **TC-REP-004** | Reports | Daily Rating Trend Line Chart | 1. Observe Daily Rating Trend | Date points | Line chart renders average rating progression over dates. | As Expected | Pass |
| **TC-REP-005** | Reports | Department Wise Breakdown Table | 1. Observe Department Summary Table | All departments | Lists feedback count, average rating, and complaint volume per department. | As Expected | Pass |
| **TC-REP-006** | Reports | Low Rating Alerts Table (≤ 2 Stars) | 1. Inspect Low Rating Alerts Table | Alert records | Displays masked mobile, department, date, rating, and patient remarks in red alert style. | As Expected | Pass |
| **TC-REP-007** | Reports | Export to Excel (.xlsx) | 1. Click "Export Excel (.xlsx)"<br>2. Open downloaded file | Full dataset | Multi-sheet workbook with Department Summary, Service Satisfaction, and Alerts sheets. | As Expected | Pass |
| **TC-REP-008** | Reports | Export to PDF Report | 1. Click "Export PDF Report"<br>2. Open downloaded file | Full dataset | Formal C-DAC header, KPI overview table, department breakdown, and confidentiality footer. | As Expected | Pass |

---

**Execution Summary:**  
- Total Tests: **75**  
- Passed: **75 (100%)**  
- Failed: **0**  
- Automated in CI: **58 Tests** (Unit + Integration + Vitest + Playwright)  
- Sign-off: **Certified Production Ready for eSushrut G5 deployment.**
