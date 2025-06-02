import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        recommendations: ['AI recommendations unavailable - API key not configured'] 
      });
    }

    // Initialize the Gemini SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Generate content using the SDK
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Split recommendations by bullet points or numbers and filter out empty ones
    const recommendations = text.split(/[\n•\-\d+\.]\s*/).filter((item: string) => item.trim().length > 20);
    
    return NextResponse.json({ 
      recommendations: recommendations.slice(0, 6) 
    });
  } catch (error) {
    return NextResponse.json({ 
      recommendations: ['Unable to generate recommendations'] 
    });
  }
} 