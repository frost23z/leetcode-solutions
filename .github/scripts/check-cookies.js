// check-cookies.js
//
// Quickly checks whether the current LEETCODE_SESSION / csrftoken cookies
// are still valid, WITHOUT launching a browser or logging in. Writes
// `valid=true` or `valid=false` to $GITHUB_OUTPUT so the workflow can decide
// whether to run the (heavier, riskier) Playwright login step.
//
// Required environment variables:
//   LEETCODE_SESSION     - current session cookie value
//   LEETCODE_CSRF_TOKEN  - current csrftoken cookie value
//   GITHUB_OUTPUT        - auto-provided by GitHub Actions

const fs = require("fs");

const GRAPHQL_URL = "https://leetcode.com/graphql/";

const QUERY = {
  query: `
    query globalData {
      userStatus {
        isSignedIn
        username
      }
    }
  `,
};

function writeOutput(valid) {
  const outputPath = process.env.GITHUB_OUTPUT;
  const line = `valid=${valid}\n`;
  if (outputPath) {
    fs.appendFileSync(outputPath, line);
  }
  console.log(`Cookie check result: valid=${valid}`);
}

(async () => {
  const session = process.env.LEETCODE_SESSION;
  const csrf = process.env.LEETCODE_CSRF_TOKEN;

  if (!session || !csrf) {
    console.log(
      "No existing session/csrf secrets found — treating as invalid.",
    );
    writeOutput(false);
    return;
  }

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `LEETCODE_SESSION=${session}; csrftoken=${csrf}`,
        "x-csrftoken": csrf,
        Referer: "https://leetcode.com",
      },
      body: JSON.stringify(QUERY),
    });

    if (!res.ok) {
      console.log(
        `Request failed with status ${res.status} — treating as invalid.`,
      );
      writeOutput(false);
      return;
    }

    const data = await res.json();
    const isSignedIn =
      data &&
      data.data &&
      data.data.userStatus &&
      data.data.userStatus.isSignedIn;

    if (isSignedIn) {
      console.log(
        `Session still valid for user: ${data.data.userStatus.username}`,
      );
      writeOutput(true);
    } else {
      console.log(
        "Session responded but isSignedIn=false — treating as invalid.",
      );
      writeOutput(false);
    }
  } catch (err) {
    console.log(
      "Error while checking session, treating as invalid:",
      err.message,
    );
    writeOutput(false);
  }
})();
