import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { conversationText } = await request.json();

    if (!conversationText) {
      return new NextResponse('Conversation text is required', { status: 400 });
    }

    // This prompt instructs the AI to create a concise summary.
    const prompt = `Briefly summarize the key points of this conversation in a single, short sentence: "${conversationText}"`;

    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    const apiKey = process.env.GEMINI_API_KEY; 
    if (!apiKey) {
        console.error("Gemini API key is not configured.");
        return new NextResponse('Internal Server Error', { status: 500 });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // Call the Gemini API to get the summary
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Gemini API request failed:", errorBody);
        return new NextResponse(`Error from Gemini API: ${response.statusText}`, { status: response.status });
    }

    const result = await response.json();
    
    // Extract the summary text from the response
    const summary = result.candidates[0]?.content?.parts[0]?.text || "Could not generate summary.";

    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error('Error in summarization route:', error);
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}
