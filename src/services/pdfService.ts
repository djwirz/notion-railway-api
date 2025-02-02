import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import puppeteer from "puppeteer";
import MarkdownIt from "markdown-it";

/**
 * Basic Markdown-to-PDF conversion (text only, no formatting).
 */
export async function convertMarkdownToPDFWithText(markdown: string): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = page.getSize();
    const fontSize = 12;
    const margin = 50;

    // Remove Markdown formatting (plain text only)
    const plainText = markdown.replace(/[*#>]/g, "").trim();

    page.drawText(plainText, {
        x: margin,
        y: height - margin,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
        maxWidth: width - 2 * margin,
    });

    return await pdfDoc.save();
}

/**
 * Full Markdown-to-PDF conversion (HTML-to-PDF via Puppeteer).
 */
export async function convertMarkdownToPDFWithPuppeteer(markdown: string): Promise<Uint8Array> {
    const md = new MarkdownIt();
    const htmlContent = md.render(markdown);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(`
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.5; }
                h1, h2, h3 { color: #333; }
                a { color: blue; text-decoration: underline; }
                strong { font-weight: bold; }
                ul { padding-left: 20px; }
            </style>
        </head>
        <body>${htmlContent}</body>
        </html>
    `);

    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    return pdfBuffer;
}
