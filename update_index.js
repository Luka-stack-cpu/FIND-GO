const fs = require('fs');

const oldHtml = fs.readFileSync('public/index.html', 'utf8');

const scriptStart = oldHtml.indexOf('<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>');
if (scriptStart === -1) {
    console.error('Could not find script tag');
    process.exit(1);
}

const scripts = oldHtml.substring(scriptStart);

const newHtml = `<!DOCTYPE html>
<html lang="ru" data-bs-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>Find&Go – Найди компанию в Бишкеке</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <link rel="stylesheet" type="text/css" href="https://npmcdn.com/flatpickr/dist/themes/airbnb.css">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧭</text></svg>">
    <style>
        :root {
            --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --hero-gradient: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
        }
        [data-bs-theme="dark"] {
            --hero-gradient: linear-gradient(135deg, #2a2a35 0%, #1a1a24 100%);
        }

        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: var(--bs-body-bg); 
            transition: background-color 0.3s ease; 
            overflow-x: hidden; 
            color: var(--bs-body-color);
        }

        /* Animations */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }

        /* Navbar */
        .navbar { 
            background: rgba(255, 255, 255, 0.85); 
            backdrop-filter: blur(15px); 
            padding: 16px 0; 
            transition: all 0.3s ease;
            border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        [data-bs-theme="dark"] .navbar { 
            background: rgba(33, 37, 41, 0.85); 
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .navbar-brand { 
            font-weight: 800; 
            font-size: 1.5rem; 
            background: var(--primary-gradient); 
            -webkit-background-clip: text; 
            background-clip: text; 
            color: transparent; 
        }
        .btn-menu { background: none; border: none; font-size: 1.8rem; color: #667eea; }
        .btn-logout { border: none; background: rgba(220, 53, 69, 0.1); border-radius: 50px; padding: 6px 20px; color: #dc2626; font-weight: 500; transition: 0.3s; }
        .btn-logout:hover { background: #dc2626; color: white; }

        /* Search */
        .search-container { max-width: 350px; width: 100%; }
        .search-wrapper { position: relative; }
        .search-input { 
            background: var(--bs-secondary-bg); 
            border: 1px solid transparent; 
            border-radius: 50px; 
            padding: 10px 16px 10px 42px; 
            width: 100%; 
            transition: 0.3s;
        }
        .search-input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1); }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--bs-secondary-color); }

        /* Hero Section */
        .hero { 
            background: var(--hero-gradient); 
            margin: 100px 20px 40px; 
            border-radius: 32px; 
            padding: 80px 24px; 
            position: relative; 
            overflow: hidden; 
            text-align: center;
            animation: fadeUp 0.8s ease-out;
            box-shadow: 0 20px 40px rgba(0,0,0,0.05);
        }
        [data-bs-theme="dark"] .hero { box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
        .hero::before { 
            content: ''; 
            position: absolute; 
            top: -50%; left: -50%; width: 200%; height: 200%; 
            background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%); 
            pointer-events: none; 
            animation: float 15s infinite linear;
        }
        .hero-content { position: relative; z-index: 2; }
        .hero h1 { font-size: 3.5rem; font-weight: 900; margin-bottom: 20px; color: #2d3748; letter-spacing: -1px; }
        [data-bs-theme="dark"] .hero h1 { color: #f7fafc; }
        .hero p { font-size: 1.25rem; color: #4a5568; max-width: 600px; margin: 0 auto 32px; line-height: 1.6; }
        [data-bs-theme="dark"] .hero p { color: #a0aec0; }
        .hero .btn-primary { 
            background: var(--primary-gradient); 
            border: none; 
            border-radius: 50px; 
            padding: 14px 36px; 
            font-weight: 600; 
            font-size: 1.1rem;
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
        }
        .hero .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 25px rgba(102, 126, 234, 0.4); }
        .hero .btn-outline { 
            background: rgba(255,255,255,0.5); 
            border: 2px solid transparent; 
            color: #4a5568;
            border-radius: 50px; 
            padding: 12px 32px; 
            font-weight: 600;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }
        [data-bs-theme="dark"] .hero .btn-outline { background: rgba(0,0,0,0.2); color: #fff; }
        .hero .btn-outline:hover { background: white; color: #667eea; border-color: white; }

        /* How it works */
        .info-section { padding: 80px 20px; }
        .section-title-main { font-size: 2.2rem; font-weight: 800; text-align: center; margin-bottom: 40px; }
        .step-card { 
            background: var(--bs-card-bg); 
            border-radius: 24px; 
            padding: 32px 24px; 
            height: 100%; 
            border: 1px solid var(--bs-border-color); 
            transition: all 0.4s ease; 
            text-align: center;
        }
        .step-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); border-color: #667eea; }
        .step-icon { 
            width: 80px; height: 80px; 
            background: rgba(102, 126, 234, 0.1); 
            border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; 
            margin: 0 auto 24px; 
            font-size: 2.5rem; color: #667eea; 
            transition: all 0.3s ease;
        }
        .step-card:hover .step-icon { background: var(--primary-gradient); color: white; transform: scale(1.1); }
        .step-card h5 { font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; }
        .step-card p { color: var(--bs-secondary-color); font-size: 0.95rem; line-height: 1.5; margin: 0; }

        /* Categories */
        .category-container { padding: 40px 20px; background: var(--bs-tertiary-bg); border-radius: 32px; margin: 0 20px; }
        .category-filters { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-bottom: 30px; }
        .filter-btn { 
            background: var(--bs-card-bg); 
            border: 1px solid var(--bs-border-color); 
            border-radius: 50px; 
            padding: 10px 24px; 
            font-weight: 600; 
            transition: all 0.3s ease; 
            color: var(--bs-body-color); 
            box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }
        .filter-btn.active { background: var(--primary-gradient); color: white; border-color: transparent; box-shadow: 0 8px 15px rgba(102, 126, 234, 0.3); }
        .filter-btn:hover:not(.active) { transform: translateY(-2px); border-color: #667eea; }

        /* Places Scroll */
        .section-header { display: flex; justify-content: space-between; align-items: flex-end; padding: 0 24px; margin: 60px 0 24px; }
        .section-title { font-size: 1.8rem; font-weight: 800; display: flex; align-items: center; gap: 12px; }
        .places-scroll { display: flex; overflow-x: auto; gap: 20px; padding: 8px 24px 32px; scroll-behavior: smooth; }
        .places-scroll::-webkit-scrollbar { height: 6px; }
        .places-scroll::-webkit-scrollbar-track { background: var(--bs-secondary-bg); border-radius: 10px; margin: 0 24px; }
        .places-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .places-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        .place-card { 
            flex: 0 0 300px; 
            background: var(--bs-card-bg); 
            border-radius: 24px; 
            overflow: hidden; 
            cursor: pointer; 
            box-shadow: 0 10px 20px rgba(0,0,0,0.05); 
            border: 1px solid var(--bs-border-color); 
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
        }
        .place-card:hover { transform: translateY(-12px); box-shadow: 0 20px 40px rgba(0,0,0,0.12); border-color: rgba(102, 126, 234, 0.5); }
        .place-card .card-body { padding: 20px; }
        .place-tag { 
            display: inline-block; 
            background: rgba(102, 126, 234, 0.1); 
            color: #667eea;
            padding: 6px 14px; 
            border-radius: 20px; 
            font-size: 0.75rem; 
            font-weight: 700; 
            margin-bottom: 12px; 
        }
        .place-card h4 { font-size: 1.25rem; font-weight: 800; margin-bottom: 8px; line-height: 1.3; }
        .place-card p { font-size: 0.9rem; color: var(--bs-secondary-color); line-height: 1.5; margin: 0; }

        /* Sliders */
        .place-slider { position: relative; width: 100%; height: 200px; overflow: hidden; }
        .place-slider-track { display: flex; height: 100%; transition: transform 0.6s cubic-bezier(.4,0,.2,1); will-change: transform; }
        .place-slider-slide { flex: 0 0 100%; height: 100%; }
        .place-slider-slide img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
        .place-card:hover .place-slider-slide img { transform: scale(1.05); }
        .place-slider-dots { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; }
        .place-slider-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.4); transition: all 0.3s; border: none; padding: 0; }
        .place-slider-dot.active { background: white; transform: scale(1.2); }

        /* Events Grid */
        .events-container { padding: 40px 24px; background: var(--bs-tertiary-bg); border-radius: 32px; margin: 0 20px 60px; }
        .events-grid { display: grid; gap: 16px; }
        @media (min-width: 768px) { .events-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .events-grid { grid-template-columns: repeat(3, 1fr); } }
        
        .event-card { 
            background: var(--bs-card-bg); 
            border-radius: 20px; 
            padding: 20px; 
            border: 1px solid var(--bs-border-color); 
            transition: all 0.3s ease; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.02);
            display: flex; flex-direction: column; justify-content: space-between;
        }
        .event-card:hover { border-color: #667eea; transform: translateY(-5px); box-shadow: 0 12px 25px rgba(0,0,0,0.08); }
        .event-title { font-weight: 800; font-size: 1.15rem; margin-bottom: 8px; }
        .event-meta { font-size: 0.9rem; color: var(--bs-secondary-color); display: flex; gap: 12px; margin-bottom: 16px; }
        .btn-join { background: var(--primary-gradient); border: none; border-radius: 50px; padding: 10px 24px; color: white; font-weight: 600; width: 100%; transition: 0.3s; }
        .btn-join:hover { opacity: 0.9; transform: scale(1.02); }

        /* Offcanvas */
        .offcanvas-header { background: var(--primary-gradient); color: white; }
        .offcanvas-body .nav-link { padding: 14px 16px; color: var(--bs-body-color); font-weight: 500; border-radius: 12px; transition: 0.2s; margin-bottom: 4px; }
        .offcanvas-body .nav-link:hover { background: var(--bs-secondary-bg); padding-left: 20px; color: #667eea; }
        .offcanvas-body .nav-link i { margin-right: 14px; width: 24px; font-size: 1.2rem; }

        /* Modals & Misc */
        .modal-content { background-color: var(--bs-modal-bg); border-radius: 24px; border: none; overflow: hidden; }
        .modal-header { border-bottom: 1px solid var(--bs-border-color); }
        .modal-two-cards { display: flex; gap: 24px; flex-wrap: wrap; }
        .modal-card { flex: 1; background: var(--bs-card-bg); border-radius: 20px; padding: 24px; border: 1px solid var(--bs-border-color); }
        
        .user-item-compact { display: flex; align-items: center; justify-content: space-between; padding: 12px; margin-bottom: 12px; background: var(--bs-secondary-bg); border-radius: 16px; transition: all 0.2s ease; cursor: pointer; }
        .user-item-compact:hover { background: var(--bs-border-color); transform: translateX(5px); }
        .invite-btn-small { background: white; border: 1px solid #667eea; border-radius: 50px; padding: 6px 16px; color: #667eea; font-size: 0.8rem; font-weight: 600; transition: 0.2s; }
        .invite-btn-small:hover { background: var(--primary-gradient); border-color: transparent; color: white; }
        [data-bs-theme="dark"] .invite-btn-small { background: transparent; }

        /* Calendar */
        .calendar-container { background: var(--bs-card-bg); border-radius: 24px; padding: 24px; border: 1px solid var(--bs-border-color); margin: 0 24px 40px; }

        @media (max-width: 768px) { 
            .hero { padding: 60px 20px; margin: 80px 12px 30px; }
            .hero h1 { font-size: 2.2rem; }
            .hero p { font-size: 1rem; }
            .section-header { padding: 0 16px; flex-direction: column; align-items: flex-start; gap: 8px; }
            .places-scroll { padding: 8px 16px 24px; }
            .category-container, .events-container { margin: 0 12px; padding: 30px 16px; }
            .search-container { display: none; }
        }
    </style>
</head>
<body>

<!-- Боковое меню -->
<div class="offcanvas offcanvas-start" tabindex="-1" id="sidebarMenu">
    <div class="offcanvas-header border-0">
        <h5 class="offcanvas-title fw-bold"><i class="bi bi-compass"></i> Find&Go</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
    </div>
    <div class="offcanvas-body">
        <ul class="nav flex-column mb-auto">
            <li class="nav-item"><a class="nav-link" href="#heroSection" data-bs-dismiss="offcanvas"><i class="bi bi-house-door"></i> Главная</a></li>
            <li class="nav-item"><a class="nav-link" href="#howItWorksSection" data-bs-dismiss="offcanvas"><i class="bi bi-info-circle"></i> Как это работает</a></li>
            <li class="nav-item"><a class="nav-link" href="/create-event.html"><i class="bi bi-plus-circle"></i> Создать поход</a></li>
            <li class="nav-item"><a class="nav-link" href="/profile.html"><i class="bi bi-person"></i> Мой профиль</a></li>
            <li class="nav-item"><a class="nav-link" href="/faq.html"><i class="bi bi-question-circle"></i> Вопросы и ответы</a></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="loadInvitesModal(); return false;" data-bs-dismiss="offcanvas"><i class="bi bi-envelope-paper"></i> Приглашения <span id="sidebarInvitesBadge" class="badge bg-danger ms-1" style="display:none;"></span></a></li>
            <li class="nav-item"><a class="nav-link" href="/chats.html"><i class="bi bi-chat-dots"></i> Мои чаты</a></li>
            <li class="nav-item"><a class="nav-link" href="/icebreakers.html"><i class="bi bi-snow2"></i> Темы для общения</a></li>
        </ul>
        <hr>
        <div class="theme-switch p-2 rounded-3 bg-secondary-subtle mb-3 d-flex justify-content-between align-items-center">
            <span class="fw-medium"><i class="bi bi-moon-stars text-primary me-2"></i> Тёмная тема</span>
            <div class="form-check form-switch m-0">
                <input class="form-check-input" type="checkbox" id="darkModeSwitch">
            </div>
        </div>
        <div class="d-flex gap-2">
            <button class="btn btn-outline-primary flex-fill btn-sm" onclick="switchLanguage('ru')">Русский</button>
            <button class="btn btn-outline-primary flex-fill btn-sm" onclick="switchLanguage('ky')">Кыргызча</button>
        </div>
    </div>
</div>

<!-- Навбар -->
<nav class="navbar navbar-expand-lg fixed-top shadow-sm">
    <div class="container-fluid px-3 px-md-4">
        <button class="btn-menu me-2" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu">
            <i class="bi bi-list"></i>
        </button>
        <a class="navbar-brand" href="/"><i class="bi bi-compass"></i> Find&Go</a>
        
        <div class="search-container ms-auto me-4">
            <div class="search-wrapper">
                <i class="bi bi-search search-icon"></i>
                <input type="text" id="searchInput" class="search-input" placeholder="Найти интересное место...">
            </div>
        </div>

        <div class="d-flex align-items-center gap-1 gap-md-3">
            <button id="notificationsBtn" class="btn btn-link position-relative text-decoration-none" style="color: var(--bs-body-color);">
                <i class="bi bi-bell fs-5"></i>
                <span id="notificationsBadge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm" style="display: none;font-size:0.65rem;">0</span>
            </button>
            
            <button class="btn btn-link position-relative text-decoration-none d-none d-sm-block" onclick="loadInvitesModal()" style="color: var(--bs-body-color);">
                <i class="bi bi-envelope-paper fs-5"></i>
                <span id="invitesBadge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm" style="display: none;font-size:0.65rem;">0</span>
            </button>

            <a href="/create-event.html" class="btn btn-primary btn-sm rounded-pill px-3 d-none d-md-block shadow-sm">
                <i class="bi bi-plus-lg"></i> Создать
            </a>
            
            <div id="userProfileLink" class="ms-2 ms-md-0 d-flex align-items-center gap-2" style="cursor: pointer; padding: 4px; border-radius: 50px; background: var(--bs-secondary-bg); transition: 0.2s;">
                <img id="headerAvatar" src="https://api.dicebear.com/7.x/avataaars/svg?seed=default" width="36" height="36" class="rounded-circle shadow-sm" style="object-fit: cover;">
                <span id="userName" class="fw-bold pe-2 d-none d-sm-block" style="font-size: 0.9rem;"></span>
            </div>
            
            <button id="logoutBtn" class="btn btn-logout ms-2 d-none d-lg-block">Выйти</button>
        </div>
    </div>
</nav>

<!-- Hero Section -->
<div class="hero" id="heroSection">
    <div class="hero-content">
        <h1 id="heroTitle">Найди свою идеальную компанию! 🇰🇬</h1>
        <p id="heroSubtitle">Не с кем пойти в кафе, погулять в парке или в горы? Создавай поход, находи единомышленников и открывай Бишкек заново!</p>
        <div class="d-flex justify-content-center gap-3 flex-wrap mt-4">
            <button class="btn btn-primary" onclick="document.getElementById('categoryFilters').scrollIntoView({behavior:'smooth'})">Выбрать место</button>
            <a href="/create-event.html" class="btn btn-outline"><span id="createBtnText">Собрать компанию</span></a>
        </div>
    </div>
</div>

<div id="welcomeBanner" class="container" style="display: none;">
    <div class="alert alert-primary border-0 shadow-sm text-center position-relative rounded-4 p-4 mx-3 mx-md-5">
        <button type="button" class="btn-close position-absolute top-0 end-0 m-3" onclick="closeWelcomeBanner()"></button>
        <div class="fs-1 mb-2">👋</div>
        <h4 class="fw-bold">Добро пожаловать в Find&Go!</h4>
        <p class="text-muted mb-4">Твой первый шаг к новым знакомствам начинается здесь.</p>
        <a href="/create-event.html" class="btn btn-primary rounded-pill px-4">Создать первый поход</a>
    </div>
</div>

<!-- Как это работает -->
<div class="container" id="howItWorksSection">
    <div class="info-section">
        <h2 class="section-title-main" id="howItWorksTitle">Всё очень просто</h2>
        <div class="row g-4 px-2 px-md-5">
            <div class="col-md-4">
                <div class="step-card">
                    <div class="step-icon"><i class="bi bi-geo-alt"></i></div>
                    <h5 id="step1Title">Выбери классное место</h5>
                    <p>Листай нашу подборку парков, кафе и развлечений в Бишкеке.</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="step-card">
                    <div class="step-icon"><i class="bi bi-people"></i></div>
                    <h5 id="step2Title">Создай или присоединись</h5>
                    <p>Организуй свой поход или откликнись на приглашение других.</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="step-card">
                    <div class="step-icon"><i class="bi bi-chat-heart"></i></div>
                    <h5 id="step3Title">Встречайся и общайся</h5>
                    <p>Договаривайтесь в удобном чате и наслаждайтесь общением!</p>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Категории и Фильтры -->
<div class="category-container shadow-sm" id="categoryCards">
    <h3 class="text-center fw-bold mb-4">Куда пойдем сегодня?</h3>
    <div class="category-filters" id="categoryFilters">
        <button class="filter-btn active" data-category="all">Всё подряд</button>
        <button class="filter-btn" data-category="парк">🌳 Парки</button>
        <button class="filter-btn" data-category="природа">⛰️ Природа</button>
        <button class="filter-btn" data-category="кафе">☕ Кафе и Рестораны</button>
        <button class="filter-btn" data-category="паб">🍺 Пабы</button>
        <button class="filter-btn" data-category="трц">🛍️ ТРЦ</button>
        <button class="filter-btn" data-category="отель">🏨 Отели</button>
    </div>
</div>

<!-- Скролл мест -->
<div class="container-fluid px-0" id="placesGrid">
    <div class="section-header">
        <div class="section-title"><i class="bi bi-star text-warning"></i> Популярные места</div>
        <div class="text-muted small fw-medium bg-secondary-subtle px-3 py-1 rounded-pill">листай вправо <i class="bi bi-arrow-right"></i></div>
    </div>
    <div class="places-scroll" id="placesScroll"></div>
</div>

<!-- Активные походы и календарь -->
<div class="events-container shadow-sm mt-5">
    <div class="row">
        <div class="col-lg-8">
            <h3 class="fw-bold mb-4 d-flex align-items-center gap-2"><i class="bi bi-activity text-success"></i> Сейчас ищут компанию</h3>
            <div id="eventsList" class="events-grid"></div>
        </div>
        <div class="col-lg-4 mt-5 mt-lg-0">
            <div class="calendar-container shadow-sm bg-body m-0">
                <h5 class="fw-bold mb-3 d-flex align-items-center gap-2"><i class="bi bi-calendar-check text-primary"></i> Фильтр по дате</h5>
                <p class="text-muted small mb-3">Выберите день, чтобы увидеть запланированные походы</p>
                <input type="text" id="inlineCalendar" style="display: none;">
                <button class="btn btn-sm btn-outline-danger w-100 mt-3 rounded-pill" id="clearDateFilterBtn" style="display: none;">
                    <i class="bi bi-x"></i> Сбросить дату
                </button>
            </div>
        </div>
    </div>
</div>

<!-- CTA -->
<div class="container mb-5">
    <div class="hero" style="margin: 0; padding: 60px 20px; background: var(--primary-gradient);">
        <h2 class="text-white fw-bold mb-3">Готов к новым эмоциям?</h2>
        <p class="text-white-50 mb-4 fs-5">Сотни людей в Бишкеке уже находят друзей через Find&Go.</p>
        <a href="/create-event.html" class="btn btn-light btn-lg rounded-pill px-5 fw-bold text-primary shadow">Создать свой поход</a>
    </div>
</div>

<!-- Модальные окна (оставлены без изменений для JS) -->
<div class="modal fade" id="placeDetailTwoColumnsModal" tabindex="-1"><div class="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered"><div class="modal-content"><div class="modal-header border-0 pb-0"><h4 class="modal-title fw-bold px-2 pt-2" id="modalPlaceTitle">Место</h4><button type="button" class="btn-close bg-secondary-subtle rounded-circle p-2 me-2" data-bs-dismiss="modal"></button></div><div class="modal-body p-4"><div class="modal-two-cards" id="modalTwoCardsContainer"><div class="modal-card border-0 shadow-sm" id="modalLeftCard"></div><div class="modal-card border-0 shadow-sm" id="modalRightCard"></div></div></div></div></div></div>
<div class="modal fade" id="userProfileModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header bg-primary text-white border-0"><h5 class="modal-title"><i class="bi bi-person-circle"></i> Профиль</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body text-center p-4" id="userProfileModalBody"></div></div></div></div>
<div class="modal fade" id="notificationsModal" tabindex="-1"><div class="modal-dialog modal-dialog-scrollable modal-dialog-centered"><div class="modal-content"><div class="modal-header bg-primary text-white border-0"><h5 class="modal-title"><i class="bi bi-bell-fill"></i> Уведомления</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body p-0" id="notificationsModalBody"></div></div></div></div>
<div class="modal fade" id="invitesModal" tabindex="-1"><div class="modal-dialog modal-dialog-scrollable modal-dialog-centered"><div class="modal-content"><div class="modal-header bg-primary text-white border-0"><h5 class="modal-title"><i class="bi bi-envelope-paper-fill"></i> Приглашения</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body p-0" id="invitesModalBody"></div></div></div></div>
<div class="modal fade" id="reviewsModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header bg-primary text-white border-0"><h5 class="modal-title"><i class="bi bi-star-fill"></i> Оставить отзывы</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body p-4" id="reviewsModalBody"></div></div></div></div>

<div id="onboardingOverlay" class="onboarding-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: none; align-items: center; justify-content: center;">
    <div class="onboarding-card bg-body rounded-4 p-4 text-center mx-3" id="onboardingCard" style="max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);"></div>
</div>

<div id="faqSection" style="display: none;"></div>
<button id="toggleFaqBtn" style="display:none;"></button>

<div id="toastContainer" class="position-fixed bottom-0 end-0 p-3" style="z-index: 1100;"></div>

`;

fs.writeFileSync('public/index.html', newHtml + scripts);
console.log('Update successful!');
