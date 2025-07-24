
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

// 最新記事を取得して表示
async function loadLatestArticles() {
  const container = document.getElementById('latest-articles-container');
  if (!container) return;

  try {
    const response = await fetch('/api/articles?limit=3');
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const articles = await response.json();
    
    if (articles.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">記事が見つかりませんでした。</p>';
      return;
    }

    const articlesHtml = articles.map(article => `
      <article class="article-card">
        <div class="article-image" style="${article.thumbnailUrl ? `background-image: url(${article.thumbnailUrl}); background-size: cover; background-position: center;` : ''}"></div>
        <div class="article-content">
          <span class="article-category">${article.category || 'カテゴリなし'}</span>
          <h4 class="article-title">
            <a href="article.html?id=${article.id}">${article.title || '無題'}</a>
          </h4>
          <p class="article-excerpt">${generateExcerpt(article.title, article.category)}</p>
          <time class="article-date">${formatArticleDate(article.publishDate)}</time>
        </div>
      </article>
    `).join('');

    container.innerHTML = articlesHtml;

  } catch (error) {
    console.error('記事の読み込みに失敗しました:', error);
    container.innerHTML = `
      <div class="error-message" style="text-align: center; padding: 2rem;">
        <p style="color: var(--text-secondary);">記事の読み込みに失敗しました。</p>
        <p style="color: var(--text-light); font-size: 0.9rem;">${error.message}</p>
      </div>
    `;
  }
}

// 記事の要約を生成（タイトルとカテゴリから）
function generateExcerpt(title, category) {
  const excerpts = {
    '季節の養生': '季節に合わせた養生法で、自然のリズムに調和した健康管理を...',
    '食養生': '薬膳の知恵を活かした食事で、体の内側から健康をサポート...',
    '感情と気のめぐり': '東洋医学の視点から、心と体のバランスを整える方法を...'
  };
  
  return excerpts[category] || '東洋医学の知恵を現代の生活に活かす養生法をご紹介...';
}

// 日付フォーマット関数
function formatArticleDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '.');
}

// Initialize seasonal greeting and load articles
document.addEventListener('DOMContentLoaded', function() {
  addSeasonalGreeting();
  loadLatestArticles();
});

// Simple parallax effect for hero section
window.addEventListener('scroll', function() {
  const scrolled = window.pageYOffset;
  const hero = document.querySelector('.hero');
  
  if (hero) {
    const speed = scrolled * 0.5;
    hero.style.transform = `translateY(${speed}px)`;
  }
});
