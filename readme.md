### secure-ci

Create an NGINX location block where we allow Clouflare to change origin IP, and whitelist Github's IP range for WebHooks.

Obtain IP ranges by querying Cloudflare & Github's API's.

Also hide the "public" facing route by returning 404 (not-found) errors when 403 (unauthorized) would have occurred.

Dependencies: ```dotenv```

---

### Usage

1. ```npm install```

2. Create a ```.env``` file and add ```CI_PORT``` and ```CI_URL``` values. This should be the port your ci-cd server is running on, and the URL to make it accessible at.

2. Run `node index`

3. Copy and paste the block from within the generated file in your domains NGINX server block

```
Example of an NGINX file with the generated block added.

server {

  server_name domain.com www.domain.com;

  root /var/www/domain;
  index index.html index.htm;

  location /ci-url {
    # Cloudflare IP ranges
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 104.16.0.0/12;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 199.27.128.0/21;

    real_ip_header X-Forwarded-For;

    allow 140.82.112.0/20;
    allow 185.199.108.0/22;
    allow 192.30.252.0/22;
    allow 143.55.64.0/20;
    allow 2a0a:a440::/29;
    allow 2606:50c0::/32;

    error_page 403 404;

    deny all;

    proxy_pass http://localhost:3000;
  }
}
```

---

### About

This was build to more easily generate, or refresh the config for a CI-CD project I am working on.

---

### Ideas

I could setup some kind of chron job on the server to query every so often and check if our IP ranges need updating, if so me if so run the app and copy our new ranges into the config, then run `nginx -s reload`
