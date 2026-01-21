// Simple sound function
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
}

// Variables
let tasks = [];
let currentStatusFilter = 'all';  // all, active, completed
let currentCategoryFilter = 'all';  // all, work, personal, urgent, other
let searchText = '';
let editingId = null;

// Get elements
const taskInput = document.getElementById('taskInput');
const categorySelect = document.getElementById('categorySelect');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const emptyMessage = document.getElementById('emptyMessage');
const searchInput = document.getElementById('searchInput');
const categoryFilterDropdown = document.getElementById('categoryFilter');
const statusFilterRadios = document.querySelectorAll('input[name="filter"]');
const feedbackMessage = document.getElementById('feedbackMessage');
const clearBtn = document.getElementById('clearBtn');

// Stats elements
const totalTasks = document.getElementById('totalTasks');
const activeTasks = document.getElementById('activeTasks');
const completedTasks = document.getElementById('completedTasks');

// Load tasks from localStorage
function loadTasks() {
    try {
        const saved = localStorage.getItem('myTasks');
        if (saved) {
            tasks = JSON.parse(saved);
        }
    } catch (error) {
        console.log('Error loading tasks');
        tasks = [];
    }
}

// Save tasks to localStorage
function saveTasks() {
    try {
        localStorage.setItem('myTasks', JSON.stringify(tasks));
    } catch (error) {
        console.log('Error saving tasks');
    }
}

// Show feedback message
function showMessage(text, type) {
    feedbackMessage.textContent = text;
    feedbackMessage.className = 'feedback-message ' + type;
    feedbackMessage.style.display = 'block';
    
    setTimeout(function() {
        feedbackMessage.style.display = 'none';
    }, 3000);
}

// Check if task is duplicate
function checkDuplicate(text, category) {
    const lowerText = text.toLowerCase().trim();
    
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].text.toLowerCase() === lowerText && 
            tasks[i].category === category) {
            return true;
        }
    }
    return false;
}

// Get filtered tasks
function getFilteredTasks() {
    let result = tasks;
    
    // Apply search filter
    if (searchText) {
        result = result.filter(function(task) {
            return task.text.toLowerCase().includes(searchText.toLowerCase());
        });
    }
    
    // Apply status filter (all, active, completed)
    if (currentStatusFilter === 'active') {
        result = result.filter(function(task) {
            return !task.done;
        });
    } else if (currentStatusFilter === 'completed') {
        result = result.filter(function(task) {
            return task.done;
        });
    }
    
    // Apply category filter
    if (currentCategoryFilter !== 'all') {
        result = result.filter(function(task) {
            return task.category === currentCategoryFilter;
        });
    }
    
    return result;
}

// Render tasks
function renderTasks() {
    // Remove old tasks
    const oldTasks = taskList.querySelectorAll('.task-item');
    oldTasks.forEach(function(item) {
        item.remove();
    });
    
    const filtered = getFilteredTasks();
    
    // Show/hide empty message
    if (filtered.length === 0) {
        emptyMessage.style.display = 'block';
        
        // Custom empty message based on filters
        const emptyText = emptyMessage.querySelector('p');
        if (tasks.length === 0) {
            emptyText.textContent = 'No tasks yet. Add one above!';
        } else if (searchText) {
            emptyText.textContent = 'No tasks match your search.';
        } else {
            emptyText.textContent = 'No tasks match the selected filters.';
        }
    } else {
        emptyMessage.style.display = 'none';
    }
    
    // Create task items
    filtered.forEach(function(task) {
        const li = document.createElement('li');
        li.className = 'task-item';
        if (task.done) {
            li.className += ' completed';
        }
        
        // Checkbox
        const checkbox = document.createElement('div');
        checkbox.className = 'task-checkbox';
        checkbox.onclick = function() {
            toggleTask(task.id);
        };
        
        // Content
        const content = document.createElement('div');
        content.className = 'task-content';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'task-text';
        textDiv.textContent = task.text;
        
        const categorySpan = document.createElement('span');
        categorySpan.className = 'task-category category-' + task.category;
        categorySpan.textContent = task.category;
        
        content.appendChild(textDiv);
        content.appendChild(categorySpan);
        
        // Buttons
        const buttons = document.createElement('div');
        buttons.className = 'task-buttons';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.onclick = function() {
            editTask(task.id, li);
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = function() {
            deleteTask(task.id);
        };
        
        buttons.appendChild(editBtn);
        buttons.appendChild(deleteBtn);
        
        // Add all to li
        li.appendChild(checkbox);
        li.appendChild(content);
        li.appendChild(buttons);
        
        taskList.appendChild(li);
    });
    
    updateStats();
}

// Add task
function addTask() {
    const text = taskInput.value.trim();
    const category = categorySelect.value;
    
    // Validate
    if (text === '') {
        showMessage('Please enter a task!', 'error');
        return;
    }
    
    if (text.length > 200) {
        showMessage('Task is too long!', 'error');
        return;
    }
    
    // Check duplicate
    if (checkDuplicate(text, category)) {
        showMessage('This task already exists in ' + category + '!', 'warning');
        return;
    }
    
    // Create task
    const newTask = {
        id: Date.now(),
        text: text,
        category: category,
        done: false
    };
    
    tasks.push(newTask);
    saveTasks();
    
    taskInput.value = '';
    playSound(600);
    showMessage('Task added!', 'success');
    renderTasks();
}

// Toggle task
function toggleTask(id) {
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === id) {
            tasks[i].done = !tasks[i].done;
            if (tasks[i].done) {
                playSound(800);
            }
            break;
        }
    }
    saveTasks();
    renderTasks();
}

// Edit task
function editTask(id, element) {
    if (editingId !== null) {
        showMessage('Save current edit first!', 'warning');
        return;
    }
    
    let task;
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === id) {
            task = tasks[i];
            break;
        }
    }
    
    if (!task) return;
    
    editingId = id;
    
    const content = element.querySelector('.task-content');
    const buttons = element.querySelector('.task-buttons');
    
    // Create input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = task.text;
    input.maxLength = 200;
    
    content.innerHTML = '';
    content.appendChild(input);
    input.focus();
    
    // Create buttons
    buttons.innerHTML = '';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.textContent = 'Save';
    saveBtn.onclick = function() {
        const newText = input.value.trim();
        
        if (newText === '') {
            showMessage('Task cannot be empty!', 'error');
            return;
        }
        
        // Check duplicate (exclude current task)
        let isDuplicate = false;
        for (let i = 0; i < tasks.length; i++) {
            if (tasks[i].id !== id && 
                tasks[i].text.toLowerCase() === newText.toLowerCase() &&
                tasks[i].category === task.category) {
                isDuplicate = true;
                break;
            }
        }
        
        if (isDuplicate) {
            showMessage('This task already exists!', 'warning');
            return;
        }
        
        task.text = newText;
        saveTasks();
        editingId = null;
        showMessage('Task updated!', 'success');
        renderTasks();
    };
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = function() {
        editingId = null;
        renderTasks();
    };
    
    buttons.appendChild(saveBtn);
    buttons.appendChild(cancelBtn);
    
    // Enter to save
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveBtn.click();
        }
    });
}

// Delete task
function deleteTask(id) {
    let taskText = '';
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === id) {
            taskText = tasks[i].text;
            break;
        }
    }
    
    if (confirm('Delete "' + taskText + '"?')) {
        tasks = tasks.filter(function(task) {
            return task.id !== id;
        });
        saveTasks();
        showMessage('Task deleted!', 'success');
        renderTasks();
    }
}

// Clear all tasks
function clearAllTasks() {
    if (tasks.length === 0) {
        showMessage('No tasks to clear!', 'warning');
        return;
    }
    
    if (confirm('Delete all ' + tasks.length + ' tasks?')) {
        tasks = [];
        saveTasks();
        showMessage('All tasks cleared!', 'success');
        renderTasks();
    }
}

// Update statistics
function updateStats() {
    const total = tasks.length;
    let completed = 0;
    let active = 0;
    
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].done) {
            completed++;
        } else {
            active++;
        }
    }
    
    totalTasks.textContent = total;
    activeTasks.textContent = active;
    completedTasks.textContent = completed;
}

// Event listeners

// Add task
addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Search
searchInput.addEventListener('input', function(e) {
    searchText = e.target.value;
    renderTasks();
});

// Status filter (radio buttons)
statusFilterRadios.forEach(function(radio) {
    radio.addEventListener('change', function() {
        if (this.checked) {
            currentStatusFilter = this.value;
            renderTasks();
        }
    });
});

// Category filter (dropdown)
categoryFilterDropdown.addEventListener('change', function() {
    currentCategoryFilter = this.value;
    renderTasks();
});

// Clear all
clearBtn.addEventListener('click', clearAllTasks);

// Initialize
loadTasks();
renderTasks();

console.log('Task Manager loaded with sidebar!');