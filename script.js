document.addEventListener('DOMContentLoaded', function() {
    // Текуща дата
    let currentYear = new Date().getFullYear();
    let currentMonth = 8; // Вересень
    let currentDate = new Date(currentYear, currentMonth, 1);
    
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
    const versionCorner = document.getElementById('version-corner');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Расписание занятий
    const scheduleData = {
        "1": [ // Понеділок
            { time: "9:00-10:20", subject: "МОБ", room: "301", teacher: "Вирста" },
            { time: "10:30-11:50", subject: "Буріння свердловин", room: "103", teacher: "Агейчева" },
            { time: "12:00-13:20", subject: "Буріння свердловин", room: "103", teacher: "Агейчева" }
        ],
        "2": [ // Вівторок
            { time: "9:00-10:20", subject: "Технічна механіка", room: "302", teacher: "Волинець" },
            { time: "10:30-11:50", subject: "Промивка свердловин", room: "307А", teacher: "Деркунська" },
            { time: "12:00-13:20", subject: "МОБ", room: "301", teacher: "Вирста" }
        ],
        "3": [ // Середа
            { time: "9:00-10:20", subject: "МОБ", room: "301", teacher: "Вирста" },
            { time: "10:30-11:50", subject: "Фізичне виховання", room: "с/з", teacher: "Кошель" },
            { time: "12:00-13:20", subject: "ЗНПГ", room: "202", teacher: "Сакова" },
            { time: "13:30-14:50", subject: "Іноземна (ЗПС)", room: "316", teacher: "Почтакова" }
        ],
        "4": [ // Четвер
            { time: "9:00-10:20", subject: "Технічна механіка", room: "302", teacher: "Волинець" },
            { time: "10:30-11:50", subject: "Гідравліка", room: "310", teacher: "Чмихун" },
            { time: "12:00-13:20", subject: "Гідравліка", room: "310", teacher: "Чмихун" }
        ],
        "5": [ // П'ятниця
            { time: "9:00-10:20", subject: "Промивка свердловин", room: "307А", teacher: "Деркунська" },
            { time: "10:30-11:50", subject: "ЗНПГ", room: "202", teacher: "Сакова" },
            { time: "12:00-13:20", subject: "Буріння свердловин", room: "103", teacher: "Агейчева" }
        ]
    };
    
    // Дни недели на украинском
    const weekdays = [
        "Неділя", "Понеділок", "Вівторок", "Середа", 
        "Четвер", "П'ятниця", "Субота"
    ];
    
    // Загрузить отметки о пропусках
    let absenceData = JSON.parse(localStorage.getItem('absenceData')) || {};
    
    // Функция для подсчета пропусков за месяц
    function getMonthlyAbsences(year, month) {
        let count = 0;
        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= lastDay; day++) {
            const dateKey = `${year}-${month + 1}-${day}`;
            if (absenceData[dateKey]) {
                count += absenceData[dateKey].length;
            }
        }
        return count;
    }
    
    // Функция для проверки, есть ли пропуски в текущем месяце
    function hasCurrentMonthAbsences() {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        return getMonthlyAbsences(currentYear, currentMonth) > 0;
    }
    
    // Выбранная дата и день недели
    let selectedDate = null;
    let selectedDayOfWeek = null;
    
    // Генерация календаря
    function generateCalendar() {
        // Используем DocumentFragment для снижения reflow/repaint
        const fragment = document.createDocumentFragment();
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

        // Подсчет и отображение пропусков за месяц
        const absences = getMonthlyAbsences(currentYear, currentMonth);
        updateMonthAbsenceIndicator(absences);

        // Дни предыдущего месяца
        for (let i = firstDayIndex; i > 0; i--) {
            fragment.appendChild(createDay(prevLastDay - i + 1, true));
        }

        // Дни текущего месяца
        for (let i = 1; i <= lastDay.getDate(); i++) {
            fragment.appendChild(createDay(i, false));
        }

        // Дни следующего месяца
        const daysLeft = 42 - (firstDayIndex + lastDay.getDate());
        for (let i = 1; i <= daysLeft; i++) {
            fragment.appendChild(createDay(i, true));
        }

        calendarDays.appendChild(fragment);

        // Скрываем подсказку о свайпе после первого использования
        if (localStorage.getItem('swipeHintSeen')) {
            mobileIndicator.classList.add('hidden');
        }

        // Анимация появления календаря
        animateCalendarAppearance();
    }
    
    // Функция для обновления индикатора пропусков месяца
    function updateMonthAbsenceIndicator(absences) {
        // Убираем предыдущие классы и элементы
        currentMonthElement.classList.remove('has-absences');
        const existingCount = currentMonthElement.querySelector('.absence-count');
        if (existingCount) {
            existingCount.remove();
        }
        
        // Если есть пропуски, добавляем индикатор
        if (absences > 0) {
            currentMonthElement.classList.add('has-absences');
            
            const countSpan = document.createElement('span');
            countSpan.classList.add('absence-count');
            countSpan.textContent = absences;
            countSpan.setAttribute('aria-label', `Пропущено ${absences} пар в цьому місяці`);
            
            currentMonthElement.appendChild(countSpan);
            
            // Анимация появления индикатора
            setTimeout(() => {
                countSpan.style.animation = 'bounce 0.6s ease';
            }, 100);
        }
    }
    
    // Анимация появления календаря
    function animateCalendarAppearance() {
        const days = calendarDays.querySelectorAll('.day');
        days.forEach((day, index) => {
            day.style.opacity = '0';
            day.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                day.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                day.style.opacity = '1';
                day.style.transform = 'translateY(0)';
            }, index * 20);
        });
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
            
            // Добавляем анимацию при наведении на мобильных
            if (window.innerWidth <= 600) {
                dayElement.addEventListener('touchstart', () => {
                    dayElement.style.transform = 'scale(0.95)';
                });
                dayElement.addEventListener('touchend', () => {
                    setTimeout(() => {
                        dayElement.style.transform = 'scale(1)';
                    }, 150);
                });
            }
        } else {
            dayElement.style.cursor = 'default';
        }
        
        dayElement.innerHTML = dayContent;
        return dayElement;
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
        
        // Анимация открытия модального окна
        scheduleModal.style.display = 'flex';
        scheduleModal.style.opacity = '0';
        
        setTimeout(() => {
            scheduleModal.style.opacity = '1';
            scheduleModal.style.transition = 'opacity 0.3s ease';
        }, 10);
        
        document.body.style.overflow = 'hidden';

        // Скрыть версию при открытии модального окна
        if (versionCorner) {
            versionCorner.classList.add('hide');
        }

        // Вибрация при открытии (на мобильных)
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
        
        // Анимация появления содержимого
        setTimeout(() => {
            const modalContent = document.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.animation = 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            }
        }, 100);
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
                
                // Анимация появления элементов
                scheduleItem.style.opacity = '0';
                scheduleItem.style.transform = 'translateX(-20px)';
                
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
                
                // Анимация появления с задержкой
                setTimeout(() => {
                    scheduleItem.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                    scheduleItem.style.opacity = '1';
                    scheduleItem.style.transform = 'translateX(0)';
                }, index * 100);
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
        
        // Анимация появления статистики
        const summaryItems = attendanceSummary.querySelectorAll('.summary-item');
        summaryItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 150);
        });
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
            
            // Анимация сохранения
            saveAttendanceButton.innerHTML = `
                <span>Збережено!</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
            saveAttendanceButton.style.background = 'linear-gradient(135deg, var(--success-color), #34d058)';
            
            setTimeout(() => {
                generateCalendar();
                closeModal();
                
                // Восстанавливаем кнопку
                saveAttendanceButton.innerHTML = `
                    <span>Зберегти відвідуваність</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                `;
                saveAttendanceButton.style.background = 'linear-gradient(135deg, var(--primary-color), var(--primary-light))';
            }, 1000);
            
            // Вибрация при сохранении
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
        }
    }
    
    // Закрыть модальное окно
    function closeModal() {
        // Анимация закрытия
        scheduleModal.style.opacity = '0';
        scheduleModal.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            scheduleModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);

        // Показать версию при закрытии модального окна
        if (versionCorner) {
            versionCorner.classList.remove('hide');
        }
    }
    
    // Показать версию
    function showVersion() {
        versionInfo.classList.add('show');
        
        setTimeout(() => {
            versionInfo.classList.remove('show');
        }, 3000);
    }
    
    // Duty-list: только имя и фамилия, количество чергувань, чекбокс "Сьогодні чергував"
    const dutyList = [
        "Ахіджанов Микола",
        "Бублик Анатолій",
        "Васін Максим",
        "Волоцький Дмитро",
        "Галенко Максим",
        "Джуманов Дамір",
        "Дрозд Євгеній",
        "Дяченко Ігор",
        "Житченко Олександр",
        "Жолонка Дмитро",
        "Заголовацький Богдан",
        "Карпенко Ігор",
        "Корніліч Кирило",
        "Лаврушко Максим",
        "Мартин Владислав",
        "Михайлов Владислав",
        "Поліщук Денис",
        "Решетніков Максим",
        "Сердюк Станіслав",
        "Слиньок Матвій",
        "Терещенко Денис",
        "Хоменко Олександр"
    ];

    const dutyTable = document.getElementById('duty-table').querySelector('tbody');
    // Ключ для хранения количества чергувань
    const dutyCountsKey = 'dutyCounts';
    let dutyCounts = JSON.parse(localStorage.getItem(dutyCountsKey)) || {};

    function renderDutyTable() {
        dutyTable.innerHTML = '';
        dutyList.forEach((fio, idx) => {
            const count = dutyCounts[fio] || 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${fio}</td>
                <td class="duty-count" data-fio="${fio}">${count}</td>
                <td>
                    <input type="checkbox" class="duty-today" data-fio="${fio}" />
                </td>
            `;
            // Для анимации появления строк
            tr.style.setProperty('--i', idx + 1);
            dutyTable.appendChild(tr);
        });
    }

    // Обработка отметки "Сьогодні чергував"
    dutyTable.addEventListener('change', function(e) {
        if (e.target.classList.contains('duty-today')) {
            const fio = e.target.dataset.fio;
            // Увеличиваем количество
            dutyCounts[fio] = (dutyCounts[fio] || 0) + 1;
            localStorage.setItem(dutyCountsKey, JSON.stringify(dutyCounts));
            // Обновляем только ячейку количества
            const td = dutyTable.querySelector(`.duty-count[data-fio="${fio}"]`);
            if (td) td.textContent = dutyCounts[fio];
            // Снимаем галочку через 400мс для UX
            setTimeout(() => { e.target.checked = false; }, 400);
        }
    });

    renderDutyTable();

    // Обработчики событий
    prevMonthButton.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        
        // Анимация переключения
        calendarDays.style.opacity = '0';
        calendarDays.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            generateCalendar();
            calendarDays.style.transition = 'all 0.3s ease';
            calendarDays.style.opacity = '1';
            calendarDays.style.transform = 'translateX(0)';
        }, 150);
        
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
        
        // Анимация переключения
        calendarDays.style.opacity = '0';
        calendarDays.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            generateCalendar();
            calendarDays.style.transition = 'all 0.3s ease';
            calendarDays.style.opacity = '1';
            calendarDays.style.transform = 'translateX(0)';
        }, 150);
        
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
            
            // Анимация checkbox
            const checkbox = event.target;
            checkbox.style.transform = 'scale(1.2)';
            setTimeout(() => {
                checkbox.style.transform = 'scale(1)';
            }, 150);
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
    }, { passive: true });
    
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
    }, { passive: true });
    
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
            
            // Анимация свайпа
            calendarDays.style.opacity = '0';
            calendarDays.style.transform = `translateX(${diffX > 0 ? '20px' : '-20px'})`;
            
            setTimeout(() => {
                generateCalendar();
                calendarDays.style.transition = 'all 0.3s ease';
                calendarDays.style.opacity = '1';
                calendarDays.style.transform = 'translateX(0)';
            }, 150);
            
            // Вибрация при свайпе
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
        }
    }, { passive: true });
    
    // Инициализация
    generateCalendar();
    
    // Показываем версию при загрузке (только на мобильных)
    setTimeout(showVersion, 2000);
    
    // Добавляем поддержку клавиатуры для мобильных
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && scheduleModal.style.display === 'flex') {
            closeModal();
        }
    });
    
    // Улучшенная обработка касаний для мобильных
    if (window.innerWidth <= 600) {
        // Предотвращаем двойное касание
        let lastTouchTime = 0;
        document.addEventListener('touchstart', (e) => {
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - lastTouchTime;
            
            if (timeDiff < 300) {
                e.preventDefault();
            }
            lastTouchTime = currentTime;
        }, { passive: false });
        
        // Улучшенная обработка скролла на мобильных
        let isScrolling = false;
        let scrollTimeout;
        
        window.addEventListener('scroll', () => {
            isScrolling = true;
            clearTimeout(scrollTimeout);
            
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
            }, 150);
        }, { passive: true });
    }

    // Переключение вкладок + управление видимостью версии на вкладке чергування
    tabBtns.forEach((btn, idx) => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            tabContents[idx].classList.add('active');

            // Лёгкая анимация появления контента вкладки
            const content = tabContents[idx];
            content.style.opacity = '0';
            content.style.transform = 'translateY(8px)';
            requestAnimationFrame(() => {
                content.style.transition = 'opacity 250ms ease, transform 250ms ease';
                content.style.opacity = '1';
                content.style.transform = 'translateY(0)';
            });

            // Прятать версию на вкладке "Чергування" и показывать на календаре
            if (btn.id === 'tab-duty-btn') {
                if (versionCorner) versionCorner.classList.add('hide');
            } else {
                if (versionCorner) versionCorner.classList.remove('hide');
            }
        }, { passive: true });
    });
});
