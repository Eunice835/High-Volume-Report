import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import nodemailer from "nodemailer";
import { sessionMiddleware } from "./auth";

let io: SocketServer | null = null;

interface JobNotification {
  type: "job_queued" | "job_progress" | "job_completed" | "job_failed";
  jobId: string;
  jobName?: string;
  progress?: number;
  message?: string;
  downloadUrl?: string;
  timestamp: Date;
}

const mailTransport = nodemailer.createTransport({
  host: process.env.MAILHOG_HOST || "localhost",
  port: parseInt(process.env.MAILHOG_PORT || "1025"),
  secure: false,
  ignoreTLS: true,
});

export function setupWebSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5000"],
      credentials: true,
    },
  });

  const wrap = (middleware: any) => (socket: Socket, next: any) => 
    middleware(socket.request, {}, next);
  
  io.use(wrap(sessionMiddleware));

  io.use((socket, next) => {
    const session = (socket.request as any).session;
    if (session && session.userId) {
      next();
    } else {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const session = (socket.request as any).session;
    console.log(`WebSocket connected: user ${session?.username || "unknown"}`);

    socket.join(`user:${session?.userId}`);

    socket.on("subscribe_jobs", () => {
      socket.join("jobs");
      console.log(`User ${session?.username} subscribed to job notifications`);
    });

    socket.on("unsubscribe_jobs", () => {
      socket.leave("jobs");
    });

    socket.on("disconnect", () => {
      console.log(`WebSocket disconnected: user ${session?.username || "unknown"}`);
    });
  });

  console.log("WebSocket server initialized");
  return io;
}

export function emitJobNotification(notification: JobNotification) {
  if (!io) {
    console.warn("WebSocket server not initialized, skipping notification");
    return;
  }

  io.to("jobs").emit("job_update", notification);
}

export function emitToUser(userId: number, event: string, data: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

export async function sendEmailNotification(
  to: string | string[],
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const recipients = Array.isArray(to) ? to.join(", ") : to;
    
    await mailTransport.sendMail({
      from: '"Ira Analytics" <notifications@ira.local>',
      to: recipients,
      subject,
      html,
    });
    
    console.log(`Email sent to ${recipients}: ${subject}`);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export function createJobCompletedEmail(jobName: string, downloadUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; }
        .container { max-width: 600px; margin: 0 auto; padding: 24px; }
        .header { background: linear-gradient(135deg, #0ea5e9, #3b82f6); padding: 24px; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: #1e293b; padding: 24px; border-radius: 0 0 12px 12px; }
        .btn { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px; }
        .footer { text-align: center; margin-top: 24px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Ira Analytics</h1>
        </div>
        <div class="content">
          <h2>Export Complete</h2>
          <p>Your report <strong>${jobName}</strong> has been generated successfully and is ready for download.</p>
          <a href="${downloadUrl}" class="btn">Download Report</a>
          <p style="margin-top: 24px; color: #94a3b8;">This link will expire in 24 hours.</p>
        </div>
        <div class="footer">
          <p>Ira Analytics - Enterprise Reporting System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function createJobFailedEmail(jobName: string, errorMessage: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; }
        .container { max-width: 600px; margin: 0 auto; padding: 24px; }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 24px; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: #1e293b; padding: 24px; border-radius: 0 0 12px 12px; }
        .error-box { background: #450a0a; border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .footer { text-align: center; margin-top: 24px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Ira Analytics</h1>
        </div>
        <div class="content">
          <h2>Export Failed</h2>
          <p>Unfortunately, your report <strong>${jobName}</strong> could not be generated.</p>
          <div class="error-box">
            <strong>Error:</strong> ${errorMessage}
          </div>
          <p>Please try again with a smaller date range or contact support if the issue persists.</p>
        </div>
        <div class="footer">
          <p>Ira Analytics - Enterprise Reporting System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
