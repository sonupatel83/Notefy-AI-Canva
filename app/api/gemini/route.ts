import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      console.error("No image data provided")
      return NextResponse.json({ error: "Image data is required" }, { status: 400 })
    }

    // Remove the data URL prefix to get just the base64 data
    const base64Image = image.split(",")[1]

    const flaskApiUrl = process.env.FLASK_API_URL || "http://127.0.0.1:5000"
    console.log(`Calling Flask API at: ${flaskApiUrl}/analyze`)

    // Call the Flask backend
    const flaskResponse = await fetch(`${flaskApiUrl}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
        api_key: process.env.GEMINI_API_KEY,
      }),
      cache: "no-store",
    })

    if (!flaskResponse.ok) {
      const errorText = await flaskResponse.text()
      console.error("Flask API error:", errorText)
      return NextResponse.json(
        { error: `Failed to process image with Gemini API: ${errorText}` },
        { status: flaskResponse.status },
      )
    }

    const data = await flaskResponse.json()

    return NextResponse.json({
      response: data.response,
    })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

