(function () {
    const html = document.documentElement;
    const toggleBtn = document.getElementById('toggleDark');

    if (!toggleBtn) return;

    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
        html.classList.add('dark');
    }

    toggleBtn.innerText = html.classList.contains('dark')
        ? '☀️ Light Mode'
        : '🌙 Dark Mode';

    toggleBtn.addEventListener('click', () => {
        html.classList.toggle('dark');

        const isDark = html.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        toggleBtn.innerText = isDark
            ? '☀️ Light Mode'
            : '🌙 Dark Mode';
    });
})();
