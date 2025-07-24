const { getMarkdownFiles, parseMarkdownFile } = require("../../lib/markdown");

module.exports = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const markdownFiles = getMarkdownFiles();

    const articles = markdownFiles
      .map((filename) => parseMarkdownFile(filename))
      .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
      .slice(0, limit)
      .map((article) => ({
        id: article.id,
        title: article.title,
        category: article.category,
        publishDate: article.publishDate,
        thumbnailUrl: article.thumbnailUrl,
      }));

    res.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({
      error: "Failed to fetch articles",
      message: error.message,
    });
  }
};
