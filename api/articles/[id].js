const { getMarkdownFiles, parseMarkdownFile } = require("../../lib/markdown");

module.exports = async (req, res) => {
  try {
    const { id } = req.query;
    const markdownFiles = getMarkdownFiles();

    let article = null;
    for (const filename of markdownFiles) {
      const parsedArticle = parseMarkdownFile(filename);
      if (parsedArticle.id === id) {
        article = parsedArticle;
        break;
      }
    }

    if (!article) {
      return res.status(404).json({
        error: "Article not found",
        message: `記事ID "${id}" が見つかりません`,
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
};
