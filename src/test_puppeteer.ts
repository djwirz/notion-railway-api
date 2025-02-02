import { convertMarkdownToPDFWithPuppeteer } from "./services/pdfService.ts";
import { writeFile } from "fs/promises";

const testMarkdown = `
# Daniel J. Wirz
**Software Engineer experienced in healthcare solutions and AI-enabled developer tools.**  
Building scalable microservices, AI-driven agentic solutions, and enabling ridiculous personal use cases in Notion.  
[GitHub](https://github.com/djwirz/) | [LinkedIn](https://linkedin.com/in/djwirz)  
Minneapolis, MN | 715-225-8532 | djwirz@gmail.com  
`;

async function runTest() {
    try {
        console.log("Generating PDF using Puppeteer (HTML-to-PDF)...");
        const pdfBytes = await convertMarkdownToPDFWithPuppeteer(testMarkdown);
        await writeFile("test_output_puppeteer.pdf", pdfBytes);
        console.log("✅ PDF saved as test_output_puppeteer.pdf");
    } catch (error) {
        console.error("❌ Error generating PDF:", error);
    }
}

runTest();
