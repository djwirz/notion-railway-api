import { createServer } from "http";
import { convertMarkdownToPDF } from "./services/pdfService";
import { uploadToCloudflareR2 } from "./services/cloudflareR2Client";

const PORT = process.env.PORT || 3000;
const NOTION_API_KEY = process.env.NOTION_API_KEY;

if (!NOTION_API_KEY) {
    throw new Error("❌ Notion API key is missing.");
}

/**
 * Fetches Markdown content from Notion for a given resume ID.
 */
async function fetchMarkdownFromNotion(resumeId: string): Promise<string> {
    console.log(`Fetching Markdown for resume ID: ${resumeId}...`);

    const response = await fetch(`https://api.notion.com/v1/pages/${resumeId}`, {
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
 * Updates Notion to attach the **public PDF URL** to the resume entry.
 */
async function uploadPDFToNotion(resumeId: string, pdfUrl: string) {
    console.log(`Attaching public PDF to Notion resume ID: ${resumeId}...`);

    const notionUploadResponse = await fetch(`https://api.notion.com/v1/pages/${resumeId}`, {
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

const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);

    // Only accept GET requests to `/generate-pdf`
    if (req.method !== "GET" || url.pathname !== "/generate-pdf") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
    }

    // Get `resumeId` from query params
    const resumeId = url.searchParams.get("resumeId");
    if (!resumeId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing resumeId query parameter." }));
        return;
    }

    try {
        console.log(`Processing PDF generation for resume ID: ${resumeId}`);

        // Step 1: Fetch Markdown from Notion
        const markdown = await fetchMarkdownFromNotion(resumeId);
        if (!markdown) throw new Error("No Markdown content found.");

        // Step 2: Generate PDF
        console.log("Generating PDF...");
        const pdfBuffer = await convertMarkdownToPDF(markdown);

        // Step 3: Upload PDF to Cloudflare R2 and get public URL
        const fileName = `resume_${resumeId}.pdf`;
        const publicPdfUrl = await uploadToCloudflareR2(Buffer.from(pdfBuffer), fileName);

        // Step 4: Attach the **permanent public PDF URL** to Notion
        await uploadPDFToNotion(resumeId, publicPdfUrl);

        // Step 5: Respond with the public URL (so Notion can confirm the link)
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ url: publicPdfUrl }));

    } catch (error) {
        console.error("❌ Error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: (error as Error).message }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
