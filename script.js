// Performance Manager for mobile optimization
class PerformanceManager {
    constructor() {
        this.isLowEndDevice = this.detectLowEndDevice();
        this.performanceMode = false;
        this.intersectionObserver = null;
        this.resizeObserver = null;
        this.touchEvents = new Map();
        this.initPerformanceMode();
    }
    
    detectLowEndDevice() {
        // Check for indicators of low-end device
        const { hardwareConcurrency, deviceMemory } = navigator;
        const pixelRatio = window.devicePixelRatio || 1;
        const screenArea = screen.width * screen.height;
        
        // Heuristics for low-end device detection
        const lowConcurrency = hardwareConcurrency && hardwareConcurrency <= 2;
        const lowMemory = deviceMemory && deviceMemory <= 1;
        const lowRes = screenArea < 800 * 600;
        const highDensity = pixelRatio > 2;
        
        return lowConcurrency || lowMemory || (lowRes && highDensity);
    }
    
    initPerformanceMode() {
        if (this.isLowEndDevice) {
            document.documentElement.classList.add('performance-mode');
            this.performanceMode = true;
        }
        
        // Check for user's motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.performanceMode = true;
            document.documentElement.classList.add('reduced-motion');
        }
    }
    
    optimizeEventListeners() {
        // Use passive listeners for touch events
        const options = { passive: true, capture: false };
        return options;
    }
    
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Application State
class ScheduleApp {
    constructor() {
        try {
            // Initialize performance manager first
            this.performance = new PerformanceManager();
            
            // Основные свойства
            this.currentWeek = new Date();
            this.selectedDate = null;
            this.isMobile = window.innerWidth <= 768;
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.vibrationEnabled = true;
            
            // Lazy loading and caching
            this.scheduleCache = new Map();
            this.domCache = new Map();
            
            // Загрузка данных
            this.attendanceData = this.loadAttendanceData();
            this.customClasses = this.loadCustomClasses();
            this.currentTheme = this.loadTheme();
            this.sampleSchedule = this.generateSampleSchedule();
            this.applyTheme();
            this.loadSettings();
            this.init();
            
        } catch (error) {
            console.error('Error in ScheduleApp constructor:', error);
            throw error;
        }
    }

    // Use performance manager's optimized debounce
    debounce(func, wait, immediate = false) {
        return this.performance.debounce(func, wait, immediate);
    }
    
    // Use performance manager's throttle
    throttle(func, limit) {
        return this.performance.throttle(func, limit);
    }

    init() {
        try {
            this.cacheDOM();
            this.setupEventListeners();
            this.updateCurrentDate();
            this.renderCalendar();
            this.updateStats();
            this.handleResize();
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }
    
    // Cache frequently used DOM elements
    cacheDOM() {
        const elements = {
            calendarGrid: document.getElementById('calendarGrid'),
            weekTitle: document.getElementById('weekTitle'),
            monthTitle: document.getElementById('monthTitle'),
            monthStats: document.getElementById('monthStats'),
            modalOverlay: document.getElementById('modalOverlay'),
            modalTitle: document.getElementById('modalTitle'),
            modalBody: document.getElementById('modalBody'),
            modalClose: document.getElementById('modalClose'),
            currentDate: document.getElementById('currentDate')
        };
        
        Object.entries(elements).forEach(([key, element]) => {
            if (element) this.domCache.set(key, element);
        });
    }
    
    // Get cached DOM element
    getElement(key) {
        return this.domCache.get(key) || document.getElementById(key);
    }

    // Fixed weekly schedule that generates for any week
    generateSampleSchedule() {
        const schedule = {};
        
        // Permanent weekly schedule template
        const weeklyPlan = {
            1: [ // Понеділок
                { subject: 'МОБ', room: 'ауд. 301', teacher: 'Вирста' },
                { subject: 'Буріння свердловин', room: 'ауд. 103', teacher: 'Агейчева' },
                { subject: 'Буріння свердловин', room: 'ауд. 103', teacher: 'Агейчева' }
            ],
            2: [ // Вівторок
                { subject: 'Технічна механіка', room: 'ауд. 302', teacher: 'Волинець' },
                { subject: 'Промивка свердловин', room: 'ауд. 307А', teacher: 'Деркунська' },
                { subject: 'МОБ', room: 'ауд. 301', teacher: 'Вирста' }
            ],
            3: [ // Середа
                { subject: 'МОБ', room: 'ауд. 301', teacher: 'Вирста' },
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
        
        const times = ['08:30-10:05', '10:25-12:00', '12:20-13:55', '14:15-15:50'];
        
        // Clear existing schedule
        this.weeklyScheduleTemplate = weeklyPlan;
        
        // Generate schedule for current week
        return this.generateWeekSchedule(this.currentWeek);
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
        
        // Add custom classes from localStorage
        const customClasses = this.loadCustomClasses();
        Object.keys(customClasses).forEach(dateKey => {
            const customDate = new Date(dateKey);
            const currentWeekStart = new Date(weekStart);
            const currentWeekEnd = new Date(weekStart);
            currentWeekEnd.setDate(weekStart.getDate() + 6);
            
            if (customDate >= currentWeekStart && customDate <= currentWeekEnd) {
                if (!schedule[dateKey]) schedule[dateKey] = { classes: [] };
                schedule[dateKey].classes.push(...customClasses[dateKey]);
            }
        });
        
        return schedule;
    }

    // Load attendance data from localStorage
    loadAttendanceData() {
        try {
            const saved = localStorage.getItem('bn32-attendance');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Failed to load attendance data:', error);
            return {};
        }
    }
    
    // Load custom classes from localStorage
    loadCustomClasses() {
        try {
            const saved = localStorage.getItem('bn32-custom-classes');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Failed to load custom classes:', error);
            return {};
        }
    }
    
    // Save custom classes to localStorage
    saveCustomClasses() {
        try {
            localStorage.setItem('bn32-custom-classes', JSON.stringify(this.customClasses));
        } catch (error) {
            console.error('Failed to save custom classes:', error);
            alert('Помилка збереження даних. Перевірте доступний простір.');
        }
    }

    // Save attendance data to localStorage
    saveAttendanceData() {
        try {
            localStorage.setItem('bn32-attendance', JSON.stringify(this.attendanceData));
        } catch (error) {
            console.error('Failed to save attendance data:', error);
            alert('Помилка збереження відвідуваності. Перевірте доступний простір.');
        }
    }

    setupEventListeners() {
        // Navigation buttons
        const nextWeek = document.getElementById('nextWeek');
        if (nextWeek) nextWeek.addEventListener('click', () => this.navigateWeek(1));
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
        
        
        // Absence toggle buttons (delegated event listener)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('absence-toggle-btn')) {
                const classId = e.target.dataset.classId;
                const dateKey = this.formatDateKey(this.selectedDate);
                const currentStatus = this.attendanceData[dateKey]?.classes?.[classId];
                const newStatus = currentStatus === 'absent' ? null : 'absent';
                
                if (newStatus === null) {
                    // Remove absence mark
                    if (this.attendanceData[dateKey]?.classes) {
                        delete this.attendanceData[dateKey].classes[classId];
                        this.saveAttendanceData();
                        this.showToast('Помічено як присутній', 'success', 1500);
                    }
                } else {
                    this.markClassAttendance(dateKey, classId, newStatus);
                    this.showToast('Помічено як пропуск', 'warning', 1500);
                }
                
                // Refresh modal
                this.openDayModal(this.selectedDate);
                this.vibrate(30);
            }
            
            if (e.target.classList.contains('add-custom-class-btn')) {
                this.showAddClassModal();
            }
            
            // Clear day button
            if (e.target.classList.contains('clear-day-btn')) {
                const dateKey = e.target.dataset.dateKey;
                const date = new Date(dateKey);
                const dayName = date.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
                
                if (confirm(`Ви впевнені, що хочете очистити всі дані за ${dayName}?\n\nЦе видалить:\n• Всі відмітки відвідуваності\n• Всі додані пари/заміни`)) {
                    this.markDayAsDeleted(date);
                    this.closeModal(); // Close modal after clearing
                }
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Optimized touch events for mobile swipes
        const touchOptions = this.performance.optimizeEventListeners();
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), touchOptions);
        document.addEventListener('touchmove', this.throttle((e) => this.handleTouchMove(e), 16), touchOptions);
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), touchOptions);
        
        // Resize handler with optimized debounce
        window.addEventListener('resize', this.debounce(() => this.handleResize(), 150, false));
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.sidebar') && !e.target.closest('.menu-toggle')) {
                this.closeMobileMenu();
            }
            
            // Theme selector
            if (e.target.classList.contains('theme-btn')) {
                const theme = e.target.dataset.theme;
                this.changeTheme(theme);
                
                // Update active theme button
                document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
            
            // Font size controls
            if (e.target.classList.contains('size-btn')) {
                const size = e.target.dataset.size;
                this.changeFontSize(size);
                
                // Update active size button
                document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
        
        // Vibration toggle
        document.getElementById('vibration-toggle')?.addEventListener('change', (e) => {
            this.toggleVibration(e.target.checked);
        });
        
        // Custom schedule buttons
        document.getElementById('edit-schedule-btn')?.addEventListener('click', () => {
            this.showScheduleEditor();
        });
        
        document.getElementById('reset-schedule-btn')?.addEventListener('click', () => {
            this.resetToDefaultSchedule();
        });

    handleResize()
        this.isMobile = window.innerWidth <= 768;
        if (!this.isMobile) {
            this.closeMobileMenu();
        }

    updateCurrentDate()
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

    navigateWeek(direction)
        this.currentWeek.setDate(this.currentWeek.getDate() + (direction * 7));
        // Regenerate schedule for new week
        this.sampleSchedule = this.generateWeekSchedule(this.currentWeek);
        this.renderCalendar();
        this.animateNavigation(direction);

    animateNavigation(direction)
        const calendar = document.getElementById('calendarGrid');
        if (calendar) {
            calendar.style.transform = `translateX(${direction * 10}px)`;
            calendar.style.opacity = '0.8';
            
            setTimeout(() => {
                calendar.style.transform = 'translateX(0)';
                calendar.style.opacity = '1';
            }, 150);
        }

    renderCalendar()
        try {
            const grid = this.getElement('calendarGrid');
            const weekTitle = this.getElement('weekTitle');
            const monthTitle = this.getElement('monthTitle');
            const monthStats = this.getElement('monthStats');
            
            if (!grid) {
                console.error('Calendar grid element not found');
                return;
            }
            
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
                monthTitle.textContent = weekStart.toLocaleDateString('uk-UA', monthOptions);
            }
            
            // Calculate month stats
            if (monthStats) {
                const currentMonth = weekStart.getMonth();
                const currentYear = weekStart.getFullYear();
                const monthMissedCount = this.getMonthMissedCount(currentYear, currentMonth);
                monthStats.innerHTML = monthMissedCount > 0 ? 
                    `<span class="missed-badge">${monthMissedCount}</span>` : '';
            }
            
            // Update week title - show only weekdays (Monday-Friday)
            if (weekTitle) {
                const titleOptions = { day: 'numeric' };
                // Monday is weekStart + 1 day, Friday is weekStart + 5 days
                const mondayDate = new Date(weekStart);
                mondayDate.setDate(weekStart.getDate() + 1);
                const fridayDate = new Date(weekStart);
                fridayDate.setDate(weekStart.getDate() + 5);
                
                const mondayDay = mondayDate.toLocaleDateString('uk-UA', titleOptions);
                const fridayDay = fridayDate.toLocaleDateString('uk-UA', titleOptions);
                weekTitle.textContent = `${mondayDay} - ${fridayDay}`;
            }
            
            // Generate calendar days using document fragment for better performance
            const days = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
            const fragment = document.createDocumentFragment();
            
            for (let i = 0; i < 6; i++) {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + i);
                
                const dayElement = this.createDayElement(date, days[i], i);
                fragment.appendChild(dayElement);
            }
            
            // Single DOM update
            grid.appendChild(fragment);
        } catch (error) {
            console.error('Error rendering calendar:', error);
        }

    createDayElement(date, dayName, index = 0)
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.style.animationDelay = `${index * 0.08}s`;
        
        // Add day name header
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = dayName;
        dayElement.appendChild(dayHeader);
        
        const dateKey = this.formatDateKey(date);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        const hasClasses = this.sampleSchedule[dateKey];
        
        // Check if day has any missed classes
        const hasMissedClasses = this.hasMissedClassesOnDay(dateKey);
        
        // Add classes
        if (isToday) dayElement.classList.add('today');
        if (hasClasses) dayElement.classList.add('has-classes');
        if (hasMissedClasses) dayElement.classList.add('has-absences');
        
        // Day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        
        // Day classes info
        const dayClasses = document.createElement('div');
        dayClasses.className = 'day-classes';
        
        if (hasClasses) {
            const classCount = hasClasses.classes.length;
            dayClasses.textContent = `${classCount} ${this.getPluralForm(classCount, 'заняття', 'заняття', 'занять')}`;
        } else {
            dayClasses.textContent = '';
        }
        
        dayElement.appendChild(dayNumber);
        dayElement.appendChild(dayClasses);
        
        // Add missed classes badge
        const missedCount = this.getMissedClassCount(dateKey);
        if (missedCount > 0) {
            const missedBadge = document.createElement('div');
            missedBadge.className = 'missed-badge day-badge';
            missedBadge.textContent = missedCount;
            dayElement.appendChild(missedBadge);
        }
        
        // Click handler
        dayElement.addEventListener('click', () => this.openDayModal(date));
        
        // Optimized touch feedback on mobile
        if (this.isMobile) {
            dayElement.addEventListener('touchstart', (e) => {
                this.vibrate(15, [10, 5, 10]);
                dayElement.style.willChange = 'transform';
                dayElement.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    dayElement.style.transform = '';
                    dayElement.style.willChange = 'auto';
                }, 100);
            }, { passive: true });
        }
        
        return dayElement;
    }

    formatDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    getPluralForm(count, one, few, many) {
        if (count % 10 === 1 && count % 100 !== 11) return one;
        if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return few;
        return many;
    }
    
    // Check if day has any missed classes
    hasMissedClassesOnDay(dateKey) {
        const dayAttendance = this.attendanceData[dateKey];
        if (!dayAttendance || !dayAttendance.classes) return false;
        return Object.values(dayAttendance.classes).some(status => status === 'absent');
    }
    
    // Get count of missed classes on a specific day
    getMissedClassCount(dateKey) {
        const dayAttendance = this.attendanceData[dateKey];
        if (!dayAttendance || !dayAttendance.classes) return 0;
        return Object.values(dayAttendance.classes).filter(status => status === 'absent').length;
    }
    
    // Mark attendance for a specific class
    markClassAttendance(dateKey, classId, status) {
        if (!this.attendanceData[dateKey]) {
            this.attendanceData[dateKey] = { classes: {} };
        }
        if (!this.attendanceData[dateKey].classes) {
            this.attendanceData[dateKey].classes = {};
        }
        
        this.attendanceData[dateKey].classes[classId] = status;
        this.attendanceData[dateKey].timestamp = new Date().toISOString();
        
        this.saveAttendanceData();
        this.updateStats();
        this.renderCalendar();
    }
    
    // Get missed class count for a specific month
    getMonthMissedCount(year, month) {
        let missedCount = 0;
        Object.keys(this.attendanceData).forEach(dateKey => {
            const date = new Date(dateKey);
            if (date.getFullYear() === year && date.getMonth() === month) {
                const dayData = this.attendanceData[dateKey];
                if (dayData.classes) {
                    missedCount += Object.values(dayData.classes).filter(status => status === 'absent').length;
                }
            }
        });
        return missedCount;
    }

    openDayModal(date) {
        this.selectedDate = date;
        const modal = document.getElementById('modalOverlay');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        // Set modal title
        const titleOptions = { weekday: 'long', month: 'long', day: 'numeric' };
        modalTitle.textContent = date.toLocaleDateString('uk-UA', titleOptions);
        
        // Clear modal body
        modalBody.innerHTML = '';
        
        const dateKey = this.formatDateKey(date);
        const schedule = this.sampleSchedule[dateKey];
        
        if (schedule) {
            this.renderScheduleDetails(modalBody, schedule, dateKey);
        } else {
            modalBody.innerHTML = '<p>На цей день немає запланованих занять.</p>';
            
            // Still allow adding custom classes on empty days
            const addClassDiv = document.createElement('div');
            addClassDiv.style.cssText = `
                padding: 1rem;
                margin: 1rem 0;
                background: var(--bg-tertiary);
                border-radius: var(--border-radius);
                border: 2px dashed var(--border-color);
                text-align: center;
            `;
            
            addClassDiv.innerHTML = `
                <button class="add-custom-class-btn" style="
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: var(--border-radius);
                    font-weight: 500;
                    cursor: pointer;
                    transition: var(--transition);
                ">
                    + Додати пару/заміну
                </button>
            `;
            
            modalBody.appendChild(addClassDiv);
        }
        
        // Hide menu button and header when modal opens (only on mobile)
        if (this.isMobile) {
            const menuToggle = document.getElementById('menuToggle');
            const header = document.querySelector('.header');
            
            if (menuToggle) {
                menuToggle.style.transition = 'all 0.5s ease-out';
                menuToggle.style.opacity = '0';
                menuToggle.style.pointerEvents = 'none';
                menuToggle.style.transform = 'scale(0.1) translateY(-50px) rotate(180deg)';
                menuToggle.style.visibility = 'hidden';
            }
            
            if (header) {
                header.style.transition = 'all 0.4s ease-out';
                header.style.opacity = '0';
                header.style.transform = 'translateY(-100%)';
                header.style.pointerEvents = 'none';
            }
        }
        
        // Show modal with animation
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus trap for accessibility
        this.trapFocus(modal);
    }

    renderScheduleDetails(container, schedule, dateKey)
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'schedule-details';
        
        const title = document.createElement('h4');
        title.textContent = 'Розклад на день';
        detailsDiv.appendChild(title);
        
        schedule.classes.forEach(classInfo => {
            const classDiv = document.createElement('div');
            classDiv.className = 'class-item';
            
            const dayAttendance = this.attendanceData[dateKey];
            const isAbsent = dayAttendance?.classes?.[classInfo.id] === 'absent';
            
            classDiv.style.cssText = `
                padding: 1rem;
                margin: 0.5rem 0;
                background: var(--bg-secondary);
                border-radius: var(--border-radius);
                border-left: 4px solid ${isAbsent ? 'var(--danger-color)' : 'var(--primary-color)'};
                opacity: ${isAbsent ? '0.7' : '1'};
                position: relative;
                transition: var(--transition);
            `;
            
            // Build meta line (room • teacher • type*)
            const metaParts = [];
            if (classInfo.room) metaParts.push(classInfo.room);
            if (classInfo.teacher) metaParts.push(classInfo.teacher);
            if (classInfo.type && classInfo.type !== 'Заняття') metaParts.push(classInfo.type);
            const metaLine = metaParts.join(' • ');
            
            classDiv.innerHTML = `
                <div style="font-weight: 600; color: ${isAbsent ? 'var(--danger-color)' : 'var(--primary-color)'}; margin-bottom: 0.25rem;">
                    ${classInfo.time}
                    ${isAbsent ? ' <span style="color: var(--danger-color); font-size: 0.9em;">• Пропущено</span>' : ''}
                </div>
                <div style="font-size: 1.1rem; font-weight: 500; margin-bottom: 0.25rem;">
                    ${classInfo.subject}
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.75rem;">
                    ${metaLine}
                </div>
                <button class="absence-toggle-btn" data-class-id="${classInfo.id}" 
                    style="background: ${isAbsent ? 'var(--success-color)' : 'var(--danger-color)'}; 
                           color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; 
                           font-size: 0.85rem; cursor: pointer; transition: var(--transition);">
                    ${isAbsent ? '✓ Позначити присутнім' : '✗ Позначити пропуск'}
                </button>
            `;
            
            detailsDiv.appendChild(classDiv);
        });
        
        // Add custom class button
        const addClassDiv = document.createElement('div');
        addClassDiv.style.cssText = `
            padding: 1rem;
            margin: 1rem 0;
            background: var(--bg-tertiary);
            border-radius: var(--border-radius);
            border: 2px dashed var(--border-color);
            text-align: center;
        `;
        
        addClassDiv.innerHTML = `
            <button class="add-custom-class-btn" style="
                background: var(--primary-color);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: var(--border-radius);
                font-weight: 500;
                cursor: pointer;
                transition: var(--transition);
            ">
                + Додати пару/заміну
            </button>
        `;
        
        detailsDiv.appendChild(addClassDiv);
        
        // Add clear day button
        const clearDayDiv = document.createElement('div');
        clearDayDiv.style.cssText = `
            padding: 1rem;
            margin: 1rem 0 0 0;
            text-align: center;
            border-top: 1px solid var(--border-color);
        `;
        {
        clearDayDiv.innerHTML = `
            <button class="clear-day-btn" data-date-key="${dateKey}" style="
                background: var(--danger-color);
                color: white;
                border: none;
                padding: 0.6rem 1.2rem;
                border-radius: var(--border-radius);
                font-size: 0.85rem;
                font-weight: 500;
                cursor: pointer;
                transition: var(--transition);
            ">
                🗑️ Очистити день
            </button>
        `;
        
        detailsDiv.appendChild(clearDayDiv);
        container.appendChild(detailsDiv);
    }



    closeModal() {
        const modal = document.getElementById('modalOverlay');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        this.selectedDate = null;
        
        // Show menu button and header when modal closes (only on mobile)
        if (this.isMobile) {
            const menuToggle = document.getElementById('menuToggle');
            const header = document.querySelector('.header');
            
            if (menuToggle) {
                menuToggle.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                menuToggle.style.visibility = 'visible';
                menuToggle.style.opacity = '1';
                menuToggle.style.pointerEvents = 'auto';
                menuToggle.style.transform = 'scale(1) translateY(0) rotate(0deg)';
            }
            
            if (header) {
                header.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                header.style.opacity = '1';
                header.style.transform = 'translateY(0)';
                header.style.pointerEvents = 'auto';
            }
        }
    }

    updateStats() {
        // This will be updated to work with the new schedule tab instead of main screen
        const totalClasses = Object.keys(this.sampleSchedule).reduce((sum, date) => {
            return sum + (this.sampleSchedule[date]?.classes.length || 0);
        }, 0);
        
        let missedClasses = 0;
        Object.keys(this.attendanceData).forEach(dateKey => {
            const dayData = this.attendanceData[dateKey];
            if (dayData.classes) {
                missedClasses += Object.values(dayData.classes).filter(status => status === 'absent').length;
            }
        });
        
        const attendanceRate = totalClasses > 0 ? 
            Math.round(((totalClasses - missedClasses) / totalClasses) * 100) : 0;
        
        // Update stats if elements exist (for backwards compatibility)
        if (document.getElementById('attendanceRate')) {
            this.animateStatValue('attendanceRate', `${attendanceRate}%`);
            this.animateStatValue('totalClasses', totalClasses);
            this.animateStatValue('missedClasses', missedClasses);
        }
    }

    animateStatValue(elementId, newValue) {
        const element = document.getElementById(elementId);
        element.style.transform = 'scale(1.1)';
        element.style.color = 'var(--primary-color)';
        
        setTimeout(() => {
            element.textContent = newValue;
            element.style.transform = 'scale(1)';
        }, 100);
        
        setTimeout(() => {
            element.style.color = '';
        }, 300);
    }

    navigateToSection(sectionId) {
        try {
            console.log(`Navigating to section: ${sectionId}`);
            
            // Update active nav item
            const navItems = document.querySelectorAll('.nav-item');
            console.log(`Found ${navItems.length} nav items`);
            
            navItems.forEach(item => {
                item.classList.remove('active');
            });
            
            const navItem = document.querySelector(`[data-section="${sectionId}"]`);
            if (navItem) {
                navItem.classList.add('active');
                console.log(`Activated nav item for ${sectionId}`);
            } else {
                console.warn(`Nav item not found for section ${sectionId}`);
            }
            
            // Show/hide content sections
            const sections = document.querySelectorAll('.content-section');
            console.log(`Found ${sections.length} content sections`);
            
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            const targetSection = document.getElementById(`${sectionId}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
                console.log(`Activated section: ${sectionId}-section`);
            } else {
                console.error(`Section not found: ${sectionId}-section`);
            }
            
            // Close mobile menu if open
            if (this.isMobile) {
                this.closeMobileMenu();
            }
            
            // Render schedule view if switching to schedule section
            if (sectionId === 'schedule') {
                setTimeout(() => {
                    this.renderScheduleView();
                }, 100);
            }
            
            // Update active theme button on settings load
            if (sectionId === 'settings') {
                setTimeout(() => {
                    document.querySelectorAll('.theme-btn').forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.theme === this.currentTheme);
                    });
                }, 100);
            }
            
            // Vibration feedback on mobile
            this.vibrate(10);
            
        } catch (error) {
            console.error('Navigation error:', error);
        }
    }

    toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menuToggle');
        const mainContent = document.getElementById('mainContent');
        
        sidebar.classList.toggle('active');
        menuToggle.classList.toggle('active');
        mainContent.classList.toggle('sidebar-open');
        
        this.vibrate(20);
    }

    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menuToggle');
        const mainContent = document.getElementById('mainContent');
        
        sidebar.classList.remove('active');
        menuToggle.classList.remove('active');
        mainContent.classList.remove('sidebar-open');
    }


    handleKeyboard(event) {
        switch (event.key) {
            case 'Escape':
                if (document.getElementById('modalOverlay').classList.contains('active')) {
                    this.closeModal();
                }
                break;
            case 'ArrowLeft':
                if (!event.target.closest('.modal')) {
                    this.navigateWeek(-1);
                }
                break;
            case 'ArrowRight':
                if (!event.target.closest('.modal')) {
                    this.navigateWeek(1);
                }
                break;
        }
    }

    // Touch gesture handling
    handleTouchStart(event) {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
    }

    handleTouchMove(event) {
        // Prevent default scrolling during swipe
        if (Math.abs(event.touches[0].clientX - this.touchStartX) > 10) {
            event.preventDefault();
        }
    }

    handleTouchEnd(event) {
        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;
        
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        
        // Only process horizontal swipes
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (!event.target.closest('.modal') && !event.target.closest('.sidebar')) {
                if (deltaX > 0) {
                    this.navigateWeek(-1); // Swipe right = previous week
                } else {
                    this.navigateWeek(1);  // Swipe left = next week
                }
                this.vibrate(30);
            }
        }
    }

    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        firstFocusable.focus();
        
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    vibrate(duration) {
        if ('vibrate' in navigator && this.isMobile && this.vibrationEnabled !== false) {
            try {
                navigator.vibrate(duration);
            } catch (error) {
                console.warn('Vibration failed:', error);
            }
        }
    }

    
    // Show modal for adding custom classes
    showAddClassModal() {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay active';
        modalOverlay.style.zIndex = '2500';
        
        modalOverlay.innerHTML = `
            <div class="modal add-class-modal" style="max-width: 400px; transform: scale(1);">
                <div class="modal-header">
                    <h3 class="modal-title">Додати пару/заміну</h3>
                    <button class="modal-close add-class-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Предмет:</label>
                        <input type="text" id="custom-subject" placeholder="Назва предмету" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Час:</label>
                        <input type="text" id="custom-time" placeholder="08:30-10:05" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Аудиторія:</label>
                        <input type="text" id="custom-room" placeholder="ауд. 301" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Викладач:</label>
                        <input type="text" id="custom-teacher" placeholder="Прізвище" class="form-input">
                    </div>
                    <div class="form-buttons">
                        <button class="add-class-save btn-primary">Зберегти</button>
                        <button class="add-class-close btn-secondary">Скасувати</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        document.body.style.overflow = 'hidden';
        
        // Event handlers
        modalOverlay.querySelector('.add-class-save').addEventListener('click', () => {
            this.saveCustomClass(modalOverlay);
        });
        
        modalOverlay.querySelectorAll('.add-class-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modalOverlay);
                document.body.style.overflow = 'auto';
            });
        });
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // Save custom class
    saveCustomClass(modalOverlay) {
        const subject = document.getElementById('custom-subject').value.trim();
        const time = document.getElementById('custom-time').value.trim();
        const room = document.getElementById('custom-room').value.trim();
        const teacher = document.getElementById('custom-teacher').value.trim();
        
        if (!subject || !time) {
            alert('Заповніть обовʼязкові поля!');
            const targetElement = document.getElementById(!subject ? 'custom-subject' : 'custom-time');
            if (targetElement) targetElement.focus();
            return;
        }
        
        // Validate time format (HH:MM-HH:MM)
        const timeRegex = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/;
        if (!timeRegex.test(time)) {
            alert('Невірний формат часу. Використовуйте формат: 08:30-10:05');
            const timeElement = document.getElementById('custom-time');
            if (timeElement) timeElement.focus();
            return;
        }
        
        const dateKey = this.formatDateKey(this.selectedDate);
        const customClass = {
            id: `custom-${Date.now()}`,
            subject,
            time,
            room,
            teacher,
            type: 'Заміна',
            custom: true
        };
        
        if (!this.customClasses[dateKey]) {
            this.customClasses[dateKey] = [];
        }
        
        this.customClasses[dateKey].push(customClass);
        this.saveCustomClasses();
        
        // Refresh schedule and modal
        this.sampleSchedule = this.generateSampleSchedule();
        this.renderCalendar();
        this.openDayModal(this.selectedDate);
        
        // Show success notification
        this.showToast(`Пару "${subject}" додано до розкладу`, 'success', 2000);
        
        // Close modal
        document.body.removeChild(modalOverlay);
        document.body.style.overflow = 'auto';
    }
    
    // Load theme from localStorage
    loadTheme() {
        try {
            return localStorage.getItem('bn32-theme') || 'default';
        } catch (error) {
            console.warn('Failed to load theme:', error);
            return 'default';
        }
    }
    
    // Save theme to localStorage
    saveTheme() {
        try {
            localStorage.setItem('bn32-theme', this.currentTheme);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    }
    
    // Apply theme
    applyTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
    }
    
    // Change theme
    changeTheme(themeName) {
        this.currentTheme = themeName;
        this.saveTheme();
        this.applyTheme();
        
        // Regenerate schedule to apply new theme
        this.sampleSchedule = this.generateWeekSchedule(this.currentWeek);
        this.renderCalendar();
        if (document.getElementById('weeklySchedule')) {
            this.renderScheduleView();
        }
    }
    
    // Change font size
    changeFontSize(size) {
        document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
        document.documentElement.classList.add(`font-${size}`);
        localStorage.setItem('bn32-font-size', size);
    }
    
    // Toggle vibration
    toggleVibration(enabled) {
        this.vibrationEnabled = enabled;
        localStorage.setItem('bn32-vibration', enabled);
    }
    
    // Enhanced vibrate method with patterns
    vibrate(duration, pattern = null) {
        if ('vibrate' in navigator && this.isMobile && this.vibrationEnabled !== false) {
            try {
                if (pattern) {
                    navigator.vibrate(pattern);
                } else {
                    navigator.vibrate(duration);
                }
            } catch (error) {
                console.warn('Vibration failed:', error);
            }
        }
    }
        const fontSize = localStorage.getItem('bn32-font-size') || 'medium';
        this.changeFontSize(fontSize);
        
        // Update UI to reflect loaded font size
        setTimeout(() => {
            document.querySelectorAll('.size-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.size === fontSize);
            });
        }, 100);
        
        // Load vibration setting
        const vibration = localStorage.getItem('bn32-vibration');
        this.vibrationEnabled = vibration !== 'false';
        
        // Update vibration toggle UI
        setTimeout(() => {
            const toggle = document.getElementById('vibration-toggle');
            if (toggle) toggle.checked = this.vibrationEnabled;
    // Show advanced schedule editor modal
    showScheduleEditor() {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay active custom-schedule-modal';
        modalOverlay.style.zIndex = '2500';
        
        modalOverlay.innerHTML = `
            <div class="modal schedule-editor-modal">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <span class="editor-icon">🗃️</span>
                        Редактор розкладу
                        <span class="alpha-badge">alpha</span>
                    </h3>
                    <button class="modal-close schedule-editor-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="editor-tabs">
                        <div class="tab-header">
                            <button class="tab-btn active" data-tab="weekly">🗓️ Тижневий</button>
                            <button class="tab-btn" data-tab="daily">📅 По дням</button>
                            <button class="tab-btn" data-tab="templates">📚 Шаблони</button>
                        </div>
                        
                        <div class="tab-content active" id="weekly-tab">
                            <div class="week-overview">
                                <h4>Огляд тижня</h4>
                                <div class="week-grid">
                                    <div class="day-card" data-day="1">
                                        <div class="day-header">
                                            <span class="day-emoji">🔥</span>
                                            <span class="day-name">ПН</span>
                                            <span class="day-count">0</span>
                                        </div>
                                        <div class="day-preview"></div>
                                    </div>
                                    <div class="day-card" data-day="2">
                                        <div class="day-header">
                                            <span class="day-emoji">⚡</span>
                                            <span class="day-name">ВТ</span>
                                            <span class="day-count">0</span>
                                        </div>
                                        <div class="day-preview"></div>
                                    </div>
                                    <div class="day-card" data-day="3">
                                        <div class="day-header">
                                            <span class="day-emoji">🌟</span>
                                            <span class="day-name">СР</span>
                                            <span class="day-count">0</span>
                                        </div>
                                        <div class="day-preview"></div>
                                    </div>
                                    <div class="day-card" data-day="4">
                                        <div class="day-header">
                                            <span class="day-emoji">✨</span>
                                            <span class="day-name">ЧТ</span>
                                            <span class="day-count">0</span>
                                        </div>
                                        <div class="day-preview"></div>
                                    </div>
                                    <div class="day-card" data-day="5">
                                        <div class="day-header">
                                            <span class="day-emoji">🎈</span>
                                            <span class="day-name">ПТ</span>
                                            <span class="day-count">0</span>
                                        </div>
                                        <div class="day-preview"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="tab-content" id="daily-tab">
                            <div class="day-editor">
                                <div class="day-selector-modern">
                                    <button class="modern-day-btn" data-day="1">
                                        <span class="day-emoji">🔥</span>
                                        <span class="day-full">Понеділок</span>
                                    </button>
                                    <button class="modern-day-btn" data-day="2">
                                        <span class="day-emoji">⚡</span>
                                        <span class="day-full">Вівторок</span>
                                    </button>
                                    <button class="modern-day-btn" data-day="3">
                                        <span class="day-emoji">🌟</span>
                                        <span class="day-full">Середа</span>
                                    </button>
                                    <button class="modern-day-btn" data-day="4">
                                        <span class="day-emoji">✨</span>
                                        <span class="day-full">Четвер</span>
                                    </button>
                                    <button class="modern-day-btn" data-day="5">
                                        <span class="day-emoji">🎈</span>
                                        <span class="day-full">П'ятниця</span>
                                    </button>
                                </div>
                                
                                <div class="day-editor-content" id="dayEditorContent">
                                    <div class="editor-placeholder">
                                        <div class="placeholder-icon">📅</div>
                                        <h3>Оберіть день для редагування</h3>
                                        <p>Клікніть на день тижня зліва</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="tab-content" id="templates-tab">
                            <div class="templates-section">
                                <h4>Готові шаблони</h4>
                                <div class="template-grid">
                                    <div class="template-card" data-template="standard">
                                        <div class="template-icon">📚</div>
                                        <h5>Стандартний</h5>
                                        <p>Базовий розклад БН-3-2</p>
                                        <button class="apply-template-btn">Застосувати</button>
                                    </div>
                                    <div class="template-card" data-template="intensive">
                                        <div class="template-icon">🔥</div>
                                        <h5>Інтенсив</h5>
                                        <p>Полные дни з 4-5 парами</p>
                                        <button class="apply-template-btn">Застосувати</button>
                                    </div>
                                    <div class="template-card" data-template="light">
                                        <div class="template-icon">🌱</div>
                                        <h5>Легкий</h5>
                                        <p>Мінімальна нагрузка</p>
                                        <button class="apply-template-btn">Застосувати</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="editor-actions">
                        <button class="schedule-editor-save btn-primary">
                            <span class="btn-icon">✨</span>
                            Зберегти зміни
                        </button>
                        <button class="schedule-editor-close btn-secondary">
                            <span class="btn-icon">❌</span>
                            Скасувати
                        </button>
                        <button class="reset-to-default btn-danger">
                            <span class="btn-icon">🔄</span>
                            Скинути
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        document.body.style.overflow = 'hidden';
        
        // Initialize editor
        this.initializeScheduleEditor(modalOverlay);
    }
    
    // Initialize schedule editor functionality
    initializeScheduleEditor(modalOverlay)
        // Tab switching
        const tabBtns = modalOverlay.querySelectorAll('.tab-btn');
        const tabContents = modalOverlay.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                // Update active tab button
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update active tab content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tabId}-tab`) {
                        content.classList.add('active');
                    }
                });
                
                this.vibrate(10);
            });
        });
        
        // Day cards in week overview
        const dayCards = modalOverlay.querySelectorAll('.day-card');
        dayCards.forEach(card => {
            card.addEventListener('click', () => {
                const day = parseInt(card.dataset.day);
                // Switch to daily tab and select this day
                document.querySelector('[data-tab="daily"]').click();
                setTimeout(() => {
                    document.querySelector(`[data-day="${day}"].modern-day-btn`).click();
                }, 100);
            });
        });
        
        // Modern day buttons
        const modernDayBtns = modalOverlay.querySelectorAll('.modern-day-btn');
        modernDayBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const day = parseInt(btn.dataset.day);
                
                // Update active button
                modernDayBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show day editor for this day
                this.showAdvancedDayEditor(day, modalOverlay);
                this.vibrate(15);
            });
        });
        
        // Close handlers
        modalOverlay.querySelectorAll('.schedule-editor-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeScheduleEditor(modalOverlay));
        });
        
        // Save handler
        modalOverlay.querySelector('.schedule-editor-save').addEventListener('click', () => {
            this.saveAdvancedSchedule(modalOverlay);
        });
        
        // Reset handler
        modalOverlay.querySelector('.reset-to-default').addEventListener('click', () => {
            this.resetScheduleToDefault(modalOverlay);
        });
        
        // Template handlers
        const templateCards = modalOverlay.querySelectorAll('.template-card');
        templateCards.forEach(card => {
            const applyBtn = card.querySelector('.apply-template-btn');
            applyBtn.addEventListener('click', () => {
                const template = card.dataset.template;
                this.applyScheduleTemplate(template, modalOverlay);
            });
        });
        
        // Initialize week overview
        this.updateWeekOverview(modalOverlay);
    }
    
    // Update week overview cards
    updateWeekOverview(modalOverlay) {
        const dayCards = modalOverlay.querySelectorAll('.day-card');
        dayCards.forEach(card => {
            const day = parseInt(card.dataset.day);
            const dayClasses = this.weeklyScheduleTemplate[day] || [];
            
            const countElement = card.querySelector('.day-count');
            const previewElement = card.querySelector('.day-preview');
            
            countElement.textContent = dayClasses.length;
            
            // Add preview of subjects
            if (dayClasses.length > 0) {
                previewElement.innerHTML = dayClasses.slice(0, 2).map(cls => 
                    `<div class="subject-preview">${cls.subject}</div>`
                ).join('');
                
                if (dayClasses.length > 2) {
                    previewElement.innerHTML += `<div class="more-subjects">+${dayClasses.length - 2}</div>`;
                }
            } else {
                previewElement.innerHTML = '<div class="no-classes">Немає пар</div>';
            }
        });
    }
    
    // Show advanced day editor
    showAdvancedDayEditor(day, modalOverlay) {
        const dayNames = ['', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця"];
        const editorContent = modalOverlay.querySelector('#dayEditorContent');
        
        const dayClasses = this.weeklyScheduleTemplate[day] || [];
        const times = ['08:30-10:05', '10:25-12:00', '12:20-13:55', '14:15-15:50'];
        
        editorContent.innerHTML = `
            <div class="day-editor-header">
                <h3><span class="day-emoji">${this.getDayEmoji(day)}</span> ${dayNames[day]}</h3>
                <div class="class-count">${dayClasses.length} ${dayClasses.length === 1 ? 'пара' : 'пар'}</div>
            </div>
            
            <div class="classes-list" id="classesList">
                ${dayClasses.map((cls, index) => `
                    <div class="class-editor-item" data-index="${index}">
                        <div class="class-time">
                            <input type="text" value="${times[index] || ''}" class="time-input" placeholder="08:30-10:05">
                        </div>
                        <div class="class-details">
                            <input type="text" value="${cls.subject}" class="subject-input" placeholder="Назва предмету">
                            <div class="class-meta">
                                <input type="text" value="${cls.room}" class="room-input" placeholder="ауд. 301">
                                <input type="text" value="${cls.teacher}" class="teacher-input" placeholder="Викладач">
                            </div>
                        </div>
                        <button class="remove-class-btn" data-index="${index}">
                            <span class="btn-icon">🗑️</span>
                        </button>
                    </div>
                `).join('')}
            </div>
            
            <div class="add-class-section">
                <button class="add-class-modern-btn">
                    <span class="btn-icon">➕</span>
                    <span>Додати нову пару</span>
                </button>
            </div>
            
            <div class="quick-actions">
                <button class="quick-btn clear-day-btn" data-day="${day}">
                    <span class="btn-icon">🧹</span>
                    Очистити день
                </button>
                <button class="quick-btn copy-day-btn" data-day="${day}">
                    <span class="btn-icon">📋</span>
                    Копіювати день
                </button>
            </div>
        `;
        
        // Add event listeners for this day editor
        this.setupDayEditorListeners(day, modalOverlay);
    }
    
    // Get emoji for day
    getDayEmoji(day) {
        const emojis = ['', '🔥', '⚡', '🌟', '✨', '🎈'];
        return emojis[day] || '📅';
    }
    
    // Setup listeners for day editor
    setupDayEditorListeners(day, modalOverlay) {
        const editorContent = modalOverlay.querySelector('#dayEditorContent');
        
        // Add class button
        const addBtn = editorContent.querySelector('.add-class-modern-btn');
        addBtn?.addEventListener('click', () => {
            this.addNewClassToDay(day, modalOverlay);
        });
        
        // Remove class buttons
        const removeButtons = editorContent.querySelectorAll('.remove-class-btn');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.removeClassFromDay(day, index, modalOverlay);
            });
        });
        
        // Quick actions
        const clearBtn = editorContent.querySelector('.clear-day-btn');
        clearBtn?.addEventListener('click', () => {
            if (confirm('Очистити всі пари на цей день?')) {
                this.weeklyScheduleTemplate[day] = [];
                this.showAdvancedDayEditor(day, modalOverlay);
                this.updateWeekOverview(modalOverlay);
            }
        });
    }
    
    // Add new class to day
    addNewClassToDay(day, modalOverlay) {
        if (!this.weeklyScheduleTemplate[day]) {
            this.weeklyScheduleTemplate[day] = [];
        }
        
        this.weeklyScheduleTemplate[day].push({
            subject: '',
            room: '',
            teacher: ''
        });
        
        this.showAdvancedDayEditor(day, modalOverlay);
        this.updateWeekOverview(modalOverlay);
        this.vibrate(20);
    }
    
    // Remove class from day
    removeClassFromDay(day, index, modalOverlay) {
        if (this.weeklyScheduleTemplate[day]) {
            this.weeklyScheduleTemplate[day].splice(index, 1);
            this.showAdvancedDayEditor(day, modalOverlay);
            this.updateWeekOverview(modalOverlay);
            this.vibrate(15);
        }
    }
    
    // Apply schedule template
    applyScheduleTemplate(templateName, modalOverlay) {
        const templates = {
            standard: {
                1: [
                    { subject: 'МОБ', room: 'ауд. 301', teacher: 'Вирста' },
                    { subject: 'Буріння свердловин', room: 'ауд. 103', teacher: 'Агейчева' },
                    { subject: 'Буріння свердловин', room: 'ауд. 103', teacher: 'Агейчева' }
                ],
                2: [
                    { subject: 'Технічна механіка', room: 'ауд. 302', teacher: 'Волинець' },
                    { subject: 'Промивка свердловин', room: 'ауд. 307А', teacher: 'Деркунська' },
                    { subject: 'МОБ', room: 'ауд. 301', teacher: 'Вирста' }
                ],
                3: [
                    { subject: 'МОБ', room: 'ауд. 301', teacher: 'Вирста' },
                    { subject: 'Фізичне виховання', room: 'с/з', teacher: 'Кошель' },
                    { subject: 'ЗНПГ', room: 'ауд. 202', teacher: 'Сакова' },
                    { subject: "Іноземна (ЗПС)", room: 'ауд. 316', teacher: 'Почтакова' }
                ],
                4: [
                    { subject: 'Технічна механіка', room: 'ауд. 302', teacher: 'Волинець' },
                    { subject: 'Гідравліка', room: 'ауд. 310', teacher: 'Чмихун' },
                    { subject: 'Гідравліка', room: 'ауд. 310', teacher: 'Чмихун' }
                ],
                5: [
                    { subject: 'Промивка свердловин', room: 'ауд. 307А', teacher: 'Деркунська' },
                    { subject: 'ЗНПГ', room: 'ауд. 202', teacher: 'Сакова' },
                    { subject: 'Буріння свердловин', room: 'ауд. 103', teacher: 'Агейчева' }
                ]
            },
            intensive: {
                1: [
                    { subject: 'МОБ', room: 'ауд. 301', teacher: 'Вирста' },
                    { subject: 'Буріння свердловин', room: 'ауд. 103', teacher: 'Агейчева' },
                    { subject: 'Технічна механіка', room: 'ауд. 302', teacher: 'Волинець' },
                    { subject: 'ЗНПГ', room: 'ауд. 202', teacher: 'Сакова' }
                ],
                2: [
                    { subject: 'Промивка свердловин', room: 'ауд. 307А', teacher: 'Деркунська' },
                    { subject: 'МОБ', room: 'ауд. 301', teacher: 'Вирста' },
                    { subject: 'Гідравліка', room: 'ауд. 310', teacher: 'Чмихун' },
                    { subject: 'Фізичне виховання', room: 'с/з', teacher: 'Кошель' }
                ],
                3: [
                    { subject: 'МОБ', room: 'ауд. 301', teacher: 'Вирста' },
                    { subject: 'ЗНПГ', room: 'ауд. 202', teacher: 'Сакова' },
                    { subject: 'Технічна механіка', room: 'ауд. 302', teacher: 'Волинець' },
                    { subject: "Іноземна (ЗПС)", room: 'ауд. 316', teacher: 'Почтакова' }
                ],
                4: [
                    { subject: 'Буріння свердловин', room: 'ауд. 103', teacher: 'Агейчева' },
                    { subject: 'Гідравліка', room: 'ауд. 310', teacher: 'Чмихун' },
                    { subject: 'Промивка свердловин', room: 'ауд. 307А', teacher: 'Деркунська' },
                    { subject: 'МОБ', room: 'ауд. 301', teacher: 'Вирста' }
                ],
                5: [
                    { subject: 'ЗНПГ', room: 'ауд. 202', teacher: 'Сакова' },
                    { subject: 'Технічна механіка', room: 'ауд. 302', teacher: 'Волинець' },
                    { subject: 'Буріння свердловин', room: 'ауд. 103', teacher: 'Агейчева' }
                ]
            },
            light: {
                1: [
                    { subject: 'МОБ', room: 'ауд. 301', teacher: 'Вирста' }
                ],
                2: [
                    { subject: 'Технічна механіка', room: 'ауд. 302', teacher: 'Волинець' },
                    { subject: 'Промивка свердловин', room: 'ауд. 307А', teacher: 'Деркунська' }
                ],
                3: [
                    { subject: 'ЗНПГ', room: 'ауд. 202', teacher: 'Сакова' }
                ],
                4: [
                    { subject: 'Гідравліка', room: 'ауд. 310', teacher: 'Чмихун' }
                ],
                5: [
                    { subject: 'Буріння свердловин', room: 'ауд. 103', teacher: 'Агейчева' },
                    { subject: 'ЗНПГ', room: 'ауд. 202', teacher: 'Сакова' }
                ]
            }
        };
        
        if (confirm(`Застосувати шаблон "${templateName}"? Це замінить поточний розклад.`)) {
            this.weeklyScheduleTemplate = JSON.parse(JSON.stringify(templates[templateName]));
            this.updateWeekOverview(modalOverlay);
            this.vibrate(30);
        }
    }
    
    // Save advanced schedule
    saveAdvancedSchedule(modalOverlay) {
        // Save current template and regenerate schedule
        this.sampleSchedule = this.generateSampleSchedule();
        this.renderCalendar();
        this.updateStats();
        
        if (document.getElementById('weeklySchedule')) {
            this.renderScheduleView();
        }
        
        this.closeScheduleEditor(modalOverlay);
        this.vibrate(40);
    }
    
    // Reset to default schedule
    resetScheduleToDefault(modalOverlay) {
        if (confirm('Скинути розклад на стандартний? Всі зміни будуть втрачені.')) {
            this.applyScheduleTemplate('standard', modalOverlay);
        }
    }
    
    // Close schedule editor
    closeScheduleEditor(modalOverlay) {
        document.body.removeChild(modalOverlay);
        document.body.style.overflow = 'auto';
    }
            });
        });
    }
    
    
    
    
    // Render schedule view in the schedule tab
    renderScheduleView() {
        const container = document.getElementById('weeklySchedule');
        if (!container) {
            console.warn('Weekly schedule container not found');
            return;
        }
        container.innerHTML = '';
        
        container.innerHTML = '';
        
        // Create stats section
        const statsDiv = document.createElement('div');
        statsDiv.className = 'schedule-stats';
        
        let totalClasses = 0;
        let missedClasses = 0;
        Object.keys(this.sampleSchedule).forEach(dateKey => {
            const daySchedule = this.sampleSchedule[dateKey];
            totalClasses += daySchedule.classes.length;
            missedClasses += this.getMissedClassCount(dateKey);
        });
        
        const attendanceRate = totalClasses > 0 ? 
            Math.round(((totalClasses - missedClasses) / totalClasses) * 100) : 0;
        
        statsDiv.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${attendanceRate}%</div>
                    <div class="stat-label">Відвідуваність</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalClasses}</div>
                    <div class="stat-label">Всього пар</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${missedClasses}</div>
                    <div class="stat-label">Пропущено</div>
                </div>
            </div>
        `;
        
        container.appendChild(statsDiv);
        
        // Create weekly schedule
        const weeklyDiv = document.createElement('div');
        weeklyDiv.className = 'weekly-schedule-grid';
        
        const daysOfWeek = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця"];
        
        // Get current week dates
        const weekStart = new Date(this.currentWeek);
        weekStart.setDate(this.currentWeek.getDate() - this.currentWeek.getDay());
        
        daysOfWeek.forEach((dayName, index) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + index + 1); // +1 because Monday is day 1
            const dateKey = this.formatDateKey(date);
            const daySchedule = this.sampleSchedule[dateKey];
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'schedule-day';
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.innerHTML = `
                <h3>${dayName}</h3>
                <span class="day-date">${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}</span>
            `;
            
            dayDiv.appendChild(dayHeader);
            
            if (daySchedule && daySchedule.classes.length > 0) {
                daySchedule.classes.forEach(classInfo => {
                    const dayAttendance = this.attendanceData[dateKey];
                    const isAbsent = dayAttendance?.classes?.[classInfo.id] === 'absent';
                    
                    const classDiv = document.createElement('div');
                    classDiv.className = `schedule-class ${isAbsent ? 'absent' : ''}`;
                    
                    classDiv.innerHTML = `
                        <div class="class-time">${classInfo.time}</div>
                        <div class="class-subject">${classInfo.subject}</div>
                        <div class="class-details">${classInfo.room} • ${classInfo.teacher}</div>
                        ${isAbsent ? '<div class="absence-indicator">Пропущено</div>' : ''}
                        <button class="toggle-absence-btn" data-date-key="${dateKey}" data-class-id="${classInfo.id}">
                            ${isAbsent ? 'Позначити присутнім' : 'Позначити пропуск'}
                        </button>
                    `;
                    
                    dayDiv.appendChild(classDiv);
                });
            } else {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'no-classes';
                emptyDiv.textContent = 'Немає занять';
                dayDiv.appendChild(emptyDiv);
            }
            
            weeklyDiv.appendChild(dayDiv);
        });
        
        container.appendChild(weeklyDiv);
        
        // Add event listeners for absence toggle buttons
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('toggle-absence-btn')) {
                const dateKey = e.target.dataset.dateKey;
                const classId = e.target.dataset.classId;
                const currentStatus = this.attendanceData[dateKey]?.classes?.[classId];
                
                if (currentStatus === 'absent') {
                    // Remove absence
                    if (this.attendanceData[dateKey]?.classes) {
                        delete this.attendanceData[dateKey].classes[classId];
                    }
                } else {
                    // Mark as absent
                    this.markClassAttendance(dateKey, classId, 'absent');
                }
                
                this.renderScheduleView();
                this.renderCalendar();
                this.vibrate(30);
            }
        });
    }
    
    // Theme management
    loadTheme() {
        return localStorage.getItem('bn32-theme') || 'default';
    }
    
    changeTheme(themeName) {
        this.currentTheme = themeName;
        document.body.setAttribute('data-theme', themeName);
        localStorage.setItem('bn32-theme', themeName);
        this.vibrate(15);
    }
    
    applyTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
    }
    
    // Settings management
    loadSettings() {
        // Load font size
        const fontSize = localStorage.getItem('bn32-font-size') || 'medium';
        document.body.className = document.body.className.replace(/font-\w+/g, '') + ` font-${fontSize}`;
        
        // Load vibration setting
        this.vibrationEnabled = localStorage.getItem('bn32-vibration') !== 'false';
        const vibrationToggle = document.getElementById('vibration-toggle');
        if (vibrationToggle) {
            vibrationToggle.checked = this.vibrationEnabled;
        }
    }
    
    changeFontSize(size) {
        document.body.className = document.body.className.replace(/font-\w+/g, '') + ` font-${size}`;
        localStorage.setItem('bn32-font-size', size);
        this.vibrate(10);
    }
    
    toggleVibration(enabled) {
        this.vibrationEnabled = enabled;
        localStorage.setItem('bn32-vibration', enabled ? 'true' : 'false');
    }
    
    // Optimized toast notification system
    showToast(message, type = 'success', duration = 3000) {
        // Remove existing toast if present - use requestAnimationFrame for smooth removal
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            requestAnimationFrame(() => existingToast.remove());
        }
        
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        
        // Mobile-optimized styling with better performance
        const isMobile = this.isMobile; // Use cached value
        const styles = {
            position: 'fixed',
            top: isMobile ? '15px' : '20px',
            left: '50%',
            transform: 'translateX(-50%) translateZ(0)', // Force hardware acceleration
            background: this.getToastColor(type),
            color: 'white',
            padding: isMobile ? '8px 16px' : '12px 20px',
            borderRadius: isMobile ? '20px' : '25px',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: '10000',
            maxWidth: isMobile ? '280px' : '400px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            animation: 'slideDown 0.3s ease-out',
            willChange: 'transform, opacity'
        };
        
        // Apply styles efficiently
        Object.assign(toast.style, styles);
        toast.textContent = message;
        
        // Use requestAnimationFrame for smoother DOM insertion
        requestAnimationFrame(() => {
            document.body.appendChild(toast);
        });
        
        // Optimized auto-removal with cleanup
        const timeoutId = setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideUp 0.3s ease-in';
                const removeTimeout = setTimeout(() => {
                    if (toast.parentNode) {
                        toast.style.willChange = 'auto'; // Cleanup will-change
                        toast.remove();
                    }
                }, 300);
                toast._removeTimeout = removeTimeout;
            }
        }, duration);
        
        toast._timeoutId = timeoutId;
        
        // Optimized vibration feedback
        if (this.vibrationEnabled) {
            this.vibrate(type === 'success' ? 30 : 50);
        }
    }
    
    getToastColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #10b981, #059669)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
        };
        return colors[type] || colors.success;
    }
    
    // Mark day as deleted/cleared
    markDayAsDeleted(date) {
        const dateKey = this.formatDateKey(date);
        
        // Clear all attendance data for this day
        if (this.attendanceData[dateKey]) {
            delete this.attendanceData[dateKey];
            this.saveAttendanceData();
        }
        
        // Clear custom classes for this day
        if (this.customClasses[dateKey]) {
            delete this.customClasses[dateKey];
            this.saveCustomClasses();
        }
        
        // Update displays
        this.renderCalendar();
        this.updateStats();
        
        // Show success notification
        const dayName = date.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
        this.showToast(`День ${dayName} помічено як очищений`, 'success', 2500);
    }
    
    // Schedule editor placeholders
    showScheduleEditor() {
        alert('Редактор розкладу буде доступний в наступному оновленні!');
        this.vibrate(30);
    }
    
    resetToDefaultSchedule() {
        if (confirm('Ви впевнені, що хочете скинути розклад до стандартного?')) {
            localStorage.removeItem('bn32-custom-classes');
            this.customClasses = {};
            this.sampleSchedule = this.generateWeekSchedule(this.currentWeek);
            this.renderCalendar();
            this.vibrate(50);
            this.showToast('Розклад скинуто до стандартного', 'info', 2000);
        }
    }
}

// Optimized CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    .toast-notification {
        will-change: transform, opacity;
        contain: layout style;
    }
    
    @keyframes slideDown {
        from { 
            transform: translateX(-50%) translateY(-100%) translateZ(0); 
            opacity: 0; 
        }
        to { 
            transform: translateX(-50%) translateY(0) translateZ(0); 
            opacity: 1; 
        }
    }
    
    @keyframes slideUp {
        from { 
            transform: translateX(-50%) translateY(0) translateZ(0); 
            opacity: 1; 
        }
        to { 
            transform: translateX(-50%) translateY(-100%) translateZ(0); 
            opacity: 0; 
        }
    }
`;
document.head.appendChild(style);

// Optimized app initialization
document.addEventListener('DOMContentLoaded', () => {
    // Use requestIdleCallback for better performance on mobile
    if (window.requestIdleCallback) {
        requestIdleCallback(() => {
            initializeApp();
        });
    } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(initializeApp, 0);
    }
});

function initializeApp() {
    try {
        window.scheduleApp = new ScheduleApp();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        // Retry once after 500ms
        setTimeout(() => {
            try {
                window.scheduleApp = new ScheduleApp();
            } catch (retryError) {
                console.error('Failed to initialize app on retry:', retryError);
            }
        }, 500);
    }
}

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Only register if service worker file exists
        fetch('/sw.js')
            .then(response => {
                if (response.status === 200) {
                    return navigator.serviceWorker.register('/sw.js');
                } else {
                    console.log('Service Worker file not found, skipping registration');
                    return null;
                }
            })
            .then(registration => {
                if (registration) {
                    console.log('SW registered: ', registration);
                }
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
