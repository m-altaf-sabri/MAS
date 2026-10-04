export default {
    async fetch(request, env) {
        try {
            const result = await env.DB
                .prepare("SELECT name FROM sqlite_master WHERE type='table'")
                .all();

            return Response.json({
                success: true,
                message: "Cloudflare Worker + D1 connected!",
                tables: result.results
            });
        } catch (error) {
            return Response.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }
    }
  };