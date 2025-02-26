import puppeteer from "puppeteer";
import MarkdownIt from "markdown-it";

/**
 * Converts Markdown to properly structured HTML for PDF generation.
 */
export function convertMarkdownToHTML(markdown: string): string {
    const md = new MarkdownIt({
        html: true, // Allow raw HTML
        linkify: true, // Auto-detect URLs
    });

    const htmlContent = md.render(markdown);

    return `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px; }
                h1, h2, h3 { color: #222; }
                h1 { font-size: 22px; margin-bottom: 8px; }
                h2 { font-size: 18px; margin-top: 18px; }
                h3 { font-size: 16px; font-weight: bold; margin-top: 15px; }
                p { margin-bottom: 10px; }
                a { color: blue; text-decoration: underline; }
                strong { font-weight: bold; }
                ul { padding-left: 20px; margin: 0; }
                li { margin-bottom: 3px; }
                hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
            </style>
        </head>
        <body>${htmlContent}</body>
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
    await page.setContent(htmlContent, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "20px", bottom: "20px" },
    });

    await browser.close();
    return pdfBuffer;
}
