import { createServer } from "http";
import { convertMarkdownToPDF } from "../src/services/pdfService";

const PORT = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/generate-pdf") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
        try {
            const { markdown } = JSON.parse(body);
            if (!markdown) throw new Error("Markdown content required");

            const pdfBytes = await convertMarkdownToPDF(markdown);

            res.writeHead(200, {
                "Content-Type": "application/pdf",
                "Content-Disposition": 'attachment; filename="output.pdf"',
            });
            res.end(Buffer.from(pdfBytes));
        } catch (error) {
            console.error("Error:", error);
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: (error as Error).message }));
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
