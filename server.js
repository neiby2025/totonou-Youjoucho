
import express from 'express';
import { Client } from '@notionhq/client';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS設定
app.use(cors());
app.use(express.json());

// 静的ファイル配信
app.use(express.static('.'));

// Notion APIクライアント初期化
const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

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

// 記事取得API
app.get('/api/articles/:id', async (req, res) => {
  try {
    const pageId = req.params.id;
    
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
    
    res.json({
      title,
      category,
      publishDate,
      thumbnailUrl,
      contentHtml,
      keywords,
      tips
    });
    
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ 
      error: 'Failed to fetch article',
      message: error.message 
    });
  }
});

// 関連記事取得API
app.get('/api/articles/:id/related', async (req, res) => {
  try {
    const currentPageId = req.params.id;
    const limit = parseInt(req.query.limit) || 3;
    
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      page_size: limit + 1,
      sorts: [
        {
          property: '公開日',
          direction: 'descending'
        }
      ]
    });
    
    const relatedArticles = response.results
      .filter(page => page.id !== currentPageId)
      .slice(0, limit)
      .map(page => ({
        id: page.id,
        title: page.properties.タイトル?.title?.[0]?.plain_text || '',
        category: page.properties.カテゴリ?.select?.name || '',
        publishDate: page.properties.公開日?.date?.start || ''
      }));
      
    res.json(relatedArticles);
    
  } catch (error) {
    console.error('Error fetching related articles:', error);
    res.status(500).json({ 
      error: 'Failed to fetch related articles',
      message: error.message 
    });
  }
});

// 最新記事リスト取得API
app.get('/api/articles', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      page_size: limit,
      sorts: [
        {
          property: '公開日',
          direction: 'descending'
        }
      ]
    });
    
    const articles = response.results.map(page => ({
      id: page.id,
      title: page.properties.タイトル?.title?.[0]?.plain_text || '',
      category: page.properties.カテゴリ?.select?.name || '',
      publishDate: page.properties.公開日?.date?.start || '',
      thumbnailUrl: page.properties.サムネイルURL?.files?.[0]?.file?.url || page.properties.サムネイルURL?.url || ''
    }));
    
    res.json(articles);
    
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ 
      error: 'Failed to fetch articles',
      message: error.message 
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
