:root {
    --primary-color: #4a6fa5;
    --primary-light: #6b8cbc;
    --primary-dark: #3a5a80;
    --accent-color: #ff6b6b;
    --accent-light: #ff8e8e;
    --accent-dark: #e55a5a;
    --success-color: #28a745;
    --warning-color: #ffc107;
    --dark-color: #2d3748;
    --light-color: #f8f9fa;
    --gray-100: #f7fafc;
    --gray-200: #edf2f7;
    --gray-300: #e2e8f0;
    --gray-400: #cbd5e0;
    --gray-500: #a0aec0;
    --gray-600: #718096;
    --border-radius: 20px;
    --border-radius-sm: 12px;
    --shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
    --shadow-hover: 0 12px 35px rgba(0, 0, 0, 0.15);
    --shadow-modal: 0 25px 50px rgba(0, 0, 0, 0.25);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-attachment: fixed;
    color: var(--dark-color);
    line-height: 1.6;
    min-height: 100vh;
    padding: 0;
    margin: 0;
    -webkit-tap-highlight-color: transparent;
}

.container {
    max-width: 100%;
    margin: 0 auto;
    padding: 16px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Header */
header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: var(--border-radius);
    margin-bottom: 20px;
    padding: 20px;
    box-shadow: var(--shadow);
    animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
}

.logo {
    display: flex;
    align-items: center;
    gap: 12px;
}

.logo-icon {
    font-size: 2rem;
    animation: bounce 2s infinite;
}

h1 {
    color: var(--primary-color);
    font-size: 1.5rem;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.month-nav {
    display: flex;
    align-items: center;
    gap: 16px;
}

.nav-btn {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    color: white;
    border: none;
    border-radius: var(--border-radius-sm);
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow);
    position: relative;
    overflow: hidden;
}

.nav-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

.nav-btn:hover::before {
    left: 100%;
}

.nav-btn:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: var(--shadow-hover);
}

.nav-btn:active {
    transform: translateY(0) scale(0.95);
}

.month-year {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 110px;
}

.month-nav h2 {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--dark-color);
    text-align: center;
}

#current-year {
    font-size: 0.9rem;
    color: var(--gray-600);
    font-weight: 500;
    margin-top: 2px;
}

/* Main content */
main {
    flex: 1;
}

.calendar-wrapper {
    background: linear-gradient(135deg, #f8fafc 80%, #e2e8f0 100%);
    border: 1.5px solid #e2e8f0;
    box-shadow: 0 8px 32px rgba(76,110,165,0.10);
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow);
    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
}

.weekdays div {
    padding: 16px 0;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 0.85rem;
}

.days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px; /* Добавлен отступ между днями */
    background-color: var(--gray-200);
}

.day {
    background: white;
    min-height: 70px;
    padding: 12px;
    position: relative;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    animation: fadeIn 0.5s ease;
    border: 1px solid transparent;
    border-radius: 14px; /* Только закругление, без тени и сложных градиентов */
}

.day:hover {
    background: linear-gradient(135deg, #f7fafc 90%, #e2e8f0 100%);
    box-shadow: 0 6px 24px 0 rgba(76,110,165,0.13);
}

.day.other-month {
    background: linear-gradient(135deg, #f7fafc 80%, #e2e8f0 100%);
    color: #bfc8e6;
    opacity: 0.7;
}

.day.absence-marked {
    background: linear-gradient(135deg, #fff5f5 80%, #ffe6e6 100%);
    border: 2px solid #ff8e8e;
}

.day-number {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 4px;
    color: var(--dark-color);
}

.day-subject {
    font-size: 0.75rem;
    line-height: 1.3;
    color: var(--gray-600);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    font-weight: 500;
}

.day-absence-count {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: linear-gradient(135deg, var(--accent-color), var(--accent-dark));
    color: #fff;
    border: 2px solid #fff;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

/* Карточки расписания — белый фон, мягкая тень, закругление, отступы */
.schedule-item {
    background: #fff;
    color: var(--dark-color);
    border-left: 4px solid var(--primary-color);
    border-radius: 18px;
    margin-bottom: 18px;
    box-shadow: 0 2px 12px 0 rgba(76,110,165,0.07);
    padding: 18px;
    transition: box-shadow 0.2s, background 0.2s;
    position: relative;
}

.schedule-item.absent {
    background: #fff5f5;
    border-left-color: var(--accent-color);
}

.schedule-item:last-child {
    margin-bottom: 0;
}

.schedule-item:hover {
    box-shadow: 0 8px 24px 0 rgba(76,110,165,0.13);
    background: #f7fafc;
}

/* Отступы между карточками */
.day-schedule {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-bottom: 24px;
}

/* Версия в правом нижнем углу — всегда видна, минимализм */
.version-corner {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 1100;
    background: rgba(44, 62, 80, 0.92);
    color: #fff;
    padding: 10px 28px;
    border-radius: 22px;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 1px;
    box-shadow: 0 4px 18px rgba(44,62,80,0.18);
    opacity: 1;
    pointer-events: none;
    transition: opacity 0.5s cubic-bezier(.4,0,.2,1), transform 0.5s cubic-bezier(.4,0,.2,1), background 0.3s, color 0.3s, box-shadow 0.3s;
}

.version-corner.hide {
    opacity: 0;
    pointer-events: none;
    transform: translateY(30px) scale(0.97);
}

/* Модальное окно */
.schedule-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    justify-content: center;
    align-items: center;
    padding: 16px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.35s cubic-bezier(.4,0,.2,1);
}

.schedule-modal[style*="display: flex"] {
    opacity: 1;
    pointer-events: auto;
}

.modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    animation: fadeIn 0.4s ease;
}

.modal-content {
    background: white;
    border-radius: var(--border-radius);
    width: 100%;
    max-width: 500px;
    max-height: 85vh;
    overflow: hidden;
    box-shadow: var(--shadow-modal);
    position: relative;
    z-index: 1001;
    animation: modalSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 22px !important;
    box-shadow: 0 12px 40px rgba(44, 62, 80, 0.18);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 24px;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    color: white;
    position: relative;
    overflow: hidden;
}

.modal-header::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: shimmer 3s infinite;
}

.modal-title {
    flex: 1;
}

.modal-header h3 {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 8px;
}

.date-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    cursor: pointer;
    padding: 8px;
    border-radius: 12px;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin-left: 16px;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
}

.modal-body {
    padding: 24px;
    max-height: 60vh;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--gray-300) transparent;
}

.modal-body::-webkit-scrollbar {
    width: 6px;
}

.modal-body::-webkit-scrollbar-thumb {
    background: var(--gray-300);
    border-radius: 3px;
}

.day-schedule {
    margin-bottom: 24px;
}

.schedule-item {
    background: #fff;
    color: var(--dark-color);
    border-left: 4px solid var(--primary-color);
    border-radius: 18px;
    margin-bottom: 18px;
    box-shadow: 0 2px 12px 0 rgba(76,110,165,0.07);
    padding: 18px;
    transition: box-shadow 0.2s, background 0.2s;
    position: relative;
}

.schedule-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transform: translateX(-100%);
}

.schedule-item:hover::before {
    animation: shimmer 1.5s;
}

.schedule-item:hover {
    background: linear-gradient(135deg, #f7fafc 90%, #e2e8f0 100%);
    box-shadow: 0 8px 24px 0 rgba(76,110,165,0.13);
}

.schedule-item.absent {
    background: #fff5f5;
    border-left-color: var(--accent-color);
}

.schedule-time {
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 6px;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 8px;
}

.schedule-time::before {
    content: '🕒';
    font-size: 0.9em;
}

.schedule-item.absent .schedule-time {
    color: #ff6b6b;
}

.schedule-subject {
    font-weight: 700;
    margin-bottom: 8px;
    font-size: 1.05rem;
    color: var(--dark-color);
    line-height: 1.4;
}

.schedule-details {
    display: flex;
    justify-content: space-between;
    color: var(--gray-600);
    font-size: 0.9rem;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 8px;
}

.schedule-details span {
    display: flex;
    align-items: center;
    gap: 4px;
}

.schedule-details span::before {
    font-size: 0.9em;
}

.schedule-details span:first-child::before {
    content: '🏢';
}

.schedule-details span:last-child::before {
    content: '👤';
}

.attendance-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--gray-200);
    margin-top: 8px;
}

.attendance-toggle input {
    width: 22px;
    height: 22px;
    accent-color: var(--accent-color);
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.attendance-toggle input:checked {
    transform: scale(1.2);
    box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.2);
}

.attendance-toggle label {
    font-size: 0.9rem;
    color: var(--gray-600);
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    flex: 1;
}

.attendance-toggle input:checked + label {
    color: var(--accent-color);
    font-weight: 600;
}

.attendance-summary {
    background: linear-gradient(135deg, #f8fafc 80%, #e2e8f0 100%);
    border: 1.5px solid #e2e8f0;
    box-shadow: 0 2px 12px 0 rgba(76,110,165,0.07);
    padding: 20px;
    border-radius: var(--border-radius-sm);
    animation: fadeIn 0.6s ease;
    border: 1px solid var(--gray-200);
    border-radius: 18px !important;
}

.attendance-summary h4 {
    margin-bottom: 16px;
    color: var(--dark-color);
    font-size: 1.1rem;
    font-weight: 700;
    text-align: center;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 0.95rem;
    padding: 8px 0;
    border-bottom: 1px solid var(--gray-200);
}

.summary-item:last-child {
    border-bottom: none;
}

.summary-total {
    font-weight: 800;
    border-top: 2px solid var(--gray-300);
    padding-top: 12px;
    margin-top: 12px;
    color: var(--dark-color);
    font-size: 1rem;
}

/* Фон-подложка под кнопкой сохранить */
.modal-footer {
    padding: 0;
    border-top: none;
    text-align: center;
    position: static;
    background: #f8fafc;
    box-shadow: none;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    height: auto;
    margin-top: 24px;
}

.save-btn {
    margin: 0 auto;
    margin-top: 16px;
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    color: #fff;
    border: none;
    box-shadow: 0 2px 12px 0 rgba(76,110,165,0.10);
    border-radius: 18px !important;
    transition: background 0.3s, box-shadow 0.3s;
    padding: 16px 32px;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: 1rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow);
    min-width: 200px;
    justify-content: center;
    position: relative;
    overflow: hidden;
    border-radius: 18px !important;
}

.save-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
}

.save-btn:hover::before {
    left: 100%;
}

.save-btn:hover {
    background: linear-gradient(135deg, var(--primary-light), var(--primary-color));
    box-shadow: 0 6px 18px rgba(76,110,165,0.13);
}

.save-btn:active {
    transform: translateY(0);
}

.empty-schedule {
    text-align: center;
    padding: 40px 20px;
    color: var(--gray-500);
    font-style: italic;
    font-size: 1.1rem;
}

/* Улучшения интерфейса: */
.calendar-wrapper {
    background: linear-gradient(135deg, #f8fafc 80%, #e2e8f0 100%);
    border: 1.5px solid #e2e8f0;
    box-shadow: 0 8px 32px rgba(76,110,165,0.10);
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow);
    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.days {
    background: transparent;
}

.day {
    background: linear-gradient(135deg, #fff 80%, #f7fafc 100%);
    color: var(--dark-color);
    border: 1.5px solid #e2e8f0;
    box-shadow: 0 2px 12px 0 rgba(76,110,165,0.07);
    transition: background 0.4s cubic-bezier(.4,0,.2,1), color 0.4s, box-shadow 0.4s, border 0.4s;
    display: flex;
    flex-direction: column;
    animation: fadeIn 0.5s ease;
    border-radius: 18px !important;
    box-shadow: 0 2px 8px rgba(76,110,165,0.06);
}

.day:hover {
    background: linear-gradient(135deg, #f7fafc 90%, #e2e8f0 100%);
    box-shadow: 0 6px 24px 0 rgba(76,110,165,0.13);
}

.day.other-month {
    background: linear-gradient(135deg, #f7fafc 80%, #e2e8f0 100%);
    color: #bfc8e6;
    opacity: 0.7;
}

.day.absence-marked {
    background: linear-gradient(135deg, #fff5f5 80%, #ffe6e6 100%);
    border: 2px solid #ff8e8e;
}

.day-absence-count {
    background: linear-gradient(135deg, var(--accent-color), var(--accent-dark));
    color: #fff;
    border: 2px solid #fff;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

/* Модальное окно */
.schedule-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    justify-content: center;
    align-items: center;
    padding: 16px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.35s cubic-bezier(.4,0,.2,1);
}

.schedule-modal[style*="display: flex"] {
    opacity: 1;
    pointer-events: auto;
}

.modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    animation: fadeIn 0.4s ease;
}

.modal-content {
    background: white;
    border-radius: var(--border-radius);
    width: 100%;
    max-width: 500px;
    max-height: 85vh;
    overflow: hidden;
    box-shadow: var(--shadow-modal);
    position: relative;
    z-index: 1001;
    animation: modalSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 22px !important;
    box-shadow: 0 12px 40px rgba(44, 62, 80, 0.18);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 24px;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    color: white;
    position: relative;
    overflow: hidden;
}

.modal-header::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: shimmer 3s infinite;
}

.modal-title {
    flex: 1;
}

.modal-header h3 {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 8px;
}

.date-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    cursor: pointer;
    padding: 8px;
    border-radius: 12px;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin-left: 16px;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
}

.modal-body {
    padding: 24px;
    max-height: 60vh;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--gray-300) transparent;
}

.modal-body::-webkit-scrollbar {
    width: 6px;
}

.modal-body::-webkit-scrollbar-thumb {
    background: var(--gray-300);
    border-radius: 3px;
}

.day-schedule {
    margin-bottom: 24px;
}

.schedule-item {
    background: #fff;
    color: var(--dark-color);
    border-left: 4px solid var(--primary-color);
    border-radius: 18px;
    margin-bottom: 18px;
    box-shadow: 0 2px 12px 0 rgba(76,110,165,0.07);
    padding: 18px;
    transition: box-shadow 0.2s, background 0.2s;
    position: relative;
}

.schedule-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transform: translateX(-100%);
}

.schedule-item:hover::before {
    animation: shimmer 1.5s;
}

.schedule-item:hover {
    background: linear-gradient(135deg, #f7fafc 90%, #e2e8f0 100%);
    box-shadow: 0 8px 24px 0 rgba(76,110,165,0.13);
}

.schedule-item.absent {
    background: #fff5f5;
    border-left-color: var(--accent-color);
}

.schedule-time {
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 6px;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 8px;
}

.schedule-time::before {
    content: '🕒';
    font-size: 0.9em;
}

.schedule-item.absent .schedule-time {
    color: #ff6b6b;
}

.schedule-subject {
    font-weight: 700;
    margin-bottom: 8px;
    font-size: 1.05rem;
    color: var(--dark-color);
    line-height: 1.4;
}

.schedule-details {
    display: flex;
    justify-content: space-between;
    color: var(--gray-600);
    font-size: 0.9rem;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 8px;
}

.schedule-details span {
    display: flex;
    align-items: center;
    gap: 4px;
}

.schedule-details span::before {
    font-size: 0.9em;
}

.schedule-details span:first-child::before {
    content: '🏢';
}

.schedule-details span:last-child::before {
    content: '👤';
}

.attendance-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--gray-200);
    margin-top: 8px;
}

.attendance-toggle input {
    width: 22px;
    height: 22px;
    accent-color: var(--accent-color);
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.attendance-toggle input:checked {
    transform: scale(1.2);
    box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.2);
}

.attendance-toggle label {
    font-size: 0.9rem;
    color: var(--gray-600);
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    flex: 1;
}

.attendance-toggle input:checked + label {
    color: var(--accent-color);
    font-weight: 600;
}

.attendance-summary {
    background: linear-gradient(135deg, #f8fafc 80%, #e2e8f0 100%);
    border: 1.5px solid #e2e8f0;
    box-shadow: 0 2px 12px 0 rgba(76,110,165,0.07);
    padding: 20px;
    border-radius: var(--border-radius-sm);
    animation: fadeIn 0.6s ease;
    border: 1px solid var(--gray-200);
    border-radius: 18px !important;
}

.attendance-summary h4 {
    margin-bottom: 16px;
    color: var(--dark-color);
    font-size: 1.1rem;
    font-weight: 700;
    text-align: center;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 0.95rem;
    padding: 8px 0;
    border-bottom: 1px solid var(--gray-200);
}

.summary-item:last-child {
    border-bottom: none;
}

.summary-total {
    font-weight: 800;
    border-top: 2px solid var(--gray-300);
    padding-top: 12px;
    margin-top: 12px;
    color: var(--dark-color);
    font-size: 1rem;
}

/* Фон-подложка под кнопкой сохранить */
.modal-footer {
    padding: 0;
    border-top: none;
    text-align: center;
    position: static;
    background: #f8fafc;
    box-shadow: none;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    height: auto;
    margin-top: 24px;
}

.save-btn {
    margin: 0 auto;
    margin-top: 16px;
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    color: #fff;
    border: none;
    box-shadow: 0 2px 12px 0 rgba(76,110,165,0.10);
    border-radius: 18px !important;
    transition: background 0.3s, box-shadow 0.3s;
    padding: 16px 32px;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: 1rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow);
    min-width: 200px;
    justify-content: center;
    position: relative;
    overflow: hidden;
    border-radius: 18px !important;
}

.save-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
}

.save-btn:hover::before {
    left: 100%;
}

.save-btn:hover {
    background: linear-gradient(135deg, var(--primary-light), var(--primary-color));
    box-shadow: 0 6px 18px rgba(76,110,165,0.13);
}

.save-btn:active {
    transform: translateY(0);
}

.empty-schedule {
    text-align: center;
    padding: 40px 20px;
    color: var(--gray-500);
    font-style: italic;
    font-size: 1.1rem;
}

/* --- Мобильная оптимизация модального окна и кнопки --- */
@media (max-width: 600px) {
    .modal-content {
        max-width: 100vw;
        width: 100vw;
        border-radius: 0 !important;
        min-height: 100vh;
        max-height: 100vh;
        display: flex;
        flex-direction: column;
    }
    .modal-header,
    .modal-body {
        padding: 12px 8px;
    }
    .modal-body {
        max-height: none;
        flex: 1 1 auto;
        overflow-y: auto;
    }
    .modal-footer {
        margin-top: 0;
        padding: 0;
        height: auto;
        position: sticky;
        bottom: 0;
        left: 0;
        right: 0;
        background: #f8fafc;
        z-index: 10;
        box-shadow: 0 -2px 12px 0 rgba(76,110,165,0.07);
    }
    .save-btn {
        padding: 14px 10px;
        font-size: 1rem;
        min-width: 90vw;
        max-width: 98vw;
        margin: 10px auto 10px auto;
        border-radius: 14px !important;
        box-sizing: border-box;
    }
    .attendance-summary {
        padding: 10px 6px;
    }
    .schedule-item {
        padding: 10px 6px;
        font-size: 0.97rem;
    }
    .modal-header h3 {
        font-size: 1.05rem;
    }
    .date-badge {
        font-size: 0.8rem;
        padding: 3px 8px;
    }
}
