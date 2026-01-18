(function () {
    if (window.__themeInitialized) return;
    window.__themeInitialized = true;

    const initTheme = () => {
        const html = document.documentElement;
        const toggleBtn = document.getElementById('toggleDark');

        if (!toggleBtn) return;

        // Apple-style Icons (Lucide-based, inline for performance)
        // Sun: Thin stroke, detached rays
        const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41-1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
        
        // Moon: Thin stroke, clean crescent
        const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

        const updateUI = (isDark) => {
            toggleBtn.innerHTML = isDark ? sunIcon : moonIcon;
            toggleBtn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
        };

        const savedTheme = localStorage.getItem('theme');

        if (savedTheme === 'dark') {
            html.classList.add('dark');
        }

        updateUI(html.classList.contains('dark'));

        toggleBtn.addEventListener('click', () => {
            html.classList.toggle('dark');
            const isDark = html.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateUI(isDark);
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }
})();
