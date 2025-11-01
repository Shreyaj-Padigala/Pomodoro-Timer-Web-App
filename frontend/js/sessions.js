// Session History Management
const historySection = document.getElementById('historySection');
const sessionsList = document.getElementById('sessionsList');
const tabs = document.querySelectorAll('.tab');
const timerSection = document.querySelector('.timer-section');
const notesSection = document.querySelector('.notes-section');

// Session Detail Modal
const sessionDetailModal = document.getElementById('sessionDetailModal');
const closeDetailBtn = document.getElementById('closeDetailBtn');
const detailSessionName = document.getElementById('detailSessionName');
const detailDuration = document.getElementById('detailDuration');
const detailPomodoros = document.getElementById('detailPomodoros');
const detailDate = document.getElementById('detailDate');
const detailNotes = document.getElementById('detailNotes');
const deleteSessionBtn = document.getElementById('deleteSessionBtn');
const exportNotesBtn = document.getElementById('exportNotesBtn');

let currentDetailSessionId = null;

// Tab Switching
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show/hide sections
        if (tabName === 'timer') {
            timerSection.style.display = 'block';
            notesSection.style.display = 'block';
            aiPanel.style.display = aiPanel.classList.contains('hidden') ? 'none' : 'block';
            historySection.classList.add('hidden');
        } else if (tabName === 'history') {
            timerSection.style.display = 'none';
            notesSection.style.display = 'none';
            aiPanel.style.display = 'none';
            historySection.classList.remove('hidden');
            loadSessionHistory();
        }
    });
});

// Load Session History
async function loadSessionHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/sessions`);
        
        if (!response.ok) {
            throw new Error('Failed to load sessions');
        }
        
        const sessions = await response.json();
        
        if (sessions.length === 0) {
            sessionsList.innerHTML = '<p class="no-sessions">No study sessions yet. Start your first session!</p>';
            return;
        }
        
        // Clear existing sessions
        sessionsList.innerHTML = '';
        
        // Create session cards
        sessions.forEach(session => {
            const card = createSessionCard(session);
            sessionsList.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading sessions:', error);
        sessionsList.innerHTML = '<p class="no-sessions">Error loading sessions. Make sure the backend is running.</p>';
    }
}

// Create Session Card
function createSessionCard(session) {
    const card = document.createElement('div');
    card.className = 'session-card';
    card.onclick = () => showSessionDetail(session.id);
    
    // Format date
    const date = new Date(session.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Preview notes (first 100 characters)
    const notesPreview = session.notes 
        ? (session.notes.substring(0, 100) + (session.notes.length > 100 ? '...' : ''))
        : 'No notes taken';
    
    card.innerHTML = `
        <h3>${session.session_name}</h3>
        <div class="session-meta">
            <span>⏱️ ${session.total_duration} min</span>
            <span>🍅 ${session.pomodoros_completed} Pomodoros</span>
        </div>
        <div class="session-meta">
            <span>📅 ${formattedDate}</span>
        </div>
        <div class="session-notes-preview">${notesPreview}</div>
    `;
    
    return card;
}

// Show Session Detail
async function showSessionDetail(sessionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
        
        if (!response.ok) {
            throw new Error('Failed to load session details');
        }
        
        const session = await response.json();
        currentDetailSessionId = sessionId;
        
        // Populate modal
        detailSessionName.textContent = session.session_name;
        detailDuration.textContent = `${session.total_duration} minutes`;
        detailPomodoros.textContent = session.pomodoros_completed;
        
        const date = new Date(session.created_at);
        detailDate.textContent = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        detailNotes.textContent = session.notes || 'No notes taken during this session.';
        
        // Show modal
        sessionDetailModal.classList.remove('hidden');
        sessionDetailModal.classList.add('active');
        
    } catch (error) {
        console.error('Error loading session details:', error);
        alert('Failed to load session details');
    }
}

// Close Session Detail Modal
closeDetailBtn.addEventListener('click', () => {
    sessionDetailModal.classList.remove('active');
    sessionDetailModal.classList.add('hidden');
    currentDetailSessionId = null;
});

// Close modal when clicking outside
sessionDetailModal.addEventListener('click', (e) => {
    if (e.target === sessionDetailModal) {
        closeDetailBtn.click();
    }
});

// Delete Session
deleteSessionBtn.addEventListener('click', async () => {
    if (!currentDetailSessionId) return;
    
    const confirmDelete = confirm('Are you sure you want to delete this study session? This cannot be undone.');
    
    if (!confirmDelete) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/sessions/${currentDetailSessionId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete session');
        }
        
        alert('Session deleted successfully');
        
        // Close modal and reload history
        closeDetailBtn.click();
        loadSessionHistory();
        
    } catch (error) {
        console.error('Error deleting session:', error);
        alert('Failed to delete session');
    }
});

// Export Notes
exportNotesBtn.addEventListener('click', () => {
    const sessionName = detailSessionName.textContent;
    const notes = detailNotes.textContent;
    const date = detailDate.textContent;
    
    // Create text file content
    const content = `Study Session: ${sessionName}\nDate: ${date}\n\n${notes}`;
    
    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionName.replace(/[^a-z0-9]/gi, '_')}_notes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Notes exported successfully!');
});

// Close session modal when clicking outside
sessionModal.addEventListener('click', (e) => {
    if (e.target === sessionModal) {
        closeSessionModal();
    }
});

// Initialize - load sessions on page load
document.addEventListener('DOMContentLoaded', () => {
    // Don't auto-load history, only load when user clicks the tab
    console.log('Pomodoro Study Timer initialized');
});
