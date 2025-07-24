const {
  getMarkdownFiles,
  parseMarkdownFile,
} = require("../../../lib/markdown");

module.exports = async (req, res) => {
  try {
    const { id } = req.query;
    const limit = parseInt(req.query.limit) || 3;
    const markdownFiles = getMarkdownFiles();

    const allArticles = markdownFiles
      .map((filename) => parseMarkdownFile(filename))
      .filter((article) => article.id !== id)
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
};
