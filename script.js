document.addEventListener('DOMContentLoaded', function() {
    // Текущая дата
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    // Элементы DOM
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthElement = document.getElementById('current-month');
    const currentYearElement = document.getElementById('current-year');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const scheduleModal = document.getElementById('schedule-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalDate = document.getElementById('modal-date');
    const dateBadge = document.getElementById('date-badge');
    const daySchedule = document.getElementById('day-schedule');
    const attendanceSummary = document.getElementById('attendance-summary');
    const saveAttendanceButton = document.getElementById('save-attendance');
    const closeModalButton = document.getElementById('close-modal');
    const versionInfo = document.getElementById('version-info');
    const mobileIndicator = document.querySelector('.mobile-indicator');
    
    // Расписание занятий
    const scheduleData = {
        "1": [ // Понедельник
            { time: "9:00-10:20", subject: "Інженерна та комп. графіка", room: "415", teacher: "Воронцов" },
            { time: "10:30-11:50", subject: "Захист України", room: "227", teacher: "Воронянський" },
            { time: "12:00-13:20", subject: "Технології", room: "417", teacher: "Яковенко" },
            { time: "13:30-14:50", subject: "Матеріалознавство", room: "302", teacher: "Волинець" }
        ],
        "2": [ // Вторник
            { time: "9:00-10:20", subject: "Іноземна мова", room: "316", teacher: "Почтакова" },
            { time: "10:30-11:50", subject: "Фізика і астрономія", room: "414", teacher: "Павлович" },
            { time: "12:00-13:20", subject: "Біологія і екологія", room: "409", teacher: "Сахненко" }
        ],
        "3": [ // Среда
            { time: "9:00-10:20", subject: "Вища математика", room: "312", teacher: "Кізь" },
            { time: "10:30-11:50", subject: "Українська мова", room: "407", teacher: "Марченко" },
            { time: "12:00-13:20", subject: "Історія України", room: "225", teacher: "Коваленко" },
            { time: "13:30-14:50", subject: "Географія", room: "203", teacher: "Тенькова" },
            { time: "15:00-16:20", subject: "Фізика і астрономія", room: "414", teacher: "Павлович" }
        ],
        "4": [ // Четверг
            { time: "9:00-10:20", subject: "Українська література", room: "407", teacher: "Марченко" },
            { time: "10:30-11:50", subject: "Фізика", room: "305", teacher: "Яковенко" },
            { time: "12:00-13:20", subject: "Фізична культура", room: "с/з", teacher: "Кошель" },
            { time: "13:30-14:50", subject: "Економічні теорії", room: "408", teacher: "Марченко" },
            { time: "15:00-16:20", subject: "Хімія", room: "411", teacher: "Андрушкевич" }
        ],
        "5": [ // Пятница
            { time: "9:00-10:20", subject: "Українська мова (ЗПС)", room: "407", teacher: "Марченко" },
            { time: "10:30-11:50", subject: "Географія", room: "203", teacher: "Тенькова" },
            { time: "12:00-13:20", subject: "Фізична культура", room: "с/з", teacher: "Кошель" }
        ]
    };
    
    // Дни недели на украинском
    const weekdays = [
        "Неділя", "Понеділок", "Вівторок", "Середа", 
        "Четвер", "П'ятниця", "Субота"
    ];
    
    // Загрузить отметки о пропусках
    let absenceData = JSON.parse(localStorage.getItem('absenceData')) || {};
    
    // Выбранная дата и день недели
    let selectedDate = null;
    let selectedDayOfWeek = null;
    
    // Генерация календаря
    function generateCalendar() {
        calendarDays.innerHTML = '';
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const firstDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();
        
        const months = [
            "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
            "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
        ];
        
        // Обновляем и месяц и год
        currentMonthElement.textContent = months[currentMonth];
        currentYearElement.textContent = currentYear;
        
        // Дни предыдущего месяца
        for (let i = firstDayIndex; i > 0; i--) {
            createDay(prevLastDay - i + 1, true);
        }
        
        // Дни текущего месяца
        for (let i = 1; i <= lastDay.getDate(); i++) {
            createDay(i, false);
        }
        
        // Дни следующего месяца
        const daysLeft = 42 - (firstDayIndex + lastDay.getDate());
        for (let i = 1; i <= daysLeft; i++) {
            createDay(i, true);
        }
        
        // Скрываем подсказку о свайпе после первого использования
        if (localStorage.getItem('swipeHintSeen')) {
            mobileIndicator.classList.add('hidden');
        }
    }
    
    function createDay(day, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('day');
        if (isOtherMonth) dayElement.classList.add('other-month');
        
        const dateObj = new Date(currentYear, currentMonth, day);
        const dayOfWeek = dateObj.getDay();
        const normalizedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
        
        const hasClasses = !isOtherMonth && normalizedDayOfWeek <= 5 && scheduleData[normalizedDayOfWeek];
        const dateKey = `${currentYear}-${currentMonth + 1}-${day}`;
        const dayAbsences = absenceData[dateKey] || [];
        
        let dayContent = `<div class="day-number">${day}</div>`;
        
        if (hasClasses) {
            const subjects = scheduleData[normalizedDayOfWeek];
            for (let j = 0; j < Math.min(2, subjects.length); j++) {
                dayContent += `<div class="day-subject">${subjects[j].subject}</div>`;
            }
            dayElement.classList.add('has-classes');
            
            if (dayAbsences.length > 0) {
                dayContent += `<div class="day-absence-count">${dayAbsences.length}</div>`;
                dayElement.classList.add('absence-marked');
            }
            
            dayElement.addEventListener('click', () => openSchedule(day, normalizedDayOfWeek));
            dayElement.style.cursor = 'pointer';
        } else {
            dayElement.style.cursor = 'default';
        }
        
        dayElement.innerHTML = dayContent;
        calendarDays.appendChild(dayElement);
    }
    
    // Открыть расписание
    function openSchedule(day, dayOfWeek) {
        selectedDate = `${currentYear}-${currentMonth + 1}-${day}`;
        selectedDayOfWeek = dayOfWeek;
        
        const date = new Date(currentYear, currentMonth, day);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        modalDate.textContent = `Розклад на ${date.toLocaleDateString('uk-UA', options)}`;
        dateBadge.textContent = weekdays[date.getDay()];
        
        renderSchedule();
        scheduleModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Вибрация при открытии (на мобильных)
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }
    
    function renderSchedule() {
        daySchedule.innerHTML = '';
        
        if (scheduleData[selectedDayOfWeek]) {
            const dayAbsences = absenceData[selectedDate] || [];
            
            scheduleData[selectedDayOfWeek].forEach((lesson, index) => {
                const isAbsent = dayAbsences.includes(index);
                const scheduleItem = document.createElement('div');
                scheduleItem.classList.add('schedule-item');
                if (isAbsent) scheduleItem.classList.add('absent');
                
                scheduleItem.innerHTML = `
                    <div class="schedule-time">${lesson.time}</div>
                    <div class="schedule-subject">${lesson.subject}</div>
                    <div class="schedule-details">
                        <span>Ауд. ${lesson.room}</span>
                        <span>${lesson.teacher}</span>
                    </div>
                    <div class="attendance-toggle">
                        <input type="checkbox" id="absence-${index}" data-lesson="${index}" ${isAbsent ? 'checked' : ''}>
                        <label for="absence-${index}">Відмітити як пропущену</label>
                    </div>
                `;
                daySchedule.appendChild(scheduleItem);
            });
            
            updateAttendanceSummary(dayAbsences.length, scheduleData[selectedDayOfWeek].length);
        } else {
            daySchedule.innerHTML = '<div class="empty-schedule">В цей день пар немає</div>';
            attendanceSummary.innerHTML = '';
        }
    }
    
    // Обновить статистику
    function updateAttendanceSummary(absencesCount, totalLessons) {
        const presentCount = totalLessons - absencesCount;
        const percentage = totalLessons > 0 ? Math.round((presentCount / totalLessons) * 100) : 0;
        
        attendanceSummary.innerHTML = `
            <h4>Відвідуваність</h4>
            <div class="summary-item">
                <span>Присутній:</span>
                <span>${presentCount} пар</span>
            </div>
            <div class="summary-item">
                <span>Відсутній:</span>
                <span>${absencesCount} пар</span>
            </div>
            <div class="summary-item summary-total">
                <span>Всього:</span>
                <span>${totalLessons} пар (${percentage}%)</span>
            </div>
        `;
    }
    
    // Сохранить отметки
    function saveAttendance() {
        if (selectedDate) {
            const checkboxes = document.querySelectorAll('.attendance-toggle input');
            const absences = [];
            
            checkboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    absences.push(parseInt(checkbox.dataset.lesson));
                }
            });
            
            if (absences.length > 0) {
                absenceData[selectedDate] = absences;
            } else {
                delete absenceData[selectedDate];
            }
            
            localStorage.setItem('absenceData', JSON.stringify(absenceData));
            generateCalendar();
            closeModal();
            
            // Вибрация при сохранении
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
        }
    }
    
    // Закрыть модальное окно
    function closeModal() {
        scheduleModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Показать версию
    function showVersion() {
        versionInfo.classList.add('show');
        
        setTimeout(() => {
            versionInfo.classList.remove('show');
        }, 3000);
    }
    
    // Обработчики событий
    prevMonthButton.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar();
        
        // Вибрация при переключении
        if ('vibrate' in navigator) {
            navigator.vibrate(30);
        }
    });
    
    nextMonthButton.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar();
        
        // Вибрация при переключении
        if ('vibrate' in navigator) {
            navigator.vibrate(30);
        }
    });
    
    closeModalButton.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);
    
    saveAttendanceButton.addEventListener('click', saveAttendance);
    
    // Обновление статистики при изменении checkbox
    document.addEventListener('change', (event) => {
        if (event.target.matches('.attendance-toggle input')) {
            const checkboxes = document.querySelectorAll('.attendance-toggle input');
            const absencesCount = Array.from(checkboxes).filter(cb => cb.checked).length;
            
            if (selectedDayOfWeek && scheduleData[selectedDayOfWeek]) {
                updateAttendanceSummary(absencesCount, scheduleData[selectedDayOfWeek].length);
            }
            
            // Легкая вибрация при изменении
            if ('vibrate' in navigator) {
                navigator.vibrate(20);
            }
        }
    });
    
    // Обработчик прокрутки для показа версии
    let lastScrollTop = 0;
    let versionShown = false;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Показываем версию только при прокрутке вниз и если еще не показывали
        if (scrollTop > lastScrollTop && scrollTop > 100 && !versionShown) {
            showVersion();
            versionShown = true;
        }
        
        // Показываем версию при достижении конца страницы
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        
        if (scrollHeight - scrollTop - clientHeight < 50 && !versionShown) {
            showVersion();
            versionShown = true;
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Скрываем версию при касании
    versionInfo.addEventListener('click', function() {
        versionInfo.classList.remove('show');
    });
    
    // Swipe для мобильных
    let touchStartX = 0;
    let touchStartY = 0;
    
    calendarDays.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        
        // Скрываем подсказку о свайпе после первого использования
        localStorage.setItem('swipeHintSeen', 'true');
        mobileIndicator.classList.add('hidden');
    });
    
    calendarDays.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // Проверяем, что это горизонтальный свайп, а не вертикальный
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) {
                // Swipe right - previous month
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
            } else {
                // Swipe left - next month
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
            }
            generateCalendar();
            
            // Вибрация при свайпе
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
        }
    });
    
    // Инициализация
    generateCalendar();
    
    // Показываем версию при загрузке (только на мобильных)
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        setTimeout(showVersion, 2000);
    }
});
