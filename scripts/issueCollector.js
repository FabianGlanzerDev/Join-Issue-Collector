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


document.addEventListener('DOMContentLoaded', loadDailyLimit);
