
const menuIcon = document.querySelector('#menu-icon');
const navLinks = document.querySelector('.nav-links');
const copyrightYear = document.querySelector('#year');

// Mobile navigation
if (menuIcon && navLinks) {
    function toggleMenu() {
        const isOpen = navLinks.classList.toggle('active');

        menuIcon.setAttribute('aria-expanded', String(isOpen));
        menuIcon.setAttribute(
            'aria-label',
            isOpen ? 'Close navigation' : 'Open navigation'
        );

        menuIcon.classList.toggle('fa-bars', !isOpen);
        menuIcon.classList.toggle('fa-xmark', isOpen);
    }

    menuIcon.addEventListener('click', toggleMenu);

    // Allow keyboard users to operate the menu
    menuIcon.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleMenu();
        }
    });

    // Close the menu after selecting a navigation link
    navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuIcon.classList.remove('fa-xmark');
            menuIcon.classList.add('fa-bars');
            menuIcon.setAttribute('aria-expanded', 'false');
            menuIcon.setAttribute('aria-label', 'Open navigation');
        });
    });

    // Close the menu with Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            navLinks.classList.remove('active');
            menuIcon.classList.remove('fa-xmark');
            menuIcon.classList.add('fa-bars');
            menuIcon.setAttribute('aria-expanded', 'false');
            menuIcon.setAttribute('aria-label', 'Open navigation');
        }
    });
}

// Automatically update the footer year
if (copyrightYear) {
    copyrightYear.textContent = new Date().getFullYear();
}
