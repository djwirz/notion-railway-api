import { convertMarkdownToPDF } from "./services/pdfService.ts";
import { writeFile } from "fs/promises";

const testMarkdown = `
# Test Markdown

This is a **bold** statement.

- Item 1
- Item 2
- Item 3

> A sample blockquote.

[Google](https://www.google.com)
`;

async function runTest() {
    try {
        console.log("Generating PDF...");
        const pdfBytes = await convertMarkdownToPDF(testMarkdown);
        await writeFile("test_output.pdf", pdfBytes);
        console.log("✅ PDF saved as test_output.pdf");
    } catch (error) {
        console.error("❌ Error generating PDF:", error);
    }
}

runTest();
