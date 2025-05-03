import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      console.error("No image data provided")
      return NextResponse.json({ error: "Image data is required" }, { status: 400 })
    }

    // Remove the data URL prefix to get just the base64 data
    const base64Image = image.split(",")[1]

    // Create the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" })

    // Generate content
    const result = await model.generateContent([
      "Analyze this handwritten content and provide a detailed explanation. Consider the following aspects:\n\n" +
      "1. If it's a mathematical expression or equation:\n" +
      "   - Explain the mathematical concepts involved\n" +
      "   - Break down the steps if it's a calculation\n" +
      "   - Provide the solution if applicable\n" +
      "   - Explain any formulas or theorems used\n\n" +
      "2. If it's a chemical formula or equation:\n" +
      "   - Identify the elements and compounds\n" +
      "   - Explain the chemical reaction if present\n" +
      "   - Describe the properties and significance\n" +
      "   - Explain any chemical principles involved\n\n" +
      "3. If it's a physics formula or concept:\n" +
      "   - Explain the physical principles\n" +
      "   - Describe the variables and their meanings\n" +
      "   - Explain the applications and significance\n" +
      "   - Provide relevant examples\n\n" +
      "4. If it's a general note or text:\n" +
      "   - Summarize the main points\n" +
      "   - Explain key concepts\n" +
      "   - Provide context and significance\n" +
      "   - Suggest related topics or further reading\n\n" +
      "Provide a clear, detailed explanation that would help someone understand the content thoroughly.",
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/png"
        }
      }
    ])

    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      response: text,
    })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
