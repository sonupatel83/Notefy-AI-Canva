"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Eraser, Pencil, Search, Download, Trash2, X, ChevronDown, Save, CornerDownLeft, ChevronLeft, ChevronRight, Plus, Type } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { jsPDF } from "jspdf"
import AIResponseDisplay from "@/components/ai-response-display"
import { cn } from "@/lib/utils"
import DashboardHeader from "./dashboard-header"
import { toast } from "@/hooks/use-toast"

interface CanvasEditorProps {
  noteId: string
  initialNote: any
  userId: string
}

export default function CanvasEditor({ noteId, initialNote, userId }: CanvasEditorProps) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState("#000000")
  const [penWidth, setPenWidth] = useState(2)
  const [eraserWidth, setEraserWidth] = useState(10)
  const [tool, setTool] = useState<"pen" | "eraser" | "selection" | "text">("pen")
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [isAddingText, setIsAddingText] = useState(false)
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null)
  const [textInput, setTextInput] = useState("")
  const [fontSize, setFontSize] = useState(16)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showAiResponse, setShowAiResponse] = useState(false)
  const [canvasHeight, setCanvasHeight] = useState(600)
  const [showPenOptions, setShowPenOptions] = useState(false)
  const [showEraserOptions, setShowEraserOptions] = useState(false)
  const [showTextOptions, setShowTextOptions] = useState(false)
  const [eraserMode, setEraserMode] = useState<"stroke" | "point">("stroke")
  const [title, setTitle] = useState(initialNote?.title || "Untitled Note")
  const [isSaving, setIsSaving] = useState(false)
  const [canvasHistory, setCanvasHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<{ canvasData: string; order: number }[]>([])

  const writingColors = [
    { name: "Black", value: "#000000" },
    { name: "Dark Blue", value: "#000080" },
    { name: "Dark Green", value: "#006400" },
    { name: "Dark Red", value: "#8B0000" },
    { name: "Purple", value: "#800080" },
  ]

  useEffect(() => {
    if (initialNote?.slides) {
      setSlides(initialNote.slides)
    } else {
      // Initialize with one empty slide
      setSlides([{ canvasData: "", order: 0 }])
    }
  }, [initialNote])

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
        context.lineWidth = penWidth
        context.fillStyle = "#ffffff"
        context.fillRect(0, 0, canvas.width, canvas.height)
        setCtx(context)
      }
    }
  }, [canvasHeight])

  useEffect(() => {
    if (ctx) {
      ctx.strokeStyle = tool === "pen" ? color : "#ffffff"
      ctx.lineWidth = tool === "pen" ? penWidth : eraserWidth
    }
  }, [color, penWidth, eraserWidth, tool, ctx])

  useEffect(() => {
    if (aiResponse) {
      setShowAiResponse(true)
    }
  }, [aiResponse])

  // Initialize canvas history after canvas is set up
  useEffect(() => {
    if (ctx && canvasRef.current) {
      // Save initial state
      const initialState = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
      setCanvasHistory([initialState])
      setHistoryIndex(0)
    }
  }, [ctx])

  // Load current slide data
  useEffect(() => {
    if (slides[currentSlide]?.canvasData && ctx && canvasRef.current) {
      try {
        const canvas = canvasRef.current
        const img = new Image()
        img.onload = () => {
          // Clear canvas
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Draw image
          ctx.drawImage(img, 0, 0)

          // Save to history
          const newState = ctx.getImageData(0, 0, canvas.width, canvas.height)
          setCanvasHistory([newState])
          setHistoryIndex(0)
        }
        img.src = slides[currentSlide].canvasData
      } catch (error) {
        console.error("Error loading slide data:", error)
      }
    } else if (ctx && canvasRef.current) {
      // If no data for this slide, clear the canvas
      const canvas = canvasRef.current
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const newState = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setCanvasHistory([newState])
      setHistoryIndex(0)
    }
  }, [currentSlide, slides, ctx])

  const saveCurrentState = () => {
    if (!ctx || !canvasRef.current) return

    const currentState = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)

    // If we've gone back in history and then made a new change, truncate the future history
    if (historyIndex < canvasHistory.length - 1) {
      setCanvasHistory((prev) => prev.slice(0, historyIndex + 1))
    }

    setCanvasHistory((prev) => [...prev, currentState])
    setHistoryIndex((prev) => prev + 1)

    // Save the current canvas state to the current slide
    const currentCanvasData = canvasRef.current.toDataURL("image/png")
    setSlides((prevSlides) => {
      const newSlides = [...prevSlides]
      newSlides[currentSlide] = {
        ...newSlides[currentSlide],
        canvasData: currentCanvasData,
        order: currentSlide,
      }
      return newSlides
    })
  }

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

    if (tool === "text") {
      setTextPosition({ x, y })
      setIsAddingText(true)
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
      ctx.arc(x, y, eraserWidth / 2, 0, Math.PI * 2)
      ctx.fillStyle = "#ffffff"
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

    // Save state after drawing is complete
    saveCurrentState()
  }

  const downloadCanvas = () => {
    if (!canvasRef.current) return

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
      format: [canvasRef.current.width, canvasRef.current.height],
    })

    // Add all slides to the PDF
    slides.forEach((slide, index) => {
      if (index > 0) {
        pdf.addPage()
      }
      const img = new Image()
      img.src = slide.canvasData
      pdf.addImage(img, "PNG", 0, 0, canvasRef.current!.width, canvasRef.current!.height)
    })

      pdf.save(`${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`)
  }

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return

    const canvas = canvasRef.current
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    setSelectionStart(null)
    setSelectionEnd(null)
    setAiResponse(null)
    setShowAiResponse(false)

    // Save cleared state
    saveCurrentState()
  }

  const saveNote = async () => {
    if (!canvasRef.current || !userId) return

    setIsSaving(true)

    try {
      // Get current canvas data for the active slide
      const currentCanvasData = canvasRef.current.toDataURL("image/png")

      // Update the current slide's data
      const updatedSlides = [...slides]
      updatedSlides[currentSlide] = {
        ...updatedSlides[currentSlide],
        canvasData: currentCanvasData,
        order: currentSlide,
      }

      // Ensure all slides have proper order and data
      const finalSlides = updatedSlides.map((slide, index) => ({
        ...slide,
        order: index,
        canvasData: slide.canvasData || "", // Ensure empty string if no data
      }))

      const noteData = {
        title,
        slides: finalSlides,
        userId,
      }

      const url = noteId === "new" ? "/api/notes" : `/api/notes/${noteId}`
      const method = noteId === "new" ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(noteData),
      })

      if (!response.ok) {
        throw new Error("Failed to save note")
      }

      const savedNote = await response.json()

      // Update local state with the saved note data
      setSlides(savedNote.slides)

      toast({
        title: "Success",
        description: "Your note has been saved.",
      })

      // If creating a new note, redirect to the edit page
      if (noteId === "new") {
        router.push(`/canvas/${savedNote._id}`)
      }
    } catch (error) {
      console.error("Error saving note:", error)
      toast({
        title: "Error",
        description: "Failed to save your note. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
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
        
        // Clear selection after getting response
        setSelectionStart(null)
        setSelectionEnd(null)
        setIsSelecting(false)
      }
    } catch (error) {
      console.error("Error searching with Gemini:", error)
      setAiResponse(
        `Error: ${error instanceof Error ? error.message : "Failed to process your request. Please try again."}`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  const closeAiResponse = () => {
    setShowAiResponse(false)
  }

  const addNewSlide = () => {
    const newSlide = {
      canvasData: "",
      order: slides.length,
    }
    setSlides((prevSlides) => [...prevSlides, newSlide])
    setCurrentSlide(slides.length)
  }

  const goToPreviousSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const goToNextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
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

  const handleTextSubmit = () => {
    if (!ctx || !textPosition || !textInput.trim()) return

    ctx.font = `${fontSize}px Arial`
    ctx.fillStyle = color
    ctx.fillText(textInput, textPosition.x, textPosition.y)
    
    setTextInput("")
    setIsAddingText(false)
    setTextPosition(null)
    saveCurrentState()
  }

  const handleToolChange = (newTool: "pen" | "eraser" | "selection" | "text") => {
    // Clear text input state when switching tools
    if (newTool !== "text") {
      setTextInput("")
      setIsAddingText(false)
      setTextPosition(null)
    }
    setTool(newTool)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader 
        title={title}
        onTitleChange={setTitle}
        onSave={saveNote}
        isSaving={isSaving}
        showSaveButton={true}
        isCanvasPage={true}
      />

      <div className="container py-0">
        <div className="flex flex-col lg:flex-row gap-4">
          <div
            className={cn("flex-1 flex flex-col transition-all duration-300", showAiResponse ? "lg:w-2/3" : "w-full")}
          >
            <div className="bg-white rounded-lg shadow-md p-2 mb-4">
              <div className="flex flex-wrap gap-1.5">
                {/* Pen Tool */}
                <Popover open={showPenOptions} onOpenChange={setShowPenOptions}>
                  <PopoverTrigger asChild>
                    <Button variant={tool === "pen" ? "default" : "outline"} size="sm" className="h-8" onClick={() => handleToolChange("pen")}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Pen
                      <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
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
                        <span className="text-sm font-medium">Line Width: {penWidth}px</span>
                        <Slider
                          value={[penWidth]}
                          min={1}
                          max={20}
                          step={1}
                          onValueChange={(value) => setPenWidth(value[0])}
                          className="w-48"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Text Tool */}
                <Popover open={showTextOptions} onOpenChange={setShowTextOptions}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={tool === "text" ? "default" : "outline"}
                      size="sm"
                      className="h-8"
                      onClick={() => handleToolChange("text")}
                    >
                      <Type className="h-3.5 w-3.5 mr-1.5" />
                      Text
                      <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Text Color:</span>
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
                        <span className="text-sm font-medium">Font Size: {fontSize}px</span>
                        <Slider
                          value={[fontSize]}
                          min={8}
                          max={72}
                          step={1}
                          onValueChange={(value) => setFontSize(value[0])}
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
                      className="h-8"
                      onClick={() => handleToolChange("eraser")}
                    >
                      <Eraser className="h-3.5 w-3.5 mr-1.5" />
                      Eraser
                      <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
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
                        <span className="text-sm font-medium">Size: {eraserWidth}px</span>
                        <Slider
                          value={[eraserWidth]}
                          min={1}
                          max={50}
                          step={1}
                          onValueChange={(value) => setEraserWidth(value[0])}
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
                  className="h-8"
                  onClick={() => handleToolChange("selection")}
                >
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                  Selection
                </Button>

                {/* Action Buttons */}
                <div className="flex gap-1.5 ml-auto">
                  <Button variant="outline" size="sm" className="h-8" onClick={downloadCanvas}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download PDF
                  </Button>
                  <Button variant="outline" size="sm" className="h-8" onClick={clearCanvas}>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    className={cn(
                      "bg-blue-600 hover:bg-blue-700 text-white h-8",
                      (!selectionStart || !selectionEnd || isLoading || tool !== "selection") && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={searchWithGemini}
                    disabled={!selectionStart || !selectionEnd || isLoading || tool !== "selection"}
                  >
                    <Search className="h-3.5 w-3.5 mr-1.5" />
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
              {isAddingText && textPosition && (
                <div
                  className="absolute bg-white p-2 rounded-lg shadow-md"
                  style={{
                    left: `${textPosition.x}px`,
                    top: `${textPosition.y}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleTextSubmit()
                      }
                    }}
                    className="w-48"
                    placeholder="Type text..."
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousSlide}
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-500">
                  Slide {currentSlide + 1} of {slides.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextSlide}
                  disabled={currentSlide === slides.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={addNewSlide}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Slide
            </Button>
            </div>
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
    </div>
  )
}
