import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for simulated email sending
  app.post("/api/send-quotation", (req, res) => {
    const { email, quotationData } = req.body;
    console.log(`Simulating email to ${email} with quotation:`, quotationData);
    
    // In a real app, you'd use nodemailer or a service like SendGrid
    setTimeout(() => {
      res.json({ success: true, message: "Quotation sent successfully to " + email });
    }, 1500);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Configure static file serving with correct MIME types for modules
    app.use(express.static(path.join(process.cwd(), "dist"), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.wasm')) {
          res.setHeader('Content-Type', 'application/wasm');
        }
      }
    }));
    // SPA fallback - serve index.html for all unmatched routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
