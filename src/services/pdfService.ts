import puppeteer from "puppeteer";
import MarkdownIt from "markdown-it";

/**
 * Converts Markdown to properly structured HTML for PDF generation.
 */
export function convertMarkdownToHTML(markdown: string): string {
    const md = new MarkdownIt({
        html: true,
        linkify: true, // Auto-detect links (handles GitHub, LinkedIn, mailto, etc.)
    });

    return `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px; }
                h1, h2, h3 { color: #222; }
                h1 { font-size: 22px; margin-bottom: 8px; }
                h2 { font-size: 18px; margin-top: 20px; padding-top: 5px; }
                h3 { font-size: 16px; font-weight: bold; margin-top: 15px; }
                p { margin-bottom: 10px; }
                a { color: blue; text-decoration: underline; }
                strong { font-weight: bold; }
                ul { padding-left: 20px; margin-bottom: 10px; }
                li { margin-bottom: 3px; }
                hr { border: none; border-top: 1px solid #ccc; margin: 25px 0; }
            </style>
        </head>
        <body>${md.render(markdown)}</body>
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
        margin: { top: "25px", bottom: "25px" },
    });

    await browser.close();
    return pdfBuffer;
}
