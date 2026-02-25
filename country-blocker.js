const CONFIG = {
  blockedCountries: new Set(["CN","RU","IR","KP","BY","SY","CU","VE","TM","EG","SA","AE","TR","PK"]),
  geoIPRanges: [],
  abusiveIPs: new Set(),
  rateLimit: { maxRequests: 5, windowMs: 10000 }
};

const ipAccess = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  let times = ipAccess.get(ip) || [];
  times = times.filter(t => now - t < CONFIG.rateLimit.windowMs);
  if (times.length >= CONFIG.rateLimit.maxRequests) return true;
  times.push(now);
  ipAccess.set(ip, times);
  return false;
}

function ipToNumber(ip) {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
}

function getCountryFromIP(ip) {
  if (!CONFIG.geoIPRanges.length) return null;
  const ipNum = ipToNumber(ip);
  let left = 0, right = CONFIG.geoIPRanges.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const r = CONFIG.geoIPRanges[mid];
    if (ipNum < r.start) right = mid - 1;
    else if (ipNum > r.end) left = mid + 1;
    else return r.country;
  }
  return null;
}

function isBlocked(ip) {
  if (isRateLimited(ip)) return true;
  if (CONFIG.abusiveIPs.has(ip)) return true;
  const country = getCountryFromIP(ip);
  if (!country) return true;
  return CONFIG.blockedCountries.has(country);
}

function handleAccess(ip) {
  return !isBlocked(ip);
}

function loadGeoIPRanges(json) {
  CONFIG.geoIPRanges = json
    .map(r => ({ start: ipToNumber(r.start), end: ipToNumber(r.end), country: r.country }))
    .sort((a,b) => a.start - b.start);
}

async function fetchAbuseFeed(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch abuse feed");
    const text = await res.text();
    return text.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#"));
  } catch(e) {
    console.error("Failed to fetch abuse feed:", url, e);
    return [];
  }
}

async function loadAbusiveIPs(feeds) {
  const results = await Promise.all(feeds.map(fetchAbuseFeed));
  CONFIG.abusiveIPs = new Set(results.flat());
}

async function loadGeoIPFromPublicFeed(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch GeoIP feed");
    const json = await res.json();
    loadGeoIPRanges(json);
  } catch(e) {
    console.error("Failed to load GeoIP feed:", e);
  }
}

function scheduleFeedRefresh(geoIPUrl, abuseFeeds, intervalMs) {
  loadGeoIPFromPublicFeed(geoIPUrl);
  loadAbusiveIPs(abuseFeeds);
  setInterval(() => {
    loadGeoIPFromPublicFeed(geoIPUrl);
    loadAbusiveIPs(abuseFeeds);
  }, intervalMs);
}

// ----- REAL PUBLIC FEEDS -----
const GEOIP_PUBLIC_URL = "https://raw.githubusercontent.com/hotcakex/official-iana-ip-blocks/main/country-split/ip4.json";
const ABUSE_PUBLIC_FEEDS = [
  "https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/ciarmy.ipset",
  "https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/dshield.netset",
  "https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/ipsum.list",
  "https://raw.githubusercontent.com/iamshab/Malicious-IPs-Feed/main/AFAT-Clean-IPs.txt",
  "https://www.spamhaus.org/drop/drop_v4.json"
];

// Start auto-refresh every 10 minutes
scheduleFeedRefresh(GEOIP_PUBLIC_URL, ABUSE_PUBLIC_FEEDS, 10 * 60 * 1000);
