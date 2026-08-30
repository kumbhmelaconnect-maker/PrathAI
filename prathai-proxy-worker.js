// Cloudflare Worker — PrathAI साठी सुरक्षित API प्रॉक्सी
// हे तैनात (deploy) झाल्यावर तुमची Tavily key फक्त इथे राहते,
// browser/PWA मध्ये कधीच पाठवली जात नाही.

const ALLOWED_ORIGINS = [
  "https://<your-username>.github.io",   // PrathAI ची GitHub Pages URL टाका
  "https://<your-username>.github.io/kumbhconnect"  // गरज असल्यास KumbhConnect ची पण
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response("Origin not allowed", { status: 403, headers: corsHeaders });
    }

    try {
      const body = await request.json();

      // browser ने फक्त query/context पाठवायचा — key कधीच नाही
      const tavilyResponse = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: env.TAVILY_API_KEY,   // Worker secret — कधीच browser ला दिसत नाही
          query: body.query,
          search_depth: body.search_depth || "advanced",
          include_answer: true,
        }),
      });

      const data = await tavilyResponse.json();

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Proxy error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
