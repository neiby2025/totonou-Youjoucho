
import { getArticleById, getRelatedArticles } from './notion-api.js';

// URLパラメータから記事IDを取得
function getArticleIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id') || 'default-article-id';
}

// 記事データをページに反映
async function loadArticle() {
  const articleId = getArticleIdFromUrl();
  const loadingElement = document.getElementById('loading');
  const articleContainer = document.getElementById('article-container');
  const errorContainer = document.getElementById('error-container');
  
  try {
    if (loadingElement) loadingElement.style.display = 'block';
    if (errorContainer) errorContainer.style.display = 'none';
    
    // 記事データを取得
    const article = await getArticleById(articleId);
    const relatedArticles = await getRelatedArticles(articleId);
    
    // ページタイトルを更新
    document.title = `${article.title} - ととのう養生帖`;
    
    // 記事メタ情報を更新
    updateElement('article-category', article.category);
    updateElement('article-date', formatDate(article.publishDate));
    updateElement('article-title', article.title);
    
    // サムネイル画像を設定
    const heroImage = document.querySelector('.article-image-hero');
    if (heroImage && article.thumbnailUrl) {
      heroImage.style.backgroundImage = `url(${article.thumbnailUrl})`;
      heroImage.style.backgroundSize = 'cover';
      heroImage.style.backgroundPosition = 'center';
    }
    
    // 記事本文を更新
    const contentElement = document.querySelector('.article-content .dynamic-content');
    if (contentElement) {
      contentElement.innerHTML = article.contentHtml;
    }
    
    // 養生ポイントを更新
    const tipsElement = document.querySelector('.seasonal-tip p');
    if (tipsElement && article.tips) {
      tipsElement.textContent = article.tips;
    }
    
    // キーワードタグを表示
    displayKeywords(article.keywords);
    
    // 関連記事を表示
    displayRelatedArticles(relatedArticles);
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (articleContainer) articleContainer.style.display = 'block';
    
  } catch (error) {
    console.error('記事の読み込みに失敗しました:', error);
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (articleContainer) articleContainer.style.display = 'none';
    if (errorContainer) {
      errorContainer.style.display = 'block';
      errorContainer.innerHTML = `
        <div class="error-message">
          <h2>記事の読み込みに失敗しました</h2>
          <p>記事が見つからないか、一時的なエラーが発生しています。</p>
          <a href="index.html" class="back-btn">トップページに戻る</a>
        </div>
      `;
    }
  }
}

// 要素の内容を更新
function updateElement(id, content) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = content;
  }
}

// 日付をフォーマット
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '.');
}

// キーワードタグを表示
function displayKeywords(keywords) {
  const keywordsContainer = document.getElementById('keywords-container');
  if (!keywordsContainer || !keywords || keywords.length === 0) return;
  
  const keywordsHtml = keywords.map(keyword => 
    `<span class="keyword-tag">${keyword}</span>`
  ).join('');
  
  keywordsContainer.innerHTML = `
    <div class="keywords-section">
      <h4>キーワード</h4>
      <div class="keywords-list">${keywordsHtml}</div>
    </div>
  `;
}

// 関連記事を表示
function displayRelatedArticles(relatedArticles) {
  const relatedContainer = document.querySelector('.related-list');
  if (!relatedContainer || !relatedArticles || relatedArticles.length === 0) return;
  
  const relatedHtml = relatedArticles.map(article => `
    <a href="article.html?id=${article.id}" class="related-item">
      <h4>${article.title}</h4>
      <span class="related-category">${article.category}</span>
      <time class="related-date">${formatDate(article.publishDate)}</time>
    </a>
  `).join('');
  
  relatedContainer.innerHTML = relatedHtml;
}

// ページ読み込み時に記事を取得
document.addEventListener('DOMContentLoaded', loadArticle);

// エクスポート（他のファイルから使用する場合）
export { loadArticle, getArticleIdFromUrl };
