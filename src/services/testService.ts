import puppeteer from "puppeteer";
import MarkdownIt from "markdown-it";
import { promises as fs } from "fs";

async function generatePDFWithStrategy(markdown: string, layoutOption: string) {
    const htmlContent = convertMarkdownToHTML(markdown, layoutOption);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "18px", bottom: "18px", left: "22px", right: "22px" },
    });

    await browser.close();
    await fs.writeFile(`test_output_${layoutOption}.pdf`, pdfBuffer);
}

function convertMarkdownToHTML(markdown: string, layoutOption: string): string {
    const md = new MarkdownIt({ html: true, linkify: true });
    let htmlContent = md.render(markdown);

    htmlContent = htmlContent.replace(/<h1>.*?<\/h1>/, ""); // Remove duplicate header

    let layoutStyles = "";
    if (layoutOption === "table-layout") {
        layoutStyles = `
            .job-entry { display: table; width: 100%; }
            .job-title, .job-company, .job-bullets { display: table-row; }
            .job-company { font-style: italic; }
            .job-bullets { padding-top: 2px; }
        `;
    } else if (layoutOption === "absolute-position") {
        layoutStyles = `
            .job-entry { position: relative; margin-bottom: 6px; }
            .job-title { position: relative; top: -5px; }
            .job-company { position: relative; top: -3px; font-style: italic; }
            .job-bullets { margin-top: -4px; }
        `;
    } else if (layoutOption === "grid-layout") {
        layoutStyles = `
            .experience-container { display: grid; grid-template-rows: auto auto 1fr; row-gap: 2px; }
            .job-company { font-style: italic; }
            .job-bullets { margin-top: 3px; }
        `;
    }

    return `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.4; max-width: 850px; margin: auto; padding: 20px; }
                h1, h2, h3 { color: #222; }
                h1 { font-size: 22px; margin-bottom: 4px; text-align: center; }
                h2 { font-size: 18px; margin-top: 10px; }
                h3 { font-size: 16px; font-weight: bold; margin-top: 8px; }
                p { margin-bottom: 5px; }
                a { color: black; text-decoration: underline; }
                strong { font-weight: bold; }
                ul { padding-left: 18px; margin-bottom: 5px; }
                li { margin-bottom: 2px; }
                hr { border: none; border-top: 1px solid #ccc; margin: 12px 0; }
                
                .experience-container h3 { margin-bottom: 2px; }
                .header-info { margin-bottom: 8px; }

                ${layoutStyles} /* Apply selected layout strategy */
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

export async function generateTestPDFs(markdown: string) {
    console.log("Generating test PDFs with different spacing methods...");
    await generatePDFWithStrategy(markdown, "table-layout");
    await generatePDFWithStrategy(markdown, "absolute-position");
    await generatePDFWithStrategy(markdown, "grid-layout");
    console.log("✅ PDFs generated: test_output_table-layout.pdf, test_output_absolute-position.pdf, test_output_grid-layout.pdf");
}
