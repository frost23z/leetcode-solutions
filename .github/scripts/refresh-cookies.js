// refresh-cookies.js
//
// Logs into LeetCode headlessly with Playwright, extracts the LEETCODE_SESSION
// and csrftoken cookies, and pushes them into this repo's GitHub Actions
// secrets using the `gh` CLI. Intended to run as a step BEFORE the
// leetcode-sync action in the same workflow, so that action always gets
// fresh cookies.
//
// Required environment variables (all provided via GitHub Actions secrets):
//   LEETCODE_USERNAME   - LeetCode login email or username
//   LEETCODE_PASSWORD   - LeetCode password
//   GH_SECRETS_PAT       - PAT with permission to write secrets to this repo
//   GITHUB_REPOSITORY   - auto-provided by GitHub Actions ("owner/repo")

const { chromium } = require("playwright");
const { execSync } = require("child_process");

const LOGIN_URL = "https://leetcode.com/accounts/login/";

function requireEnv(name) {
  const val = process.env[name];
  if (!val) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return val;
}

function setGithubSecret(name, value) {
  // Uses the gh CLI (authenticated via GH_SECRETS_PAT in the workflow env)
  // to write a repo secret. `gh secret set` reads the value from stdin so
  // it never appears in process listings or shell history.
  execSync(`gh secret set ${name}`, {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
  });
}

(async () => {
  const username = requireEnv("LEETCODE_USERNAME");
  const password = requireEnv("LEETCODE_PASSWORD");
  requireEnv("GH_SECRETS_PAT"); // used implicitly by `gh`, validated here
  requireEnv("GITHUB_REPOSITORY");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    console.log("Navigating to LeetCode login page...");
    await page.goto(LOGIN_URL, { waitUntil: "networkidle" });

    // Field selectors as of writing. If LeetCode changes their login form,
    // update these selectors (inspect the page in devtools).
    await page.fill("#id_login", username);
    await page.fill("#id_password", password);

    await Promise.all([
      page
        .waitForNavigation({ waitUntil: "networkidle", timeout: 30000 })
        .catch(() => null),
      page.click("#signin_btn"),
    ]);

    // Give the page a moment to settle / set cookies after redirect.
    await page.waitForTimeout(2000);
  } catch (err) {
    console.error("Login flow failed:", err);
    await page.screenshot({ path: "login-failure.png" }).catch(() => {});
    await browser.close();
    process.exit(1);
  }

  // Check whether login actually succeeded (LeetCode redirects logged-in
  // users away from /accounts/login/). If we're still on the login page,
  // something went wrong (bad credentials, CAPTCHA, bot challenge, etc.)
  const currentUrl = page.url();
  if (currentUrl.includes("/accounts/login")) {
    console.error(
      "Still on login page after submit — login likely failed (bad credentials, CAPTCHA, or bot challenge).",
    );
    await page.screenshot({ path: "login-failure.png" }).catch(() => {});
    await browser.close();
    process.exit(1);
  }

  const cookies = await context.cookies();
  const sessionCookie = cookies.find((c) => c.name === "LEETCODE_SESSION");
  const csrfCookie = cookies.find((c) => c.name === "csrftoken");

  await browser.close();

  if (!sessionCookie || !csrfCookie) {
    console.error(
      "Could not find LEETCODE_SESSION or csrftoken cookie after login.",
    );
    process.exit(1);
  }

  console.log(
    "Login succeeded, cookies retrieved. Pushing to GitHub secrets...",
  );

  try {
    setGithubSecret("LEETCODE_SESSION", sessionCookie.value);
    setGithubSecret("LEETCODE_CSRF_TOKEN", csrfCookie.value);
    console.log("Secrets updated successfully.");
  } catch (err) {
    console.error("Failed to update GitHub secrets:", err);
    process.exit(1);
  }
})();
