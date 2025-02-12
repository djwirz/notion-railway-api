import { generateTestPDFs } from "./services/testService.ts";
import { readFile } from "fs/promises";

async function runTest() {
    try {
        console.log("Reading Markdown content...");
        const markdown = await readFile("./src/test.md", "utf-8");

        console.log("Generating test PDFs...");
        await generateTestPDFs(markdown);
        console.log("✅ PDFs generated: test_output_table-layout.pdf, test_output_absolute-position.pdf, test_output_grid-layout.pdf");
    } catch (error) {
        console.error("❌ Error generating test PDFs:", error);
    }
}

runTest();
