const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const filesToUpdate = [
    'app.html', 'create-event.html', 'profile.html', 'edinomyshlenniki.html', 
    'chat.html', 'chats.html', 'dm.html', 'icebreakers.html', 'faq.html', 'moderator.html'
];

const standardSidebar = `
<!-- Боковое меню -->
<div class="offcanvas offcanvas-start" tabindex="-1" id="sidebarMenu">
    <div class="offcanvas-header border-0">
        <h5 class="offcanvas-title fw-bold"><img src="/img/logo.png" alt="Find&Go" width="36" height="36" class="d-inline-block align-top me-2" style="border-radius: 4px;">Find&Go</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
    </div>
    <div class="offcanvas-body">
        <ul class="nav flex-column mb-auto">
            <li class="nav-item"><a class="nav-link" href="/app.html"><i class="bi bi-house-door"></i> Главная</a></li>
            <li class="nav-item"><a class="nav-link" href="/create-event.html"><i class="bi bi-plus-circle"></i> Создать поход</a></li>
            <li class="nav-item"><a class="nav-link" href="/profile.html"><i class="bi bi-person"></i> Мой профиль</a></li>
            <li class="nav-item"><a class="nav-link" href="/faq.html"><i class="bi bi-question-circle"></i> Вопросы и ответы</a></li>
            <li class="nav-item"><a class="nav-link" href="/chats.html"><i class="bi bi-chat-dots"></i> Чаты походов</a></li>
            <li class="nav-item"><a class="nav-link" href="/dm.html"><i class="bi bi-person-heart"></i> Личные сообщения</a></li>
            <li class="nav-item"><a class="nav-link" href="/icebreakers.html"><i class="bi bi-snow2"></i> Темы для общения</a></li>
            <li class="nav-item"><a class="nav-link fw-semibold" href="/edinomyshlenniki.html" style="color: #8b5cf6;"><i class="bi bi-people-fill"></i> Единомышленники <span class="badge ms-1" style="background: linear-gradient(135deg,#667eea,#764ba2); font-size:0.65rem;">NEW</span></a></li>
            <li class="nav-item" id="modPanelNavItem" style="display: none;"><a class="nav-link text-danger fw-bold" href="/moderator.html"><i class="bi bi-shield-lock-fill"></i> Панель модератора</a></li>
        </ul>
        <hr>
        <div class="theme-switch p-2 rounded-3 bg-secondary-subtle mb-3 d-flex justify-content-between align-items-center">
            <span class="fw-medium"><i class="bi bi-moon-stars text-primary me-2"></i> Тёмная тема</span>
            <div class="form-check form-switch m-0">
                <input class="form-check-input" type="checkbox" id="darkModeSwitch">
            </div>
        </div>
        <div class="d-flex gap-2">
            <button class="btn btn-outline-primary flex-fill btn-sm" onclick="if(typeof switchLanguage === 'function') switchLanguage('ru')">Русский</button>
            <button class="btn btn-outline-primary flex-fill btn-sm" onclick="if(typeof switchLanguage === 'function') switchLanguage('ky')">Кыргызча</button>
        </div>
    </div>
</div>
`;

filesToUpdate.forEach(file => {
    let filePath = path.join(publicDir, file);
    if (!fs.existsSync(filePath)) {
        if (file === 'app.html' || file === 'server.js') {
            filePath = path.join(__dirname, file); // fallback if it's in root
        }
    }
    
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 1. Remove inline theme switch from headers
        // Using a regex to match the theme-switch div and its contents
        content = content.replace(/<div class="theme-switch[^>]*>[\s\S]*?<\/div>\s*<\/div>/g, ''); 
        // Or simpler regex for specific occurrences:
        content = content.replace(/<div class="theme-switch[^>]*>[\s\S]*?<\/div>/g, (match) => {
            if (match.includes('darkModeSwitchProfile') || match.includes('Тёмная тема')) {
                // If it doesn't have offcanvas in it...
                if (!match.includes('offcanvas')) return ''; // delete
            }
            return match;
        });

        // Some files might just have a list item:
        content = content.replace(/<li class="nav-item">\s*<div class="theme-switch">[\s\S]*?<\/div>\s*<\/li>/g, '');
        content = content.replace(/<div class="theme-switch me-2">[\s\S]*?<\/div>\s*<\/div>/g, ''); // specific to profile
        
        // 2. Replace or Insert Sidebar
        if (content.includes('<div class="offcanvas offcanvas-start"')) {
            // Replace existing sidebar
            // Find start and end of sidebarMenu
            const startIdx = content.indexOf('<div class="offcanvas offcanvas-start"');
            let endIdx = content.indexOf('<!-- Навбар -->', startIdx);
            if (endIdx === -1) endIdx = content.indexOf('<nav class="navbar', startIdx);
            if (endIdx !== -1 && startIdx !== -1) {
                const before = content.substring(0, startIdx);
                const after = content.substring(endIdx);
                content = before + standardSidebar + "\n" + after;
            }
        } else {
            // Insert right after <body>
            content = content.replace('<body>', '<body>\n' + standardSidebar);
        }
        
        // 3. Ensure burger button exists in navbar
        if (!content.includes('data-bs-target="#sidebarMenu"') && content.includes('<nav class="navbar')) {
            content = content.replace(/<div class="container[^>]*>/, (match) => {
                return match + '\n        <button class="btn-menu me-2" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu" style="border:none;background:none;font-size:1.5rem;"><i class="bi bi-list"></i></button>';
            });
        }
        
        // 4. Change specific theme toggle IDs if they were hardcoded
        content = content.replace(/darkModeSwitchProfile/g, 'darkModeSwitch');
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`File not found: ${file}`);
    }
});
