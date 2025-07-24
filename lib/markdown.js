const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const marked = require("marked");

const CONTENT_DIR = path.join(__dirname, "../content");

function getMarkdownFiles() {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }
  return fs.readdirSync(CONTENT_DIR).filter((file) => file.endsWith(".md"));
}

function parseMarkdownFile(filename) {
  const filePath = path.join(CONTENT_DIR, filename);
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data: frontmatter, content } = matter(fileContent);

  return {
    id: frontmatter.id || path.basename(filename, ".md"),
    title: frontmatter.title || "",
    category: frontmatter.category || "",
    publishDate: frontmatter.publishDate || "",
    thumbnailUrl: frontmatter.thumbnailUrl || "",
    keywords: frontmatter.keywords || [],
    tips: frontmatter.tips || "",
    content: content,
    contentHtml: marked(content),
  };
}

module.exports = { getMarkdownFiles, parseMarkdownFile };
