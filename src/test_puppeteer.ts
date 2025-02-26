import { convertMarkdownToPDF } from "./services/pdfService.ts";
import { writeFile, readFile } from "fs/promises";

async function runTest() {
    try {
        console.log("Reading Markdown content...");
        const markdown = await readFile("./src/test.md", "utf-8");

        console.log("Generating refined Puppeteer PDF...");
        const pdfBytes = await convertMarkdownToPDF(markdown);
        await writeFile("test_output_puppeteer_refined.pdf", pdfBytes);
        console.log("✅ PDF saved as test_output_puppeteer_refined.pdf");
    } catch (error) {
        console.error("❌ Error generating PDF:", error);
    }
}

runTest();
