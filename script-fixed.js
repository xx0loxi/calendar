// ScheduleApp optimized version

// Mobile performance: silence verbose logs on phones to reduce overhead (keeps errors/warnings)
(function(){
    try {
        const ua = navigator.userAgent || '';
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        if (isMobile) {
            const noop = () => {};
            console.debug = noop;
            console.log = noop;
        }
    } catch {}
})();

// Performance Manager for mobile optimization
class PerformanceManager {
    constructor() {
        this.isLowEndDevice = this.detectLowEndDevice();
        this.performanceMode = false;
        this.animationsEnabled = true;
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
            this.animationsEnabled = false;
        }
        
        // Check for user's motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.performanceMode = true;
            this.animationsEnabled = false;
            document.documentElement.classList.add('reduced-motion');
        }
    }
    
    optimizeEventListeners() {
        // Use passive listeners for touch events to improve scroll performance
        return { passive: true, capture: false };
    }
    
    debounce(func, wait, immediate = false) {
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
    
    // Optimize animations for performance
    optimizeAnimation(element, properties) {
        if (!this.animationsEnabled) {
            return Promise.resolve();
        }
        
        return new Promise(resolve => {
            // Enable will-change only during animation
            element.style.willChange = Object.keys(properties).join(', ');
            
            // Apply properties
            Object.assign(element.style, properties);
            
            // Clean up after animation
            const cleanup = () => {
                element.style.willChange = 'auto';
                resolve();
            };
            
            // Use requestAnimationFrame for smooth animations
            requestAnimationFrame(() => {
                setTimeout(cleanup, 300); // Assume 300ms animation duration
            });
        });
    }
}

// Add default passive listeners for touch/scroll events to improve scroll performance on mobile
(function enablePassiveDefaults(){
    let supportsPassive = false;
    try {
        const opts = Object.defineProperty({}, 'passive', {
            get() { supportsPassive = true; }
        });
        window.addEventListener('test-passive', null, opts);
        window.removeEventListener('test-passive', null, opts);
    } catch (e) {}

    if (!supportsPassive) return;

    const originalAdd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        try {
            // For high-frequency events prefer passive unless explicitly specified
            const passiveEvents = ['touchstart','touchmove','wheel','scroll'];
            if (passiveEvents.indexOf(type) !== -1) {
                if (options === undefined || typeof options === 'boolean') {
                    return originalAdd.call(this, type, listener, { passive: true, capture: false });
                }
                if (typeof options === 'object' && options.passive === undefined) {
                    options = Object.assign({}, options, { passive: true });
                }
            }
        } catch (e) {
            // fallback to original
        }
        return originalAdd.call(this, type, listener, options);
    };
})();

// Глобальний обработчик ошибок
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
        // Initialize app constructor
        
        try {
            // Initialize performance manager first
            this.performance = new PerformanceManager();
            
            // Основні свойства
            this.currentWeek = new Date();
            this.selectedDate = null;
            this.isMobile = window.innerWidth <= 768;
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.vibrationEnabled = true;
            
            // DOM and data caching for performance
            this.domCache = new Map();
            this.scheduleCache = new Map();
            
            // Calendar view is fixed to month view
            this.calendarView = 'month';
            
            // Current group selection
            this.currentGroup = localStorage.getItem('bn32-current-group') || 'bn-3-2';
            this.isSwitchingGroup = false;
            this.isMonthTransitioning = false;
            
            // Інициализація базового шаблона
            this.initializeBaseScheduleTemplate();
            
            // Загрузка данних
            this.attendanceData = this.loadAttendanceData();
            this.customClasses = this.loadCustomClasses();
            this.loadSavedScheduleTemplate();
            this.perDayExtras = this.loadPerDayExtras();
            
            // Генерация расписания
            this.sampleSchedule = this.generateWeekSchedule(this.currentWeek);
            
            // Инициализация
            this.init();
            
        } catch (error) {
            console.error('Error in ScheduleApp constructor:', error);
        }
    }

    init() {
        try {
            // Cache DOM elements first for better performance
            this.cacheDOM();
            
            this.setupEventListeners();
            this.updateCurrentDate();
            this.updateGroupButtons();
            
            // Use RAF for smoother initial render
            requestAnimationFrame(() => {
                this.renderCalendar();
                this.updateStats();
                this.handleResize();
                this.enableAbsoluteBottomNavForMobile();
            });
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }
    
    // Cache frequently used DOM elements for better performance
    cacheDOM() {
        const elements = {
            calendarGrid: 'calendarGrid',
            weekTitle: 'weekTitle', 
            monthTitle: 'monthTitle',
            monthStats: 'monthStats',
            modalOverlay: 'modalOverlay',
            modalTitle: 'modalTitle',
            modalBody: 'modalBody',
            modalClose: 'modalClose',
            currentDate: 'currentDate',
            bottomNav: 'bottomNav'
        };
        
        Object.entries(elements).forEach(([key, id]) => {
            const element = document.getElementById(id);
            if (element) {
                this.domCache.set(key, element);
            }
        });
    }
    
    // Get cached DOM element or fallback to getElementById
    getElement(key) {
        return this.domCache.get(key) || document.getElementById(key);
    }
    
    // Use performance manager's optimized debounce
    debounce(func, wait, immediate = false) {
        return this.performance.debounce(func, wait, immediate);
    }
    
    // Use performance manager's throttle
    throttle(func, limit) {
        return this.performance.throttle(func, limit);
    }

    // Initialize base schedule template
    initializeBaseScheduleTemplate() {
        // Schedule templates for both groups
        this.scheduleTemplates = {
            'bn-3-2': {
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
            },
            'bn-2-1': {
                1: [ // Понеділок
                    { subject: 'Технології', room: 'ауд. 405', teacher: 'Новікова' },
                    { subject: 'Історія України', room: 'ауд. 225', teacher: 'Коваленко' },
                    { subject: 'Технології', room: 'ауд. 405', teacher: 'Новікова' },
                    { subject: 'Фізична культура/Фізика і астрономія', room: 'с/з або ауд. 410', teacher: 'Кошель/Руденко' }
                ],
                2: [ // Вівторок
                    { subject: 'Інформатика', room: 'ауд. 404', teacher: 'Сидорина' },
                    { subject: 'Географія', room: 'ауд. 203', teacher: 'Тенькова' },
                    { subject: 'Іноземна мова', room: 'ауд. 316А', teacher: 'Бовсунівський' }
                ],
                3: [ // Середа
                    { subject: 'Українська мова', room: 'ауд. 407', teacher: 'Марченко' },
                    { subject: 'Фізика і астрономія', room: 'ауд. 410', teacher: 'Руденко' },
                    { subject: 'Фізична культура', room: 'с/з', teacher: 'Кошель' }
                ],
                4: [ // Четвер
                    { subject: 'Українська література', room: 'ауд. 407', teacher: 'Марченко' },
                    { subject: 'Інженерна та комп. графіка', room: 'ауд. 417', teacher: 'Ездула' },
                    { subject: 'Біологія і екологія', room: 'ауд. 409', teacher: 'Сахненко' },
                    { subject: 'Основи правознавства', room: 'ауд. 225', teacher: 'Коваленко' }
                ],
                5: [ // П'ятниця
                    { subject: 'Математика', room: 'ауд. 408', teacher: 'Марченко' },
                    { subject: 'Захист України', room: 'ауд. 227', teacher: 'Воронянський' },
                    { subject: 'Хімія', room: 'ауд. 407', teacher: 'Андрушкевич' }
                ]
            }
        };
        
        // Set current template based on selected group
        this.weeklyScheduleTemplate = this.scheduleTemplates[this.currentGroup];
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
            // Завантажуємо дані для поточної групи
            const storageKey = `bn32-attendance-${this.currentGroup}`;
            const saved = localStorage.getItem(storageKey);
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
        
        // Navigation buttons (левая и правая) - завжди по місяцях
        const prevWeek = document.getElementById('prevWeek');
        const nextWeek = document.getElementById('nextWeek');
        if (prevWeek) {
            prevWeek.addEventListener('click', () => { 
                this.navigateMonth(-1);
                this.vibrate(10);
            });
            prevWeek.setAttribute('title', 'Попередній місяць');
        }
        if (nextWeek) {
            nextWeek.addEventListener('click', () => {
                this.navigateMonth(1);
                this.vibrate(10);
            });
            nextWeek.setAttribute('title', 'Наступний місяць');
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
        
        // Sidebar navigation (if present in debug tools)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => this.navigateToSection(item.dataset.section));
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.navigateToSection(item.dataset.section);
                }
            });
        });

        // Group switcher buttons
        document.querySelectorAll('.group-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const group = btn.dataset.group;
                this.switchGroup(group);
                this.vibrate(15);
            });
        });

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

        // Prime vibration on first user interaction (helps some browsers)
        const primeVibration = () => {
            try {
                if (navigator && typeof navigator.vibrate === 'function') {
                    navigator.vibrate(0);
                }
            } catch {}
            document.removeEventListener('touchstart', primeVibration);
            document.removeEventListener('pointerdown', primeVibration);
        };
        document.addEventListener('touchstart', primeVibration, { passive: true });
        document.addEventListener('pointerdown', primeVibration, { passive: true });
        
        // Setup optimized touch events
        this.setupTouchEvents();
    }
    
    // Optimized touch events setup
    setupTouchEvents() {
        if (!this.isMobile) return;
        
        const touchOptions = this.performance.optimizeEventListeners();
        
        // Touch events for calendar navigation
        const calendarGrid = this.getElement('calendarGrid');
        if (calendarGrid) {
            let touchStartX = 0;
            let touchStartY = 0;
            let touchStartTime = 0;
            
            const handleTouchStart = (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchStartTime = Date.now();
            };
            
            const handleTouchEnd = this.throttle((e) => {
                if (!e.changedTouches[0]) return;
                
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const touchEndTime = Date.now();
                
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                const deltaTime = touchEndTime - touchStartTime;
                
                // Only register swipe if it was quick and horizontal
                if (deltaTime < 300 && Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100) {
                    if (deltaX > 0) {
                        // Swipe right = previous month
                        this.navigateMonth(-1);
                    } else {
                        // Swipe left = next month
                        this.navigateMonth(1);
                    }
                }
            }, 100);
            
            calendarGrid.addEventListener('touchstart', handleTouchStart, touchOptions);
            calendarGrid.addEventListener('touchend', handleTouchEnd, touchOptions);
        }
        
        // Optimize calendar day interactions
        document.addEventListener('touchstart', (e) => {
            const dayElement = e.target.closest('.calendar-day');
            if (dayElement && this.performance.animationsEnabled) {
                this.performance.optimizeAnimation(dayElement, {
                    transform: 'scale(0.98) translateZ(0)',
                    transition: 'transform 0.1s ease'
                });
            }
        }, touchOptions);
        
        document.addEventListener('touchend', (e) => {
            const dayElement = e.target.closest('.calendar-day');
            if (dayElement) {
                setTimeout(() => {
                    if (this.performance.animationsEnabled) {
                        this.performance.optimizeAnimation(dayElement, {
                            transform: 'scale(1) translateZ(0)',
                            transition: 'transform 0.2s ease'
                        });
                    }
                }, 50);
            }
        }, touchOptions);
    }

    navigateToSection(sectionId) {
        try {
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
                // Force another scroll to top after section change
                requestAnimationFrame(() => {
                    window.scrollTo(0, 0);
                });
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
            // Use cached elements for better performance
            const grid = this.getElement('calendarGrid');
            const weekTitle = this.getElement('weekTitle');
            const monthTitle = this.getElement('monthTitle');
            const monthStats = this.getElement('monthStats');
            
            if (!grid) return;
            
            // Use document fragment for batched DOM updates
            const fragment = document.createDocumentFragment();
            
            // Clear existing content and update grid classes
            grid.innerHTML = '';
            grid.className = 'calendar-grid';
            if (this.calendarView === 'month') {
                grid.classList.add('month-view');
                // Also add class to container for CSS targeting
                const container = grid.closest('.calendar-container');
                if (container) container.classList.add('has-month-view');
            } else {
                // Remove month view classes
                const container = grid.closest('.calendar-container');
                if (container) container.classList.remove('has-month-view');
            }
            
            // Update content section class for version positioning
            const contentSection = document.getElementById('main-section');
            if (contentSection) {
                if (this.calendarView === 'month') {
                    contentSection.classList.add('month-view-active');
                } else {
                    contentSection.classList.remove('month-view-active');
                }
            }
            
            let displayDate, startDate, endDate;
            
            if (this.calendarView === 'month') {
                // For month view, use the current month
                displayDate = new Date(this.currentWeek);
                displayDate.setDate(1); // First day of month
                startDate = new Date(displayDate);
                endDate = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0); // Last day of month
            } else {
                // For week view, use week dates
                displayDate = new Date(this.currentWeek);
                startDate = new Date(displayDate);
                startDate.setDate(displayDate.getDate() - displayDate.getDay());
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
            }
            
            // Update month title and stats
            if (monthTitle) {
                const monthOptions = { month: 'long', year: 'numeric' };
                let monthName = displayDate.toLocaleDateString('uk-UA', monthOptions);
                // Убираем "р" после года (например "2025 р." -> "2025")
                monthName = monthName.replace(/\s*р\.?$/i, '');
                monthTitle.textContent = monthName;
            }
            
            // Update month stats with absences count (optimized)
            if (monthStats) {
                // Check if there are absences for the current month
                const monthAbsences = this.getMonthAbsencesCount(displayDate);
                if (monthAbsences > 0) {
                    monthStats.innerHTML = `
                        <div class="month-absences-counter">
                            <span class="absences-icon">⚠️</span>
                            <span class="absences-count">${monthAbsences}</span>
                            <span class="absences-text">${this.getPluralForm(monthAbsences, 'пропуск', 'пропуски', 'пропусків')}</span>
                        </div>
                    `;
                    // ensure month title highlighted when absences exist
                    if (monthTitle) monthTitle.classList.add('has-absences');
                } else {
                    monthStats.innerHTML = '<div class="month-perfect">✓ Без пропусків</div>';
                    // Remove red highlight if no absences
                    if (monthTitle) {
                        monthTitle.classList.remove('has-absences');
                        monthTitle.classList.remove('highlight-absences'); // legacy
                    }
                }
            }
            
            // Update week/month title based on view
            if (weekTitle) {
                if (this.calendarView === 'month') {
                    // For month view, show month name
                    const monthOptions = { month: 'long' };
                    const monthName = displayDate.toLocaleDateString('uk-UA', monthOptions);
                    weekTitle.textContent = monthName;
                } else {
                    // For week view, show date range
                    const titleOptions = { day: 'numeric' };
                    const startDay = startDate.toLocaleDateString('uk-UA', titleOptions);
                    const endDay = endDate.toLocaleDateString('uk-UA', titleOptions);
                    weekTitle.textContent = `${startDay} - ${endDay}`;
                }
            }
            
            // Generate calendar days based on view type
            if (this.calendarView === 'month') {
                this.renderMonthView(fragment, displayDate);
            } else {
                this.renderWeekView(fragment, startDate);
            }
            
            // Single DOM update for better performance
            grid.appendChild(fragment);
            
            // Trigger animations with RAF for better performance
            if (this.performance.animationsEnabled) {
                requestAnimationFrame(() => {
                    grid.offsetHeight; // Force reflow for animations
                });
            }
            
        } catch (error) {
            console.error('Error rendering calendar:', error);
        }
    }
    
    // Render week view (тільки Пн-Пт, без суботи)
    renderWeekView(fragment, weekStart) {
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
        
        for (let i = 1; i <= 5; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            
            const dayElement = this.createDayElement(date, days[i - 1], i - 1);
            fragment.appendChild(dayElement);
        }
        
        // Week view rendered
    }
    
    // Render month view (тільки Пн-Пт, без субот і неділь)
    renderMonthView(fragment, monthStart) {
        const year = monthStart.getFullYear();
        const month = monthStart.getMonth();
        
        // Get first and last day of month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Days of the week (only Mon-Fri)
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
        let renderedDays = 0;
        
        // Generate schedule for entire month first
        this.generateMonthSchedule(year, month);
        
        // Відображаємо тільки Пн-Пт (без субот і неділь)
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            const dateKey = this.formatDateKey(date);
            
            // Skip Sundays (day 0) and Saturdays (day 6)
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;
            
            // Convert to our Monday=0 system (Mon=1->0, Tue=2->1, etc)
            const adjustedDayOfWeek = dayOfWeek - 1;
            const dayName = days[adjustedDayOfWeek];
            
            const dayElement = this.createDayElement(date, dayName, renderedDays);
            fragment.appendChild(dayElement);
            renderedDays++;
        }
        
        // Month view: ${renderedDays} days rendered
    }
    
    // Generate schedule for entire month
    generateMonthSchedule(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Generate schedule for each week in the month
        for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 7)) {
            const weekSchedule = this.generateWeekSchedule(date);
            // Merge with existing schedule
            Object.assign(this.sampleSchedule, weekSchedule);
        }
    }

    createDayElement(date, dayName, index = 0) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.style.animationDelay = `${index * 0.08}s`;
        
        const dateKey = this.formatDateKey(date);
        dayElement.dataset.dateKey = dateKey;
        
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
        
        // Add absence badge if есть
        if (dayAbsencesCount > 0) {
            const badge = document.createElement('div');
            badge.className = 'day-absence-badge';
            badge.textContent = dayAbsencesCount;
            dayElement.appendChild(badge);
        }
        
        // Make day clickable
        dayElement.addEventListener('click', () => this.openDayModal(date));
        
        return dayElement;
    }
    
    getDayAbsencesCount(dateKey) {
        const combined = this.getCombinedDaySchedule(dateKey);
        if (!combined || !combined.classes) return 0;
        
        return combined.classes.filter(c => this.attendanceData[c.id] === 'absent').length;
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
        
        console.log(`Counting absences for month: ${month + 1}/${year}`);
        
        // Проходим по всем дням месяца
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            const dateKey = this.formatDateKey(d);
            
            // Генерируем расписание для этого дня, если его нет
            if (!this.sampleSchedule[dateKey]) {
                const tempWeekSchedule = this.generateWeekSchedule(d);
                if (tempWeekSchedule[dateKey]) {
                    this.sampleSchedule[dateKey] = tempWeekSchedule[dateKey];
                }
            }
            
            // ВАЖНО: используем getCombinedDaySchedule для учета замен
            const combined = this.getCombinedDaySchedule(dateKey);
            if (combined && combined.classes && combined.classes.length > 0) {
                combined.classes.forEach(classInfo => {
                    if (this.attendanceData[classInfo.id] === 'absent') {
                        absencesCount++;
                        console.log(`Found absence: ${classInfo.id} on ${dateKey}`);
                    }
                });
            }
        }
        
        console.log(`Total absences in month: ${absencesCount}`);
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
    
    saveGroupName() {
        const groupNameInput = document.getElementById('groupNameInput');
        if (!groupNameInput) return;
        
        const newGroupName = groupNameInput.value.trim();
        if (newGroupName === '') {
            this.showNotification('Назва групи не може бути пустою', 'error');
            return;
        }
        
        // Save to localStorage
        localStorage.setItem('bn32-group-name', newGroupName);
        
        // Update the app title
        this.updateAppTitle(newGroupName);
        
        // Show success notification
        this.showNotification('Назву групи збережено!', 'success');
        this.vibrate(20);
    }
    
    updateAppTitle(groupName) {
        const appTitle = document.getElementById('appTitle');
        if (appTitle) {
            appTitle.textContent = `Розклад ${groupName}`;
        }
        
        // Also update page title if needed
        document.title = `Розклад ${groupName}`;
    }
    
    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            z-index: 10000;
            font-weight: 600;
            box-shadow: var(--shadow-lg);
            animation: slideInFromRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutToRight 0.3s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    showToast(message, type = 'info', duration = 3000) {
        // Alias for showNotification
        this.showNotification(message, type);
    }
    
    updateGroupButtons() {
        // Update active button based on current group
        document.querySelectorAll('.group-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.group === this.currentGroup);
        });
        
        // Update app title
        const appTitle = document.getElementById('appTitle');
        if (appTitle) {
            const groupName = this.currentGroup === 'bn-3-2' ? 'БН-3-2' : 'БН 2-1';
            appTitle.textContent = `Розклад ${groupName}`;
        }
    }

    handleResize() {
        this.isMobile = window.innerWidth <= 768;
        if (!this.isMobile) {
            this.closeMobileMenu();
        }
    }

    openDayModal(date) {
        this.selectedDate = date;
        const modalOverlay = document.getElementById('modalOverlay');
        const modalPanel = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        if (!modalOverlay || !modalTitle || !modalBody) {
            console.error('Modal elements not found:', { modalOverlay: !!modalOverlay, modalTitle: !!modalTitle, modalBody: !!modalBody });
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
        const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
        this.lastScrollPosition = currentScrollY;
        modalOverlay.classList.add('active');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        const scrollTarget = modalPanel || modalOverlay;
        const needsWindowScroll = currentScrollY > 40;
        // Невелика затримка, щоб DOM/CSS встигли оновитися перед автопрокруткою
        setTimeout(() => {
            try {
                // Для стабільності не використовуємо scrollIntoView/scrollBy з додатковими обчисленнями
                // Якщо користувач сильно прокрутив сторінку вниз, просто м'яко повертаємося до верху
                if (needsWindowScroll) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }

                // Фокус всередині модального вікна (без додаткового скролу від браузера)
                const focusScope = modalPanel || modalOverlay;
                const focusable = focusScope?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable && typeof focusable.focus === 'function') {
                    focusable.focus({ preventScroll: true });
                }
            } catch (e) {
                // swallow any errors — це лише покращення UX
                console.warn('Auto-scroll to modal failed', e);
            }
        }, 60);
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
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
        }
        const restoreScroll = () => {
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
            if (typeof this.lastScrollPosition === 'number') {
                window.scrollTo({ top: this.lastScrollPosition, behavior: 'auto' });
                this.lastScrollPosition = null;
            }
        };
        setTimeout(restoreScroll, 350);
        this.selectedDate = null;
    }

    // Change calendar view between week and month
    changeCalendarView(viewType) {
        console.log(`Changing calendar view to: ${viewType}`);
        
        this.calendarView = viewType;
        localStorage.setItem('bn32-calendar-view', viewType);
        
        // Navigation labels - завжди по місяцях
        const prevBtn = document.getElementById('prevWeek');
        const nextBtn = document.getElementById('nextWeek');
        
        if (prevBtn) {
            prevBtn.setAttribute('aria-label', 'Попередній місяць');
            prevBtn.title = 'Попередній місяць';
        }
        if (nextBtn) {
            nextBtn.setAttribute('aria-label', 'Наступний місяць');
            nextBtn.title = 'Наступний місяць';
        }
        
        // Re-render calendar with new view
        this.renderCalendar();
    }
    
    // Navigate calendar - завжди по місяцях
    navigateCalendar(direction) {
        this.navigateMonth(direction);
    }
    
    // Navigate month for monthly view
    navigateMonth(direction) {
        if (this.isMonthTransitioning) {
            console.log('Month transition already running');
            return;
        }
        this.isMonthTransitioning = true;
        
        const calendarGrid = this.getElement('calendarGrid');
        const calendarContainer = document.querySelector('.calendar-container');
        const monthHeader = document.querySelector('.month-header');
        const directionClass = direction > 0 ? 'transition-forward' : 'transition-backward';
        
        const startTransition = () => {
            if (calendarGrid) {
                calendarGrid.classList.add('month-transitioning', directionClass);
            }
            if (calendarContainer) {
                calendarContainer.classList.add('switching');
            }
            if (monthHeader) {
                monthHeader.classList.add('transitioning');
            }
        };
        requestAnimationFrame(startTransition);
        
        const performSwitch = () => {
            // Get current month and year
            const currentDate = new Date(this.currentWeek);
            currentDate.setMonth(currentDate.getMonth() + direction);
            currentDate.setDate(1); // Set to first day of month
            
            this.currentWeek = currentDate;
            this.renderCalendar();
            this.animateWeekTitle(direction);
            this.animateNavigation(direction);
            this.vibrate(10);
            
            const cleanup = () => {
                if (calendarGrid) {
                    calendarGrid.classList.remove('month-transitioning', 'transition-forward', 'transition-backward');
                }
                if (calendarContainer) {
                    calendarContainer.classList.remove('switching');
                }
                if (monthHeader) {
                    monthHeader.classList.remove('transitioning');
                }
                this.isMonthTransitioning = false;
            };
            setTimeout(cleanup, 320);
        };
        const delay = this.performance?.animationsEnabled === false ? 0 : 170;
        setTimeout(performSwitch, delay);
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
                                Текущий месяц: <strong>${stats.currentMonthAbsences} пропусків</strong>
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
    
    loadSettings() {
        // Vibration
        const savedVibration = localStorage.getItem('bn32-vibration');
        this.vibrationEnabled = savedVibration !== 'false';
        
        // Font size
        const fontSize = localStorage.getItem('bn32-font-size') || 'medium';
        this.changeFontSize(fontSize);
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.size === fontSize) btn.classList.add('active');
        });
        
        // Bottom navigation
        const savedBottomNav = localStorage.getItem('bn32-bottom-nav');
        const bottomNavEnabled = (savedBottomNav === null) ? true : (savedBottomNav === 'true');
        localStorage.setItem('bn32-bottom-nav', bottomNavEnabled ? 'true' : 'false');
        this.applyBottomNav(bottomNavEnabled);
        const bottomToggle = document.getElementById('bottom-nav-toggle');
        if (bottomToggle) bottomToggle.checked = bottomNavEnabled;
        
        // Apply theme and activate buttons after DOM ready
        setTimeout(() => {
            this.applyTheme && this.applyTheme();
            const activeThemeBtn = document.querySelector(`[data-theme="${this.currentTheme}"]`);
            if (activeThemeBtn) {
                if (this.activeThemeBtn && this.activeThemeBtn !== activeThemeBtn) {
                    this.activeThemeBtn.classList.remove('active');
                }
                activeThemeBtn.classList.add('active');
                this.activeThemeBtn = activeThemeBtn;
            }
            
            const vibrationToggle = document.getElementById('vibration-toggle');
            if (vibrationToggle) {
                vibrationToggle.checked = this.vibrationEnabled;
                if (!(navigator && typeof navigator.vibrate === 'function')) {
                    vibrationToggle.disabled = true;
                    vibrationToggle.title = 'Вібрація не підтримується на цьому пристрої';
                }
            }
        }, 100);
        
        console.log('Settings loaded successfully');
    }

    vibrate(duration = 10) {
        if (!this.vibrationEnabled) return false;
       
        if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;
        try {
            // Cancel any ongoing vibration before starting a new one
            navigator.vibrate(0);
            const ok = navigator.vibrate([Math.max(1, duration)]);
            return !!ok;
        } catch (error) {
            console.warn('Vibration failed:', error);
            return false;
        }
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
    
    
    applyTheme() {
        // Apply saved theme without flicker; skip if already applied
        try {
            const el = document.documentElement;
            const desired = (this.currentTheme && this.currentTheme !== 'default') ? this.currentTheme : null;
            const current = el.getAttribute('data-theme');
            if ((desired || null) === (current || null)) {
                return; // nothing to do
            }
            // Temporarily disable transitions to avoid color flicker on phones
            el.classList.add('no-animations');
            if (desired) {
                el.setAttribute('data-theme', desired);
            } else {
                el.removeAttribute('data-theme');
            }
            // Force a reflow so CSS variables propagate immediately
            void el.offsetWidth;
            // Re-enable animations on next frame
            requestAnimationFrame(() => el.classList.remove('no-animations'));
        } catch (e) {
            console.warn('applyTheme failed:', e);
        }
        // Update active button state after DOM is ready
        setTimeout(() => {
            if (this.updateActiveThemeButton) {
                this.updateActiveThemeButton();
            }
        }, 0);
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
        // JS controls movement for ALL mobile devices (Android + iPhone)
        try {
            const bottomNav = document.getElementById('bottomNav');
            if (!bottomNav) return;

            // Desktop - clear styles
            if (window.innerWidth > 768) {
                bottomNav.style.position = '';
                bottomNav.style.bottom = '';
                bottomNav.style.transform = '';
                bottomNav.style.top = '';
                return;
            }

            // Mobile: JS-controlled movement for all phones
            if (this._bottomNavSetup) return; // prevent duplicate listeners
            this._bottomNavSetup = true;

            let ticking = false;
            let isPageHidden = document.hidden;
            const onVisibility = () => { isPageHidden = document.hidden; };
            document.addEventListener('visibilitychange', onVisibility);

            // Base styles for transform-based movement
            bottomNav.style.position = 'absolute';
            bottomNav.style.left = '50%';
            bottomNav.style.top = '0px';
            bottomNav.style.bottom = 'auto';
            bottomNav.style.transform = 'translate3d(-50%, 0, 0)';

            const computeY = () => {
                const vv = window.visualViewport;
                const scrollY = vv ? (vv.pageTop || window.pageYOffset || document.documentElement.scrollTop || 0)
                                   : (window.pageYOffset || document.documentElement.scrollTop || 0);
                const viewportHeight = vv ? vv.height : window.innerHeight;
                const navHeight = bottomNav.offsetHeight || 0;
                const bottomOffset = 20; // match CSS gap
                return Math.max(0, scrollY + viewportHeight - navHeight - bottomOffset);
            };

            const updatePosition = () => {
                if (!bottomNav || isPageHidden) { ticking = false; return; }
                try {
                    const y = computeY();
                    const next = `translate3d(-50%, ${y}px, 0)`;
                    // Only update if position actually changed (reduce repaints)
                    const current = bottomNav.style.transform;
                    if (current !== next) {
                        bottomNav.style.transform = next;
                    }
                } finally {
                    ticking = false;
                }
            };

            // Throttled update for better performance
            let lastUpdate = 0;
            const throttleDelay = 16; // ~60fps max
            
            const requestTick = () => {
                if (isPageHidden) return;
                const now = performance.now();
                if (now - lastUpdate < throttleDelay) return;
                
                if (!ticking) {
                    ticking = true;
                    lastUpdate = now;
                    requestAnimationFrame(updatePosition);
                }
            };

            // Update on scroll and resize
            window.addEventListener('scroll', requestTick, { passive: true });
            document.addEventListener('scroll', requestTick, { passive: true, capture: true });
            window.addEventListener('resize', requestTick);
            window.addEventListener('orientationchange', () => setTimeout(requestTick, 20));

            // Touch/pointer moves for immediate response
            document.addEventListener('touchmove', requestTick, { passive: true });
            document.addEventListener('pointermove', requestTick, { passive: true });

            // VisualViewport changes (mobile address bar, keyboard)
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', requestTick);
                window.visualViewport.addEventListener('scroll', requestTick);
            }

            // Initial position
            updatePosition();

            // Store reference (optional cleanup could be added)
            this._bottomNavUpdate = requestTick;
            
            console.log('Mobile: JS-controlled movement enabled');
        } catch (e) {
            console.warn('Bottom nav setup failed:', e);
        }
    }

    updateActiveThemeButton(clickedBtn = null) {
        // Clear all active states
        this.themeButtons.forEach(btn => btn.classList.remove('active'));
        
        // Find and activate the correct button
        const targetBtn = clickedBtn || document.querySelector(`[data-theme="${this.currentTheme}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
            this.activeThemeBtn = targetBtn;
            console.log(`Active theme button updated: ${this.currentTheme}`);
        } else {
            console.warn(`No theme button found for: ${this.currentTheme}`);
        }
    }
    
    changeTheme(theme) {
        console.log(`Changing theme from ${this.currentTheme} to: ${theme}`);
        // Cancel any pending theme apply
        if (this._themeApplyTimer) {
            clearTimeout(this._themeApplyTimer);
            this._themeApplyTimer = null;
        }
        // Persist selection first
        this.currentTheme = theme;
        try { localStorage.setItem('bn32-theme', theme); } catch {}
        // Apply atomically with transitions disabled to prevent flicker
        try {
            const el = document.documentElement;
            el.classList.add('no-animations');
            if (theme === 'default') {
                el.removeAttribute('data-theme');
            } else {
                el.setAttribute('data-theme', theme);
            }
            void el.offsetWidth; // sync layout
            requestAnimationFrame(() => el.classList.remove('no-animations'));
        } catch (e) {
            console.warn('changeTheme failed:', e);
        }
        this.vibrate(10);
    }
    
    switchGroup(group) {
        console.log(`Switching from ${this.currentGroup} to ${group}`);
        
        if (this.currentGroup === group) {
            console.log('Already on this group');
            return;
        }
        
        if (this.isSwitchingGroup) {
            console.log('Group switch already in progress');
            return;
        }
        this.isSwitchingGroup = true;
        
        const calendarGrid = document.getElementById('calendarGrid');
        const calendarContainer = document.querySelector('.calendar-container');
        const monthHeader = document.querySelector('.month-header');
        
        const startGroupTransition = () => {
            if (calendarGrid) calendarGrid.classList.add('switching');
            if (calendarContainer) calendarContainer.classList.add('switching');
            if (monthHeader) monthHeader.classList.add('transitioning');
        };
        
        // Start animation next frame for smoother transition
        requestAnimationFrame(startGroupTransition);
        
        setTimeout(() => {
            // Save current group
            this.currentGroup = group;
            localStorage.setItem('bn32-current-group', group);
            
            // Завантажуємо дані відвідуваності для нової групи
            this.attendanceData = this.loadAttendanceData();
            
            // Update schedule template
            this.weeklyScheduleTemplate = this.scheduleTemplates[group];
            
            // Update active button
            document.querySelectorAll('.group-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.group === group);
            });
            
            // Update app title
            const appTitle = document.getElementById('appTitle');
            if (appTitle) {
                const groupName = group === 'bn-3-2' ? 'БН-3-2' : 'БН 2-1';
                appTitle.textContent = `Розклад ${groupName}`;
            }
            
            // Regenerate schedule
            this.sampleSchedule = this.generateWeekSchedule(this.currentWeek);
            
            // Re-render calendar
            this.renderCalendar();
            this.updateStats();
            this.updateCalendarAfterAttendanceChange();
            
            const cleanupTransition = () => {
                if (calendarGrid) calendarGrid.classList.remove('switching');
                if (calendarContainer) calendarContainer.classList.remove('switching');
                if (monthHeader) monthHeader.classList.remove('transitioning');
                this.isSwitchingGroup = false;
            };
            
            setTimeout(cleanupTransition, 300);
            
            // Show notification
            const groupName = group === 'bn-3-2' ? 'БН-3-2' : 'БН 2-1';
            this.showToast(`Переключено на групу ${groupName}`, 'success', 2000);
            
            console.log(`Group switched to ${group}`);
        }, 220);
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
        console.log('updateCalendarAfterAttendanceChange called');
        
        // Update month stats display
        this.updateMonthStatsDisplay();
        
        // Update calendar days with absence badges and styling
        this.updateCalendarDaysAbsences();
    }
    
    updateMonthStatsDisplay() {
        console.log('updateMonthStatsDisplay called');
        
        // Update month stats with absences count
        const monthStats = document.getElementById('monthStats');
        if (!monthStats) {
            console.warn('monthStats element not found');
            return;
        }
        
        // Use current displayed month/week for counting
        const displayDate = new Date(this.currentWeek);
        if (this.calendarView === 'month') {
            displayDate.setDate(1); // First day of month
        }
        
        // Check if there are absences for the current month
        const monthAbsences = this.getMonthAbsencesCount(displayDate);
        if (monthAbsences > 0) {
            monthStats.innerHTML = `
                <div class="month-absences-counter">
                    <span class="absences-icon">⚠️</span>
                    <span class="absences-count">${monthAbsences}</span>
                    <span class="absences-text">${this.getPluralForm(monthAbsences, 'пропуск', 'пропуски', 'пропусків')}</span>
                </div>
            `;
            // Ensure month title shows absence highlight when there are absences
            if (monthTitle) {
                monthTitle.classList.add('has-absences');
            }
        } else {
            monthStats.innerHTML = '<div class="month-perfect">✓ Без пропусків</div>';
            // Remove red highlight if no absences
            if (monthTitle) {
                monthTitle.classList.remove('has-absences');
                monthTitle.classList.remove('highlight-absences'); // legacy
            }
        }
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
            // Зберігаємо дані для поточної групи
            const storageKey = `bn32-attendance-${this.currentGroup}`;
            localStorage.setItem(storageKey, JSON.stringify(this.attendanceData));
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

        window.addEventListener('resize', () => {
            try {
                if (window.scheduleApp) {
                    window.scheduleApp.handleResize && window.scheduleApp.handleResize();
                }
            } catch {}
        });

    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
});
