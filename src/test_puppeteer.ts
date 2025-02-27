import { readFile, writeFile } from "fs/promises";
import { convertMarkdownToPDF } from "./services/pdfService.ts";

async function runTest() {
    try {
        console.log("Reading Markdown content...");
        const markdown = await readFile("./src/test.md", "utf-8");

        console.log("Generating test PDF...");
        const pdfBuffer = await convertMarkdownToPDF(markdown);

        await writeFile("test_output_margin-padding.pdf", pdfBuffer);
        console.log("✅ PDF generated: test_output_margin-padding.pdf");
    } catch (error) {
        console.error("❌ Error generating test PDF:", error);
    }
}

runTest();
