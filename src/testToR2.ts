import { writeFile } from "fs/promises";
import dotenv from "dotenv";
import { convertMarkdownToPDF } from "./services/pdfService.ts";
import { uploadToCloudflareR2 } from "./services/cloudflareR2Client.ts";

dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_TEST_RESUME_ID = process.env.NOTION_TEST_RESUME_ID;
const PDF_OUTPUT_NAME = "resume_test_output.pdf";

/**
 * Fetches Markdown content from Notion for a given resume ID.
 */
async function fetchMarkdownFromNotion(pageId: string): Promise<string> {
    console.log(`Fetching Markdown for resume ID: ${pageId}...`);

    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch resume: ${response.statusText}`);
    }

    const data = await response.json();
    const markdownProperty = data.properties["Markdown"]?.rich_text;

    return markdownProperty?.map((t: any) => t.plain_text).join("") || "";
}

/**
 * Updates Notion to attach the uploaded PDF to the resume entry.
 */
async function uploadPDFToNotion(pageId: string, pdfUrl: string) {
    console.log(`Attaching PDF to Notion resume ID: ${pageId}...`);

    const notionUploadResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            properties: {
                "PDF": {
                    type: "files",
                    files: [
                        {
                            name: "Resume.pdf",
                            type: "external",
                            external: { url: pdfUrl },
                        },
                    ],
                },
            },
        }),
    });

    const data = await notionUploadResponse.json();
    if (!notionUploadResponse.ok) {
        console.error("❌ Notion API Error:", JSON.stringify(data, null, 2));
        throw new Error(`Failed to attach PDF to Notion: ${notionUploadResponse.statusText}`);
    }

    console.log("✅ PDF successfully attached to Notion.");
}

/**
 * Main function to test the full process.
 */
async function runTest() {
    try {
        if (!NOTION_TEST_RESUME_ID) throw new Error("NOTION_TEST_RESUME_ID is required for testing.");

        console.log("Starting full resume PDF test...");

        // Step 1: Fetch Markdown from Notion
        const markdown = await fetchMarkdownFromNotion(NOTION_TEST_RESUME_ID);
        if (!markdown) throw new Error("No Markdown content found.");

        // Step 2: Generate PDF
        console.log("Generating PDF...");
        const pdfBuffer = await convertMarkdownToPDF(markdown);

        // Save locally for verification
        await writeFile(PDF_OUTPUT_NAME, pdfBuffer);
        console.log(`✅ PDF generated: ${PDF_OUTPUT_NAME}`);

        // Step 3: Upload to Cloudflare R2
        const uploadedPdfUrl = await uploadToCloudflareR2(Buffer.from(pdfBuffer), PDF_OUTPUT_NAME);

        // Step 4: Attach the PDF to Notion
        await uploadPDFToNotion(NOTION_TEST_RESUME_ID, uploadedPdfUrl);

    } catch (error) {
        console.error("❌ Error in full process test:", error);
    }
}

runTest();
