/**
 * Run this script once to generate a new Gmail OAuth2 refresh token.
 * 
 * Usage:
 *   1. Make sure GMAIL_OAUTH_CLIENT_ID and GMAIL_OAUTH_CLIENT_SECRET are set in your .env.local
 *   2. Run:  node scripts/generate-refresh-token.cjs
 *   3. Open the URL that appears in your browser
 *   4. Sign in as vonnessentials@gmail.com and approve the permissions
 *   5. Copy the "refresh_token" value from the output
 *   6. Go to Vercel → Project Settings → Environment Variables
 *      and update GMAIL_OAUTH_REFRESH_TOKEN with the new value
 */

require("dotenv").config({ path: ".env.local" });
const { google } = require("googleapis");
const http = require("http");
const url = require("url");

const CLIENT_ID = process.env.GMAIL_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:4040/oauth2callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "\n❌ Missing GMAIL_OAUTH_CLIENT_ID or GMAIL_OAUTH_CLIENT_SECRET in .env.local\n"
  );
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",           // forces Google to return a fresh refresh_token
  login_hint: "vonnessentials@gmail.com",
});

console.log("\n🔑 Gmail OAuth2 Refresh Token Generator");
console.log("=========================================");
console.log("\n1. Open this URL in your browser:\n");
console.log("   " + authUrl);
console.log("\n2. Sign in as vonnessentials@gmail.com");
console.log("3. Approve the Gmail send permission");
console.log("4. You will be redirected back and the token will appear here\n");

// Start a local server to catch the redirect
const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    if (parsedUrl.pathname !== "/oauth2callback") {
      res.end("Not found");
      return;
    }

    const code = parsedUrl.query.code;
    if (!code) {
      res.end("No code received.");
      return;
    }

    const { tokens } = await oAuth2Client.getToken(code);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <html><body style="font-family:monospace;padding:40px;background:#f4f8f5;">
        <h2 style="color:#162F1C;">✅ Tokens received! Check your terminal.</h2>
        <p>You can close this tab.</p>
      </body></html>
    `);

    console.log("\n✅ SUCCESS! Here are your new tokens:\n");
    console.log(JSON.stringify(tokens, null, 2));
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 COPY THIS VALUE and paste it into Vercel:");
    console.log("");
    console.log("   GMAIL_OAUTH_REFRESH_TOKEN =", tokens.refresh_token);
    console.log("");
    console.log("   Go to: Vercel Dashboard → vonn_essentials → Settings →");
    console.log("           Environment Variables → Update GMAIL_OAUTH_REFRESH_TOKEN");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    server.close(() => process.exit(0));
  } catch (err) {
    console.error("Error exchanging token:", err.message);
    res.end("Error: " + err.message);
    server.close(() => process.exit(1));
  }
});

server.listen(4040, () => {
  console.log("Waiting for Google to redirect to http://localhost:4040/oauth2callback ...\n");
});
