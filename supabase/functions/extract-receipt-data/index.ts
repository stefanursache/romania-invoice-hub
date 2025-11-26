import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Common expense categories for Romanian businesses
const EXPENSE_CATEGORIES = [
  "Transporturi",
  "Cazare",
  "Masa (restaurant)",
  "Materiale/Echipamente",
  "Servicii profesionale",
  "Utilitati",
  "Marketing/Publicitate",
  "Birotica",
  "Combustibil",
  "Telefonie/Internet",
  "Altele"
];

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

    // Call Lovable AI to extract receipt data
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
            content: `You are an expert at extracting structured data from receipt images. Extract all relevant information and automatically categorize the expense.
            
Available categories: ${EXPENSE_CATEGORIES.join(", ")}

Rules for categorization:
- Restaurants, cafes, food delivery → "Masa (restaurant)"
- Gas stations, fuel → "Combustibil"
- Hotels, accommodation → "Cazare"
- Taxi, Uber, car rental, parking → "Transporturi"
- Office supplies, stationery → "Birotica"
- Hardware, tools, equipment → "Materiale/Echipamente"
- Advertising, marketing agencies → "Marketing/Publicitate"
- Electricity, water, gas bills → "Utilitati"
- Phone, internet bills → "Telefonie/Internet"
- Consulting, legal, accounting services → "Servicii profesionale"
- Everything else → "Altele"`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract the following information from this receipt image:
- Date of purchase (in YYYY-MM-DD format)
- Merchant/vendor name
- Total amount
- VAT/TVA amount (if shown, otherwise calculate as 19% of subtotal if applicable)
- Currency (RON, EUR, USD)
- Description of items purchased (brief summary)
- Automatically determine the most appropriate category

Return ONLY valid JSON with this exact structure (no markdown, no explanations):
{
  "expense_date": "YYYY-MM-DD",
  "merchant": "string",
  "category": "one of the available categories",
  "amount": number,
  "vat_amount": number,
  "currency": "RON",
  "description": "brief description of items/services",
  "confidence": number between 0-1
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
              name: "extract_receipt_data",
              description: "Extract structured receipt data from the image",
              parameters: {
                type: "object",
                properties: {
                  expense_date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
                  merchant: { type: "string" },
                  category: { 
                    type: "string",
                    enum: EXPENSE_CATEGORIES
                  },
                  amount: { type: "number" },
                  vat_amount: { type: "number" },
                  currency: { type: "string", enum: ["RON", "EUR", "USD"] },
                  description: { type: "string" },
                  confidence: { type: "number", minimum: 0, maximum: 1 }
                },
                required: ["expense_date", "merchant", "category", "amount", "vat_amount", "currency", "description", "confidence"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_receipt_data" } },
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

    const receiptData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(receiptData), {
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