"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Eraser, Pencil, Search, Download, Trash2, X, ChevronDown, Sun, Moon, User, LogOut } from "lucide-react"
import { SketchPicker } from "react-color"
import AIResponseDisplay from "@/components/ai-response-display"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { jsPDF } from 'jspdf'
import { useAuth, useUser, SignOutButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function CanvasPage() {
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState("#000000")
  const [lineWidth, setLineWidth] = useState(2)
  const [tool, setTool] = useState<"pen" | "eraser" | "selection">("pen")
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showAiResponse, setShowAiResponse] = useState(false)
  const [canvasHeight, setCanvasHeight] = useState(600)
  const [showPenOptions, setShowPenOptions] = useState(false)
  const [showEraserOptions, setShowEraserOptions] = useState(false)
  const [eraserMode, setEraserMode] = useState<"stroke" | "point">("stroke")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

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
        context.fillStyle = isDarkMode ? "#1a1a1a" : "#ffffff"
        context.fillRect(0, 0, canvas.width, canvas.height)
        setCtx(context)
      }
    }
  }, [canvasHeight, isDarkMode])

  useEffect(() => {
    if (ctx) {
      ctx.strokeStyle = tool === "pen" ? color : (isDarkMode ? "#1a1a1a" : "#ffffff")
      ctx.lineWidth = lineWidth
    }
  }, [color, lineWidth, tool, ctx, isDarkMode])

  useEffect(() => {
    if (aiResponse) {
      setShowAiResponse(true)
    }
  }, [aiResponse])

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(prefersDark)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  useEffect(() => {
    if (!ctx || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')
    
    if (tempCtx) {
      tempCtx.putImageData(imageData, 0, 0)
      ctx.fillStyle = isDarkMode ? "#1a1a1a" : "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(tempCanvas, 0, 0)
    }
  }, [isDarkMode, ctx])

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
      ctx.fillStyle = isDarkMode ? "#1a1a1a" : "#ffffff"
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

  const downloadCanvas = () => {
    if (!canvasRef.current) return
    
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvasRef.current.width
    tempCanvas.height = canvasRef.current.height
    const tempCtx = tempCanvas.getContext('2d')
    
    if (tempCtx && ctx) {
      tempCtx.drawImage(canvasRef.current, 0, 0)
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [tempCanvas.width, tempCanvas.height]
      })
      
      const imgData = tempCanvas.toDataURL('image/png', 1.0)
      pdf.addImage(imgData, 'PNG', 0, 0, tempCanvas.width, tempCanvas.height)
      pdf.save('canvas-drawing.pdf')
    }
  }

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return
    const canvas = canvasRef.current
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = isDarkMode ? "#1a1a1a" : "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.putImageData(imageData, 0, 0)
    
    setSelectionStart(null)
    setSelectionEnd(null)
    setAiResponse(null)
    setShowAiResponse(false)
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

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in')
    }
  }, [isLoaded, userId, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">AI-Powered Canvas Notes</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="ml-4"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          {/* Profile Section */}
          <Popover open={showProfile} onOpenChange={setShowProfile}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt="Profile"
                        className="h-12 w-12 rounded-full"
                      />
                    ) : (
                      <User className="h-6 w-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {user?.fullName || 'User'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <SignOutButton>
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </SignOutButton>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className={cn("flex-1 flex flex-col transition-all duration-300", showAiResponse ? "lg:w-2/3" : "w-full")}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
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
                  Download PDF
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

          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4">
            <canvas
              ref={canvasRef}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg touch-none"
              style={{ height: `${canvasHeight}px` }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            {renderSelectionBox()}
          </div>

          <Button variant="outline" className="mb-4 w-full dark:bg-gray-800 dark:text-white" onClick={increaseCanvasHeight}>
            Add More Space
          </Button>
        </div>

        {showAiResponse && (
          <div className="w-full lg:w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 overflow-y-auto max-h-[calc(100vh-150px)] sticky top-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Response</h2>
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
              <div className="text-gray-500 dark:text-gray-400 italic">
                Select a portion of your notes and click "Search with AI" to get insights.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 