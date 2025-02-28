import puppeteer from "puppeteer";
import MarkdownIt from "markdown-it";

/**
 * Converts Markdown to properly structured HTML for PDF generation.
 */
export function convertMarkdownToHTML(markdown: string): string {
    const md = new MarkdownIt({
        html: true,
        linkify: true,
    });

    // Unescape asterisks for PDF rendering (prevents Notion errors)
    markdown = markdown.replace(/\\\*/g, "*");

    // **Step 1: Insert `<br>` Before Each Section Title (EXCEPT "Programming")**
    markdown = markdown.replace(
        /(Frontend|Backend|Infrastructure & DevOps|AI & Data|Tooling):/g,
        "<br>**$1:**"
    ).replace(
        /Programming:/g,
        "**Programming:**"
    );

    let htmlContent = md.render(markdown);

    // Ensure email is NOT hyperlinked
    htmlContent = htmlContent.replace(
        /<a href="mailto:[^"]+">([^<]+)<\/a>/g,
        "$1"
    );

    // **Manually Map Correct GitHub Links for Projects**
    htmlContent = htmlContent.replace(
        /(<h3>Notion Workout Automation\s*\|\s*GitHub<\/h3>)/g,
        `<h3>Notion Workout Automation | <a href="https://github.com/djwirz/notion-workout-automation" style="text-decoration: underline;">GitHub</a></h3>`
    ).replace(
        /(<h3>Cover Letter AI\s*\|\s*GitHub<\/h3>)/g,
        `<h3>Cover Letter AI | <a href="https://github.com/djwirz/cover-letter-ai" style="text-decoration: underline;">GitHub</a></h3>`
    );

    return `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.4; max-width: 850px; margin: auto; padding: 20px; }
                h1, h2, h3 { color: #222; }
                h1 { font-size: 22px; margin-bottom: 2px; text-align: center; }
                h2 { font-size: 18px; margin-top: 10px; margin-bottom: 4px; }
                h3 { font-size: 16px; font-weight: bold; margin-top: 8px; margin-bottom: 4px; }
                p { margin-bottom: 4px; }
                a { color: black; text-decoration: underline; }
                strong { font-weight: bold; }
                ul { padding-left: 18px; margin-bottom: 4px; }
                li { margin-bottom: 2px; }
                hr { border: none; border-top: 1px solid #ccc; margin: 10px 0; }

                .header { text-align: center; margin-bottom: 5px; }
                .header-info { font-size: 14px; color: #666; margin-top: 2px; margin-bottom: 10px; }
                .summary { font-size: 14px; text-align: center; max-width: 650px; margin: auto; margin-top: 5px; line-height: 1.5; }

                /* Reduce Vertical Spacing for Skills Section */
                .skills-container strong {
                    display: inline;
                    margin-right: 5px;
                }

                .skills-container br {
                    display: block;
                    margin-bottom: 4px;
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
            ${htmlContent}
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

    // Ensure links are interactive in the PDF
    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "15px", bottom: "15px", left: "20px", right: "20px" },
        displayHeaderFooter: false,
        printBackground: true,
        preferCSSPageSize: true,
    });

    await browser.close();
    return pdfBuffer;
}
