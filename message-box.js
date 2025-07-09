// This script creates a custom message box element and appends it to the body.
// It's designed to be a global utility for displaying messages or confirmations,
// replacing browser's native alert() and confirm() functions.

document.addEventListener('DOMContentLoaded', function() {
    // Create the message box element
    const messageBox = document.createElement('div');
    messageBox.id = 'message-box';
    messageBox.classList.add('message-box'); // Apply CSS for styling
    document.body.appendChild(messageBox);
});
