import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
const { getMarkdownFiles, parseMarkdownFile } = require("./lib/markdown");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS設定
app.use(cors());
app.use(express.json());

// 静的ファイル配信
app.use(express.static("."));

// contentディレクトリのパス
const CONTENT_DIR = "./content";

// Markdownファイルの一覧を取得

// Markdownファイルを読み込んでパース

// 記事取得API
app.get("/api/articles/:id", async (req, res) => {
  try {
    const articleId = req.params.id;
    const markdownFiles = getMarkdownFiles();

    // IDに一致する記事を探す
    let article = null;
    for (const filename of markdownFiles) {
      const parsedArticle = parseMarkdownFile(filename);
      if (parsedArticle.id === articleId) {
        article = parsedArticle;
        break;
      }
    }

    if (!article) {
      return res.status(404).json({
        error: "Article not found",
        message: `記事ID "${articleId}" が見つかりません`,
      });
    }

    res.json({
      title: article.title,
      category: article.category,
      publishDate: article.publishDate,
      thumbnailUrl: article.thumbnailUrl,
      contentHtml: article.contentHtml,
      keywords: article.keywords,
      tips: article.tips,
    });
  } catch (error) {
    console.error("Error fetching article:", error);
    res.status(500).json({
      error: "Failed to fetch article",
      message: error.message,
    });
  }
});

// 関連記事取得API
app.get("/api/articles/:id/related", async (req, res) => {
  try {
    const currentArticleId = req.params.id;
    const limit = parseInt(req.query.limit) || 3;
    const markdownFiles = getMarkdownFiles();

    const allArticles = markdownFiles
      .map((filename) => parseMarkdownFile(filename))
      .filter((article) => article.id !== currentArticleId)
      .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
      .slice(0, limit);

    const relatedArticles = allArticles.map((article) => ({
      id: article.id,
      title: article.title,
      category: article.category,
      publishDate: article.publishDate,
    }));

    res.json(relatedArticles);
  } catch (error) {
    console.error("Error fetching related articles:", error);
    res.status(500).json({
      error: "Failed to fetch related articles",
      message: error.message,
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
