import { createServer } from "http";
import { convertMarkdownToPDF } from "./services/pdfService";
import { uploadToCloudflareR2 } from "./services/cloudflareR2Client";
import { createResumeFromApplication } from "./services/notionResumeService";

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

    // ✅ Generate PDF from Notion Resume
    if (req.method === "GET" && url.pathname === "/generate-pdf") {
        const resumeId = url.searchParams.get("resumeId");
        if (!resumeId) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing resumeId query parameter." }));
            return;
        }

        try {
            console.log(`Processing PDF generation for resume ID: ${resumeId}`);
            const markdown = await fetchMarkdownFromNotion(resumeId);
            if (!markdown) throw new Error("No Markdown content found.");

            console.log("Generating PDF...");
            const pdfBuffer = await convertMarkdownToPDF(markdown);
            const fileName = `resume_${resumeId}.pdf`;
            const publicPdfUrl = await uploadToCloudflareR2(Buffer.from(pdfBuffer), fileName);

            await uploadPDFToNotion(resumeId, publicPdfUrl);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ url: publicPdfUrl }));
        } catch (error) {
            console.error("❌ Error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: (error as Error).message }));
        }
        return;
    }

    // ✅ New: Create Resume from Job Application ID (Maintains GET + Query Param pattern)
    if (req.method === "GET" && url.pathname === "/create-resume") {
        const applicationId = url.searchParams.get("applicationId");
        if (!applicationId) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing applicationId query parameter." }));
            return;
        }

        try {
            console.log(`Creating resume for job application ID: ${applicationId}`);
            const newResume = await createResumeFromApplication(applicationId);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ resumeId: newResume }));
        } catch (error) {
            console.error("❌ Error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: (error as Error).message }));
        }
        return;
    }

    // Handle 404 for all other routes
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
});

server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
