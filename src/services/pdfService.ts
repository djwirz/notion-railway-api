import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { marked } from "marked";

export async function convertMarkdownToPDF(markdown: string): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const { width, height } = page.getSize();
    const fontSize = 12;
    const margin = 50;

    const parsedText = await marked.parse(markdown, { gfm: true, breaks: true });
    const plainText = parsedText.replace(/<\/?[^>]+(>|$)/g, "");

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
