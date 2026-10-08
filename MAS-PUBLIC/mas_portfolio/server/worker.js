export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        };

        // CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });
        }

        // Test route
        if (request.method === "GET" && url.pathname === "/") {
            return Response.json(
                {
                    success: true,
                    message: "MAS Portfolio API is running!"
                },
                { headers: corsHeaders }
            );
        }

        // Contact form
        if (request.method === "POST" && url.pathname === "/api/contact") {
            try {
                const { name, email, message } = await request.json();

                // Validate fields
                if (!name || !email || !message) {
                    return Response.json(
                        {
                            success: false,
                            message: "Please fill in all fields."
                        },
                        {
                            status: 400,
                            headers: corsHeaders
                        }
                    );
                }

                // Save message to D1
                await env.DB
                    .prepare(`
              INSERT INTO contacts (name, email, message)
              VALUES (?, ?, ?)
            `)
                    .bind(name, email, message)
                    .run();

                return Response.json(
                    {
                        success: true,
                        message: "Message saved successfully!"
                    },
                    {
                        status: 201,
                        headers: corsHeaders
                    }
                );

            } catch (error) {
                console.error("Contact API error:", error);

                return Response.json(
                    {
                        success: false,
                        message: "Unable to save message."
                    },
                    {
                        status: 500,
                        headers: corsHeaders
                    }
                );
            }
        }

        // Route not found
        return Response.json(
            {
                success: false,
                message: "Route not found."
            },
            {
                status: 404,
                headers: corsHeaders
            }
        );
    }
};