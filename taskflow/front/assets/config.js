const railwayDomain = (process.env.RAILWAY_PUBLIC_DOMAIN || "").replace(/^\/+/, "");
const API_BASE = localStorage.getItem("taskflow_api_base") || ("https://"+railwayDomain);


module.exports = API_BASE;