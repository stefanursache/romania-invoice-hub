import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      throw new Error("No image provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call Lovable AI to extract invoice data
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert at extracting structured data from invoice images. Extract all relevant invoice information and return it in JSON format.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract the following information from this invoice image:
- Invoice number
- Issue date (in YYYY-MM-DD format)
- Due date (in YYYY-MM-DD format)
- Client name
- Client CUI/CIF (tax identification number)
- Client Reg. Com. (registration number)
- Client address
- Client email
- Client phone
- Currency (RON, EUR, USD)
- Line items (each with: description, quantity, unit_price, vat_rate as decimal like 0.19 for 19%)
- Notes or additional information

Return ONLY valid JSON with this exact structure (no markdown, no explanations):
{
  "invoice_number": "string",
  "issue_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "client": {
    "name": "string",
    "cui_cif": "string or null",
    "reg_com": "string or null",
    "address": "string or null",
    "email": "string or null",
    "phone": "string or null"
  },
  "currency": "RON",
  "items": [
    {
      "description": "string",
      "quantity": number,
      "unit_price": number,
      "vat_rate": number
    }
  ],
  "notes": "string or null"
}`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_invoice_data",
              description: "Extract structured invoice data from the image",
              parameters: {
                type: "object",
                properties: {
                  invoice_number: { type: "string" },
                  issue_date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
                  due_date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
                  client: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      cui_cif: { type: ["string", "null"] },
                      reg_com: { type: ["string", "null"] },
                      address: { type: ["string", "null"] },
                      email: { type: ["string", "null"] },
                      phone: { type: ["string", "null"] },
                    },
                    required: ["name"],
                  },
                  currency: { type: "string", enum: ["RON", "EUR", "USD"] },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        quantity: { type: "number" },
                        unit_price: { type: "number" },
                        vat_rate: { type: "number" },
                      },
                      required: ["description", "quantity", "unit_price", "vat_rate"],
                    },
                  },
                  notes: { type: ["string", "null"] },
                },
                required: ["invoice_number", "issue_date", "due_date", "client", "currency", "items"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_invoice_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    
    // Extract the function call arguments
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const invoiceData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(invoiceData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});