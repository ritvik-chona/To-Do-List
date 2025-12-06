// Audio API Working
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playDingSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Task management
let tasks = [];

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const statsText = document.getElementById('statsText');
const emptyState = document.getElementById('emptyState'); 

function renderTasks() {
    const taskItems = todoList.querySelectorAll('.todo-item');
    taskItems.forEach(item => item.remove());
    
    if (tasks.length === 0) {
        emptyState.style.display = 'block';
        updateStats();
        return;
    } else {
        emptyState.style.display = 'none';
    }

    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${task.done ? 'done' : ''}`;
        
        li.innerHTML = `
            <div class="checkbox"></div>
            <span class="todo-text">${task.text}</span>
            <button class="delete-btn" onclick="deleteTask(${index})">Delete</button>
        `;
        
        li.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                toggleTask(index);
            }
        });
        
        todoList.appendChild(li);
    });

    updateStats();
}

function addTask() {
    const text = taskInput.value.trim();
    
    if (text === '') {
        taskInput.focus();
        return;
    }

    tasks.push({
        text: text,
        done: false
    });

    taskInput.value = '';
    taskInput.focus();
    renderTasks();
}

function toggleTask(index) {
    tasks[index].done = !tasks[index].done;
    
    if (tasks[index].done) {
        playDingSound();
    }
    
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    renderTasks();
}

function updateStats() {
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    const remaining = total - done;

    if (total === 0) {
        statsText.textContent = "No tasks yet. Add one to get started! ";
    } else if (done === total) {
        statsText.innerHTML = " All tasks completed! Great job!";
    } else {
        statsText.innerHTML = `<strong>${done}</strong> of <strong>${total}</strong> completed • <strong>${remaining}</strong> remaining`;
    }
}

// Event listeners
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

window.deleteTask = deleteTask;

// Initial render
renderTasks();