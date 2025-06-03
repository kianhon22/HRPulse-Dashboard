import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        recommendations: ['AI recommendations unavailable - API key not configured'] 
      });
    }

    // Initialize the Gemini SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

    // Generate content using the SDK
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
        
    // Split recommendations by the unique separator
    const parts = text.split('###RECOMMENDATION###');
    const recommendations = parts
      .filter(part => part.trim().length > 15) // Filter out empty parts and separators
      // .map(part => part.trim())
      .map(part => {
        let text = part.trim();
        text = text.replace(/(\d+[\)])/g, '\n$1');
        return text.trim();
      })
      .slice(0, 5); // Take exactly 5 recommendations
        
    return NextResponse.json({ 
      recommendations: recommendations.length > 0 ? recommendations : ['Unable to generate recommendations'] 
    });
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json({ 
      recommendations: ['Unable to generate recommendations'] 
    });
  }
} 