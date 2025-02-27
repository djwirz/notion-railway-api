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

    // Remove duplicate header by stripping out the first markdown header element
    htmlContent = htmlContent.replace(/<h1>.*?<\/h1>/, ""); 

    return `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.4; max-width: 850px; margin: auto; padding: 15px; }
                h1, h2, h3 { color: #222; }
                h1 { font-size: 22px; margin-bottom: 5px; text-align: center; }
                h2 { font-size: 18px; margin-top: 15px; }
                h3 { font-size: 16px; font-weight: bold; margin-top: 10px; }
                p { margin-bottom: 5px; }
                a { color: black; text-decoration: underline; } /* Black underlined links */
                strong { font-weight: bold; }
                ul { padding-left: 18px; margin-bottom: 5px; }
                li { margin-bottom: 2px; }
                hr { border: none; border-top: 1px solid #ccc; margin: 15px 0; }

                /* Compact header */
                .header { text-align: center; margin-bottom: 10px; }
                .header-info { font-size: 14px; color: #666; }
                .summary { font-size: 14px; text-align: center; max-width: 600px; margin: auto; margin-bottom: 10px; }

                /* Two-column skills */
                .skills-container { display: flex; flex-wrap: wrap; gap: 10px; }
                .skill-column { flex: 1; min-width: 300px; }

                /* Experience formatting */
                .job-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
                .job-title { font-size: 16px; }
                .job-date { font-size: 14px; color: #666; }

                /* Skills without bullets */
                .skills-container div { margin-bottom: 3px; }

                /* Project links inline */
                .project-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
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

    // Set content & ensure everything loads before rendering
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "15px", bottom: "15px", left: "20px", right: "20px" }, // Slightly increased margin
    });

    await browser.close();
    return pdfBuffer;
}
