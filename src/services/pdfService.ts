import puppeteer from "puppeteer";
import MarkdownIt from "markdown-it";

/**
 * Converts Markdown to properly structured HTML for PDF generation.
 */
export function convertMarkdownToHTML(markdown: string): string {
    const md = new MarkdownIt({
        html: true,
        linkify: true, // Auto-detects URLs and converts them to links
    });

    let htmlContent = md.render(markdown);

    // Ensure email is NOT hyperlinked
    htmlContent = htmlContent.replace(
        /<a href="mailto:[^"]+">([^<]+)<\/a>/g,
        "$1"
    );

    // Remove duplicate header by stripping out the first markdown header element
    htmlContent = htmlContent.replace(/<h1>.*?<\/h1>/, ""); 

    return `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.4; max-width: 850px; margin: auto; padding: 20px; }
                h1, h2, h3 { color: #222; }
                h1 { font-size: 22px; margin-bottom: 4px; text-align: center; } /* Reduced gap under name */
                h2 { font-size: 18px; margin-top: 10px; }
                h3 { font-size: 16px; font-weight: bold; margin-top: 8px; }
                p { margin-bottom: 5px; }
                a { color: black; text-decoration: underline; } /* Black underlined links */
                strong { font-weight: bold; }
                ul { padding-left: 18px; margin-bottom: 5px; }
                li { margin-bottom: 2px; }
                hr { border: none; border-top: 1px solid #ccc; margin: 12px 0; }

                /* Adjusted header spacing */
                .header { text-align: center; margin-bottom: 3px; } /* Reduced gap */
                .header-info { 
                    font-size: 14px; 
                    color: #666; 
                    margin-top: 2px; /* Keeps contact info tight to title */
                    margin-bottom: 10px; /* Keeps summary close but distinct */
                }
                .summary { 
                    font-size: 14px; 
                    text-align: center; 
                    max-width: 650px; /* Optimized for two-line fit */
                    margin: auto; 
                    margin-top: 5px; /* Brings it closer to contact info */
                    line-height: 1.5;
                }

                /* Remove bullet points from skills */
                .skills-container ul { list-style: none; padding-left: 0; }
                .skills-container strong { display: block; margin-top: 3px; }

                /* Two-column skills */
                .skills-container { display: flex; flex-wrap: wrap; gap: 10px; }
                .skill-column { flex: 1; min-width: 300px; }

                /* Experience formatting */
                .job-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
                .job-title { font-size: 16px; margin-bottom: 2px; } /* Reduced gap under role */
                .job-company { font-size: 14px; font-weight: normal; margin-bottom: 5px; color: #666; } /* Reduced space below company */
                .job-date { font-size: 14px; color: #666; }

                /* Project links inline */
                .project-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Daniel J. Wirz</h1>
                <p class="header-info">
                    <a href="https://github.com/djwirz">GitHub</a> | 
                    <a href="https://linkedin.com/in/djwirz">LinkedIn</a> | 
                    Minneapolis, MN | 715-225-8532 | djwirz@gmail.com
                </p>
                <p class="summary">
                    Software Engineer experienced in healthcare solutions and AI-enabled developer tools. 
                    Building scalable microservices, AI-driven agentic solutions, and enabling ridiculous personal use cases in Notion.
                </p>
            </div>
            ${htmlContent}
        </body>
        </html>
    `;
}

/**
 * Generates a PDF from properly formatted HTML using Puppeteer.
 */
export async function convertMarkdownToPDF(markdown: string): Promise<Uint8Array> {
    const htmlContent = convertMarkdownToHTML(markdown);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set content & ensure everything loads before rendering
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "18px", bottom: "18px", left: "22px", right: "22px" }, // Slightly reduced overall margins
    });

    await browser.close();
    return pdfBuffer;
}
