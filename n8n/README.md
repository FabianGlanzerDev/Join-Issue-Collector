# n8n integration

This folder documents the two live Join Issue Collector workflows used for the dedicated Gmail intake address:

`fabian.glanzer99+join@gmail.com`

Credentials, passwords, API keys, OAuth tokens, Firebase secrets, and n8n encryption keys are not stored in this repository.

## Workflow 01: Gmail intake + AI + Firebase + responses

The first workflow handles incoming stakeholder emails from intake through AI analysis, ticket creation, response email, and mailbox filing.

### Integration setup

The live workflow uses:

- Gmail OAuth2 for the Gmail Trigger, response emails, and mailbox label operations
- the Gmail labels `erledigt` and `zu bearbeiten`
- Google Gemini in `Google Gemini Chat Model` for AI-based ticket analysis
- Firebase Realtime Database as the Join task storage
- the Join Firebase database:
  `https://join-issue-default-rtdb.europe-west1.firebasedatabase.app/`

All credentials are configured directly in n8n and are intentionally excluded from the repository.

### Live processing flow

1. `Gmail Trigger`
2. `Normalize Incoming Email`
3. `Email Is Processable?`
4. `Load Daily Requests from Firebase`
5. `Check Daily Limit`
6. `Daily Limit Reached?`
7. If the limit is not reached: `AI Ticket Triage`
8. `Build Join Task Candidate`
9. `AI Output Valid?`
10. `Ready for Firebase`
11. `Create Task in Firebase`
12. `Prepare Firebase Result`
13. `Firebase Task Created?`
14. On success: `Firebase Ticket Created`
15. `Prepare Success Email`
16. `Send Success Email (Gmail)`
17. `Success Response Sent`
18. The source message receives the `erledigt` label, is removed from `INBOX`, and is marked as read.

Validation, AI, or Firebase failures use the error-response branch. Messages that require manual review are filed under `zu bearbeiten`.

## Daily limit / cost airbag

The Issue Collector supports a maximum of **10 successfully created email tickets per Europe/Vienna calendar day**.

Firebase tasks are the single source of truth. Before the AI call, `Load Daily Requests from Firebase` reads `/tasks.json`. `Check Daily Limit` counts only tasks where:

- `source === "email"`
- `aiGenerated === true`
- `createdAt` belongs to the current `Europe/Vienna` calendar day

The stakeholder page uses the same rules against the same Firebase collection. The displayed `x of 10` value and the n8n backend decision therefore use the same data source.

At 10 successful tickets:

- the next incoming request is blocked before the AI call
- no additional Firebase ticket is created
- the sender receives the automatic daily-limit response

A new Vienna calendar day automatically starts with a count of zero until the first email ticket of that day is successfully created.

## AI ticket rules

The AI output contains:

- `title`
- `description`
- `category`: `Technical Task`, `User Story`, or `Bug Request`
- `priority`: `urgent`, `medium`, or `low`
- `dueDate`: `YYYY-MM-DD` only when a deadline exists, otherwise an empty string
- `subtasks`: only explicitly stated sub-items, maximum six

Every automatically created ticket starts with:

- `column: "triage"`
- `source: "email"`
- `creatorType: "external"`
- `aiGenerated: true`
- `creatorEmail` and `creatorName` from the incoming email

The description includes the visible notice:

`Dieses Ticket wurde KI-generiert.`

## Workflow 02: status notifications

The second workflow polls the current Join tasks and compares each task's board column with the last successfully notified column.

### Live processing flow

1. `Schedule Trigger` — currently every 5 minutes
2. `HTTP Request` — GET `/tasks.json`
3. `KI-Tickets vorbereiten`
4. `Baseline nötig?`
   - true → `Baseline in Firebase speichern`
   - false → `Status geändert?`
5. `Status geändert?`
   - true → `Status-E-Mail vorbereiten`
   - false → end
6. `Status-E-Mail senden`
7. `Benachrichtigungsstatus speichern`

### Monitored tickets

`KI-Tickets vorbereiten` keeps every task that contains a usable `creatorEmail`.

Status notifications therefore work for:

- email-generated stakeholder tickets with `creatorType: "external"`
- manually created Join tickets whose logged-in creator is stored with `creatorType: "internal"`

The workflow is not limited to `aiGenerated: true` tickets.

### Baseline and duplicate protection

Newly created Join and email tickets initialize `lastNotifiedColumn` with `triage`, so the first real move out of Triage can be detected immediately. Older tickets without `lastNotifiedColumn` still receive a baseline on their first Workflow 02 run, and no status email is sent for that initial baseline.

A notification is sent only when:

`task.column !== task.lastNotifiedColumn`

After Gmail successfully sends the notification, `Benachrichtigungsstatus speichern` PATCHes the task and stores the current column as `lastNotifiedColumn`.

A repeated workflow execution without another board move therefore does not send a duplicate email.

Readable mail labels include:

- `triage` → `Triage`
- `todo` / `to-do` → `To do`
- `inprogress` / `in-progress` / `in_progress` → `In progress`
- `awaitfeedback` / `await-feedback` / `await_feedback` → `Await feedback`
- `done` → `Done`

## Firebase paths

Workflow 01 creates tickets under:

`/tasks.json`

Workflow 02 reads the same `/tasks.json` collection and PATCHes individual tasks under:

`/tasks/{taskId}.json`

Guest Join data is isolated under `/users/guest/...` and is not used as the production stakeholder notification source.

## Implemented end-to-end behavior

The completed implementation covers the following flows:

- stakeholder emails are received through the dedicated Gmail intake address
- email sender, subject, and body are normalized before processing
- AI output is transformed into the Join ticket schema
- successfully processed tickets are created in the `Triage` column
- the sender receives a confirmation email after successful ticket creation
- processed Gmail messages are filed automatically
- validation, AI, and Firebase failures use the error/manual-review branch
- the daily request counter is based on successfully created Firebase tickets
- requests beyond the daily limit are blocked before the AI call
- the stakeholder page and n8n use the same Firebase-based daily count
- status changes generate an email notification for the stored ticket creator
- repeated workflow executions without another status change do not create duplicate notifications
- manually created Join tickets can notify their internal creator after a status change

The workflow exports in this folder represent the published n8n workflows used by the project.

## Security note

The repository does not contain service-account keys, OAuth tokens, API secrets, passwords, or n8n encryption keys.

The current Firebase access model should be reviewed before a public production deployment. Tightening Firebase rules may require authenticated database requests from Join and n8n, so related application flows would need to be validated again after such a change.
