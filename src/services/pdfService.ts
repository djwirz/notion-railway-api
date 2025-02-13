import puppeteer from "puppeteer";
import MarkdownIt from "markdown-it";

/**
 * Converts Markdown to properly structured HTML for PDF generation.
 */
export function convertMarkdownToHTML(markdown: string): string {
    const md = new MarkdownIt({
        html: true,
        linkify: true, // Auto-detects URLs and converts them to links
    });

    let htmlContent = md.render(markdown);

    // Ensure email is NOT hyperlinked
    htmlContent = htmlContent.replace(
        /<a href="mailto:[^"]+">([^<]+)<\/a>/g,
        "$1"
    );

    // Fully remove any existing header duplication from Markdown conversion
    htmlContent = htmlContent.replace(/<h1>.*?<\/h1>/, "");

    return `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.3; 
                    max-width: 850px; 
                    margin: auto; 
                    padding: 20px; 
                }
                h1, h2, h3 { color: #222; }
                h1 { font-size: 22px; margin-bottom: 1px; text-align: center; }
                h2 { font-size: 18px; margin-top: 8px; }
                h3 { 
                    font-size: 16px; 
                    font-weight: bold; 
                    margin-bottom: 0px; 
                    white-space: nowrap; /* Forces job title and company onto the same line */
                } 
                p { margin-bottom: 4px; }
                a { color: black; text-decoration: underline; }
                strong { font-weight: bold; }

                /* Job Entries: Table Structure to Enforce Alignment */
                .job-entry {
                    display: table;
                    width: 100%;
                    margin-bottom: 10px;
                }
                .job-row {
                    display: table-row;
                }
                .job-title, .job-company {
                    display: table-cell;
                    vertical-align: top;
                    padding-right: 8px;
                }
                .job-title {
                    font-size: 16px;
                    font-weight: bold;
                }
                .job-company {
                    font-size: 15px;
                    font-weight: 600;
                    color: #333;
                    white-space: nowrap;
                }

                /* Bullet List Adjustments */
                .job-details {
                    display: table-cell;
                    vertical-align: top; /* Forces bullet points to align with the company name */
                }
                .job-details ul {
                    padding-left: 16px;
                    margin-top: 0px;
                    margin-bottom: 4px;
                    display: table;
                }
                .job-details li {
                    margin-bottom: 2px;
                    line-height: 1.1; /* Tighter line height for bullets */
                }

                /* Projects Section - GitHub links inline */
                .project-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    font-weight: bold; 
                    margin-bottom: 2px;
                }
                .project-header a { 
                    font-weight: normal; 
                    margin-left: 6px; 
                    font-size: 13px; 
                    text-decoration: none; 
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Daniel J. Wirz</h1>
                <p class="header-info">
                    <a href="https://github.com/djwirz">GitHub</a> | 
                    <a href="https://linkedin.com/in/djwirz">LinkedIn</a> | 
                    Minneapolis, MN | 715-225-8532 | djwirz@gmail.com
                </p>
                <p class="summary">
                    Software Engineer experienced in healthcare solutions and AI-enabled developer tools. 
                    Building scalable microservices, AI-driven agentic solutions, and enabling ridiculous personal use cases in Notion.
                </p>
            </div>
            <div class="experience-container">
                ${htmlContent}
            </div>
        </body>
        </html>
    `;
}

/**
 * Generates a PDF from properly formatted HTML using Puppeteer.
 */
export async function convertMarkdownToPDF(markdown: string): Promise<Uint8Array> {
    const htmlContent = convertMarkdownToHTML(markdown);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "10px", bottom: "10px", left: "18px", right: "18px" },
    });

    await browser.close();
    return pdfBuffer;
}