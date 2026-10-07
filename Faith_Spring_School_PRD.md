# Product Requirements Document (PRD)
## Faith Spring School — School Management Portal

**School:** Faith Spring School
**Location:** Bokkos, Plateau State, Nigeria
**School Type:** Primary School
**Document Owner:** Saviour (Technical Lead / Project Owner)
**Prepared For:** Antigravity (AI build agent)
**Version:** 1.0

---

## 0. Instructions to Antigravity (Read First)

You are building this system end-to-end. Follow these directives exactly:

1. **Backend:** Use Supabase. A Supabase project named **"Faith Spring School"** already exists — it is accessible to you via your Supabase MCP connection. Use that existing project; do not create a new one. Build out the schema, auth, storage, Row Level Security (RLS) policies, edge functions, and any scheduled jobs inside it.
2. **Frontend:** React + Tailwind CSS. A UI has already been provided/designed for this project. Use it as the visual foundation.
   - If the provided UI is **not already** React/Tailwind (e.g. it's static HTML, Figma, or another framework), **convert it to React + Tailwind** — do not discard it and start from a generic template. Preserve its layout, components, and visual identity as closely as possible.
   - Where the provided UI is missing screens for features in this PRD, design new screens that **match the existing UI's design system** (colors, typography, spacing, component style) rather than introducing a new look.
3. **Three portals, three route namespaces:**
   - `/admin` — Admin portal
   - `/teachers` — Teacher portal
   - `/students` — Student/Parent portal
   Each namespace has its own authentication guard and layout shell.
4. **Build order (do not reorder):**
   1. Students module (records, CRUD, enrollment)
   2. Teachers module (records, CRUD, assignment)
   3. Subjects module
   4. Classes module (arms/sections, class-teacher assignment)
   5. Fees Management module (including Paystack integration)
   6. Remaining modules in whatever order is technically sensible (Timetable, Attendance, Exams/CBT, Results/PIN checker, E-Learning, Communication Log), respecting the dependency notes in each module's section below.
5. **Payment gateway:** Use **Paystack** for all online fee payments. Use Paystack's standard checkout/inline flow and verify transactions server-side (via a Supabase Edge Function) before marking any invoice as paid — never trust client-side "success" callbacks alone.
6. **Gap-filling responsibility:** Section 3 below lists features Saviour explicitly requested. Section 4 lists features Antigravity has identified as **necessary but missing** from that list, based on what a real, standard school management system requires. Build Section 4 items too, treating them as part of the required scope, not optional extras. If you identify further gaps while building, list them for Saviour rather than silently skipping them.
7. **Testing requirement:** After the system (or each module) is built, **test it yourself in a sandbox** — create real test data (fake students, teachers, classes, fees, exams, etc.) and exercise every flow end-to-end (registration, login for each role, PIN result checks, fee payment + receipt generation, timetable generation, CBT exam taking and grading, attendance marking, leave requests, messaging) using your own tooling.
   - **Do not open Saviour's browser for anything.** All testing must happen in your own sandboxed/headless environment or via direct API/database calls. Report results back as a written test summary, not by asking Saviour to click through anything.
8. **Reporting back:** When done (or at each major milestone), report: what was built, what test cases were run and their results, any schema/RLS decisions made, any additional gaps found, and anything you could not complete and why.

---

## 1. Overview & Purpose

Faith Spring School needs a single, unified digital school management system covering the full academic and administrative lifecycle: student and staff records, class/subject structuring, timetabling, attendance, fee collection, examinations (including computer-based testing), e-learning content delivery, result publishing via a PIN-based checker, and structured communication between parents and teachers.

The system replaces manual/paper-based processes (attendance registers, paper report cards, physical fee receipts, notice boards) with a role-based web portal usable by school administrators, teachers, and students/parents.

## 2. Goals

- Give **admins** full control over school data: students, staff, classes, subjects, fees, timetables, exams, and system-wide reporting.
- Give **teachers** tools to manage their classes: mark attendance, set/grade exams, upload e-learning content, log communications with parents, and view their timetable.
- Give **students/parents** self-service access: check results via PIN, view timetable, pay fees online, access e-learning materials, take CBT exams, and view communication logs.
- Ensure the system works reliably on low-bandwidth connections typical of Bokkos, Plateau State, since this is a primary school context where parents may use basic smartphones.
- Ensure financial operations (fee payment) are secure, auditable, and produce automatic receipts.

## 3. Core Feature Modules (As Requested)

### 3.1 PIN-Based Result Checking
- Each student's term result is compiled into a report card (subjects, scores, grades, position in class, teacher comments, attendance summary).
- Admin (or automated process at term-end) generates a **unique scratch-card-style PIN** per student per term, tied to a specific result record.
- A student/parent enters **Student ID/Admission Number + PIN** on a public-facing (but access-controlled) result checker page — no full login required for this specific flow, mirroring how Nigerian result-checker portals (e.g. WAEC-style) work.
- Each PIN should be single-use or limited-use (configurable, e.g. max 3 views) and expire after a configurable period.
- Result view should be printable/downloadable as PDF.
- Admin dashboard to generate, view, revoke, and reissue PINs in bulk (e.g. per class, per term).

### 3.2 Timetable Generation
- Admin defines periods, days, and subject-teacher-class mappings.
- System should support **manual timetable building** (drag-and-drop or form-based) per class, with conflict detection (a teacher cannot be in two classes at the same period; a class cannot have two subjects at the same period).
- Optional: an "auto-generate" assist that proposes a clash-free timetable given constraints (subjects per class, periods per week, teacher availability), which admin can then adjust.
- Published timetables are visible to teachers (their own schedule across classes) and to students/parents (their class's schedule).
- Support timetable versioning per term, since it may change.

### 3.3 Online Fee Payment with Automated Receipt (Paystack)
- Admin sets up fee structures per class/term (tuition, PTA levy, exam fee, uniform, etc.), including amount and due date.
- Parent/student portal shows an itemized invoice/balance per term.
- Payment via **Paystack** (card, bank transfer, USSD as supported by Paystack for Nigeria).
- On successful, **server-verified** payment: 
  - Update the student's fee ledger automatically.
  - Generate an automated **PDF receipt** (school letterhead, student details, amount, payment reference, date) and make it downloadable/emailable.
  - Send confirmation (email/SMS, see Section 4) to parent.
- Support partial payments and installments if the school allows them (confirm policy with Saviour; default to allowing partial payment with a running balance).
- Admin view: full payment ledger, outstanding balances per student/class, exportable reports (CSV/PDF).

### 3.4 E-Learning
- Teachers can upload learning materials per subject/class: documents, PDFs, images, links to videos, and simple lesson notes.
- Content organized by Class → Subject → Term → Topic/Week.
- Students/parents browse and download/view materials for their class.
- Optional: simple progress tracking (marked as viewed) — not full LMS complexity, appropriate for a primary school.

### 3.5 Examination Management & CBT
- Admin/teachers create exams: subject, class, term, exam type (CA, mid-term, end-of-term).
- Two exam modes:
  - **Manual score entry** (for handwritten/offline exams — teacher enters scores per student).
  - **Computer-Based Testing (CBT)**: teacher builds a question bank (multiple choice at minimum, appropriate for primary pupils — keep UI simple, large touch targets, minimal text-heavy instructions), sets duration, randomizes question order/options, and students take it online.
- CBT auto-grades objective questions; system computes term scores by combining CA + exam components per the school's grading weight configuration (admin-configurable, e.g. 40% CA + 60% exam).
- Results feed directly into the report card / PIN checker system (Section 3.1).
- Basic anti-cheating measures appropriate to context: timed sessions, one-attempt-per-exam (configurable), auto-submit on time expiry.

### 3.6 Attendance and Leave Tracking
- Teachers mark daily attendance per class (present/absent/late) — simple, fast UI since this happens every school day.
- Admin dashboard: attendance trends per class/student, exportable reports.
- **Leave tracking**: distinguish between (a) **student leave/absence requests** submitted by parents (e.g. "my child will be absent on X date, reason Y") for admin/teacher approval and record-keeping, and (b) **staff leave requests** submitted by teachers to admin (sick leave, annual leave) with an approval workflow.
- Attendance summary should appear on the student's report card (Section 3.1).

### 3.7 Parent and Teacher Communication Log
- A structured log (not open chat) where teachers can record notes/communications about a student (e.g. behavioral notes, academic concerns, praise, meeting summaries) visible to the relevant parent.
- Parents can send messages/queries to a teacher or the school office; teacher/admin can respond, and the exchange is logged and timestamped.
- Admin can view all communication logs school-wide for oversight.
- Notification badge/indicator when a new log entry or message exists.

## 4. Additional Features Antigravity Should Build (Gaps Identified)

These are not explicitly listed by Saviour but are standard, necessary parts of a real school management system and should be included in scope:

1. **Authentication & Role-Based Access Control** — Supabase Auth with roles (admin, teacher, student/parent), RLS policies enforcing that each role only sees/edits what it should (e.g. a parent can only see their own child's data; a teacher only their assigned classes).
2. **Student Admission / Onboarding workflow** — a proper "admit new student" flow (not just a raw DB insert): capture bio-data, parent/guardian contact info, class placement, passport photo upload, admission number auto-generation.
3. **Parent-Student linking** — a parent account can be linked to one or more children (siblings), and switch between them in the portal.
4. **Staff/HR basics** — teacher profile records (subjects qualified to teach, classes assigned, contact info, employment date); not full payroll, but enough for admin oversight.
5. **Class & Subject curriculum mapping** — which subjects are compulsory per class/level (primary schools have a fixed core curriculum), so timetable/exam creation is guided rather than freeform.
6. **Grading scale / report card configuration** — admin-configurable grading bands (e.g. A=80-100, etc.), and comment banks for teacher/head-teacher remarks.
7. **Academic Calendar / Term management** — define terms/sessions (e.g. 2025/2026 First Term), with start/end dates; all modules (fees, exams, attendance, timetable) are scoped to a term.
8. **Notifications** — at minimum email notifications (via Supabase + an email provider) for: fee payment confirmation, new result available, new communication log entry, leave request status change. SMS is a stretch goal worth flagging to Saviour given many parents in Bokkos may rely on SMS/USSD more than email.
9. **Admin dashboard/analytics** — at-a-glance stats: total students, fee collection rate, attendance rate today, upcoming exams, recent communications.
10. **Audit logging** — track who changed what (especially for fee/result edits) for accountability.
11. **Data backup/export** — admin ability to export core data (students, results, fee ledger) as CSV/Excel for offline record-keeping, since this is a real institution's system of record.
12. **Bulk import** — CSV upload for initial bulk-adding of existing students/teachers rather than one-by-one entry, given this will onboard an existing school population.
13. **Mobile responsiveness** — since parents will very likely access this primarily from phones, not desktops; this should be treated as a primary constraint, not an afterthought.
14. **Basic offline/low-bandwidth tolerance** — lightweight pages, image compression on upload (photos, e-learning materials), given typical connectivity in Bokkos.

Antigravity should flag any of these it believes are out of scope or should be deprioritized, rather than silently dropping them.

## 5. Information Architecture / Routes

- `/admin` — Admin portal (default landing: dashboard)
  - `/admin/students`, `/admin/teachers`, `/admin/subjects`, `/admin/classes`, `/admin/fees`, `/admin/timetable`, `/admin/exams`, `/admin/attendance`, `/admin/results`, `/admin/communications`, `/admin/settings`
- `/teachers` — Teacher portal
  - `/teachers/dashboard`, `/teachers/attendance`, `/teachers/exams`, `/teachers/elearning`, `/teachers/timetable`, `/teachers/communications`, `/teachers/leave`
- `/students` — Student/Parent portal
  - `/students/dashboard`, `/students/results` (PIN checker), `/students/fees`, `/students/timetable`, `/students/elearning`, `/students/exams` (CBT), `/students/communications`

(Public, unauthenticated route: a standalone `/results/check` or similar for the PIN-based checker, separate from the authenticated `/students` area, since some parents may want to check results without a full account.)

## 6. Data Model Notes (Supabase, high level)

Antigravity should design full schema/RLS, but at minimum expect these entities: `schools` (single row, for future-proofing), `terms`, `classes`, `subjects`, `class_subjects`, `students`, `guardians`, `student_guardians`, `teachers`, `teacher_class_subjects`, `timetable_slots`, `fee_structures`, `invoices`, `payments` (with Paystack reference), `receipts`, `exams`, `exam_questions`, `exam_options`, `exam_attempts`, `exam_answers`, `scores`, `report_cards`, `result_pins`, `attendance_records`, `leave_requests` (student and staff), `elearning_resources`, `communication_logs`, `notifications`, `audit_logs`.

## 7. Non-Functional Requirements

- **Security:** RLS on every table; no student can query another student's data; Paystack webhook/verification must be server-side only.
- **Performance:** Optimize for mobile/low-bandwidth; paginate lists; compress uploaded images.
- **Reliability:** Payment flow must be idempotent (no double-charging or duplicate receipts on retry).
- **Auditability:** Financial and result changes must be logged with actor and timestamp.
- **Usability:** Primary-school-appropriate UI for the student side — simple language, large buttons, minimal jargon (parents, not the 6–15-year-old pupils themselves, will likely operate most of the portal, but CBT exams may be taken directly by pupils, so that specific flow needs to be extra simple).

## 8. Testing & Acceptance Criteria

Antigravity must, in its own sandbox (no browser hand-off to Saviour):
- Create seed/test data across all entities.
- Walk through: admin creates a class/subject/teacher/student → assigns timetable → sets fee structure → parent pays via Paystack test mode → receipt auto-generates → teacher marks attendance → teacher creates a CBT exam → student takes it → score feeds into report card → admin generates result PIN → parent checks result via PIN → teacher logs a communication note → parent replies.
- Confirm RLS boundaries hold (a student cannot see another student's data; a teacher cannot edit another teacher's class).
- Report pass/fail per flow, and fix/re-test any failures before declaring the module done.

## 9. Open Questions for Saviour (Antigravity should surface, not assume, where critical)

- Exact grading scale/report card format currently used by the school (or should Antigravity propose a standard primary-school one?).
- Whether partial/installment fee payment is allowed.
- Whether SMS notifications are in scope now or a later phase (cost implication via an SMS provider).
- Academic session/term structure (3-term Nigerian standard assumed unless told otherwise).

---
*End of PRD.*
