// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavigation();
    initButtons();
    initForms();
    initModals();
    initScrollEffects();
});

// Navigation functionality
function initNavigation() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('[data-action="toggle-mobile-menu"]');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            this.setAttribute('aria-expanded', 
                this.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'
            );
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (mobileMenu && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            mobileMenu.classList.remove('active');
            if (mobileMenuBtn) {
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Button event handlers
function initButtons() {
    // Handle all data-action buttons
    document.querySelectorAll('button[data-action]').forEach(button => {
        const action = button.getAttribute('data-action');
        
        button.addEventListener('click', function(e) {
            e.preventDefault();
            handleButtonAction(action, this);
        });
    });
}

// Button action handler
function handleButtonAction(action, button) {
    switch(action) {
        case 'open-modal':
            const modalId = button.getAttribute('data-target');
            openModal(modalId);
            break;
            
        case 'close-modal':
            closeModal();
            break;
            
        case 'submit-form':
            const formId = button.getAttribute('data-target');
            submitForm(formId);
            break;
            
        case 'toggle-content':
            const targetId = button.getAttribute('data-target');
            toggleContent(targetId);
            break;
            
        case 'copy-link':
            copyToClipboard(button.getAttribute('data-content') || window.location.href);
            break;
            
        case 'scroll-to-top':
            scrollToTop();
            break;
            
        case 'filter-content':
            const filterValue = button.getAttribute('data-filter');
            filterContent(filterValue);
            break;
            
        default:
            console.log('Unknown action:', action);
    }
}

// Modal functionality
function initModals() {
    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        const modal = document.querySelector('.modal.active');
        if (modal && e.target === modal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        
        // Focus first focusable element
        const focusable = modal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) focusable.focus();
    }
}

function closeModal() {
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) {
        activeModal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

// Form handling
function initForms() {
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(this);
        });
    });
}

function handleFormSubmit(form) {
    const formData = new FormData(form);
    const action = form.getAttribute('action') || '#';
    
    // Show loading state
    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
    }
    
    // Simulate form submission
    setTimeout(() => {
        showNotification('Form submitted successfully!', 'success');
        form.reset();
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }, 1000);
}

function submitForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        handleFormSubmit(form);
    }
}

// Content toggle
function toggleContent(targetId) {
    const target = document.getElementById(targetId);
    if (target) {
        target.classList.toggle('hidden');
        target.classList.toggle('visible');
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Copied to clipboard!', 'success');
    } catch (err) {
        showNotification('Failed to copy to clipboard', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Scroll effects
function initScrollEffects() {
    // Show/hide scroll to top button
    const scrollTopBtn = document.querySelector('[data-action="scroll-to-top"]');
    
    if (scrollTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollTopBtn.style.display = 'block';
            } else {
                scrollTopBtn.style.display = 'none';
            }
        });
    }
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements with animation classes
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Content filtering
function filterContent(filterValue) {
    const filterableItems = document.querySelectorAll('[data-category]');
    
    filterableItems.forEach(item => {
        const categories = item.getAttribute('data-category').split(',');
        
        if (filterValue === 'all' || categories.includes(filterValue)) {
            item.style.display = '';
            item.classList.remove('filtered-out');
        } else {
            item.style.display = 'none';
            item.classList.add('filtered-out');
        }
    });
    
    // Update active filter button
    document.querySelectorAll('[data-action="filter-content"]').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-action="filter-content"][data-filter="${filterValue}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Page-specific initialization
function initPageSpecific() {
    const pageId = document.body.getAttribute('data-page');
    
    switch(pageId) {
        case 'home':
            initHomePage();
            break;
        case 'products':
            initProductsPage();
            break;
        case 'about':
            initAboutPage();
            break;
        case 'contact':
            initContactPage();
            break;
        case 'blog':
            initBlogPage();
            break;
    }
}

// Page-specific functions (can be expanded)
function initHomePage() {
    // Hero section animations, carousel, etc.
}

function initProductsPage() {
    // Product filtering, sorting, etc.
}

function initAboutPage() {
    // Team member cards, timeline, etc.
}

function initContactPage() {
    // Contact form validation, map integration, etc.
}

function initBlogPage() {
    // Article filtering, search, pagination, etc.
}

// Initialize page-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    initPageSpecific();
});