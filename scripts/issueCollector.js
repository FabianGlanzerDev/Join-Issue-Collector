const ISSUE_COLLECTOR_LIMIT = 10;
const ISSUE_COLLECTOR_TIMEZONE = 'Europe/Vienna';
const TASKS_ENDPOINT = 'https://join-issue-default-rtdb.europe-west1.firebasedatabase.app/tasks.json';


/**
 * Formats one date as YYYY-MM-DD in the Issue Collector timezone.
 * @param {Date|string} value Date value to format.
 * @returns {string} Local calendar date or an empty string for invalid input.
 */
function getViennaDate(value) {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('en-CA', {
        timeZone: ISSUE_COLLECTOR_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}


/**
 * Counts successfully created AI email tickets for the current Vienna day.
 * @param {Record<string, object>|null} tasks Firebase task collection.
 * @returns {number} Number of email tickets created today.
 */
function countTodaysEmailTickets(tasks) {
    if (!tasks || typeof tasks !== 'object') return 0;

    const today = getViennaDate(new Date());

    return Object.values(tasks).filter((task) => {
        if (!task || typeof task !== 'object') return false;

        const isEmailTicket = task.source === 'email' && task.aiGenerated === true;
        return isEmailTicket && getViennaDate(task.createdAt) === today;
    }).length;
}


/**
 * Updates the Figma-style stakeholder screen with the current daily usage.
 * @param {number} count Current successful request count.
 */
function renderDailyLimit(count) {
    const safeCount = Math.min(Math.max(Number(count) || 0, 0), ISSUE_COLLECTOR_LIMIT);
    const isLimitReached = safeCount >= ISSUE_COLLECTOR_LIMIT;
    const counter = document.getElementById('requestCounter');
    const countNode = document.getElementById('requestCount');
    const mobileCounter = document.getElementById('mobileRequestCounter');
    const mobileCountNode = document.getElementById('mobileRequestCount');
    const availableView = document.getElementById('availableRequestView');
    const limitView = document.getElementById('limitReachedView');

    if (!counter || !countNode || !availableView || !limitView) return;

    countNode.textContent = String(safeCount);
    if (mobileCountNode) mobileCountNode.textContent = String(safeCount);
    counter.classList.toggle('is-limit-reached', isLimitReached);
    mobileCounter?.classList.toggle('is-limit-reached', isLimitReached);
    availableView.hidden = isLimitReached;
    limitView.hidden = !isLimitReached;
}


/**
 * Loads today's real request usage from Firebase.
 * The same Firebase task collection is used by n8n to enforce the daily limit.
 */
async function loadDailyLimit() {
    const status = document.getElementById('counterStatus');

    try {
        const response = await fetch(TASKS_ENDPOINT, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Firebase returned ${response.status}`);

        const tasks = await response.json();
        renderDailyLimit(countTodaysEmailTickets(tasks));

        if (status) status.textContent = '';
    } catch (error) {
        const countNode = document.getElementById('requestCount');
        const mobileCountNode = document.getElementById('mobileRequestCount');
        if (countNode) countNode.textContent = '–';
        if (mobileCountNode) mobileCountNode.textContent = '–';

        if (status) {
            status.textContent = 'Live request usage is temporarily unavailable. The 10-request limit is still enforced by n8n from Firebase.';
        }

        console.warn('Could not load Issue Collector daily usage.', error);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    loadDailyLimit();
    initializeStakeholderRequestForm();
});


const ISSUE_COLLECTOR_EMAIL = 'fabian.glanzer99+join@gmail.com';


/** Sets validation events and today's minimum date for the request form. */
function initializeRequestFieldValidation() {
    const form = document.getElementById('stakeholderRequestForm');
    const deadline = document.getElementById('requestDeadline');

    form?.setAttribute('novalidate', 'novalidate');
    form?.addEventListener('invalid', preventNativeRequestValidation, true);
    if (deadline) deadline.min = getViennaDate(new Date());

    bindRequestFieldValidation('requestSubject', 'requestSubjectError');
    bindRequestFieldValidation('requestMessage', 'requestMessageError');
    deadline?.addEventListener('input', validateRequestDeadline);
    deadline?.addEventListener('change', validateRequestDeadline);
    deadline?.addEventListener('blur', validateRequestDeadline);
}


/** Prevents browser validation bubbles so Join can show its own stable inline errors. */
function preventNativeRequestValidation(event) {
    event.preventDefault();
}


/** Wires live clearing of a required request-field error. */
function bindRequestFieldValidation(inputId, errorId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('input', () => {
        if (input.value.trim()) setRequestFieldError(inputId, errorId, '');
    });
}


/** Shows or clears one custom request-form error without layout movement. */
function setRequestFieldError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (!input || !error) return;

    input.classList.toggle('input-error', Boolean(message));
    input.setAttribute('aria-invalid', String(Boolean(message)));
    error.textContent = message;
}


/** Validates one required request field. */
function validateRequiredRequestField(inputId, errorId) {
    const input = document.getElementById(inputId);
    if (!input) return true;

    const valid = Boolean(input.value.trim());
    setRequestFieldError(inputId, errorId, valid ? '' : 'Please fill in this field');
    return valid;
}


/** Validates the optional deadline against today's Vienna calendar date. */
function validateRequestDeadline() {
    const input = document.getElementById('requestDeadline');
    if (!input) return true;

    const valid = !input.value || input.value >= getViennaDate(new Date());
    setRequestFieldError('requestDeadline', 'requestDeadlineError',
        valid ? '' : 'Please enter a current or future date');
    return valid;
}


/** Validates the complete stakeholder request form with custom messages. */
function validateStakeholderRequestForm() {
    const subjectValid = validateRequiredRequestField('requestSubject', 'requestSubjectError');
    const messageValid = validateRequiredRequestField('requestMessage', 'requestMessageError');
    const deadlineValid = validateRequestDeadline();
    return subjectValid && messageValid && deadlineValid;
}


/** Focuses the first invalid request field after custom validation. */
function focusFirstInvalidRequestField() {
    const invalid = document.querySelector('.stakeholder-request-form .input-error');
    invalid?.focus();
}


/** Opens the request form without invoking an operating-system mail handler. */
function openRequestForm() {
    const panel = document.getElementById('requestFormPanel');
    if (!panel) return;

    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('requestMessage')?.focus();
}


/** Closes the optional request form. */
function closeRequestForm() {
    const panel = document.getElementById('requestFormPanel');
    if (panel) panel.hidden = true;
}


/** Returns the email body generated from the stakeholder form. */
function getStakeholderRequestBody() {
    const request = document.getElementById('requestMessage')?.value.trim() || '';
    const deadline = document.getElementById('requestDeadline')?.value || '';

    return [
        'Please process this Join Issue Collector request.',
        '',
        'Request:',
        request,
        '',
        `Optional deadline: ${deadline || 'none specified'}`
    ].join('\n');
}


/** Returns copyable request details for users without a supported webmail account. */
function getCopyableRequestDetails() {
    const subject = document.getElementById('requestSubject')?.value.trim() || 'Join Issue Request';
    const body = getStakeholderRequestBody();

    return `To: ${ISSUE_COLLECTOR_EMAIL}\nSubject: ${subject}\n\n${body}`;
}


/** Shows a short request-form status message. */
function setRequestFormStatus(message) {
    const status = document.getElementById('requestFormStatus');
    if (status) status.textContent = message;
}


/** Copies the Issue Collector address without using mailto. */
async function copyIssueCollectorEmail() {
    const copied = await copyTextToClipboard(ISSUE_COLLECTOR_EMAIL);
    setRequestFormStatus(copied ? 'Email address copied.' : 'Could not copy the email address.');
}


/** Copies the prepared email request to the clipboard. */
async function copyPreparedRequest() {
    if (!validateStakeholderRequestForm()) {
        focusFirstInvalidRequestField();
        return;
    }

    const copied = await copyTextToClipboard(getCopyableRequestDetails());
    setRequestFormStatus(copied ? 'Email details copied. Paste them into any webmail service.' : 'Could not copy the request.');
}


/** Opens the selected browser-based webmail composer or copies the request details. */
async function submitStakeholderRequest(event) {
    event.preventDefault();

    if (!validateStakeholderRequestForm()) {
        focusFirstInvalidRequestField();
        return;
    }

    const subject = document.getElementById('requestSubject')?.value.trim() || 'Join Issue Request';
    const provider = document.getElementById('requestProvider')?.value || 'gmail';
    const body = getStakeholderRequestBody();

    if (provider === 'copy') {
        await copyPreparedRequest();
        return;
    }

    const url = buildWebmailComposeUrl(provider, ISSUE_COLLECTOR_EMAIL, subject, body);
    window.open(url, '_blank', 'noopener,noreferrer');
    setRequestFormStatus('Webmail opened in a new tab. Send the prepared message there.');
}


/** Wires the stakeholder request form and email-copy controls. */
function initializeStakeholderRequestForm() {
    initializeRequestFieldValidation();

    document.querySelectorAll('[data-open-request-form]').forEach((button) => {
        button.addEventListener('click', openRequestForm);
    });

    document.querySelectorAll('[data-copy-email]').forEach((button) => {
        button.addEventListener('click', copyIssueCollectorEmail);
    });

    document.getElementById('closeRequestForm')?.addEventListener('click', closeRequestForm);
    document.getElementById('copyRequestButton')?.addEventListener('click', copyPreparedRequest);
    document.getElementById('stakeholderRequestForm')?.addEventListener('submit', submitStakeholderRequest);
}
