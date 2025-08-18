:root {
    --primary-color: #6c5ce7;
    --primary-hover: #5649c0;
    --danger-color: #ff7675;
    --danger-hover: #e84343;
    --info-color: #00cec9;
    --info-hover: #00a8a5;
    --text-color: #2d3436;
    --bg-color: #f5f6fa;
    --note-bg: #ffffff;
    --shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    --border-radius: 12px;
    --transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.dark-theme {
    --primary-color: #a29bfe;
    --primary-hover: #847dff;
    --danger-color: #ff7675;
    --danger-hover: #ff5252;
    --info-color: #74b9ff;
    --info-hover: #0984e3;
    --text-color: #dfe6e9;
    --bg-color: #1e272e;
    --note-bg: #2d3436;
    --shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    transition: background-color 0.3s, color 0.3s;
}

body {
    background-color: var(--bg-color);
    color: var(--text-color);
    padding: 15px;
    min-height: 100vh;
}

.app {
    max-width: 100%;
    margin: 0 auto;
}

/* Шапка */
header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    border-radius: var(--border-radius);
    background-color: var(--note-bg);
    box-shadow: var(--shadow);
    position: sticky;
    top: 15px;
    z-index: 10;
}

h1 {
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    gap: 10px;
}

.header-actions {
    display: flex;
    gap: 10px;
}

button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: 1rem;
    transition: var(--transition);
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 40px;
    height: 40px;
    justify-content: center;
}

button:hover {
    background-color: var(--primary-hover);
    transform: translateY(-2px);
}

#theme-toggle-btn {
    background-color: transparent;
    color: var(--text-color);
    padding: 0;
    width: 40px;
}

#theme-toggle-btn:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.desktop-text {
    display: none;
}

/* Контейнер заметок */
.notes-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 15px;
    padding: 5px;
}

/* Заметка */
.note {
    background-color: var(--note-bg);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    padding: 15px;
    position: relative;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    transition: var(--transition);
    transform-origin: center center;
    will-change: transform, width, height, border-radius;
    z-index: 1;
}

.note-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    align-items: center;
}

.note-title {
    font-weight: bold;
    font-size: 1.1rem;
    color: var(--text-color);
    border: none;
    background: transparent;
    width: 100%;
    margin-right: 10px;
    padding: 5px;
    border-radius: 4px;
}

.note-title:focus {
    outline: 2px solid var(--primary-color);
}

.note-content {
    flex-grow: 1;
    color: var(--text-color);
    border: none;
    background: transparent;
    resize: none;
    font-size: 1rem;
    line-height: 1.5;
    margin-bottom: 10px;
    padding: 5px;
    border-radius: 4px;
    min-height: 120px;
}

.note-content:focus {
    outline: 2px solid var(--primary-color);
}

.note-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.note-actions button {
    padding: 8px 12px;
    font-size: 0.9rem;
}

.delete-btn {
    background-color: var(--danger-color);
}

.delete-btn:hover {
    background-color: var(--danger-hover);
}

.save-btn {
    background-color: var(--info-color);
}

.save-btn:hover {
    background-color: var(--info-hover);
}

.fullscreen-btn {
    background-color: #FF9800;
}

.fullscreen-btn:hover {
    background-color: #F57C00;
}

/* Анимация полноэкранного режима */
.note.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    border-radius: 0;
    padding: 20px;
    animation: expandNote 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
    overflow-y: auto;
}

.note.fullscreen .note-content {
    font-size: 1.2rem;
    min-height: calc(100vh - 180px);
}

.note.fullscreen .note-title {
    font-size: 1.5rem;
}

.note.fullscreen .note-actions {
    position: sticky;
    bottom: 20px;
    background: var(--note-bg);
    padding: 10px;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
}

@keyframes expandNote {
    0% {
        transform: scale(0.9);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* Фон для полноэкранного режима */
.fullscreen-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 999;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
}

.fullscreen-backdrop.active {
    opacity: 1;
    pointer-events: auto;
}

/* Мобильная адаптация */
@media (min-width: 768px) {
    .desktop-text {
        display: inline;
    }
    
    header {
        padding: 15px 20px;
    }
    
    button {
        padding: 10px 20px;
    }
    
    #add-note-btn {
        width: auto;
    }
}

@media (max-width: 480px) {
    body {
        padding: 10px;
    }
    
    header {
        top: 10px;
        padding: 12px;
    }
    
    h1 {
        font-size: 1.3rem;
    }
    
    .notes-container {
        grid-template-columns: 1fr;
    }
    
    .note {
        min-height: 180px;
    }
    
    .note.fullscreen {
        padding: 15px;
    }
    
    .note.fullscreen .note-content {
        font-size: 1rem;
    }
    
    .note.fullscreen .note-title {
        font-size: 1.3rem;
    }
}
