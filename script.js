document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const notesContainer = document.getElementById('notes-container');
    const addNoteBtn = document.getElementById('add-note-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const searchBtn = document.getElementById('search-btn');
    const closeSearchBtn = document.getElementById('close-search-btn');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');
    const body = document.body;
    const backdrop = document.querySelector('.fullscreen-backdrop');
    
    // Состояние приложения
    let notes = [];
    let currentSearchQuery = '';
    
    // Инициализация
    init();
    
    function init() {
        // Загрузка темы
        const savedTheme = localStorage.getItem('theme') || 'light-theme';
        body.classList.add(savedTheme);
        updateThemeIcon();
        
        // Загрузка заметок
        loadNotes();
        
        // Обработчики событий
        addNoteBtn.addEventListener('click', addNewNote);
        themeToggleBtn.addEventListener('click', toggleTheme);
        searchBtn.addEventListener('click', toggleSearch);
        closeSearchBtn.addEventListener('click', closeSearch);
        searchInput.addEventListener('input', handleSearch);
        backdrop.addEventListener('click', closeAllFullscreenNotes);
        
        // Анимация при загрузке
        setTimeout(() => {
            document.querySelectorAll('.note').forEach((note, index) => {
                note.style.animation = `fadeIn 0.5s ease ${index * 0.1}s forwards`;
                note.style.opacity = '0';
            });
        }, 100);
    }
    
    // Работа с заметками
    function addNewNote() {
        const noteId = Date.now().toString();
        const noteElement = createNoteElement(noteId, '', '');
        notesContainer.prepend(noteElement);
        saveNotes();
        
        // Анимация появления
        noteElement.style.animation = 'fadeIn 0.5s ease forwards';
        noteElement.style.opacity = '0';
        
        setTimeout(() => {
            noteElement.querySelector('.note-title').focus();
        }, 100);
    }
    
    function createNoteElement(id, title, content) {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.dataset.id = id;
        
        noteElement.innerHTML = `
            <div class="note-header">
                <input type="text" class="note-title" placeholder="Заголовок" value="${title}">
            </div>
            <textarea class="note-content" placeholder="Начните писать здесь...">${content}</textarea>
            <div class="note-actions">
                <button class="fullscreen-btn" title="На весь экран">
                    <i class="fas fa-expand"></i>
                    <span class="desktop-text">Полный экран</span>
                </button>
                <button class="save-btn">
                    <i class="fas fa-save"></i>
                    <span class="desktop-text">Сохранить</span>
                </button>
                <button class="delete-btn" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Обработчики событий
        const deleteBtn = noteElement.querySelector('.delete-btn');
        const saveBtn = noteElement.querySelector('.save-btn');
        const fullscreenBtn = noteElement.querySelector('.fullscreen-btn');
        const titleInput = noteElement.querySelector('.note-title');
        const contentTextarea = noteElement.querySelector('.note-content');
        
        deleteBtn.addEventListener('click', () => deleteNote(noteElement));
        saveBtn.addEventListener('click', () => saveNote(noteElement));
        fullscreenBtn.addEventListener('click', () => toggleFullscreenNote(noteElement));
        titleInput.addEventListener('input', () => saveNotes());
        contentTextarea.addEventListener('input', () => saveNotes());
        
        return noteElement;
    }
    
    function deleteNote(noteElement) {
        if (noteElement.classList.contains('fullscreen')) {
            closeFullscreenNote(noteElement);
        }
        
        noteElement.style.animation = 'fadeOut 0.4s ease forwards';
        
        setTimeout(() => {
            noteElement.remove();
            saveNotes();
        }, 400);
    }
    
    function saveNote(noteElement) {
        saveNotes();
        const saveBtn = noteElement.querySelector('.save-btn');
        saveBtn.innerHTML = '<i class="fas fa-check"></i><span class="desktop-text">Сохранено!</span>';
        
        setTimeout(() => {
            saveBtn.innerHTML = '<i class="fas fa-save"></i><span class="desktop-text">Сохранить</span>';
        }, 2000);
    }
    
    // Полноэкранный режим
    function toggleFullscreenNote(noteElement) {
        if (noteElement.classList.contains('fullscreen')) {
            closeFullscreenNote(noteElement);
        } else {
            openFullscreenNote(noteElement);
        }
    }
    
    function openFullscreenNote(noteElement) {
        // Сохраняем позицию и размеры
        const rect = noteElement.getBoundingClientRect();
        noteElement.dataset.originalTop = rect.top;
        noteElement.dataset.originalLeft = rect.left;
        noteElement.dataset.originalWidth = rect.width;
        noteElement.dataset.originalHeight = rect.height;
        
        // Подготовка к анимации
        noteElement.style.position = 'fixed';
        noteElement.style.top = `${rect.top}px`;
        noteElement.style.left = `${rect.left}px`;
        noteElement.style.width = `${rect.width}px`;
        noteElement.style.height = `${rect.height}px`;
        noteElement.style.margin = '0';
        noteElement.style.transition = 'none';
        
        // Активируем backdrop
        backdrop.style.display = 'block';
        setTimeout(() => {
            backdrop.classList.add('active');
        }, 10);
        
        // Запускаем анимацию
        setTimeout(() => {
            noteElement.style.transition = 'all 0.4s cubic-bezier(0.2, 0.8, 0.4, 1)';
            noteElement.classList.add('fullscreen');
            
            // Фокус на содержимое
            setTimeout(() => {
                noteElement.querySelector('.note-content').focus();
            }, 400);
        }, 20);
    }
    
    function closeFullscreenNote(noteElement) {
        noteElement.classList.add('closing');
        backdrop.classList.remove('active');
        
        setTimeout(() => {
            // Восстанавливаем оригинальные стили
            noteElement.classList.remove('fullscreen', 'closing');
            noteElement.style.position = '';
            noteElement.style.top = '';
            noteElement.style.left = '';
            noteElement.style.width = '';
            noteElement.style.height = '';
            noteElement.style.margin = '';
            noteElement.style.transition = '';
            noteElement.style.zIndex = '';
            
            backdrop.style.display = 'none';
        }, 400);
    }
    
    function closeAllFullscreenNotes() {
        document.querySelectorAll('.note.fullscreen').forEach(note => {
            closeFullscreenNote(note);
        });
    }
    
    // Поиск
    function toggleSearch() {
        searchContainer.classList.toggle('hidden');
        if (!searchContainer.classList.contains('hidden')) {
            searchInput.focus();
        } else {
            currentSearchQuery = '';
            searchInput.value = '';
            filterNotes();
        }
    }
    
    function closeSearch() {
        searchContainer.classList.add('hidden');
        currentSearchQuery = '';
        searchInput.value = '';
        filterNotes();
    }
    
    function handleSearch(e) {
        currentSearchQuery = e.target.value.toLowerCase();
        filterNotes();
    }
    
    function filterNotes() {
        const allNotes = document.querySelectorAll('.note');
        
        allNotes.forEach(note => {
            const title = note.querySelector('.note-title').value.toLowerCase();
            const content = note.querySelector('.note-content').value.toLowerCase();
            
            if (currentSearchQuery === '' || 
                title.includes(currentSearchQuery) || 
                content.includes(currentSearchQuery)) {
                note.style.display = 'flex';
                note.style.animation = 'fadeIn 0.3s ease forwards';
            } else {
                note.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => {
                    note.style.display = 'none';
                }, 300);
            }
        });
    }
    
    // Работа с данными
    function saveNotes() {
        notes = [];
        document.querySelectorAll('.note').forEach(noteElement => {
            notes.push({
                id: noteElement.dataset.id,
                title: noteElement.querySelector('.note-title').value,
                content: noteElement.querySelector('.note-content').value
            });
        });
        
        localStorage.setItem('notes', JSON.stringify(notes));
    }
    
    function loadNotes() {
        const savedNotes = localStorage.getItem('notes');
        
        if (savedNotes) {
            notes = JSON.parse(savedNotes);
            notes.forEach(note => {
                const noteElement = createNoteElement(note.id, note.title, note.content);
                notesContainer.appendChild(noteElement);
            });
        }
    }
    
    // Темная/светлая тема
    function toggleTheme() {
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            localStorage.setItem('theme', 'light-theme');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark-theme');
        }
        updateThemeIcon();
    }
    
    function updateThemeIcon() {
        const icon = themeToggleBtn.querySelector('i');
        const isDark = body.classList.contains('dark-theme');
        
        if (isDark) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            themeToggleBtn.title = 'Светлая тема';
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            themeToggleBtn.title = 'Темная тема';
        }
    }
    
    // Добавляем стили анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: scale(1); }
            to { opacity: 0; transform: scale(0.95); }
        }
    `;
    document.head.appendChild(style);
});
