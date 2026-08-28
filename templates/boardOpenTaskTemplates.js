/**
 * Returns the task detail dialog.
 * @param {Object} task - Prepared task view data.
 * @returns {string} The dialog HTML.
 */
function getOpenTaskDialogTemplate(task) {
    const aiLabel = task.aiGenerated
        ? `<span class="open-task-ai-label"><img class="open-task-ai-icon" src="../assets/icons/ai-generated-icon.png" alt=""><span>AI-generated ticket</span></span>`
        : '';
    const creatorAction = task.creatorActionHref
        ? `<a class="creator-action" href="${task.creatorActionHref}"><img src="../assets/icons/${task.creatorActionIcon}" alt="">${task.creatorActionLabel}</a>`
        : '';

    return `
        <div class="task-dialog-backdrop" id="openTaskDialog" role="dialog" aria-modal="true" aria-labelledby="openTaskTitle" tabindex="-1">
            <section class="dialog-creator" data-task-id="${task.id}">
                <header class="open-task-header">
                    <div class="open-task-header-main">
                        <span class="open-task-category ${task.categoryClass}">${task.category}</span>
                        ${aiLabel}
                    </div>
                    <button class="open-task-close" type="button" aria-label="Close dialog">&times;</button>
                </header>
                <div class="open-task-content">
                    <h1 id="openTaskTitle">${task.title}</h1>
                    <p class="open-task-description">${task.description}</p>
                    <div class="open-task-creator-row">
                        <span class="open-task-label">Creator:</span>
                        <span class="creator-badge ${task.creatorTypeClass}"><img src="../assets/icons/${task.creatorTypeIcon}" alt="">${task.creatorType}</span>
                        <span class="creator-name" title="${task.creator}">${task.creator}</span>
                        ${creatorAction}
                    </div>
                    <div class="open-task-row"><span class="open-task-label">Due date:</span><span>${task.dueDate}</span></div>
                    <div class="open-task-row"><span class="open-task-label">Priority:</span><span class="open-task-priority">${task.priorityLabel}
                        <img src="../assets/icons/${task.priorityIcon}" alt=""></span></div>
                    <div class="open-task-section"><span>Assigned To:</span><div class="open-task-contacts">${task.contacts}</div></div>
                    <div class="open-task-section"><span>Subtasks</span><div class="open-task-subtasks">${task.subtasks}</div></div>
                </div>
                <footer class="open-task-actions">
                    <button class="open-task-delete" type="button"><img src="../assets/icons/delete.webp" alt="">Delete</button>
                    <span class="open-task-action-divider"></span>
                    <button class="open-task-edit" type="button"><img src="../assets/icons/edit.webp" alt="">Edit</button>
                </footer>
            </section>
        </div>`;
}


/**
 * Returns the assigned-contact entry for the task detail dialog.
 * @param {Object} contact - Prepared contact view data.
 * @returns {string} The assigned-contact HTML.
 */
function getOpenTaskContactTemplate(contact) {
    return `<div class="open-task-contact"><span class="dialog-contact-avatar" style="background:${contact.color};color:${contact.textColor}">${contact.initials}</span><span>${contact.name}</span></div>`;
}


/**
 * Returns one selectable subtask entry for the task detail dialog.
 * @param {Object} subtask - The subtask data.
 * @returns {string} The subtask HTML.
 */
function getOpenTaskSubtaskTemplate(subtask) {
    return `<label class="open-task-subtask"><span class="custom-checkbox-wrapper">
        <input type="checkbox" data-subtask-id="${subtask.id}" ${subtask.completed ? "checked" : ""}>
        <span class="custom-checkbox" aria-hidden="true"></span>
        </span><span>${subtask.title}</span></label>`;
}
