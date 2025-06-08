
import { Client } from '@notionhq/client';
import { config } from './config.js';

// Notion APIクライアントの初期化
const notion = new Client({
  auth: config.NOTION_TOKEN
});

// データベースID
const DATABASE_ID = config.NOTION_DATABASE_ID;

// Notionのリッチテキストを HTML に変換
function richTextToHtml(richText) {
  if (!richText || !Array.isArray(richText)) return '';
  
  return richText.map(text => {
    let content = text.plain_text;
    
    if (text.annotations.bold) content = `<strong>${content}</strong>`;
    if (text.annotations.italic) content = `<em>${content}</em>`;
    if (text.annotations.underline) content = `<u>${content}</u>`;
    if (text.annotations.strikethrough) content = `<s>${content}</s>`;
    if (text.annotations.code) content = `<code>${content}</code>`;
    if (text.href) content = `<a href="${text.href}" target="_blank">${content}</a>`;
    
    return content;
  }).join('');
}

// Notionブロックを HTML に変換
function blockToHtml(block) {
  const { type } = block;
  
  switch (type) {
    case 'paragraph':
      return `<p>${richTextToHtml(block.paragraph.rich_text)}</p>`;
      
    case 'heading_1':
      return `<h1>${richTextToHtml(block.heading_1.rich_text)}</h1>`;
      
    case 'heading_2':
      return `<h2>${richTextToHtml(block.heading_2.rich_text)}</h2>`;
      
    case 'heading_3':
      return `<h3>${richTextToHtml(block.heading_3.rich_text)}</h3>`;
      
    case 'bulleted_list_item':
      return `<li>${richTextToHtml(block.bulleted_list_item.rich_text)}</li>`;
      
    case 'numbered_list_item':
      return `<li>${richTextToHtml(block.numbered_list_item.rich_text)}</li>`;
      
    case 'quote':
      return `<blockquote class="notion-quote">${richTextToHtml(block.quote.rich_text)}</blockquote>`;
      
    case 'callout':
      const icon = block.callout.icon?.emoji || '💡';
      return `<div class="notion-callout">
        <div class="callout-icon">${icon}</div>
        <div class="callout-content">${richTextToHtml(block.callout.rich_text)}</div>
      </div>`;
      
    case 'divider':
      return '<hr class="notion-divider">';
      
    case 'code':
      const language = block.code.language || '';
      return `<pre class="notion-code ${language}"><code>${block.code.rich_text[0]?.plain_text || ''}</code></pre>`;
      
    default:
      return `<p>${richTextToHtml(block[type]?.rich_text || [])}</p>`;
  }
}

// 記事データを取得
export async function getArticleById(pageId) {
  try {
    // ページ情報を取得
    const page = await notion.pages.retrieve({ page_id: pageId });
    
    // ページの子ブロックを取得
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100
    });
    
    // プロパティから基本情報を抽出
    const properties = page.properties;
    const title = properties.タイトル?.title?.[0]?.plain_text || '';
    const category = properties.カテゴリ?.select?.name || '';
    const publishDate = properties.公開日?.date?.start || '';
    const thumbnailUrl = properties.サムネイルURL?.files?.[0]?.file?.url || properties.サムネイルURL?.url || '';
    const keywords = properties.キーワード?.multi_select?.map(item => item.name) || [];
    const tips = properties.養生ポイント?.rich_text?.[0]?.plain_text || '';
    
    // ブロックをHTMLに変換
    let contentHtml = '';
    let currentList = null;
    let listItems = [];
    
    blocks.results.forEach(block => {
      if (block.type === 'bulleted_list_item') {
        if (currentList !== 'ul') {
          if (currentList) {
            contentHtml += `</${currentList}>\n`;
          }
          contentHtml += '<ul class="notion-list">\n';
          currentList = 'ul';
        }
        listItems.push(blockToHtml(block));
      } else if (block.type === 'numbered_list_item') {
        if (currentList !== 'ol') {
          if (currentList) {
            contentHtml += `</${currentList}>\n`;
          }
          contentHtml += '<ol class="notion-list">\n';
          currentList = 'ol';
        }
        listItems.push(blockToHtml(block));
      } else {
        if (currentList) {
          contentHtml += listItems.join('\n') + `\n</${currentList}>\n`;
          currentList = null;
          listItems = [];
        }
        contentHtml += blockToHtml(block) + '\n';
      }
    });
    
    // 最後のリストを閉じる
    if (currentList) {
      contentHtml += listItems.join('\n') + `\n</${currentList}>\n`;
    }
    
    return {
      title,
      category,
      publishDate,
      thumbnailUrl,
      contentHtml,
      keywords,
      tips
    };
    
  } catch (error) {
    console.error('Error fetching article:', error);
    throw error;
  }
}

// 関連記事を取得
export async function getRelatedArticles(currentPageId, limit = 3) {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      page_size: limit + 1, // 現在の記事を除外するため+1
      sorts: [
        {
          property: '公開日',
          direction: 'descending'
        }
      ]
    });
    
    return response.results
      .filter(page => page.id !== currentPageId)
      .slice(0, limit)
      .map(page => ({
        id: page.id,
        title: page.properties.タイトル?.title?.[0]?.plain_text || '',
        category: page.properties.カテゴリ?.select?.name || '',
        publishDate: page.properties.公開日?.date?.start || ''
      }));
      
  } catch (error) {
    console.error('Error fetching related articles:', error);
    return [];
  }
}

// 古典引用テーブルを取得・表示用に変換
export function formatClassicQuotes(tableData) {
  if (!tableData || !Array.isArray(tableData)) return '';
  
  let html = '<div class="classic-quotes-table"><h3>古典引用</h3><table class="quotes-table">';
  html += '<thead><tr><th>引用文</th><th>出典</th><th>解説</th></tr></thead><tbody>';
  
  tableData.forEach(row => {
    html += `<tr>
      <td class="quote-text">${row.quote || ''}</td>
      <td class="quote-source">${row.source || ''}</td>
      <td class="quote-explanation">${row.explanation || ''}</td>
    </tr>`;
  });
  
  html += '</tbody></table></div>';
  return html;
}
