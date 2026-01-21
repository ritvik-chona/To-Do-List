// AUDIO API FOR SOUND EFFECTS

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, audioContext.currentTime + duration);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// STATE MANAGEMENT

let tasks = [];
let currentFilter = 'all';
let searchQuery = '';
let editingTaskId = null;

// DOM ELEMENT REFERENCES

const taskInput = document.getElementById('taskInput');
const categorySelect = document.getElementById('categorySelect');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const feedbackMessage = document.getElementById('feedbackMessage');
const clearAllBtn = document.getElementById('clearAllBtn');

const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const completedCount = document.getElementById('completedCount');
const completionRate = document.getElementById('completionRate');
const categoryStats = document.getElementById('categoryStats');

// LOCALSTORAGE FUNCTIONS

function loadTasksFromStorage() {
    try {
        const stored = localStorage.getItem('tasks');
        if (stored) {
            tasks = JSON.parse(stored);
            console.log('✅ Loaded', tasks.length, 'tasks from storage');
        }
    } catch (error) {
        console.error('❌ Error loading tasks:', error);
        showFeedback('Error loading saved tasks', 'error');
        tasks = [];
    }
}

function saveTasksToStorage() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        console.log('💾 Saved', tasks.length, 'tasks to storage');
    } catch (error) {
        console.error('❌ Error saving tasks:', error);
        showFeedback('Error saving tasks', 'error');
    }
}

// FEEDBACK MESSAGE SYSTEM

function showFeedback(message, type = 'success') {
    feedbackMessage.textContent = message;
    feedbackMessage.className = `feedback-message ${type}`;
    feedbackMessage.style.display = 'block';
    
    setTimeout(() => {
        feedbackMessage.style.display = 'none';
    }, 3000);
}

// FILTERING & SEARCHING LOGIC

function FilteredTasks() {
    let filtered = tasks;
    
    if (searchQuery.trim() !== '') {
        filtered = filtered.filter(task => 
            task.text.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    if (currentFilter === 'all') {
    } else if (currentFilter === 'active') {
        filtered = filtered.filter(task => !task.done);
    } else if (currentFilter === 'completed') {
        filtered = filtered.filter(task => task.done);
    } else {
        filtered = filtered.filter(task => task.category === currentFilter);
    }
    
    return filtered;
}

// RENDER TASKS

function renderTasks() {
    const taskItems = todoList.querySelectorAll('.todo-item');
    taskItems.forEach(item => item.remove());
    
    const filteredTasks = FilteredTasks();
    
    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
        const emptyMsg = emptyState.querySelector('p');
        
        if (tasks.length === 0) {
            emptyMsg.textContent = 'No tasks yet. Start by adding one above!';
        } else if (searchQuery.trim() !== '') {
            emptyMsg.textContent = `No tasks match "${searchQuery}"`;
        } else {
            emptyMsg.textContent = `No ${currentFilter} tasks. Try a different filter!`;
        }
        
        updateStats();
        return;
    } else {
        emptyState.style.display = 'none';
    }

    filteredTasks.forEach((task) => {
        const li = document.createElement('li');
        li.className = `todo-item ${task.done ? 'done' : ''}`;
        li.setAttribute('data-task-id', task.id);
        
        const checkbox = document.createElement('div');
        checkbox.className = 'checkbox';
        checkbox.addEventListener('click', () => toggleTask(task.id));
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'todo-content';
        
        const textSpan = document.createElement('span');
        textSpan.className = 'todo-text';
        textSpan.textContent = task.text;
        
        const categorySpan = document.createElement('span');
        categorySpan.className = `todo-category category-${task.category}`;
        categorySpan.textContent = getCategoryEmoji(task.category) + ' ' + task.category;
        
        contentDiv.appendChild(textSpan);
        contentDiv.appendChild(categorySpan);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'todo-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => editTask(task.id, li));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        
        li.appendChild(checkbox);
        li.appendChild(contentDiv);
        li.appendChild(actionsDiv);
        
        todoList.appendChild(li);
    });

    updateStats();
}

// HELPER FUNCTIONS

function getCategoryEmoji(category) {
    const emojis = {
        work: '🏢',
        personal: '👤',
        urgent: '🚨',
        other: '📌'
    };
    return emojis[category] || '📌';
}

function findTaskById(id) {
    return tasks.find(task => task.id === id);
}

// DUPLICATE DETECTION (TEXT + CATEGORY)

function isDuplicate(text, category) {
    const normalText = text.trim().toLowerCase();
    
    const duplicate = tasks.find(task => 
        task.text.toLowerCase() === normalText && 
        task.category === category
    );
    
    if (duplicate) {
        setTimeout(() => {
            const duplicateElement = document.querySelector(`[data-task-id="${duplicate.id}"]`);
            if (duplicateElement) {
                duplicateElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                duplicateElement.style.border = '3px solid #ffaa00';
                duplicateElement.style.boxShadow = '0 0 20px rgba(255, 170, 0, 0.5)';
                
                setTimeout(() => {
                    duplicateElement.style.border = '2px solid transparent';
                    duplicateElement.style.boxShadow = 'none';
                }, 2000);
            }
        }, 100);
        
        return true;
    }
    
    return false;
}

// INPUT VALIDATION

function validateTaskInput(text) {
    if (text.trim() === '') {
        showFeedback('⚠️ Please enter a task!', 'error');
        taskInput.focus();
        return false;
    }
    
    if (text.length > 200) {
        showFeedback('⚠️ Task is too long (max 200 characters)', 'error');
        return false;
    }
    
    return true;
}

// ADD TASK WITH DUPLICATE CHECK

function addTask() {
    const text = taskInput.value.trim();
    const category = categorySelect.value;
    
    if (!validateTaskInput(text)) {
        return;
    }
    
    if (isDuplicate(text, category)) {
        showFeedback(`⚠️ This task already exists in ${category} category!`, 'warning');
        taskInput.focus();
        taskInput.select(); 
        playSound(400, 0.2); 
        return;
    }

    // Create new task
    const newTask = {
        id: Date.now(),
        text: text,
        category: category,
        done: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    saveTasksToStorage();
    
    taskInput.value = '';
    taskInput.focus();
    
    playSound(600, 0.2);
    showFeedback('✅ Task added successfully!', 'success');
    
    renderTasks();
    
    console.log('✅ Added task:', newTask);
}

// TOGGLE TASK

function toggleTask(id) {
    const task = findTaskById(id);
    if (!task) return;
    
    task.done = !task.done;
    saveTasksToStorage();
    
    if (task.done) {
        playSound(800, 0.3);
        showFeedback('🎉 Task completed!', 'success');
    } else {
        playSound(400, 0.2);
        showFeedback('Task marked as active', 'success');
    }
    
    renderTasks();
}

// EDIT TASK

function editTask(id, listItem) {
    if (editingTaskId !== null) {
        showFeedback('⚠️ Please save or cancel current edit first', 'warning');
        return;
    }
    
    const task = findTaskById(id);
    if (!task) return;
    
    editingTaskId = id;
    
    const contentDiv = listItem.querySelector('.todo-content');
    const actionsDiv = listItem.querySelector('.todo-actions');
    
    const originalContent = contentDiv.innerHTML;
    
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'edit-input';
    editInput.value = task.text;
    editInput.maxLength = 200;
    
    contentDiv.innerHTML = '';
    contentDiv.appendChild(editInput);
    editInput.focus();
    editInput.select();
    
    actionsDiv.innerHTML = '';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.textContent = 'Save';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = 'Cancel';
    
    function saveEdit() {
        const newText = editInput.value.trim();
        
        if (!validateTaskInput(newText)) {
            editInput.focus();
            return;
        }
        
        // Check if new text is duplicate in SAME category (but ignore current task)
        const normalizedNewText = newText.toLowerCase();
        const duplicateExists = tasks.some(t => 
            t.id !== id && 
            t.text.toLowerCase() === normalizedNewText && 
            t.category === task.category
        );
        
        if (duplicateExists) {
            showFeedback(`⚠️ A task with this text already exists in ${task.category} category!`, 'warning');
            editInput.focus();
            editInput.select();
            return;
        }
        
        task.text = newText;
        saveTasksToStorage();
        editingTaskId = null;
        showFeedback('✅ Task updated!', 'success');
        renderTasks();
    }
    
    function cancelEdit() {
        editingTaskId = null;
        contentDiv.innerHTML = originalContent;
        renderTasks();
        showFeedback('Edit cancelled', 'warning');
    }
    
    saveBtn.addEventListener('click', saveEdit);
    cancelBtn.addEventListener('click', cancelEdit);
    
    editInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        }
    });
    
    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cancelEdit();
        }
    });
    
    actionsDiv.appendChild(saveBtn);
    actionsDiv.appendChild(cancelBtn);
}

// DELETE TASK

function deleteTask(id) {
    const task = findTaskById(id);
    if (!task) return;
    
    if (confirm(`Delete task: "${task.text}"?`)) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasksToStorage();
        playSound(300, 0.2);
        showFeedback('🗑️ Task deleted', 'success');
        renderTasks();
    }
}

// CLEAR ALL

function clearAllTasks() {
    if (tasks.length === 0) {
        showFeedback('No tasks to clear', 'warning');
        return;
    }
    
    const count = tasks.length;
    if (confirm(`Delete all ${count} tasks? This cannot be undone.`)) {
        tasks = [];
        saveTasksToStorage();
        showFeedback(`🗑️ All ${count} tasks cleared`, 'success');
        renderTasks();
    }
}

// UPDATE STATISTICS

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.done).length;
    const active = total - completed;
    const completion = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    totalCount.textContent = total;
    activeCount.textContent = active;
    completedCount.textContent = completed;
    completionRate.textContent = completion + '%';
    
    const workCount = tasks.filter(t => t.category === 'work').length;
    const personalCount = tasks.filter(t => t.category === 'personal').length;
    const urgentCount = tasks.filter(t => t.category === 'urgent').length;
    const otherCount = tasks.filter(t => t.category === 'other').length;
    
    if (total > 0) {
        categoryStats.innerHTML = `
            <div style="margin-top: 10px;">
                🏢 Work: <strong>${workCount}</strong> • 
                👤 Personal: <strong>${personalCount}</strong> • 
                🚨 Urgent: <strong>${urgentCount}</strong> • 
                📌 Other: <strong>${otherCount}</strong>
            </div>
        `;
    } else {
        categoryStats.innerHTML = '';
    }
}

// SEARCH SETUP

function setupSearch() {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderTasks();
        
        if (searchQuery.trim() !== '') {
            console.log('🔍 Searching for:', searchQuery);
        }
    });
}

// FILTER BUTTONS

function setupFilterButtons() {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderTasks();
            console.log('🔍 Filter changed to:', currentFilter);
        });
    });
}

// EVENT LISTENERS

addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

clearAllBtn.addEventListener('click', clearAllTasks);

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
    }
});

// INITIALIZE

function initApp() {
    console.log('Initializing Task Manager...');
    
    loadTasksFromStorage();
    setupSearch();
    setupFilterButtons();
    renderTasks();
    
    if (tasks.length === 0 && !localStorage.getItem('hasVisited')) {
        showFeedback('👋 Welcome! Add your first task to get started', 'success');
        localStorage.setItem('hasVisited', 'true');
    }
    
    console.log('✅ App initialized successfully!');
    console.log('📊 Loaded', tasks.length, 'tasks');
}

initApp();
