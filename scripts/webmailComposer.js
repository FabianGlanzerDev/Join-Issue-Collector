/**
 * Builds a browser-based email compose URL without relying on a local mail handler.
 * @param {string} provider Supported provider id.
 * @param {string} to Recipient address.
 * @param {string} subject Email subject.
 * @param {string} body Email body.
 * @returns {string} Webmail compose URL.
 */
function buildWebmailComposeUrl(provider, to, subject, body) {
    const recipient = encodeURIComponent(String(to || "").trim());
    const encodedSubject = encodeURIComponent(String(subject || ""));
    const encodedBody = encodeURIComponent(String(body || ""));

    if (provider === "outlook") {
        return `https://outlook.office.com/mail/deeplink/compose?to=${recipient}&subject=${encodedSubject}&body=${encodedBody}`;
    }

    if (provider === "yahoo") {
        return `https://compose.mail.yahoo.com/?to=${recipient}&subject=${encodedSubject}&body=${encodedBody}`;
    }

    return `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${encodedSubject}&body=${encodedBody}`;
}


/**
 * Copies text to the clipboard with an input fallback for older browsers.
 * @param {string} value Text to copy.
 * @returns {Promise<boolean>} Whether copying succeeded.
 */
async function copyTextToClipboard(value) {
    const text = String(value || "");

    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        return copied;
    }
}
