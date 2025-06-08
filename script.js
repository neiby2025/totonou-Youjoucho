
// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    // Skip if href is just "#" or empty
    if (href === '#' || href.length <= 1) {
      return;
    }
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

// Mobile menu toggle (basic functionality)
const menuBtn = document.querySelector('.menu-btn');
if (menuBtn) {
  menuBtn.addEventListener('click', function() {
    this.classList.toggle('active');
    // Add mobile menu logic here when needed
  });
}

// Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe article cards and category cards for fade-in animation
document.addEventListener('DOMContentLoaded', function() {
  const animatedElements = document.querySelectorAll('.article-card, .category-card, .recommend-card');
  
  animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});

// Add seasonal greeting based on current month
function addSeasonalGreeting() {
  const month = new Date().getMonth() + 1;
  let season = '';
  
  if (month >= 3 && month <= 5) {
    season = '春';
  } else if (month >= 6 && month <= 8) {
    season = '夏';
  } else if (month >= 9 && month <= 11) {
    season = '秋';
  } else {
    season = '冬';
  }
  
  const seasonalElement = document.querySelector('.seasonal-recommend h3');
  if (seasonalElement) {
    seasonalElement.textContent = `${season}の養生におすすめ`;
  }
}

// Initialize seasonal greeting
document.addEventListener('DOMContentLoaded', addSeasonalGreeting);

// Simple parallax effect for hero section
window.addEventListener('scroll', function() {
  const scrolled = window.pageYOffset;
  const hero = document.querySelector('.hero');
  
  if (hero) {
    const speed = scrolled * 0.5;
    hero.style.transform = `translateY(${speed}px)`;
  }
});
