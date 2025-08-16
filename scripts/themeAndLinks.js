// --- Dark/Light mode with persistence ---
(function initTheme() {
    const root = document.documentElement;
    const saved = localStorage.getItem('theme');
    const preferDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : preferDark;
    root.classList.toggle('dark', isDark);
    updateToggle(isDark);
    updateLogo(isDark);
})();

document.getElementById('toggleTheme').addEventListener('click', () => {
    const root = document.documentElement;
    const nowDark = !root.classList.contains('dark');
    root.classList.toggle('dark', nowDark);
    localStorage.setItem('theme', nowDark ? 'dark' : 'light');
    updateToggle(nowDark);
    updateLogo(nowDark);
});

function updateToggle(dark) {
    document.getElementById('iconSun').style.display = dark ? 'none' : '';
    document.getElementById('iconMoon').style.display = dark ? '' : 'none';
    document.getElementById('themeLabel').textContent = dark ? 'Sombre' : 'Clair';
}

// --- Change logo based on theme ---
function updateLogo(dark) {
    const logoImg = document.querySelector('.brand .logo img');
    if (logoImg) {
        logoImg.src = dark 
            ? '/asset/logo/logo-header-bark.svg' 
            : '/asset/logo/logo-header-light.svg';
        logoImg.alt = "Logo TongaMarket";
    }
}

// --- External links: open in new tab; internal links: same tab ---
(function setLinkTargets() {
    const links = document.querySelectorAll('a[href]');
    const here = location.hostname;
    links.forEach(a => {
        try {
            const url = new URL(a.href, location.origin);
            const isExternal = url.hostname && url.hostname !== here;
            if (isExternal) {
                a.target = '_blank';
                a.rel = (a.rel || '') + ' noopener noreferrer';
            } else {
                a.removeAttribute('target');
            }
        } catch (_) { /* ignore invalid URLs */ }
    });
})();

// --- Year in footer ---
document.getElementById('year').textContent = new Date().getFullYear();
