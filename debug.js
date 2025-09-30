console.log('Debug script started');

// Простая версия приложения для отладки
class SimpleScheduleApp {
    constructor() {
        console.log('SimpleScheduleApp constructor');
        this.currentWeek = new Date();
        this.init();
    }

    init() {
        console.log('SimpleScheduleApp init');
        this.setupNavigation();
        this.renderCalendar();
        this.updateCurrentDate();
        console.log('SimpleScheduleApp initialized');
    }

    setupNavigation() {
        console.log('Setting up navigation');
        
        // Навигация по вкладкам
        const navItems = document.querySelectorAll('.nav-item');
        console.log(`Found ${navItems.length} nav items`);
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                console.log(`Clicked nav item: ${section}`);
                this.navigateToSection(section);
            });
        });
        
        // Кнопки навигации по неделям
        const prevWeek = document.getElementById('prevWeek');
        const nextWeek = document.getElementById('nextWeek');
        
        if (prevWeek) {
            prevWeek.addEventListener('click', () => {
                console.log('Previous week clicked');
                this.navigateWeek(-1);
            });
        }
        
        if (nextWeek) {
            nextWeek.addEventListener('click', () => {
                console.log('Next week clicked');
                this.navigateWeek(1);
            });
        }
    }

    navigateToSection(sectionId) {
        console.log(`Navigating to: ${sectionId}`);
        
        // Убираем активный класс со всех nav-item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Добавляем активный класс к текущему nav-item
        const currentNavItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (currentNavItem) {
            currentNavItem.classList.add('active');
        }
        
        // Скрываем все секции
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Показываем нужную секцию
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            console.log(`Section ${sectionId} activated`);
        } else {
            console.error(`Section ${sectionId}-section not found`);
        }
        
        // Специальные действия для определенных секций
        if (sectionId === 'schedule') {
            this.renderScheduleView();
        }
    }

    navigateWeek(direction) {
        console.log(`Navigate week: ${direction}`);
        this.currentWeek.setDate(this.currentWeek.getDate() + (direction * 7));
        this.renderCalendar();
    }

    renderCalendar() {
        console.log('Rendering calendar');
        
        const grid = document.getElementById('calendarGrid');
        if (!grid) {
            console.error('Calendar grid not found');
            return;
        }
        
        // Обновляем заголовки
        this.updateCalendarHeaders();
        
        // Очищаем календарь
        grid.innerHTML = '';
        
        // Получаем начало недели
        const weekStart = new Date(this.currentWeek);
        weekStart.setDate(this.currentWeek.getDate() - this.currentWeek.getDay());
        
        const days = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        
        // Создаем дни недели
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            
            const dayElement = this.createDayElement(date, days[i]);
            grid.appendChild(dayElement);
        }
        
        console.log('Calendar rendered');
    }
    
    updateCalendarHeaders() {
        const weekStart = new Date(this.currentWeek);
        weekStart.setDate(this.currentWeek.getDate() - this.currentWeek.getDay());
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        // Обновляем заголовок месяца
        const monthTitle = document.getElementById('monthTitle');
        if (monthTitle) {
            monthTitle.textContent = weekStart.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
        }
        
        // Обновляем заголовок недели
        const weekTitle = document.getElementById('weekTitle');
        if (weekTitle) {
            const startDay = weekStart.getDate();
            const endDay = weekEnd.getDate();
            weekTitle.textContent = `${startDay} - ${endDay}`;
        }
    }

    createDayElement(date, dayName) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Проверяем, сегодня ли это
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        if (isToday) {
            dayElement.classList.add('today');
        }
        
        // Добавляем содержимое
        dayElement.innerHTML = `
            <div class="day-header">${dayName}</div>
            <div class="day-number">${date.getDate()}</div>
            <div class="day-classes">Заняття</div>
        `;
        
        return dayElement;
    }

    updateCurrentDate() {
        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            currentDateElement.textContent = now.toLocaleDateString('uk-UA', options);
        }
    }
    
    renderScheduleView() {
        console.log('Rendering schedule view');
        const container = document.getElementById('weeklySchedule');
        if (!container) {
            console.warn('Weekly schedule container not found');
            return;
        }
        
        container.innerHTML = `
            <div class="schedule-stats">
                <h3>Статистика</h3>
                <p>Статистика розкладу буде тут</p>
            </div>
            <div class="schedule-grid">
                <h3>Розклад на тиждень</h3>
                <p>Розклад занять буде тут</p>
            </div>
        `;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting debug app');
    try {
        window.debugApp = new SimpleScheduleApp();
        console.log('Debug app started successfully');
    } catch (error) {
        console.error('Failed to start debug app:', error);
    }
});
