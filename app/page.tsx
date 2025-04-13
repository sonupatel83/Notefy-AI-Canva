"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Eraser, Pencil, Search, Download, Trash2, X, ChevronDown } from "lucide-react"
import { SketchPicker } from "react-color"
import AIResponseDisplay from "@/components/ai-response-display"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function CanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState("#000000")
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")
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
  const [showPenOptions, setShowPenOptions] = useState(false)
  const [showEraserOptions, setShowEraserOptions] = useState(false)
  const [eraserMode, setEraserMode] = useState<"stroke" | "point">("stroke")

  const writingColors = [
    { name: "Black", value: "#000000" },
    { name: "Dark Blue", value: "#000080" },
    { name: "Dark Green", value: "#006400" },
    { name: "Dark Red", value: "#8B0000" },
    { name: "White", value: "#FFFFFF" }
  ]

  const getContrastingColor = (bgColor: string) => {
    const r = parseInt(bgColor.slice(1, 3), 16)
    const g = parseInt(bgColor.slice(3, 5), 16)
    const b = parseInt(bgColor.slice(5, 7), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128 ? "#000000" : "#FFFFFF"
  }

  const handleBackgroundColorChange = (newColor: string) => {
    if (!ctx || !canvasRef.current) return
    const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
    setBackgroundColor(newColor)
    ctx.fillStyle = newColor
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    ctx.putImageData(imageData, 0, 0)
    const contrastingColor = getContrastingColor(newColor)
    setColor(contrastingColor)
  }

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
        context.fillStyle = backgroundColor
        context.fillRect(0, 0, canvas.width, canvas.height)
        setCtx(context)
      }
    }
  }, [canvasHeight, backgroundColor])

  useEffect(() => {
    if (ctx) {
      ctx.strokeStyle = tool === "pen" ? color : backgroundColor
      ctx.lineWidth = lineWidth
    }
  }, [color, lineWidth, tool, ctx, backgroundColor])

  useEffect(() => {
    if (aiResponse) {
      setShowAiResponse(true)
    }
  }, [aiResponse])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ctx) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

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
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    if (tool === "selection" && isSelecting) {
      setSelectionEnd({ x, y })
      return
    }

    if (!isDrawing) return

    if (tool === "eraser" && eraserMode === "point") {
      ctx.beginPath()
      ctx.arc(x, y, lineWidth / 2, 0, Math.PI * 2)
      ctx.fillStyle = backgroundColor
      ctx.fill()
    } else {
      ctx.lineTo(x, y)
      ctx.stroke()
    }
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
    ctx.fillStyle = backgroundColor
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
    setTool("pen")

    try {
      const x = Math.min(selectionStart.x, selectionEnd.x)
      const y = Math.min(selectionStart.y, selectionEnd.y)
      const width = Math.abs(selectionEnd.x - selectionStart.x)
      const height = Math.abs(selectionEnd.y - selectionStart.y)

      if (width < 10 || height < 10) {
        throw new Error("Selection area is too small. Please select a larger area.")
      }

      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = width
      tempCanvas.height = height
      const tempCtx = tempCanvas.getContext("2d")

      if (tempCtx && ctx) {
        tempCtx.drawImage(canvasRef.current, x, y, width, height, 0, 0, width, height)
        const imageData = tempCanvas.toDataURL("image/png")

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
    if (!selectionStart || !selectionEnd || !canvasRef.current) return null
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = rect.width / canvas.width
    const scaleY = rect.height / canvas.height
    const left = Math.min(selectionStart.x, selectionEnd.x) * scaleX
    const top = Math.min(selectionStart.y, selectionEnd.y) * scaleY
    const width = Math.abs(selectionEnd.x - selectionStart.x) * scaleX
    const height = Math.abs(selectionEnd.y - selectionStart.y) * scaleY

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
              {/* Pen Tool */}
              <Popover open={showPenOptions} onOpenChange={setShowPenOptions}>
                <PopoverTrigger asChild>
                  <Button
                    variant={tool === "pen" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTool("pen")}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Pen
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Pen Color:</span>
                      <div className="grid grid-cols-5 gap-2">
                        {writingColors.map((colorOption) => (
                          <button
                            key={colorOption.value}
                            className={`w-8 h-8 rounded-full border-2 ${
                              color === colorOption.value ? "border-blue-500" : "border-gray-300"
                            }`}
                            style={{ backgroundColor: colorOption.value }}
                            onClick={() => {
                              setColor(colorOption.value)
                              setShowColorPicker(false)
                            }}
                            title={colorOption.name}
                          />
                        ))}
                      </div>
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
                  </div>
                </PopoverContent>
              </Popover>

              {/* Eraser Tool */}
              <Popover open={showEraserOptions} onOpenChange={setShowEraserOptions}>
                <PopoverTrigger asChild>
                  <Button
                    variant={tool === "eraser" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTool("eraser")}
                  >
                    <Eraser className="h-4 w-4 mr-2" />
                    Eraser
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Eraser Mode:</span>
                      <Button
                        variant={eraserMode === "stroke" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEraserMode("stroke")}
                      >
                        Stroke
                      </Button>
                      <Button
                        variant={eraserMode === "point" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEraserMode("point")}
                      >
                        Point
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Size: {lineWidth}px</span>
                      <Slider
                        value={[lineWidth]}
                        min={1}
                        max={50}
                        step={1}
                        onValueChange={(value) => setLineWidth(value[0])}
                        className="w-48"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Background Color */}
              <Popover open={showBgColorPicker} onOpenChange={setShowBgColorPicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <span className="text-sm font-medium">Background</span>
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Background Color:</span>
                      <div className="grid grid-cols-5 gap-2">
                        {writingColors.map((colorOption) => (
                          <button
                            key={colorOption.value}
                            className={`w-8 h-8 rounded-full border-2 ${
                              backgroundColor === colorOption.value ? "border-blue-500" : "border-gray-300"
                            }`}
                            style={{ backgroundColor: colorOption.value }}
                            onClick={() => {
                              handleBackgroundColorChange(colorOption.value)
                              setShowBgColorPicker(false)
                            }}
                            title={colorOption.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Selection Tool */}
              <Button
                variant={tool === "selection" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("selection")}
              >
                <Search className="h-4 w-4 mr-2" />
                Selection
              </Button>

              {/* Action Buttons */}
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
              className="w-full border border-gray-200 rounded-lg touch-none"
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

