import { generateTestPDFs } from "./services/testService.ts";
import { readFile } from "fs/promises";

async function runTest() {
    try {
        console.log("Reading Markdown content...");
        const markdown = await readFile("./src/test.md", "utf-8");

        console.log("Generating test PDFs...");
        await generateTestPDFs(markdown);
        console.log("✅ PDFs generated: test_output_margin-padding.pdf, test_output_flexbox.pdf, test_output_whitespace.pdf");
    } catch (error) {
        console.error("❌ Error generating test PDFs:", error);
    }
}

runTest();
