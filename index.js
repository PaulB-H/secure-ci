require("dotenv").config();
const fs = require("fs/promises");
const makeRequest = require("./makeRequest");

const ci_port = process.env.CI_PORT;
const ci_url = process.env.CI_URL;

async function updateNginxLocationBlock() {
  try {
    const cloudflareResponse = await makeRequest({
      hostname: "api.cloudflare.com",
      path: "/client/v4/ips",
      method: "GET",
    });
    const cloudflareIpv4Ranges = cloudflareResponse.result.ipv4_cidrs;
    const cloudflareIpv6Ranges = cloudflareResponse.result.ipv6_cidrs;

    const githubResponse = await makeRequest({
      hostname: "api.github.com",
      path: "/meta",
      method: "GET",
      headers: {
        "User-Agent": "secure-ci",
      },
    });
    const githubIpRanges = githubResponse.hooks;

    const cloudflareIpv4AllowDirectives = cloudflareIpv4Ranges
      .map((ipRange) => `set_real_ip_from ${ipRange};`)
      .join("\n  ");

    const cloudflareIpv6AllowDirectives = cloudflareIpv6Ranges
      .map((ipRange) => `set_real_ip_from ${ipRange};`)
      .join("\n  ");

    const githubAllowDirectives = githubIpRanges
      .map((ipRange) => `allow ${ipRange};`)
      .join("\n  ");

    // Create the full NGINX location block
    const locationBlock = `location /${ci_url} {
  # This config:
  #   1. Allows Cloudflares IP range to "set-real-ip"
  #   2. Whitelists Githubs IP's used for webhooks
  #   3. Blocks all other requests
  #   4. Changes 403 into 404 errors to "mask" the server

  # Cloudflare IPv4 IP's
  ${cloudflareIpv4AllowDirectives}

  # Cloudflare IPv6 IP's
  ${cloudflareIpv6AllowDirectives}

  # Github Hook IP's
  ${githubAllowDirectives}

  deny all;

  error_page 403 404;

  proxy_pass http://localhost:${ci_port};
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}`;

    await fs.writeFile("whitelist-gh-hooks.conf", locationBlock);

    console.log("NGINX Location Block Updated.");
  } catch (error) {
    console.error("Error writing NGINX location to file:", error.message);
  }
}

updateNginxLocationBlock();
