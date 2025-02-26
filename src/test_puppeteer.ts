import { writeFile } from "fs/promises";
import puppeteer from "puppeteer";
import MarkdownIt from "markdown-it";

/**
 * Sample Markdown content for testing different cases.
 */
const testMarkdown = `
# Daniel J. Wirz
**Software Engineer experienced in healthcare solutions and AI-enabled developer tools.**  
Building scalable microservices, AI-driven agentic solutions, and enabling ridiculous personal use cases in Notion.  
[GitHub](https://github.com/djwirz/) | [LinkedIn](https://linkedin.com/in/djwirz)  

---

## Formatting Tests
### **Bold & Italic**
- **Bold Text**
- *Italic Text*
- ***Bold & Italic***

### **Lists**
- Item 1
- Item 2
  - Sub-item 1
  - Sub-item 2

1. Ordered List
2. Second Item
   1. Nested Ordered List

### **Blockquotes**
> This is a blockquote.
> - Nested bullet inside a blockquote

### **Links**
- [Google](https://www.google.com)
- [GitHub](https://github.com/djwirz/)

### **Tables**
| Name      | Age | Location      |
|-----------|----|--------------|
| Daniel    | 34 | Minneapolis   |
| Alice     | 28 | San Francisco |

### **Images**
![GitHub Logo](https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png)

---

## **Code Blocks**
\`\`\`javascript
console.log("Hello, world!");
\`\`\`

\`\`\`python
print("Hello, Python!")
\`\`\`
`;

/**
 * Converts Markdown to HTML using `markdown-it`.
 */
function convertMarkdownToHTML(markdown: string, styled: boolean = false): string {
    const md = new MarkdownIt();
    const htmlContent = md.render(markdown);

    // Apply CSS styling if `styled` is enabled.
    const styles = styled
        ? `
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.5; max-width: 800px; margin: auto; padding: 20px; }
            h1, h2, h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            a { color: blue; text-decoration: underline; }
            strong { font-weight: bold; }
            blockquote { font-style: italic; border-left: 3px solid #ccc; padding-left: 10px; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
            code { font-family: monospace; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            table, th, td { border: 1px solid black; padding: 8px; }
            img { max-width: 100%; height: auto; }
        </style>
    `
        : "";

    return `
        <html>
        <head>${styles}</head>
        <body>${htmlContent}</body>
        </html>
    `;
}

/**
 * Generates a PDF from HTML using Puppeteer.
 */
async function convertHTMLToPDF(htmlContent: string): Promise<Uint8Array> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();
    return pdfBuffer;
}

async function runTest() {
    try {
        console.log("Generating PDF without styling...");
        const htmlBasic = convertMarkdownToHTML(testMarkdown, false);
        const pdfBasic = await convertHTMLToPDF(htmlBasic);
        await writeFile("test_output_puppeteer_basic.pdf", pdfBasic);
        console.log("✅ PDF saved as test_output_puppeteer_basic.pdf");

        console.log("Generating PDF with styling...");
        const htmlStyled = convertMarkdownToHTML(testMarkdown, true);
        const pdfStyled = await convertHTMLToPDF(htmlStyled);
        await writeFile("test_output_puppeteer_styled.pdf", pdfStyled);
        console.log("✅ PDF saved as test_output_puppeteer_styled.pdf");
    } catch (error) {
        console.error("❌ Error generating PDFs:", error);
    }
}

runTest();
