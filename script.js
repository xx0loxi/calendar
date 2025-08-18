document.addEventListener('DOMContentLoaded', function() {
    const notesContainer = document.getElementById('notes-container');
    const addNoteBtn = document.getElementById('add-note-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;
    
    // Создаем элемент для фона полноэкранного
    const backdrop = document.createElement('div');
    backdrop.className = 'fullscreen-backdrop';
    document.body.appendChild(backdrop);
    
    // Проверяем сохраненную тему
    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    body.classList.add(savedTheme);
    updateThemeIcon(savedTheme);
    
    // Загрузка заметок из localStorage
    loadNotes();
    
    // Обработчики событий
    addNoteBtn.addEventListener('click', addNewNote);
    themeToggleBtn.addEventListener('click', toggleTheme);
    backdrop.addEventListener('click', closeAllFullscreenNotes);
    
    // Функция добавления новой заметки
    function addNewNote() {
        const noteId = Date.now().toString();
        const noteElement = createNoteElement(noteId, '', '');
        notesContainer.prepend(noteElement);
        saveNotes();
        
        // Фокус на заголовок
        setTimeout(() => {
            noteElement.querySelector('.note-title').focus();
        }, 0);
    }
    
    // Создание элемента заметки
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
        
        // Обработчики для кнопок заметки
        const deleteBtn = noteElement.querySelector('.delete-btn');
        const saveBtn = noteElement.querySelector('.save-btn');
        const fullscreenBtn = noteElement.querySelector('.fullscreen-btn');
        const titleInput = noteElement.querySelector('.note-title');
        const contentTextarea = noteElement.querySelector('.note-content');
        
        deleteBtn.addEventListener('click', () => {
            noteElement.style.transform = 'scale(0.9)';
            noteElement.style.opacity = '0';
            setTimeout(() => {
                noteElement.remove();
                saveNotes();
            }, 300);
        });
        
        saveBtn.addEventListener('click', () => {
            saveNotes();
            saveBtn.innerHTML = '<i class="fas fa-check"></i><span class="desktop-text">Сохранено!</span>';
            setTimeout(() => {
                saveBtn.innerHTML = '<i class="fas fa-save"></i><span class="desktop-text">Сохранить</span>';
            }, 2000);
        });
        
        fullscreenBtn.addEventListener('click', () => {
            toggleFullscreenNote(noteElement);
        });
        
        // Автосохранение при изменении содержимого
        titleInput.addEventListener('input', saveNotes);
        contentTextarea.addEventListener('input', saveNotes);
        
        return noteElement;
    }
    
    // Переключение полноэкранного режима
    function toggleFullscreenNote(noteElement) {
        if (noteElement.classList.contains('fullscreen')) {
            closeFullscreenNote(noteElement);
        } else {
            openFullscreenNote(noteElement);
        }
    }
    
    function openFullscreenNote(noteElement) {
        // Запоминаем оригинальное положение
        const rect = noteElement.getBoundingClientRect();
        noteElement.style.position = 'fixed';
        noteElement.style.top = `${rect.top}px`;
        noteElement.style.left = `${rect.left}px`;
        noteElement.style.width = `${rect.width}px`;
        noteElement.style.height = `${rect.height}px`;
        
        // Активируем фон
        backdrop.classList.add('active');
        
        // Добавляем класс fullscreen после небольшой задержки
        setTimeout(() => {
            noteElement.classList.add('fullscreen');
            noteElement.style.top = '0';
            noteElement.style.left = '0';
            noteElement.style.width = '100%';
            noteElement.style.height = '100%';
            
            // Фокус на содержимое
            setTimeout(() => {
                noteElement.querySelector('.note-content').focus();
            }, 100);
        }, 10);
    }
    
    function closeFullscreenNote(noteElement) {
        noteElement.classList.remove('fullscreen');
        backdrop.classList.remove('active');
        
        // Возвращаем обычные стили
        noteElement.style.position = '';
        noteElement.style.top = '';
        noteElement.style.left = '';
        noteElement.style.width = '';
        noteElement.style.height = '';
    }
    
    function closeAllFullscreenNotes() {
        document.querySelectorAll('.note.fullscreen').forEach(note => {
            closeFullscreenNote(note);
        });
    }
    
    // Сохранение заметок в localStorage
    function saveNotes() {
        const notes = [];
        const noteElements = document.querySelectorAll('.note');
        
        noteElements.forEach(noteElement => {
            notes.push({
                id: noteElement.dataset.id,
                title: noteElement.querySelector('.note-title').value,
                content: noteElement.querySelector('.note-content').value
            });
        });
        
        localStorage.setItem('notes', JSON.stringify(notes));
    }
    
    // Загрузка заметок из localStorage
    function loadNotes() {
        const savedNotes = localStorage.getItem('notes');
        
        if (savedNotes) {
            const notes = JSON.parse(savedNotes);
            
            notes.forEach(note => {
                const noteElement = createNoteElement(note.id, note.title, note.content);
                notesContainer.appendChild(noteElement);
            });
        }
    }
    
    // Переключение темы
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
    
    // Обновление иконки темы
    function updateThemeIcon(theme) {
        const icon = themeToggleBtn.querySelector('i');
        if ((theme || body.classList.contains('dark-theme'))) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            themeToggleBtn.title = 'Светлая тема';
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            themeToggleBtn.title = 'Темная тема';
        }
    }
});

