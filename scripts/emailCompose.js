/** Returns one query parameter from the current composer URL. */
function getEmailComposeParameter(name) {
    return new URLSearchParams(window.location.search).get(name) || "";
}


/** Returns the current email details in a copy-friendly format. */
function getEmailComposeDetails() {
    const to = document.getElementById("emailComposeTo")?.value.trim() || "";
    const subject = document.getElementById("emailComposeSubject")?.value.trim() || "";
    const body = document.getElementById("emailComposeBody")?.value.trim() || "";

    return `To: ${to}\nSubject: ${subject}\n\n${body}`;
}


/** Shows a composer status message. */
function setEmailComposeStatus(message) {
    const status = document.getElementById("emailComposeStatus");
    if (status) status.textContent = message;
}


/** Updates one inline validation message without changing the layout height. */
function setEmailComposeError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);

    input?.classList.toggle("input-error", Boolean(message));
    input?.setAttribute("aria-invalid", String(Boolean(message)));

    if (error) error.textContent = message;
}


/** Clears one inline field error while the user corrects the value. */
function clearEmailComposeError(inputId, errorId) {
    setEmailComposeError(inputId, errorId, "");
}


/** Validates the fields required to prepare or copy an email. */
function validateEmailCompose() {
    const to = document.getElementById("emailComposeTo")?.value.trim() || "";
    const subject = document.getElementById("emailComposeSubject")?.value.trim() || "";
    const body = document.getElementById("emailComposeBody")?.value.trim() || "";

    setEmailComposeError(
        "emailComposeTo",
        "emailComposeToError",
        to ? "" : "No recipient email address is available"
    );
    setEmailComposeError(
        "emailComposeSubject",
        "emailComposeSubjectError",
        subject ? "" : "Please fill in this field"
    );
    setEmailComposeError(
        "emailComposeBody",
        "emailComposeBodyError",
        body ? "" : "Please fill in this field"
    );

    const firstInvalid = document.querySelector(".email-compose-form .input-error");

    if (firstInvalid) {
        firstInvalid.focus();
        setEmailComposeStatus("");
        return false;
    }

    return true;
}


/** Copies the current email details to the clipboard. */
async function copyEmailComposeDetails() {
    if (!validateEmailCompose()) return;

    const copied = await copyTextToClipboard(getEmailComposeDetails());
    setEmailComposeStatus(copied ? "Email details copied." : "Could not copy the email details.");
}


/** Opens the selected browser-based webmail composer. */
async function submitEmailCompose(event) {
    event.preventDefault();

    if (!validateEmailCompose()) return;

    const to = document.getElementById("emailComposeTo")?.value.trim() || "";
    const subject = document.getElementById("emailComposeSubject")?.value.trim() || "";
    const body = document.getElementById("emailComposeBody")?.value.trim() || "";
    const provider = document.getElementById("emailComposeProvider")?.value || "gmail";

    if (provider === "copy") {
        await copyEmailComposeDetails();
        return;
    }

    window.open(buildWebmailComposeUrl(provider, to, subject, body), "_blank", "noopener,noreferrer");
    setEmailComposeStatus("Webmail opened in a new tab.");
}


/** Adds live clearing for the custom inline validation messages. */
function initializeEmailComposeValidation() {
    document.getElementById("emailComposeSubject")?.addEventListener("input", () => {
        clearEmailComposeError("emailComposeSubject", "emailComposeSubjectError");
    });

    document.getElementById("emailComposeBody")?.addEventListener("input", () => {
        clearEmailComposeError("emailComposeBody", "emailComposeBodyError");
    });
}


/** Initializes the browser email composer. */
function initializeEmailCompose() {
    const toInput = document.getElementById("emailComposeTo");

    if (toInput) {
        toInput.value = getEmailComposeParameter("to");
        clearEmailComposeError("emailComposeTo", "emailComposeToError");
    }

    initializeEmailComposeValidation();
    document.getElementById("emailComposeCopy")?.addEventListener("click", copyEmailComposeDetails);
    document.getElementById("emailComposeForm")?.addEventListener("submit", submitEmailCompose);
}


document.addEventListener("DOMContentLoaded", initializeEmailCompose);
