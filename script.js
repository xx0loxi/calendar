document.addEventListener('DOMContentLoaded', function() {
    const notesContainer = document.getElementById('notes-container');
    const addNoteBtn = document.getElementById('add-note-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;
    
    // Проверяем сохраненную тему
    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    body.classList.add(savedTheme);
    updateThemeIcon(savedTheme);
    
    // Загрузка заметок из localStorage
    loadNotes();
    
    // Обработчики событий
    addNoteBtn.addEventListener('click', addNewNote);
    themeToggleBtn.addEventListener('click', toggleTheme);
    
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
                <button class="fullscreen-btn" title="Полноэкранный режим">
                    <i class="fas fa-expand"></i>
                </button>
                <button class="save-btn">
                    <i class="fas fa-save"></i>
                </button>
                <button class="delete-btn">
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
            noteElement.classList.add('deleting');
            setTimeout(() => {
                noteElement.remove();
                saveNotes();
            }, 300);
        });
        
        saveBtn.addEventListener('click', () => {
            saveNotes();
            saveBtn.innerHTML = '<i class="fas fa-check"></i>';
            saveBtn.style.backgroundColor = 'var(--success-color)';
            
            setTimeout(() => {
                saveBtn.innerHTML = '<i class="fas fa-save"></i>';
            }, 2000);
        });
        
        fullscreenBtn.addEventListener('click', () => {
            noteElement.classList.toggle('fullscreen');
            if (noteElement.classList.contains('fullscreen')) {
                fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
                fullscreenBtn.title = 'Выйти из полноэкранного режима';
            } else {
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
                fullscreenBtn.title = 'Полноэкранный режим';
            }
        });
        
        // Автосохранение при изменении содержимого
        titleInput.addEventListener('input', saveNotes);
        contentTextarea.addEventListener('input', saveNotes);
        
        return noteElement;
    }
    
    // Сохранение заметок в localStorage
    function saveNotes() {
        const notes = [];
        const noteElements = document.querySelectorAll('.note:not(.deleting)');
        
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
            
            notes.forEach((note, index) => {
                const noteElement = createNoteElement(note.id, note.title, note.content);
                notesContainer.appendChild(noteElement);
                
                // Задержка для последовательного появления заметок
                setTimeout(() => {
                    noteElement.style.animationDelay = `${index * 0.1}s`;
                }, 0);
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
        
        // Плавное изменение темы
        themeToggleBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            themeToggleBtn.style.transform = 'rotate(0)';
        }, 300);
    }
    
    // Обновление иконки темы
    function updateThemeIcon(theme) {
        const icon = themeToggleBtn.querySelector('i');
        if ((theme || body.classList.contains('dark-theme'))) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            themeToggleBtn.title = 'Переключить на светлую тему';
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            themeToggleBtn.title = 'Переключить на темную тему';
        }
    }
});