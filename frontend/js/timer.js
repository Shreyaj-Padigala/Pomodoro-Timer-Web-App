// API Configuration
const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Timer State
let timerState = {
    state: 'IDLE', // IDLE, WORK, SHORT_BREAK, LONG_BREAK
    timeRemaining: 25 * 60, // seconds
    completedPomodoros: 0,
    interruptedPomodoros: 0,
    currentSessionId: null,
    interval: null,
    sessionStartTime: null,
    totalStudyTime: 0 // in seconds
};

// Timer Durations (in seconds)
const DURATIONS = {
    WORK: 25 * 60,
    SHORT_BREAK: 5 * 60,
    LONG_BREAK: 15 * 60
};

// DOM Elements
const timeDisplay = document.getElementById('timeDisplay');
const timerLabel = document.getElementById('timerLabel');
const timerCircle = document.getElementById('timerCircle');
const pomodoroCount = document.getElementById('pomodoroCount');
const startBtn = document.getElementById('startBtn');
const skipBtn = document.getElementById('skipBtn');
const endSessionBtn = document.getElementById('endSessionBtn');
const newSessionBtn = document.getElementById('newSessionBtn');
const sessionModal = document.getElementById('sessionModal');
const sessionNameInput = document.getElementById('sessionNameInput');
const startSessionBtn = document.getElementById('startSessionBtn');
const cancelSessionBtn = document.getElementById('cancelSessionBtn');
const currentSessionName = document.getElementById('currentSessionName');
const sessionStatus = document.getElementById('sessionStatus');
const notesArea = document.getElementById('notesArea');
const timerSound = document.getElementById('timerSound');

// Update Pomodoro Dots
function updatePomodoroDots() {
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`dot${i}`);
        if (i <= timerState.completedPomodoros % 4 || (timerState.completedPomodoros % 4 === 0 && timerState.completedPomodoros > 0 && i === 4)) {
            dot.classList.add('completed');
        } else {
            dot.classList.remove('completed');
        }
    }
    pomodoroCount.textContent = timerState.completedPomodoros;
}

// Format Time Display
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update Timer Display
function updateDisplay() {
    timeDisplay.textContent = formatTime(timerState.timeRemaining);
    
    // Update timer label and circle color
    switch(timerState.state) {
        case 'WORK':
            timerLabel.textContent = 'Focus Time';
            timerCircle.className = 'timer-circle work';
            break;
        case 'SHORT_BREAK':
            timerLabel.textContent = 'Short Break';
            timerCircle.className = 'timer-circle break';
            break;
        case 'LONG_BREAK':
            timerLabel.textContent = 'Long Break';
            timerCircle.className = 'timer-circle break';
            break;
        default:
            timerLabel.textContent = 'Ready';
            timerCircle.className = 'timer-circle';
    }
}

// Start Timer Countdown
function startTimer() {
    if (timerState.interval) {
        clearInterval(timerState.interval);
    }
    
    timerState.interval = setInterval(() => {
        timerState.timeRemaining--;
        
        // Track study time (only during WORK state)
        if (timerState.state === 'WORK') {
            timerState.totalStudyTime++;
        }
        
        updateDisplay();
        
        if (timerState.timeRemaining <= 0) {
            completeCurrentPhase();
        }
    }, 1000);
    
    // Update button states
    startBtn.textContent = 'Pause';
    startBtn.disabled = false;
    skipBtn.disabled = timerState.state === 'WORK'; // Can't skip work sessions
    endSessionBtn.disabled = false;
}

// Pause Timer
function pauseTimer() {
    if (timerState.interval) {
        clearInterval(timerState.interval);
        timerState.interval = null;
    }
    startBtn.textContent = 'Resume';
}

// Complete Current Phase
function completeCurrentPhase() {
    pauseTimer();
    playSound();
    
    if (timerState.state === 'WORK') {
        // Completed a Pomodoro!
        timerState.completedPomodoros++;
        updatePomodoroDots();
        updateSessionOnServer();
        
        // Determine next break type
        if (timerState.completedPomodoros % 4 === 0) {
            startLongBreak();
        } else {
            startShortBreak();
        }
        
        showNotification('Pomodoro Complete!', 'Great work! Time for a break.');
    } else {
        // Break completed
        showNotification('Break Over!', 'Ready to focus again?');
        startWorkSession();
    }
}

// Start Work Session
function startWorkSession() {
    timerState.state = 'WORK';
    timerState.timeRemaining = DURATIONS.WORK;
    updateDisplay();
    sessionStatus.textContent = 'Work session ready - Click Start to begin';
    startBtn.disabled = false;
    skipBtn.disabled = true;
}

// Start Short Break
function startShortBreak() {
    timerState.state = 'SHORT_BREAK';
    timerState.timeRemaining = DURATIONS.SHORT_BREAK;
    updateDisplay();
    sessionStatus.textContent = 'Take a 5-minute break';
    startBtn.disabled = false;
    skipBtn.disabled = false;
}

// Start Long Break
function startLongBreak() {
    timerState.state = 'LONG_BREAK';
    timerState.timeRemaining = DURATIONS.LONG_BREAK;
    updateDisplay();
    sessionStatus.textContent = 'Take a 15-minute long break';
    startBtn.disabled = false;
    skipBtn.disabled = false;
}

// Skip Break (only allowed during breaks)
function skipBreak() {
    if (timerState.state === 'SHORT_BREAK' || timerState.state === 'LONG_BREAK') {
        pauseTimer();
        startWorkSession();
    }
}

// Play Sound
function playSound() {
    timerSound.play().catch(err => console.log('Could not play sound:', err));
}

// Show Browser Notification
function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '🍅'
        });
    }
}

// Request Notification Permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Open Session Modal
function openSessionModal() {
    sessionModal.classList.add('active');
    sessionNameInput.value = '';
    sessionNameInput.focus();
}

// Close Session Modal
function closeSessionModal() {
    sessionModal.classList.remove('active');
}

// Start New Study Session
async function startNewSession() {
    const sessionName = sessionNameInput.value.trim();
    
    if (!sessionName) {
        alert('Please enter a study topic name');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/sessions/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session_name: sessionName })
        });
        
        if (!response.ok) {
            throw new Error('Failed to start session');
        }
        
        const session = await response.json();
        timerState.currentSessionId = session.id;
        timerState.completedPomodoros = 0;
        timerState.interruptedPomodoros = 0;
        timerState.totalStudyTime = 0;
        timerState.sessionStartTime = new Date();
        
        currentSessionName.textContent = sessionName;
        sessionStatus.textContent = 'Session started - Click Start to begin first Pomodoro';
        
        // Enable controls
        notesArea.disabled = false;
        notesArea.value = '';
        document.getElementById('aiAssistBtn').disabled = false;
        
        updatePomodoroDots();
        closeSessionModal();
        startWorkSession();
        
    } catch (error) {
        console.error('Error starting session:', error);
        alert('Failed to start session. Make sure the backend server is running.');
    }
}

// Update Session on Server
async function updateSessionOnServer() {
    if (!timerState.currentSessionId) return;
    
    try {
        await fetch(`${API_BASE_URL}/sessions/${timerState.currentSessionId}/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pomodoros_completed: timerState.completedPomodoros,
                pomodoros_interrupted: timerState.interruptedPomodoros,
                notes: notesArea.value
            })
        });
    } catch (error) {
        console.error('Error updating session:', error);
    }
}

// End Session
async function endSession() {
    if (!timerState.currentSessionId) return;
    
    const confirmEnd = confirm('Are you sure you want to end this study session?');
    if (!confirmEnd) return;
    
    pauseTimer();
    
    try {
        const totalMinutes = Math.floor(timerState.totalStudyTime / 60);
        
        await fetch(`${API_BASE_URL}/sessions/${timerState.currentSessionId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                total_duration: totalMinutes,
                pomodoros_completed: timerState.completedPomodoros,
                notes: notesArea.value
            })
        });
        
        // Reset state
        timerState = {
            state: 'IDLE',
            timeRemaining: 25 * 60,
            completedPomodoros: 0,
            interruptedPomodoros: 0,
            currentSessionId: null,
            interval: null,
            sessionStartTime: null,
            totalStudyTime: 0
        };
        
        currentSessionName.textContent = 'No Active Session';
        sessionStatus.textContent = 'Session ended! Click "New Session" to start another.';
        notesArea.value = '';
        notesArea.disabled = true;
        document.getElementById('aiAssistBtn').disabled = true;
        
        startBtn.disabled = true;
        skipBtn.disabled = true;
        endSessionBtn.disabled = true;
        
        updateDisplay();
        updatePomodoroDots();
        
        alert('Study session completed and saved!');
        
    } catch (error) {
        console.error('Error ending session:', error);
        alert('Failed to save session. Please try again.');
    }
}

// Handle Page Visibility (detect interruptions)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && timerState.state === 'WORK' && timerState.interval) {
        // User left during work session - this is an interruption
        const shouldInterrupt = confirm(
            'Leaving during a work session will mark this Pomodoro as interrupted and it will not count. Continue?'
        );
        
        if (shouldInterrupt) {
            pauseTimer();
            timerState.interruptedPomodoros++;
            updateSessionOnServer();
            startWorkSession(); // Reset to new work session
        }
    }
});

// Event Listeners
newSessionBtn.addEventListener('click', openSessionModal);
cancelSessionBtn.addEventListener('click', closeSessionModal);
startSessionBtn.addEventListener('click', startNewSession);

startBtn.addEventListener('click', () => {
    if (timerState.interval) {
        pauseTimer();
    } else {
        startTimer();
    }
});

skipBtn.addEventListener('click', skipBreak);
endSessionBtn.addEventListener('click', endSession);

// Allow Enter key to start session
sessionNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        startNewSession();
    }
});

// Initialize
updateDisplay();
updatePomodoroDots();
requestNotificationPermission();
