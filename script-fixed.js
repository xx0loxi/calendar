console.log('ScheduleApp script started');

// Глобальный обработчик ошибок
window.addEventListener('error', function(e) {
    console.error('Global error caught:', e.error);
    // Не показываем ошибки пользователям, только логируем
    return true; // Предотвращаем показ ошибки в браузере
});

// Обработчик необработанных Promise rejection
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    e.preventDefault(); // Предотвращаем показ в консоли
});


// Application State
class ScheduleApp {
    constructor() {
        console.log('ScheduleApp constructor called');
        
        try {
            // Основные свойства
            this.currentWeek = new Date();
            this.selectedDate = null;
            this.isMobile = window.innerWidth <= 768;
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.vibrationEnabled = true;
            
            // Инициализация базового шаблона
            this.initializeBaseScheduleTemplate();
            
            // Загрузка данных
            this.attendanceData = this.loadAttendanceData();
            this.customClasses = this.loadCustomClasses();
            this.currentTheme = this.loadTheme();
            this.loadSavedScheduleTemplate();
            this.perDayExtras = this.loadPerDayExtras();
            
            // Генерация расписания
            this.sampleSchedule = this.generateWeekSchedule(this.currentWeek);
            
            // Применение настроек
            this.applyTheme();
            this.loadSettings();
            
            // Инициализация
            this.init();
            
        } catch (error) {
            console.error('Error in ScheduleApp constructor:', error);
        }
    }

    init() {
        try {
            console.log('Initializing ScheduleApp...');
            
            // ПРИНУДИТЕЛЬНОЕ ЗАКРЫТИЕ МЕНЮ ПРИ ИНИЦИАЛИЗАЦИИ (фикс для iPhone)
            this.ensureMenuClosed();
            
            this.setupEventListeners();
            this.updateCurrentDate();
            this.renderCalendar();
            this.updateStats();
            this.handleResize();

            // Make bottom nav follow the screen
            this.enableAbsoluteBottomNavForMobile();
            
            // Обновляем календарь с учетом сохраненных пропусков
            setTimeout(() => {
                this.updateCalendarAfterAttendanceChange();
                // Повторно обновим позицию панели после рендера
                this.enableAbsoluteBottomNavForMobile();
                this.updateCalendarAfterAttendanceChange();
                // Повторно обновим позицию панели после первичного рендера
                this.enableAbsoluteBottomNavForMobile();
            }, 100);
            
            console.log('ScheduleApp initialized successfully');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    // Initialize base schedule template
    initializeBaseScheduleTemplate() {
        // Permanent weekly schedule template
        this.weeklyScheduleTemplate = {
            1: [ // Понеділок
                { subject: 'MOB', room: 'ауд. 301', teacher: 'Вирста' },
                { subject: 'Буріння свердловин', room: 'ауд. 103', teacher: 'Агейчева' },
                { subject: 'Буріння свердловин', room: 'ауд. 103', teacher: 'Агейчева' }
            ],
            2: [ // Вівторок
                { subject: 'Технічна механіка', room: 'ауд. 302', teacher: 'Волинець' },
                { subject: 'Промивка свердловин', room: 'ауд. 307А', teacher: 'Деркунська' },
                { subject: 'MOB', room: 'ауд. 301', teacher: 'Вирста' }
            ],
            3: [ // Середа
                { subject: 'MOB', room: 'ауд. 301', teacher: 'Вирста' },
                { subject: 'Фізичне виховання', room: 'с/з', teacher: 'Кошель' },
                { subject: 'ЗНПГ', room: 'ауд. 202', teacher: 'Сакова' },
                { subject: "Іноземна (ЗПС)", room: 'ауд. 316', teacher: 'Почтакова' }
            ],
            4: [ // Четвер
                { subject: 'Технічна механіка', room: 'ауд. 302', teacher: 'Волинець' },
                { subject: 'Гідравліка', room: 'ауд. 310', teacher: 'Чмихун' },
                { subject: 'Гідравліка', room: 'ауд. 310', teacher: 'Чмихун' }
            ],
            5: [ // П'ятниця
                { subject: 'Промивка свердловин', room: 'ауд. 307А', teacher: 'Деркунська' },
                { subject: 'ЗНПГ', room: 'ауд. 202', teacher: 'Сакова' },
                { subject: 'Буріння свердловин', room: 'ауд. 103', teacher: 'Агейчева' }
            ]
        };
    }
    
    // Generate schedule for specific week
    generateWeekSchedule(weekDate) {
        const schedule = {};
        const weekStart = new Date(weekDate);
        weekStart.setDate(weekDate.getDate() - weekDate.getDay());
        
        const times = ['08:30-10:05', '10:25-12:00', '12:20-13:55', '14:15-15:50'];
        
        for (let dow = 1; dow <= 5; dow++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + dow);
            const dateKey = this.formatDateKey(date);
            const entries = this.weeklyScheduleTemplate[dow] || [];
            
            if (entries.length > 0) {
                schedule[dateKey] = {
                    classes: entries.map((entry, idx) => ({
                        id: `${dateKey}-${idx}`,
                        time: times[idx] || times[times.length - 1],
                        subject: entry.subject,
                        room: entry.room,
                        teacher: entry.teacher,
                        type: 'Заняття'
                    }))
                };
            }
        }
        
        return schedule;
    }

    // Load data functions
    loadAttendanceData() {
        try {
            const saved = localStorage.getItem('bn32-attendance');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Failed to load attendance data:', error);
            return {};
        }
    }
    
    loadCustomClasses() {
        try {
            const saved = localStorage.getItem('bn32-custom-classes');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Failed to load custom classes:', error);
            return {};
        }
    }

    loadTheme() {
        return localStorage.getItem('bn32-theme') || 'default';
    }
    
    loadSavedScheduleTemplate() {
        try {
            const saved = localStorage.getItem('bn32-weekly-template');
            if (saved) {
                const savedTemplate = JSON.parse(saved);
                // Мергим с базовым шаблоном
                Object.keys(savedTemplate).forEach(day => {
                    this.weeklyScheduleTemplate[day] = savedTemplate[day];
                });
                console.log('Loaded custom schedule template');
            }
        } catch (error) {
            console.warn('Failed to load saved schedule template:', error);
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        
        // Navigation buttons (левая и правая)
        const prevWeek = document.getElementById('prevWeek');
        const nextWeek = document.getElementById('nextWeek');
        if (prevWeek) {
            prevWeek.addEventListener('click', () => { this.navigateWeek(-1); this.vibrate(10); });
            prevWeek.setAttribute('title', 'Попередній тиждень');
        }
        if (nextWeek) {
            nextWeek.addEventListener('click', () => { this.navigateWeek(1); this.vibrate(10); });
            nextWeek.setAttribute('title', 'Наступний тиждень');
        }
        
        // Modal controls
        const modalClose = document.getElementById('modalClose');
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalClose) modalClose.addEventListener('click', () => this.closeModal());
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) this.closeModal();
            });
        }
        
        // Sidebar navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => this.navigateToSection(item.dataset.section));
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.navigateToSection(item.dataset.section);
                }
            });
        });
        
        // Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) menuToggle.addEventListener('click', () => this.toggleMobileMenu());
        
        // Menu close button
        const menuClose = document.getElementById('menuClose');
        if (menuClose) menuClose.addEventListener('click', () => this.closeMobileMenu());
        
        // Sidebar overlay
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => this.closeMobileMenu());
        }
        
        // ESC key to close menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const sidebar = document.getElementById('sidebar');
                if (sidebar && sidebar.classList.contains('active')) {
                    this.closeMobileMenu();
                    e.preventDefault();
                }
            }
        });
        
        // Theme selector
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('theme-btn')) {
                const theme = e.target.dataset.theme;
                this.changeTheme(theme);
                
                document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });

        // Theme list collapsible toggle
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        const themeList = document.getElementById('theme-list');
        if (themeToggleBtn && themeList) {
            themeToggleBtn.addEventListener('click', () => {
                const opened = themeList.classList.toggle('open');
                themeToggleBtn.classList.toggle('open', opened);
                themeToggleBtn.setAttribute('aria-expanded', opened ? 'true' : 'false');
                themeList.setAttribute('aria-hidden', opened ? 'false' : 'true');
                this.vibrate(10);
            });
        }
        
        // Schedule editor buttons
        const editScheduleBtn = document.getElementById('edit-schedule-btn');
        const resetScheduleBtn = document.getElementById('reset-schedule-btn');
        
        if (editScheduleBtn) editScheduleBtn.addEventListener('click', () => this.openScheduleEditor());
        if (resetScheduleBtn) resetScheduleBtn.addEventListener('click', () => this.resetToDefaultSchedule());
        
        // Font size controls
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('size-btn')) {
                const size = e.target.dataset.size;
                this.changeFontSize(size);
                
                document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
        
        // Vibration toggle
        const vibrationToggle = document.getElementById('vibration-toggle');
        if (vibrationToggle) {
            vibrationToggle.addEventListener('change', (e) => {
                this.toggleVibration(e.target.checked);
            });
        }

        // Bottom nav toggle
        const bottomToggle = document.getElementById('bottom-nav-toggle');
        if (bottomToggle) {
            bottomToggle.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                localStorage.setItem('bn32-bottom-nav', enabled ? 'true' : 'false');
                this.applyBottomNav(enabled);
                this.vibrate(10);
            });
        }

        // Bottom nav clicks
        const bottomNav = document.getElementById('bottomNav');
        if (bottomNav) {
            bottomNav.addEventListener('click', (e) => {
                const btn = e.target.closest('.bottom-tab');
                if (!btn) return;
                const section = btn.dataset.section;
                if (section) {
                    this.navigateToSection(section);
                    bottomNav.querySelectorAll('.bottom-tab').forEach(b => b.classList.toggle('active', b === btn));
                }
            });
        }
    }

    navigateToSection(sectionId) {
        try {
            console.log(`Navigating to section: ${sectionId}`);
            
            // INSTANTLY scroll to top (no smooth scroll)
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            const navItem = document.querySelector(`[data-section="${sectionId}"]`);
            if (navItem) {
                navItem.classList.add('active');
            }
            
            // Show/hide content sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            const targetSection = document.getElementById(`${sectionId}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
                console.log(`Section ${sectionId} activated`);
                // Force another scroll to top after section change
                requestAnimationFrame(() => {
                    window.scrollTo(0, 0);
                });
            } else {
                console.error(`Section not found: ${sectionId}-section`);
            }

            // Sync bottom nav active state
            const bottomNav = document.getElementById('bottomNav');
            if (bottomNav) {
                bottomNav.querySelectorAll('.bottom-tab').forEach(b => b.classList.toggle('active', b.dataset.section === sectionId));
            }
            
            // Render schedule view if switching to schedule section
            if (sectionId === 'schedule') {
                setTimeout(() => {
                    this.renderScheduleView();
                }, 100);
            }
            
            // Render statistics if switching to statistics section
            if (sectionId === 'statistics') {
                setTimeout(() => {
                    this.renderStatistics();
                }, 100);
            }
            
            // Close mobile menu if open
            if (this.isMobile) {
                this.closeMobileMenu();
            }
            
            this.vibrate(10);
            
        } catch (error) {
            console.error('Navigation error:', error);
        }
    }

    navigateWeek(direction) {
        console.log(`Navigate week: ${direction}`);
        this.currentWeek.setDate(this.currentWeek.getDate() + (direction * 7));
        this.sampleSchedule = this.generateWeekSchedule(this.currentWeek);
        this.renderCalendar();
        this.animateWeekTitle(direction);
        this.animateNavigation(direction);
        this.vibrate(10);
    }


    animateNavigation(direction) {
        const calendar = document.getElementById('calendarGrid');
        if (!calendar) {
            console.warn('Calendar grid not found for animation');
            return;
        }
        
        try {
            calendar.style.transform = `translateX(${direction * 10}px)`;
            calendar.style.opacity = '0.8';
            
            setTimeout(() => {
                if (calendar && calendar.parentNode) { // Проверяем, что элемент еще существует
                    calendar.style.transform = 'translateX(0)';
                    calendar.style.opacity = '1';
                }
            }, 150);
        } catch (error) {
            console.error('Animation error:', error);
        }
    }

    animateWeekTitle(direction) {
        const weekTitle = document.getElementById('weekTitle');
        if (!weekTitle) return;
        try {
            weekTitle.style.transition = 'transform 150ms ease, opacity 150ms ease';
            weekTitle.style.transform = `translateX(${direction * 8}px)`;
            weekTitle.style.opacity = '0.85';
            setTimeout(() => {
                weekTitle.style.transform = 'translateX(0)';
                weekTitle.style.opacity = '1';
            }, 150);
        } catch (e) {
            console.warn('Week title animation error:', e);
        }
    }

    renderCalendar() {
        try {
            const grid = document.getElementById('calendarGrid');
            const weekTitle = document.getElementById('weekTitle');
            const monthTitle = document.getElementById('monthTitle');
            const monthStats = document.getElementById('monthStats');
            
            if (!grid) return;
            
            // Clear existing content
            grid.innerHTML = '';
            
            // Get week dates
            const weekStart = new Date(this.currentWeek);
            weekStart.setDate(this.currentWeek.getDate() - this.currentWeek.getDay());
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            // Update month title and stats
            if (monthTitle) {
                const monthOptions = { month: 'long', year: 'numeric' };
                const monthName = weekStart.toLocaleDateString('uk-UA', monthOptions);
                monthTitle.textContent = monthName;
            }
            
            // Update month stats with absences count
            if (monthStats) {
                const monthAbsences = this.getMonthAbsencesCount(weekStart);
                if (monthAbsences > 0) {
                    monthStats.innerHTML = `
                        <div class="month-absences-counter">
                            <span class="absences-icon">⚠️</span>
                            <span class="absences-count">${monthAbsences}</span>
                            <span class="absences-text">${this.getPluralForm(monthAbsences, 'пропуск', 'пропуски', 'пропусків')}</span>
                        </div>
                    `;
                } else {
                    monthStats.innerHTML = '<div class="month-perfect">✓ Без пропусків</div>';
                }
            }
            
            // Update week title
            if (weekTitle) {
                const titleOptions = { day: 'numeric' };
                const startDay = weekStart.toLocaleDateString('uk-UA', titleOptions);
                const endDay = weekEnd.toLocaleDateString('uk-UA', titleOptions);
                weekTitle.textContent = `${startDay} - ${endDay}`;
            }
            
            // Generate calendar days (Mon-Sat only)
            const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
            
            for (let i = 1; i <= 6; i++) {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + i);
                
                const dayElement = this.createDayElement(date, days[i - 1], i);
                grid.appendChild(dayElement);
            }
            
            console.log('Calendar rendered successfully');
            
        } catch (error) {
            console.error('Error rendering calendar:', error);
        }
    }

    createDayElement(date, dayName, index = 0) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.style.animationDelay = `${index * 0.08}s`;
        
        const dateKey = this.formatDateKey(date);
        dayElement.dataset.dateKey = dateKey; // Store date key for later use
        
        // Add day name header
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = dayName;
        dayElement.appendChild(dayHeader);
        
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
            const baseSchedule = this.sampleSchedule[dateKey];
            const hasExtras = this.getExtrasForDate(dateKey).length > 0;
            const hasAbsences = this.checkDayHasAbsences(dateKey);
            const dayAbsencesCount = this.getDayAbsencesCount(dateKey);
            
            // Add classes
            if (isToday) dayElement.classList.add('today');
            if (baseSchedule || hasExtras) dayElement.classList.add('has-classes');
            if (hasAbsences) dayElement.classList.add('has-absences');
            
            // Day number
            const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        
        // Day classes info
        const dayClasses = document.createElement('div');
        dayClasses.className = 'day-classes';
        
        const combined = this.getCombinedDaySchedule(dateKey);
        const classCount = combined.classes.length;
        if (classCount > 0) {
            dayClasses.textContent = `${classCount} ${this.getPluralForm(classCount, 'заняття', 'заняття', 'занять')}`;
        } else {
            dayClasses.textContent = '';
        }
        
        dayElement.appendChild(dayNumber);
        dayElement.appendChild(dayClasses);
        
        // Add absence badge if there are absences
        if (dayAbsencesCount > 0) {
            const absenceBadge = document.createElement('div');
            absenceBadge.className = 'day-absence-badge';
            absenceBadge.textContent = dayAbsencesCount;
            dayElement.appendChild(absenceBadge);
        }
        
        // Click handler
        dayElement.addEventListener('click', () => this.openDayModal(date));
        
        return dayElement;
    }

    formatDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    // Load per-day extra classes (replacements)
    loadPerDayExtras() {
        try {
            const saved = localStorage.getItem('bn32-day-extras');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn('Failed to load per-day extras:', e);
            return {};
        }
    }

    savePerDayExtras() {
        try {
            localStorage.setItem('bn32-day-extras', JSON.stringify(this.perDayExtras || {}));
        } catch (e) {
            console.warn('Failed to save per-day extras:', e);
        }
    }

    getExtrasForDate(dateKey) {
        if (!this.perDayExtras) this.perDayExtras = {};
        return this.perDayExtras[dateKey] || [];
    }

    addExtraClassForDate(dateKey, extra) {
        if (!this.perDayExtras) this.perDayExtras = {};
        if (!this.perDayExtras[dateKey]) this.perDayExtras[dateKey] = [];
        // Assign unique, stable id
        const id = `${dateKey}-extra-${Date.now()}`;
        this.perDayExtras[dateKey].push({ id, ...extra });
        this.savePerDayExtras();
        // Refresh calendar and modal
        this.renderCalendar();
        this.updateCalendarAfterAttendanceChange();
        this.vibrate(15);
        return id;
    }

    removeExtraClassForDate(dateKey, extraId) {
        if (!this.perDayExtras || !this.perDayExtras[dateKey]) return;
        this.perDayExtras[dateKey] = this.perDayExtras[dateKey].filter(e => e.id !== extraId);
        if (this.perDayExtras[dateKey].length === 0) delete this.perDayExtras[dateKey];
        this.savePerDayExtras();
        this.renderCalendar();
        this.updateCalendarAfterAttendanceChange();
        this.vibrate(15);
    }

    getCombinedDaySchedule(dateKey) {
        // Combine base schedule classes with per-day extras
        const base = this.sampleSchedule[dateKey]?.classes || [];
        const extras = this.getExtrasForDate(dateKey).map(e => ({
            id: e.id,
            time: e.time || '—',
            subject: e.subject || 'Заміна',
            room: e.room || '',
            teacher: e.teacher || '',
            type: 'Заміна'
        }));
        return { classes: [...base, ...extras] };
    }

    checkDayHasAbsences(dateKey) {
        console.log(`Checking absences for day: ${dateKey}`);
        
        // Сначала проверяем текущее расписание
        let daySchedule = this.sampleSchedule[dateKey];
        
        // Если нет, генерируем для этого дня
        if (!daySchedule) {
            console.log(`No schedule found for ${dateKey}, generating...`);
            const date = new Date(dateKey + 'T00:00:00');
            const tempSchedule = this.generateWeekSchedule(date);
            daySchedule = tempSchedule[dateKey];
            
            // Сохраняем в основном расписании
            if (daySchedule) {
                this.sampleSchedule[dateKey] = daySchedule;
            }
        }
        
        // Объединяем с заминами на день
        const combined = this.getCombinedDaySchedule(dateKey);
        if (!combined || !combined.classes || combined.classes.length === 0) {
            console.log(`No classes found for ${dateKey}`);
            return false;
        }
        
        console.log(`Classes for ${dateKey}:`, combined.classes.map(c => c.id));
        
        const hasAbsent = combined.classes.some(classInfo => {
            const isAbsent = this.attendanceData[classInfo.id] === 'absent';
            if (isAbsent) {
                console.log(`Found absent class: ${classInfo.id} for ${dateKey}`);
            }
            return isAbsent;
        });
        
        console.log(`Day ${dateKey} has absences: ${hasAbsent}`);
        return hasAbsent;
    }
    
    getMonthAbsencesCount(date) {
        let absencesCount = 0;
        const month = date.getMonth();
        const year = date.getFullYear();
        
        // Проходим по всем дням месяца
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            const dateKey = this.formatDateKey(d);
            // Генерируем расписание для этого дня, если его нет в текущем расписании
            let daySchedule = this.sampleSchedule[dateKey];
            if (!daySchedule) {
                const tempWeekSchedule = this.generateWeekSchedule(d);
                daySchedule = tempWeekSchedule[dateKey];
            }
            
            if (daySchedule && daySchedule.classes) {
                daySchedule.classes.forEach(classInfo => {
                    if (this.attendanceData[classInfo.id] === 'absent') {
                        absencesCount++;
                    }
                });
            }
        }
        
        return absencesCount;
    }
    
    getPluralForm(count, one, few, many) {
        if (count % 10 === 1 && count % 100 !== 11) return one;
        if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return few;
        return many;
    }

    updateCurrentDate() {
        try {
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
        } catch (error) {
            console.error('Error updating current date:', error);
        }
    }

    updateStats() {
        // Simple stats update - can be expanded later
        console.log('Stats updated');
    }

    handleResize() {
        this.isMobile = window.innerWidth <= 768;
        if (!this.isMobile) {
            this.closeMobileMenu();
        }
    }

    openDayModal(date) {
        this.selectedDate = date;
        const modal = document.getElementById('modalOverlay');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalTitle || !modalBody) {
            console.error('Modal elements not found:', { modal: !!modal, modalTitle: !!modalTitle, modalBody: !!modalBody });
            return;
        }
        
        // Set modal title
        const titleOptions = { weekday: 'long', month: 'long', day: 'numeric' };
        modalTitle.textContent = date.toLocaleDateString('uk-UA', titleOptions);
        
        // Clear modal body
        modalBody.innerHTML = '';
        
        const dateKey = this.formatDateKey(date);
        // Комбинированное расписание: базовые + замiни (тільки для цього дня)
        const combined = this.getCombinedDaySchedule(dateKey);
        this.renderScheduleDetails(modalBody, combined, dateKey);
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    renderScheduleDetails(container, schedule, dateKey) {
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'schedule-details';
        
        const title = document.createElement('h4');
        title.textContent = 'Розклад на день';
        detailsDiv.appendChild(title);
        
        const extras = new Set(this.getExtrasForDate(dateKey).map(e => e.id));
        
        schedule.classes.forEach(classInfo => {
            const classDiv = document.createElement('div');
            classDiv.className = 'class-item';
            const isExtra = extras.has(classInfo.id);
            if (isExtra) classDiv.classList.add('extra-class');
            
            const attendanceStatus = this.attendanceData[classInfo.id] || 'unknown';
            const isAbsent = attendanceStatus === 'absent';
            const isPresent = attendanceStatus === 'present';
            
            classDiv.innerHTML = `
                <div class=\"class-content\">
                    ${isExtra ? '<div class="extra-badge">Заміна</div>' : ''}
                    <div class="class-time">${classInfo.time}</div>
                    <div class="class-subject">${classInfo.subject}</div>
                    <div class="class-details">${classInfo.room} • ${classInfo.teacher}</div>
                </div>
                ${isExtra ? `<button class="remove-extra-btn" data-extra-id="${classInfo.id}">✕ Прибрати</button>` : ''}
                <div class=\"attendance-section\">
                    <div class="attendance-checkbox">
                        <input type="checkbox" id="absence-${classInfo.id}" class="absence-checkbox" data-class-id="${classInfo.id}" ${isAbsent ? 'checked' : ''}>
                        <label for="absence-${classInfo.id}" class="checkbox-label">
                            <span class="checkbox-custom"></span>
                            <span class="checkbox-text">Пропуск</span>
                        </label>
                    </div>
                </div>
            `;
            
            detailsDiv.appendChild(classDiv);
        });
        
        // Add extra class form
        const addExtraBlock = document.createElement('div');
        addExtraBlock.className = 'add-extra-block';
        addExtraBlock.innerHTML = `
            <button class="add-extra-toggle" type="button">➕ Додати пару</button>
            <div class="extra-form collapsed" aria-hidden="true">
                <div class="extra-form-inner">
                    <input type="text" class="form-input extra-time" placeholder="Час (напр. 10:25-12:00)">
                    <input type="text" class="form-input extra-subject" placeholder="Предмет">
                    <input type="text" class="form-input extra-room" placeholder="Аудиторія">
                    <input type="text" class="form-input extra-teacher" placeholder="Викладач">
                    <button class="btn-primary save-extra-btn" type="button">Додати</button>
                </div>
            </div>
        `;

        // Add event listeners for attendance checkboxes
        detailsDiv.addEventListener('click', (e) => {
            // Remove extra
            const removeBtn = e.target.closest('.remove-extra-btn');
            if (removeBtn) {
                const id = removeBtn.dataset.extraId;
                this.removeExtraClassForDate(dateKey, id);
                // Re-render modal contents
                container.innerHTML = '';
                this.renderScheduleDetails(container, this.getCombinedDaySchedule(dateKey), dateKey);
                return;
            }
        });

        detailsDiv.addEventListener('change', (e) => {
            if (e.target.classList.contains('absence-checkbox')) {
                const classId = e.target.dataset.classId;
                const isAbsent = e.target.checked;
                const status = isAbsent ? 'absent' : 'present';
                
                this.markAttendance(classId, status);
                this.vibrate(15);
            }
        });
        
        container.appendChild(detailsDiv);
        // Place add controls at the bottom
        container.appendChild(addExtraBlock);

        // Toggle show/hide of add form
        const toggleBtn = addExtraBlock.querySelector('.add-extra-toggle');
        const formEl = addExtraBlock.querySelector('.extra-form');
        if (toggleBtn && formEl) {
            toggleBtn.addEventListener('click', () => {
                formEl.classList.toggle('open');
                const isOpen = formEl.classList.contains('open');
                formEl.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
                if (isOpen) {
                    setTimeout(() => addExtraBlock.querySelector('.extra-subject')?.focus(), 50);
                }
            });
        }

        // Add handler for extra form save
        const saveBtn = addExtraBlock.querySelector('.save-extra-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const time = addExtraBlock.querySelector('.extra-time')?.value.trim();
                const subject = addExtraBlock.querySelector('.extra-subject')?.value.trim();
                const room = addExtraBlock.querySelector('.extra-room')?.value.trim();
                const teacher = addExtraBlock.querySelector('.extra-teacher')?.value.trim();
                if (!subject) {
                    this.showNotification('Вкажіть назву предмету', 'error');
                    return;
                }
                this.addExtraClassForDate(dateKey, { time, subject, room, teacher });
                // Re-render modal contents
                container.innerHTML = '';
                this.renderScheduleDetails(container, this.getCombinedDaySchedule(dateKey), dateKey);
            });
        }
    }

    closeModal() {
        const modal = document.getElementById('modalOverlay');
        if (modal) {
            modal.classList.remove('active');
            // Wait for animation to complete before cleaning up
            setTimeout(() => {
                document.body.style.overflow = 'auto';
            }, 400);
        }
        this.selectedDate = null;
    }

    toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menuToggle');
        const mainContent = document.getElementById('mainContent');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const body = document.body;
        
        const isOpen = sidebar && sidebar.classList.contains('active');
        const opening = !isOpen;
        
        // Перед открытием гарантируем видимость элементов (фикс iOS визуала)
        if (opening) {
            if (sidebar) sidebar.style.display = 'block';
            if (sidebarOverlay) sidebarOverlay.style.display = 'block';
        }
        
        if (sidebar) sidebar.classList.toggle('active');
        if (menuToggle) menuToggle.classList.toggle('active');
        if (mainContent) mainContent.classList.toggle('sidebar-open');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
        
        // Блокировка/разблокировка прокрутки body
        body.classList.toggle('sidebar-open');
        if (opening) {
            body.style.overflow = 'hidden';
            body.style.position = 'fixed';
            body.style.top = `-${window.scrollY}px`;
            body.style.width = '100%';
        } else {
            const scrollY = body.style.top;
            body.style.overflow = '';
            body.style.position = '';
            body.style.top = '';
            body.style.width = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
            // Спрячем элементы после завершения анимации
            setTimeout(() => {
                if (sidebar) sidebar.style.display = 'none';
                if (sidebarOverlay) sidebarOverlay.style.display = 'none';
            }, 350);
        }
        
        // iOS Safari fix: force DOM reflow
        window.requestAnimationFrame(() => {
            if (sidebar) sidebar.offsetHeight;
            if (sidebarOverlay) sidebarOverlay.offsetHeight;
        });
        
        this.vibrate(20);
    }

    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menuToggle');
        const mainContent = document.getElementById('mainContent');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const body = document.body;
        
        // iOS Safari Fix: принудительное закрытие меню
        if (sidebar) {
            sidebar.classList.remove('active');
            // Force repaint on iOS
            sidebar.style.transform = 'translateX(-100%)';
        }
        if (menuToggle) {
            menuToggle.classList.remove('active');
        }
        if (mainContent) {
            mainContent.classList.remove('sidebar-open');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
            // Ensure overlay is hidden on iOS
            sidebarOverlay.style.opacity = '0';
            sidebarOverlay.style.visibility = 'hidden';
            sidebarOverlay.style.pointerEvents = 'none';
        }
        
        // Возвращаем скролл
        body.classList.remove('sidebar-open');
        body.style.overflow = 'auto';
        
        // Force layout recalculation on iOS Safari
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            window.requestAnimationFrame(() => {
                if (sidebar) sidebar.offsetHeight; // Force reflow
                if (sidebarOverlay) sidebarOverlay.offsetHeight; // Force reflow
            });
        }
        
        // Clear inline styles after animation и спрятать элементы
        setTimeout(() => {
            if (sidebar) {
                sidebar.style.transform = '';
                sidebar.style.display = 'none';
            }
            if (sidebarOverlay) {
                sidebarOverlay.style.opacity = '';
                sidebarOverlay.style.visibility = '';
                sidebarOverlay.style.pointerEvents = '';
                sidebarOverlay.style.display = 'none';
            }
        }, 400);
    }

    // Принудительное закрытие меню (фикс для iPhone автооткрытия)
    ensureMenuClosed() {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menuToggle');
        const mainContent = document.getElementById('mainContent');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const body = document.body;
        
        console.log('Ensuring mobile menu is closed...');
        
        // Убираем все active классы
        if (sidebar) {
            sidebar.classList.remove('active');
            // Принудительно скрываем
            sidebar.style.transform = 'translateX(-100%)';
            sidebar.style.webkitTransform = 'translateX(-100%)';
            sidebar.style.display = 'none';
        }
        
        if (menuToggle) {
            menuToggle.classList.remove('active');
        }
        
        if (mainContent) {
            mainContent.classList.remove('sidebar-open');
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
            sidebarOverlay.style.opacity = '0';
            sidebarOverlay.style.visibility = 'hidden';
            sidebarOverlay.style.pointerEvents = 'none';
            sidebarOverlay.style.display = 'none';
        }
        
        // Убираем блокировку скролла
        body.classList.remove('sidebar-open');
        body.style.overflow = 'auto';
        body.style.position = 'static';
        
        // Очищаем inline стили через небольшой таймаут
        setTimeout(() => {
            if (sidebar) {
                sidebar.style.transform = '';
                sidebar.style.webkitTransform = '';
                // display оставляем 'none' до открытия
            }
            if (sidebarOverlay) {
                sidebarOverlay.style.opacity = '';
                sidebarOverlay.style.visibility = '';
                sidebarOverlay.style.pointerEvents = '';
                // display оставляем 'none' до открытия
            }
        }, 100);
        
        console.log('Mobile menu forced closed');
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
                <h3>Розклад на тиждень</h3>
                <p>Тут буде відображено розклад на поточний тиждень</p>
            </div>
        `;
    }
    
    renderStatistics() {
        console.log('Rendering statistics');
        const container = document.querySelector('#statistics-section .statistics-content');
        if (!container) {
            console.warn('Statistics container not found');
            return;
        }
        
        const stats = this.calculateStatistics();
        
        container.innerHTML = `
            <div class="stats-overview">
                <div class="stats-grid">
                    <div class="stat-card total-classes">
                        <div class="stat-icon">📚</div>
                        <div class="stat-value">${stats.totalClasses}</div>
                        <div class="stat-label">Всього занять</div>
                    </div>
                    
                    <div class="stat-card present-classes">
                        <div class="stat-icon">✓</div>
                        <div class="stat-value">${stats.presentClasses}</div>
                        <div class="stat-label">Присутність</div>
                    </div>
                    
                    <div class="stat-card absent-classes">
                        <div class="stat-icon">⚠️</div>
                        <div class="stat-value">${stats.absentClasses}</div>
                        <div class="stat-label">Пропуски</div>
                    </div>
                    
                    <div class="stat-card attendance-rate">
                        <div class="stat-icon">📈</div>
                        <div class="stat-value">${stats.attendanceRate}%</div>
                        <div class="stat-label">Відвідуваність</div>
                    </div>
                </div>
            </div>
            
            <div class="detailed-stats">
                <div class="stats-section">
                    <h3>Статистика по предметам</h3>
                    <div class="subjects-stats">
                        ${this.renderSubjectsStats(stats.subjectStats)}
                    </div>
                </div>
                
                <div class="stats-section">
                    <h3>Прогрес по месяцам</h3>
                    <div class="monthly-progress">
                        <div class="progress-indicator">
                            <div class="progress-text">
                                Текущий месяц: <strong>${stats.currentMonthAbsences} пропусков</strong>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(stats.currentMonthAbsences / 10 * 100, 100)}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="stats-section">
                    <h3>Рекомендації</h3>
                    <div class="recommendations">
                        ${this.generateRecommendations(stats)}
                    </div>
                </div>
            </div>
        `;
    }
    
    calculateStatistics() {
        let totalClasses = 0;
        let presentClasses = 0;
        let absentClasses = 0;
        const subjectStats = {};
        
        // Проходим по всем классам в данных о посещаемости
        Object.keys(this.attendanceData).forEach(classId => {
            const status = this.attendanceData[classId];
            
            // Найдем информацию о классе
            const classInfo = this.findClassById(classId);
            if (!classInfo) return;
            
            totalClasses++;
            
            if (status === 'present') {
                presentClasses++;
            } else if (status === 'absent') {
                absentClasses++;
            }
            
            // Статистика по предметам
            if (!subjectStats[classInfo.subject]) {
                subjectStats[classInfo.subject] = {
                    total: 0,
                    present: 0,
                    absent: 0
                };
            }
            
            subjectStats[classInfo.subject].total++;
            if (status === 'present') {
                subjectStats[classInfo.subject].present++;
            } else if (status === 'absent') {
                subjectStats[classInfo.subject].absent++;
            }
        });
        
        const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
        const currentMonthAbsences = this.getMonthAbsencesCount(new Date());
        
        return {
            totalClasses,
            presentClasses,
            absentClasses,
            attendanceRate,
            subjectStats,
            currentMonthAbsences
        };
    }
    
    findClassById(classId) {
        // Поиск класса по ID в расписании
        for (const dateKey in this.sampleSchedule) {
            const daySchedule = this.sampleSchedule[dateKey];
            if (daySchedule && daySchedule.classes) {
                const classInfo = daySchedule.classes.find(c => c.id === classId);
                if (classInfo) return classInfo;
            }
        }
        return null;
    }
    
    renderSubjectsStats(subjectStats) {
        return Object.keys(subjectStats).map(subject => {
            const stats = subjectStats[subject];
            const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
            
            return `
                <div class="subject-stat">
                    <div class="subject-name">${subject}</div>
                    <div class="subject-numbers">
                        <span class="subject-present">✓ ${stats.present}</span>
                        <span class="subject-absent">✗ ${stats.absent}</span>
                        <span class="subject-rate">${rate}%</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    generateRecommendations(stats) {
        const recommendations = [];
        
        if (stats.attendanceRate >= 90) {
            recommendations.push('🎆 Відмінна відвідуваність! Продовжуйте в тому ж дусі!');
        } else if (stats.attendanceRate >= 75) {
            recommendations.push('💪 Гарна відвідуваність, але є куди рости!');
        } else if (stats.attendanceRate >= 50) {
            recommendations.push('⚠️ Відвідуваність нижче середнього. Постарайтеся не пропускати!');
        } else {
            recommendations.push('😨 Критично низька відвідуваність! Необхідно покращити ситуацію.');
        }
        
        if (stats.currentMonthAbsences > 5) {
            recommendations.push('📅 За поточний месяц велика кількість пропусків.');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('🌟 Продовжуйте відвідувати заняття регулярно!');
        }
        
        return recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('');
    }

    // Theme management
    changeTheme(themeName) {
        this.currentTheme = themeName;
        document.body.setAttribute('data-theme', themeName);
        localStorage.setItem('bn32-theme', themeName);
        this.vibrate(15);
    }
    
    applyTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
    }
    
    loadSettings() {
        // Load basic settings
        this.vibrationEnabled = localStorage.getItem('bn32-vibration') !== 'false';
        
        // Load font size
        const fontSize = localStorage.getItem('bn32-font-size') || 'medium';
        document.body.classList.add(`font-${fontSize}`);
        
        // Set active theme button
        setTimeout(() => {
            const activeThemeBtn = document.querySelector(`[data-theme="${this.currentTheme}"]`);
            if (activeThemeBtn) {
                document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
                activeThemeBtn.classList.add('active');
            }
            
            // Set active font size button
            const activeSizeBtn = document.querySelector(`[data-size="${fontSize}"]`);
            if (activeSizeBtn) {
                document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
                activeSizeBtn.classList.add('active');
            }
            
            // Set vibration toggle
            const vibrationToggle = document.getElementById('vibration-toggle');
            if (vibrationToggle) {
                vibrationToggle.checked = this.vibrationEnabled;
            } else {
                console.warn('Vibration toggle element not found');
            }
        }, 100);
    }

    vibrate(duration) {
        // Проверяем наличие API вибрации и разрешение
        if (this.vibrationEnabled && navigator && 'vibrate' in navigator) {
            try {
                // Проверяем, что это мобильное устройство или поддерживает вибрации
                const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
                
                if (isMobileDevice || isTouchDevice) {
                    const result = navigator.vibrate(duration);
                    console.log(`Vibration ${duration}ms:`, result ? 'success' : 'failed');
                    return result;
                }
            } catch (error) {
                console.warn('Vibration failed:', error);
            }
        }
        return false;
    }
    
    diagnoseVibration() {
        console.log('=== VIBRATION DIAGNOSTIC ===');
        console.log('User Agent:', navigator.userAgent);
        console.log('Vibrate API available:', 'vibrate' in navigator);
        console.log('Touch support:', 'ontouchstart' in window);
        console.log('Max touch points:', navigator.maxTouchPoints);
        console.log('Vibration enabled:', this.vibrationEnabled);
        console.log('Is mobile (detection):', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
        console.log('Is touch device:', 'ontouchstart' in window || navigator.maxTouchPoints > 0);
        console.log('=============================');
    }
    
    // Schedule Editor Methods
    openScheduleEditor() {
        console.log('Opening schedule editor...');
        this.createScheduleEditor();
        this.vibrate(20);
    }
    
    resetToDefaultSchedule() {
        console.log('Resetting to default schedule...');
        if (confirm('Ви впевнені, що хочете скинути розклад до стандартного?')) {
            // Reset to default schedule
            this.customClasses = {};
            this.saveCustomClasses();
            this.sampleSchedule = this.generateWeekSchedule(this.currentWeek);
            this.renderCalendar();
            this.updateScheduleStatus('default');
            this.showNotification('Розклад скинуто до стандартного', 'success');
            this.vibrate(30);
        }
    }
    
    exportSchedule() {
        console.log('Exporting schedule...');
        const scheduleData = {
            customClasses: this.customClasses,
            attendanceData: this.attendanceData,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(scheduleData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `bn32-schedule-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Розклад експортовано!', 'success');
        this.vibrate(15);
    }
    
    loadSettings() {
        // Загрузка размера шрифта
        const savedFontSize = localStorage.getItem('bn32-font-size') || 'medium';
        this.changeFontSize(savedFontSize);
        
        // Обновляем активную кнопку размера шрифта
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.size === savedFontSize) {
                btn.classList.add('active');
            }
        });
        
        // Загрузка настройки вибрации
        const savedVibration = localStorage.getItem('bn32-vibration');
        if (savedVibration !== null) {
            this.vibrationEnabled = savedVibration === 'true';
            const vibrationToggle = document.getElementById('vibration-toggle');
            if (vibrationToggle) {
                vibrationToggle.checked = this.vibrationEnabled;
            }
        }

        // Нижняя навигация
        const savedBottomNav = localStorage.getItem('bn32-bottom-nav');
        const bottomNavEnabled = (savedBottomNav === null) ? true : (savedBottomNav === 'true');
        localStorage.setItem('bn32-bottom-nav', bottomNavEnabled ? 'true' : 'false');
        this.applyBottomNav(bottomNavEnabled);
        const bottomToggle = document.getElementById('bottom-nav-toggle');
        if (bottomToggle) bottomToggle.checked = bottomNavEnabled;
        
        console.log('Settings loaded successfully');
    }
    
    applyTheme() {
        // Применяем сохраненную тему
        if (this.currentTheme && this.currentTheme !== 'default') {
            document.documentElement.setAttribute('data-theme', this.currentTheme);
        }
        
        // Обновляем активную кнопку темы
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === this.currentTheme) {
                btn.classList.add('active');
            }
        });
    }
    
    setupBottomNavViewportSync() {
        try {
            const nav = document.getElementById('bottomNav');
            if (!nav) return;
            const apply = () => {
                try {
                    if (window.visualViewport) {
                        const vv = window.visualViewport;
                        const extra = Math.max(0, (window.innerHeight - vv.height - vv.offsetTop));
                        nav.style.setProperty('--vv-offset', `${extra}px`);
                    } else {
                        nav.style.setProperty('--vv-offset', '0px');
                    }
                } catch {}
            };
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', apply);
                window.visualViewport.addEventListener('scroll', apply);
            }
            window.addEventListener('orientationchange', () => setTimeout(apply, 60));
            apply();
        } catch (e) { console.warn('setupBottomNavViewportSync failed:', e); }
    }

    applyBottomNav(enabled) {
        const body = document.body;
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const menuToggle = document.getElementById('menuToggle');
        const bottomNav = document.getElementById('bottomNav');
        if (enabled) {
            body.classList.add('bottom-nav-enabled');
            // Гарантируем закрытое сайд-меню
            try { this.ensureMenuClosed && this.ensureMenuClosed(); } catch {}
            if (menuToggle) menuToggle.style.display = 'none';
        } else {
            body.classList.remove('bottom-nav-enabled');
            if (menuToggle) menuToggle.style.display = '';
        }
        // Синхронизируем активную вкладку нижней навигации с активной секцией
        if (bottomNav) {
            const activeSection = document.querySelector('.content-section.active');
            let sectionId = 'main';
            if (activeSection && activeSection.id && activeSection.id.endsWith('-section')) {
                sectionId = activeSection.id.replace('-section', '');
            }
            bottomNav.querySelectorAll('.bottom-tab').forEach(b => b.classList.toggle('active', b.dataset.section === sectionId));
        }
    }

    enableAbsoluteBottomNavForMobile() {
        // Make bottom nav follow the screen actively
        try {
            const bottomNav = document.getElementById('bottomNav');
            if (!bottomNav) return;
            
            // Only on mobile
            if (window.innerWidth > 768) {
                bottomNav.style.position = '';
                bottomNav.style.bottom = '';
                return;
            }
            
            let ticking = false;
            
            const updatePosition = () => {
                const scrollY = window.pageYOffset || document.documentElement.scrollTop;
                const viewportHeight = window.innerHeight;
                const navHeight = bottomNav.offsetHeight;
                const bottomOffset = 20; // Отступ снизу
                
                // Calculate position relative to document
                const newBottom = scrollY + viewportHeight - navHeight - bottomOffset;
                
                // Apply position
                bottomNav.style.position = 'absolute';
                bottomNav.style.bottom = 'auto';
                bottomNav.style.top = newBottom + 'px';
                bottomNav.style.left = '50%';
                bottomNav.style.transform = 'translateX(-50%)';
                bottomNav.style.zIndex = '9999';
                
                ticking = false;
            };
            
            const requestTick = () => {
                if (!ticking) {
                    requestAnimationFrame(updatePosition);
                    ticking = true;
                }
            };
            
            // Update on scroll and resize
            window.addEventListener('scroll', requestTick, { passive: true });
            window.addEventListener('resize', requestTick);
            window.addEventListener('orientationchange', () => {
                setTimeout(requestTick, 100);
            });
            
            // Touch events for immediate response
            let touchStartY = 0;
            window.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
            }, { passive: true });
            
            window.addEventListener('touchmove', (e) => {
                requestTick();
            }, { passive: true });
            
            // Initial position
            updatePosition();
            
            // Store for cleanup
            this._bottomNavUpdate = requestTick;
            
        } catch (e) {
            console.warn('Bottom nav follow failed:', e);
        }
    }

    changeTheme(theme) {
        console.log(`Changing theme to: ${theme}`);
        this.currentTheme = theme;
        localStorage.setItem('bn32-theme', theme);
        
        if (theme === 'default') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        
        this.vibrate(10);
    }
    
    changeFontSize(size) {
        console.log(`Changing font size to: ${size}`);
        document.body.className = document.body.className.replace(/font-(small|medium|large)/g, '');
        document.body.classList.add(`font-${size}`);
        localStorage.setItem('bn32-font-size', size);
        this.vibrate(10);
    }
    
    toggleVibration(enabled) {
        console.log(`Vibration ${enabled ? 'enabled' : 'disabled'}`);
        this.vibrationEnabled = enabled;
        localStorage.setItem('bn32-vibration', enabled ? 'true' : 'false');
        
        // Тестовая вибрация при включении
        if (enabled) {
            console.log('Testing vibration...');
            const vibrationResult = this.vibrate(50);
            console.log('Vibration test result:', vibrationResult);
        }
    }
    
    updateScheduleStatus(type = 'default') {
        const statusElement = document.getElementById('schedule-status');
        if (!statusElement) return;
        
        const indicator = statusElement.querySelector('.status-indicator');
        const statusText = statusElement.querySelector('.status-text');
        
        if (type === 'default') {
            indicator.className = 'status-indicator default';
            statusText.textContent = 'Використовується стандартний розклад';
        } else {
            indicator.className = 'status-indicator custom';
            statusText.textContent = 'Використовується користувацький розклад';
        }
    }
    
    showNotification(message, type = 'info') {
        // UI notifications disabled per user request
        // Keep a tiny console trace for debugging (no UI shown)
        try { console.debug('[notice suppressed]', type, message); } catch {}
        return;
    }
    
    markAttendance(classId, status) {
        console.log(`Marking attendance for class ${classId}: ${status}`);
        this.attendanceData[classId] = status;
        this.saveAttendanceData();
        
        // Show notification
        const statusText = status === 'present' ? 'Присутність' : 'Пропуск';
        this.showNotification(`Отмено как: ${statusText}`, status === 'present' ? 'success' : 'info');
        
        // Close modal first
        this.closeModal();
        
        // Force update calendar after a small delay
        setTimeout(() => {
            this.updateCalendarAfterAttendanceChange();
        }, 100);
    }
    
    updateCalendarAfterAttendanceChange() {
        // Update month stats with absences count
        const monthStats = document.getElementById('monthStats');
        if (monthStats) {
            const weekStart = new Date(this.currentWeek);
            weekStart.setDate(this.currentWeek.getDate() - this.currentWeek.getDay());
            const monthAbsences = this.getMonthAbsencesCount(weekStart);
            
            if (monthAbsences > 0) {
                monthStats.innerHTML = `
                    <div class="month-absences-counter">
                        <span class="absences-icon">⚠️</span>
                        <span class="absences-count">${monthAbsences}</span>
                        <span class="absences-text">${this.getPluralForm(monthAbsences, 'пропуск', 'пропуски', 'пропусків')}</span>
                    </div>
                `;
                
                // Make month title red if there are absences
                const monthTitle = document.getElementById('monthTitle');
                if (monthTitle) {
                    monthTitle.classList.add('has-absences');
                }
            } else {
                monthStats.innerHTML = '<div class="month-perfect">✓ Без пропусків</div>';
                
                // Remove red styling from month title
                const monthTitle = document.getElementById('monthTitle');
                if (monthTitle) {
                    monthTitle.classList.remove('has-absences');
                }
            }
        }
        
        // Update calendar days with absence badges and styling
        this.updateCalendarDaysAbsences();
    }
    
    updateCalendarDaysAbsences() {
        console.log('Updating calendar days absences...');
        const calendarDays = document.querySelectorAll('.calendar-day');
        
        calendarDays.forEach(dayElement => {
            const dateKey = this.getDayDateKey(dayElement);
            if (!dateKey) {
                console.warn('No dateKey found for day element');
                return;
            }
            
            console.log(`Checking day ${dateKey}`);
            
            // Проверяем есть ли пропуски
            const hasAbsences = this.checkDayHasAbsences(dateKey);
            const dayAbsencesCount = this.getDayAbsencesCount(dateKey);
            
            console.log(`Day ${dateKey}: hasAbsences=${hasAbsences}, count=${dayAbsencesCount}`);
            
            // Обновляем стили дня
            if (hasAbsences) {
                dayElement.classList.add('has-absences');
                console.log(`Added has-absences class to ${dateKey}`);
            } else {
                dayElement.classList.remove('has-absences');
            }
            
            // Обновляем или добавляем бейдж пропусков
            let badge = dayElement.querySelector('.day-absence-badge');
            if (dayAbsencesCount > 0) {
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'day-absence-badge';
                    dayElement.appendChild(badge);
                    console.log(`Created new badge for ${dateKey}`);
                }
                badge.textContent = dayAbsencesCount;
                badge.style.display = 'flex';
                console.log(`Updated badge for ${dateKey}: ${dayAbsencesCount}`);
            } else if (badge) {
                badge.style.display = 'none';
            }
        });
    }
    
    getDayDateKey(dayElement) {
        // Extract date from day element using data attribute
        const dateKey = dayElement.dataset.dateKey;
        if (!dateKey) {
            console.error('dayElement missing dateKey:', dayElement);
        }
        return dateKey;
    }
    
    getDayAbsencesCount(dateKey) {
        console.log(`Getting absence count for day: ${dateKey}`);
        
        // Сначала проверяем текущее расписание
        let daySchedule = this.sampleSchedule[dateKey];
        
        // Если нет, генерируем для этого дня
        if (!daySchedule) {
            console.log(`No schedule found for ${dateKey}, generating...`);
            const date = new Date(dateKey + 'T00:00:00');
            const tempSchedule = this.generateWeekSchedule(date);
            daySchedule = tempSchedule[dateKey];
            
            // Сохраняем в основном расписании
            if (daySchedule) {
                this.sampleSchedule[dateKey] = daySchedule;
            }
        }
        
        const combined = this.getCombinedDaySchedule(dateKey);
        if (!combined || !combined.classes) {
            console.log(`No classes found for ${dateKey}`);
            return 0;
        }
        
        let count = 0;
        combined.classes.forEach(classInfo => {
            if (this.attendanceData[classInfo.id] === 'absent') {
                count++;
                console.log(`Counting absent class: ${classInfo.id}`);
            }
        });
        
        console.log(`Absence count for ${dateKey}: ${count}`);
        return count;
    }
    
    saveAttendanceData() {
        try {
            localStorage.setItem('bn32-attendance', JSON.stringify(this.attendanceData));
        } catch (error) {
            console.warn('Failed to save attendance data:', error);
        }
    }
    
    createScheduleEditor() {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay custom-schedule-modal';
        modalOverlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Редактор розкладу</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="schedule-editor-content">
                        <div class="days-tabs">
                            <button class="day-tab active" data-day="1">Понеділок</button>
                            <button class="day-tab" data-day="2">Вівторок</button>
                            <button class="day-tab" data-day="3">Середа</button>
                            <button class="day-tab" data-day="4">Четвер</button>
                            <button class="day-tab" data-day="5">П'ятниця</button>
                        </div>
                        <div class="day-schedule-editor" id="dayScheduleEditor">
                            <!-- Day schedule content will be populated here -->
                        </div>
                        <div class="editor-actions">
                            <button class="btn-primary add-class-btn">Додати заняття</button>
                            <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Скасувати</button>
                            <button class="btn-primary save-schedule-btn">Зберегти</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        // Activate modal with slight delay for transition
        setTimeout(() => {
            modalOverlay.classList.add('active');
            try {
                // Ensure viewport jumps to the modal and focus it
                const modalEl = modalOverlay.querySelector('.modal');
                if (modalEl) {
                    modalEl.setAttribute('tabindex', '-1');
                    // Smoothly scroll page to top so modal is fully visible
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    // Prevent the focus from triggering another scroll
                    setTimeout(() => modalEl.focus({ preventScroll: true }), 30);
                }
            } catch {}
        }, 10);
        
        // Initialize editor
        this.currentEditingDay = 1;
        this.renderDayEditor(1);
        
        // Setup event listeners for the editor
        this.setupScheduleEditorListeners(modalOverlay);
        
        // Lock background scroll
        document.body.style.overflow = 'hidden';
    }
    
    setupScheduleEditorListeners(modal) {
        // Day tabs
        modal.querySelectorAll('.day-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                modal.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const day = parseInt(tab.dataset.day);
                this.currentEditingDay = day;
                this.renderDayEditor(day);
            });
        });
        
        // Add class button
        const addClassBtn = modal.querySelector('.add-class-btn');
        if (addClassBtn) {
            addClassBtn.addEventListener('click', () => this.addNewClass());
        }
        
        // Save button
        const saveBtn = modal.querySelector('.save-schedule-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveScheduleChanges();
                modal.remove();
                document.body.style.overflow = 'auto';
            });
        }
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    renderDayEditor(day) {
        const container = document.getElementById('dayScheduleEditor');
        if (!container) {
            console.warn('Day schedule editor container not found');
            return;
        }
        
        const dayClasses = this.weeklyScheduleTemplate[day] || [];
        const times = ['08:30-10:05', '10:25-12:00', '12:20-13:55', '14:15-15:50'];
        
        container.innerHTML = `
            <div class="day-classes-list">
                ${dayClasses.map((classInfo, index) => `
                    <div class="class-editor-item" data-index="${index}">
                        <div class="class-time-slot">${times[index] || 'Новий час'}</div>
                        <div class="class-inputs">
                            <input type="text" class="form-input subject-input" value="${classInfo.subject}" placeholder="Назва предмету">
                            <input type="text" class="form-input room-input" value="${classInfo.room}" placeholder="Аудиторія">
                            <input type="text" class="form-input teacher-input" value="${classInfo.teacher}" placeholder="Призвище викладача">
                        </div>
                        <button class="remove-class-btn" onclick="this.parentElement.remove()">
                            <span>🗑️</span>
                            <span>Удалить</span>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    addNewClass() {
        const container = document.querySelector('.day-classes-list');
        if (!container) return;
        
        const times = ['08:30-10:05', '10:25-12:00', '12:20-13:55', '14:15-15:50'];
        const currentClassCount = container.children.length;
        const timeSlot = times[currentClassCount] || `${currentClassCount + 8}:30-${currentClassCount + 10}:05`;
        
        const newClassItem = document.createElement('div');
        newClassItem.className = 'class-editor-item';
        newClassItem.dataset.index = currentClassCount;
        newClassItem.innerHTML = `
            <div class="class-time-slot">${timeSlot}</div>
            <div class="class-inputs">
                <input type="text" class="form-input subject-input" placeholder="Назва предмету">
                <input type="text" class="form-input room-input" placeholder="Аудиторія">
                <input type="text" class="form-input teacher-input" placeholder="Призвище викладача">
            </div>
            <button class="remove-class-btn" onclick="this.parentElement.remove()">
                <span>🗑️</span>
                <span>Удалить</span>
            </button>
        `;
        
        container.appendChild(newClassItem);
        newClassItem.scrollIntoView({ behavior: 'smooth' });
        
        // Focus on the first input
        const firstInput = newClassItem.querySelector('.subject-input');
        if (firstInput) firstInput.focus();
    }
    
    saveScheduleChanges() {
        const modal = document.querySelector('.custom-schedule-modal');
        if (!modal) return;
        
        // Collect data from current day first
        const currentClassItems = document.querySelectorAll('.class-editor-item');
        const currentDayClasses = [];
        
        currentClassItems.forEach(item => {
            const subject = item.querySelector('.subject-input').value.trim();
            const room = item.querySelector('.room-input').value.trim();
            const teacher = item.querySelector('.teacher-input').value.trim();
            
            if (subject) {
                currentDayClasses.push({ subject, room, teacher });
            }
        });
        
        // Update current day in template
        if (currentDayClasses.length > 0) {
            this.weeklyScheduleTemplate[this.currentEditingDay] = currentDayClasses;
        } else {
            // Remove day if no classes
            delete this.weeklyScheduleTemplate[this.currentEditingDay];
        }
        
        // Regenerate schedule and update display
        this.sampleSchedule = this.generateWeekSchedule(this.currentWeek);
        this.renderCalendar();
        this.updateScheduleStatus('custom');
        this.showNotification('Розклад збережено!', 'success');
        this.vibrate(30);
        
        // Save to localStorage
        try {
            localStorage.setItem('bn32-weekly-template', JSON.stringify(this.weeklyScheduleTemplate));
        } catch (error) {
            console.warn('Failed to save schedule template:', error);
        }
    }
    
    saveCustomClasses() {
        try {
            localStorage.setItem('bn32-custom-classes', JSON.stringify(this.customClasses));
        } catch (error) {
            console.warn('Failed to save custom classes:', error);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.scheduleApp = new ScheduleApp();

        // Дополнительная проверка/закрытие меню после полной загрузки
        setTimeout(() => {
            try { window.scheduleApp && window.scheduleApp.ensureMenuClosed && window.scheduleApp.ensureMenuClosed(); } catch {}
        }, 200);

        // iOS bfcache: при возврате на страницу убеждаемся, что меню закрыто
        window.addEventListener('pageshow', (e) => {
            try {
                if (e.persisted && window.scheduleApp && window.scheduleApp.ensureMenuClosed) {
                    window.scheduleApp.ensureMenuClosed();
                }
            } catch {}
        });

        // Пересчёт мобильного состояния при смене ориентации
        window.addEventListener('orientationchange', () => {
            try {
                if (window.scheduleApp) {
                    window.scheduleApp.handleResize && window.scheduleApp.handleResize();
                    window.scheduleApp.ensureMenuClosed && window.scheduleApp.ensureMenuClosed();
                }
            } catch {}
        });

    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
});
