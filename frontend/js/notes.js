// Notes Management
const saveIndicator = document.getElementById('saveIndicator');
let saveTimeout = null;
let lastSavedNotes = '';

// Character Counter
notesArea.addEventListener('input', () => {
    const charCount = notesArea.value.length;
    document.getElementById('characterCount').textContent = `${charCount} characters`;
    
    // Trigger auto-save
    autoSaveNotes();
});

// Auto-save Notes
function autoSaveNotes() {
    // Clear existing timeout
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    
    // Show saving indicator
    saveIndicator.textContent = 'Saving...';
    saveIndicator.classList.add('saving');
    saveIndicator.classList.remove('saved');
    
    // Set new timeout (debounce - wait 2 seconds after user stops typing)
    saveTimeout = setTimeout(async () => {
        await saveNotesToServer();
    }, 2000);
}

// Save Notes to Server
async function saveNotesToServer() {
    if (!timerState.currentSessionId) return;
    
    const currentNotes = notesArea.value;
    
    // Don't save if notes haven't changed
    if (currentNotes === lastSavedNotes) {
        saveIndicator.classList.remove('saving');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/sessions/${timerState.currentSessionId}/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                notes: currentNotes
            })
        });
        
        if (response.ok) {
            lastSavedNotes = currentNotes;
            saveIndicator.textContent = 'Saved';
            saveIndicator.classList.remove('saving');
            saveIndicator.classList.add('saved');
            
            // Hide indicator after 2 seconds
            setTimeout(() => {
                saveIndicator.classList.remove('saved');
            }, 2000);
        }
    } catch (error) {
        console.error('Error saving notes:', error);
        saveIndicator.textContent = 'Error saving';
        saveIndicator.classList.remove('saving');
        saveIndicator.style.color = '#ff6b6b';
        
        setTimeout(() => {
            saveIndicator.style.color = '';
        }, 3000);
    }
}

// AI Assistant Functionality
const aiAssistBtn = document.getElementById('aiAssistBtn');
const aiPanel = document.getElementById('aiPanel');
const closeAiBtn = document.getElementById('closeAiBtn');
const aiQueryText = document.getElementById('aiQueryText');
const submitAiQuery = document.getElementById('submitAiQuery');
const aiResponse = document.getElementById('aiResponse');
const aiResponseText = document.getElementById('aiResponseText');
const aiLoading = document.getElementById('aiLoading');
const insertAiResponse = document.getElementById('insertAiResponse');

let currentAiResponse = '';

// Open AI Panel
aiAssistBtn.addEventListener('click', () => {
    aiPanel.classList.remove('hidden');
    
    // Check if user has text selected in notes
    const selectedText = getSelectedText();
    if (selectedText) {
        aiQueryText.value = selectedText;
    }
    
    aiQueryText.focus();
});

// Close AI Panel
closeAiBtn.addEventListener('click', () => {
    aiPanel.classList.add('hidden');
    aiResponse.classList.add('hidden');
});

// Get Selected Text from Notes Area
function getSelectedText() {
    const start = notesArea.selectionStart;
    const end = notesArea.selectionEnd;
    return notesArea.value.substring(start, end);
}

// Submit AI Query
submitAiQuery.addEventListener('click', async () => {
    const query = aiQueryText.value.trim();
    
    if (!query) {
        alert('Please enter a topic or question for the AI assistant');
        return;
    }
    
    // Show loading, hide response
    aiLoading.classList.remove('hidden');
    aiResponse.classList.add('hidden');
    submitAiQuery.disabled = true;
    
    try {
        // NOTE: This is a placeholder since we haven't implemented the AI endpoint yet
        // For now, we'll simulate an AI response
        const response = await getAiResponse(query);
        
        currentAiResponse = response;
        aiResponseText.textContent = response;
        
        // Show response, hide loading
        aiLoading.classList.add('hidden');
        aiResponse.classList.remove('hidden');
        submitAiQuery.disabled = false;
        
    } catch (error) {
        console.error('Error getting AI response:', error);
        alert('Failed to get AI response. This feature requires backend AI integration.');
        
        aiLoading.classList.add('hidden');
        submitAiQuery.disabled = false;
    }
});

// Get AI Response (Placeholder - will be replaced with actual API call)
async function getAiResponse(query) {
    // TODO: Replace this with actual Azure OpenAI API call
    // For now, return a simulated response
    
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`AI Response for "${query}":\n\nThis is a placeholder response. To enable real AI assistance, you need to:\n\n1. Set up Azure OpenAI API\n2. Add your API key to backend .env file\n3. Implement the /api/ai/elaborate endpoint in app.py\n\nOnce configured, the AI will provide helpful explanations, formulas, and study assistance based on your query.`);
        }, 1500);
    });
}

// Insert AI Response into Notes
insertAiResponse.addEventListener('click', () => {
    if (currentAiResponse) {
        // Insert at cursor position or append to end
        const cursorPos = notesArea.selectionStart;
        const textBefore = notesArea.value.substring(0, cursorPos);
        const textAfter = notesArea.value.substring(cursorPos);
        
        notesArea.value = textBefore + '\n\n--- AI Assistant ---\n' + currentAiResponse + '\n--- End AI ---\n\n' + textAfter;
        
        // Trigger character count and auto-save
        const charCount = notesArea.value.length;
        document.getElementById('characterCount').textContent = `${charCount} characters`;
        autoSaveNotes();
        
        // Close AI panel
        aiPanel.classList.add('hidden');
        aiResponse.classList.add('hidden');
        
        // Show confirmation
        alert('AI response inserted into your notes!');
    }
});

// Keyboard Shortcuts for Notes
notesArea.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to manually save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNotesToServer();
    }
    
    // Ctrl/Cmd + K to open AI assistant
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        aiAssistBtn.click();
    }
});

// Prevent data loss on page unload
window.addEventListener('beforeunload', (e) => {
    if (timerState.currentSessionId && notesArea.value !== lastSavedNotes) {
        e.preventDefault();
        e.returnValue = '';
        saveNotesToServer();
    }
});
