"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eraser, Pencil, Search, Download, Trash2, X } from "lucide-react"
import { SketchPicker } from "react-color"
import AIResponseDisplay from "@/components/ai-response-display"
import { cn } from "@/lib/utils"

export default function CanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState("#000000")
  const [bgColor, setBgColor] = useState("#ffffff")
  const [lineWidth, setLineWidth] = useState(2)
  const [tool, setTool] = useState<"pen" | "eraser" | "selection">("pen")
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showBgColorPicker, setShowBgColorPicker] = useState(false)
  const [showAiResponse, setShowAiResponse] = useState(false)
  const [canvasHeight, setCanvasHeight] = useState(600)

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      canvas.width = canvas.offsetWidth
      canvas.height = canvasHeight
      const context = canvas.getContext("2d")
      if (context) {
        context.lineCap = "round"
        context.lineJoin = "round"
        context.strokeStyle = color
        context.lineWidth = lineWidth
        setCtx(context)

        // Fill canvas with background color
        context.fillStyle = bgColor
        context.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [bgColor, canvasHeight])

  useEffect(() => {
    if (ctx) {
      ctx.strokeStyle = tool === "pen" ? color : bgColor
      ctx.lineWidth = lineWidth
    }
  }, [color, lineWidth, tool, ctx, bgColor])

  // Set AI response visibility when response changes
  useEffect(() => {
    if (aiResponse) {
      setShowAiResponse(true)
    }
  }, [aiResponse])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ctx) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top + window.scrollY

    if (tool === "selection") {
      setIsSelecting(true)
      setSelectionStart({ x, y })
      setSelectionEnd({ x, y })
      return
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ctx) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top + window.scrollY

    if (tool === "selection" && isSelecting) {
      setSelectionEnd({ x, y })
      return
    }

    if (!isDrawing) return

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!ctx) return

    if (tool === "selection" && isSelecting) {
      setIsSelecting(false)
      return
    }

    ctx.closePath()
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setSelectionStart(null)
    setSelectionEnd(null)
    setAiResponse(null)
    setShowAiResponse(false)
  }

  const downloadCanvas = () => {
    if (!canvasRef.current) return
    const link = document.createElement("a")
    link.download = "ai-notes.png"
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  const searchWithGemini = async () => {
    if (!selectionStart || !selectionEnd || !canvasRef.current) return

    setIsLoading(true)
    setAiResponse(null)

    try {
      // Get the selection area
      const x = Math.min(selectionStart.x, selectionEnd.x)
      const y = Math.min(selectionStart.y, selectionEnd.y)
      const width = Math.abs(selectionEnd.x - selectionStart.x)
      const height = Math.abs(selectionEnd.y - selectionStart.y)

      // Ensure we have a valid selection
      if (width < 10 || height < 10) {
        throw new Error("Selection area is too small. Please select a larger area.")
      }

      // Create a temporary canvas to hold the selection
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = width
      tempCanvas.height = height
      const tempCtx = tempCanvas.getContext("2d")

      if (tempCtx && ctx) {
        // Draw the selection to the temporary canvas
        tempCtx.drawImage(canvasRef.current, x, y, width, height, 0, 0, width, height)

        // Convert to base64
        const imageData = tempCanvas.toDataURL("image/png")

        console.log("Sending image to API...")

        // Send to backend
        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: imageData }),
          cache: "no-store",
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to get response from Gemini API")
        }

        setAiResponse(data.response)
        setShowAiResponse(true)
      }
    } catch (error) {
      console.error("Error searching with Gemini:", error)
      setAiResponse(
        `Error: ${error instanceof Error ? error.message : "Failed to process your request. Please try again."}`,
      )
      setShowAiResponse(true)
    } finally {
      setIsLoading(false)
    }
  }

  const closeAiResponse = () => {
    setShowAiResponse(false)
  }

  const increaseCanvasHeight = () => {
    setCanvasHeight((prevHeight) => prevHeight + 300)
  }

  const renderSelectionBox = () => {
    if (!selectionStart || !selectionEnd) return null

    const left = Math.min(selectionStart.x, selectionEnd.x)
    const top = Math.min(selectionStart.y, selectionEnd.y)
    const width = Math.abs(selectionEnd.x - selectionStart.x)
    const height = Math.abs(selectionEnd.y - selectionStart.y)

    return (
      <div
        className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-20 pointer-events-none"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
        }}
      />
    )
  }

  return (
    <div className="flex flex-col min-h-screen p-4 bg-gray-50">
      <h1 className="text-3xl font-bold mb-4 text-center">AI-Powered Canvas Notes</h1>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className={cn("flex-1 flex flex-col transition-all duration-300", showAiResponse ? "lg:w-2/3" : "w-full")}>
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Tabs defaultValue="pen" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger
                    value="pen"
                    onClick={() => setTool("pen")}
                    className={tool === "pen" ? "bg-blue-100" : ""}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Pen
                  </TabsTrigger>
                  <TabsTrigger
                    value="eraser"
                    onClick={() => setTool("eraser")}
                    className={tool === "eraser" ? "bg-blue-100" : ""}
                  >
                    <Eraser className="h-4 w-4 mr-2" />
                    Eraser
                  </TabsTrigger>
                  <TabsTrigger
                    value="selection"
                    onClick={() => setTool("selection")}
                    className={tool === "selection" ? "bg-blue-100" : ""}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Selection
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pen" className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Pen Color:</span>
                    <div
                      className="w-8 h-8 rounded-full border border-gray-300 cursor-pointer"
                      style={{ backgroundColor: color }}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    />
                    {showColorPicker && (
                      <div className="absolute z-10 mt-2">
                        <div className="fixed inset-0" onClick={() => setShowColorPicker(false)} />
                        <SketchPicker color={color} onChange={(color) => setColor(color.hex)} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Line Width: {lineWidth}px</span>
                    <Slider
                      value={[lineWidth]}
                      min={1}
                      max={20}
                      step={1}
                      onValueChange={(value) => setLineWidth(value[0])}
                      className="w-48"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="eraser" className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Eraser Size: {lineWidth}px</span>
                    <Slider
                      value={[lineWidth]}
                      min={1}
                      max={50}
                      step={1}
                      onValueChange={(value) => setLineWidth(value[0])}
                      className="w-48"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="selection">
                  <p className="text-sm text-gray-600">
                    Click and drag to select an area of your notes, then use the search button to get AI insights.
                  </p>
                </TabsContent>
              </Tabs>

              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm font-medium">Background:</span>
                <div
                  className="w-8 h-8 rounded-full border border-gray-300 cursor-pointer"
                  style={{ backgroundColor: bgColor }}
                  onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                />
                {showBgColorPicker && (
                  <div className="absolute z-10 mt-2">
                    <div className="fixed inset-0" onClick={() => setShowBgColorPicker(false)} />
                    <SketchPicker color={bgColor} onChange={(color) => setBgColor(color.hex)} />
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={downloadCanvas}>
                  <Download className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={clearCanvas}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={searchWithGemini}
                  disabled={!selectionStart || !selectionEnd || isLoading || tool !== "selection"}
                  className={cn(
                    "bg-blue-600 hover:bg-blue-700 text-white",
                    (!selectionStart || !selectionEnd || tool !== "selection") && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isLoading ? "Searching..." : "Search with AI"}
                </Button>
              </div>
            </div>
          </div>

          <div className="relative bg-white rounded-lg shadow-md overflow-hidden mb-4">
            <canvas
              ref={canvasRef}
              className="w-full border border-gray-200 rounded-lg"
              style={{ height: `${canvasHeight}px` }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            {renderSelectionBox()}
          </div>

          <Button variant="outline" className="mb-4 w-full" onClick={increaseCanvasHeight}>
            Add More Space
          </Button>
        </div>

        {showAiResponse && (
          <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-md p-4 overflow-y-auto max-h-[calc(100vh-150px)] sticky top-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">AI Response</h2>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={closeAiResponse}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
              </div>
            ) : aiResponse ? (
              <AIResponseDisplay content={aiResponse} />
            ) : (
              <div className="text-gray-500 italic">
                Select a portion of your notes and click "Search with AI" to get insights.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

