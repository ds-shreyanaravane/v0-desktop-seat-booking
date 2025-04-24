"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import {
  Info,
  User,
  Calendar,
  Clock,
  ZoomIn,
  ZoomOut,
  MapPin,
  Users,
  Building,
  Search,
  ChevronRight,
  Activity,
  Zap,
  Coffee,
  Wifi,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Seat {
  id: string
  x: number
  y: number
  width: number
  height: number
  status: "available" | "booked" | "blocked" | "yours"
  type: "standard" | "standing" | "meeting" | "focus"
  zone: string
  bookedBy?: string
  angle?: number
}

interface FloorPlanProps {
  selectedDate: Date | undefined
  selectedZone: string | null
  selectedSeatType: string | null
}

export default function FloorPlan({ selectedDate, selectedZone, selectedSeatType }: FloorPlanProps) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isHovering, setIsHovering] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })
  const [activeTab, setActiveTab] = useState("map")
  const [searchQuery, setSearchQuery] = useState("")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [floorStats, setFloorStats] = useState({
    total: 0,
    available: 0,
    booked: 0,
    yours: 0,
  })

  // Generate seat data based on the exact positions of colored rectangles in the image
  // Accounting for the angled floor plan
  useEffect(() => {
    const generateSeats = () => {
      const mockSeats: Seat[] = []
      const angle = 20 // Approximate angle of the floor plan tilt

      // Function to adjust coordinates based on the angle
      const adjustForAngle = (x: number, y: number, rowIndex: number, colIndex: number) => {
        // Calculate offset based on position in the grid
        const angleOffset = rowIndex * Math.tan((angle * Math.PI) / 180) * 10
        return {
          x: x + angleOffset + colIndex * 5,
          y: y,
        }
      }

      // TENDER CHECKING AREA - Left side
      // Define the grid parameters
      const tenderStartX = 245
      const tenderStartY = 285
      const rowSpacing = 40
      const colSpacing = 45

      // Create a grid of seats with proper angling
      const tenderRows = [
        // Row 1 (G G R G)
        [
          { id: "TC-101", status: "available" },
          { id: "TC-102", status: "available" },
          { id: "TC-103", status: "booked" },
          { id: "TC-104", status: "available" },
        ],
        // Row 2 (G G G G)
        [
          { id: "TC-201", status: "available" },
          { id: "TC-202", status: "available" },
          { id: "TC-203", status: "available" },
          { id: "TC-204", status: "available" },
        ],
        // Row 3 (G G G G)
        [
          { id: "TC-301", status: "available" },
          { id: "TC-302", status: "available" },
          { id: "TC-303", status: "available" },
          { id: "TC-304", status: "available" },
        ],
        // Row 4 (R R R R)
        [
          { id: "TC-401", status: "booked" },
          { id: "TC-402", status: "booked" },
          { id: "TC-403", status: "booked" },
          { id: "TC-404", status: "booked" },
        ],
        // Row 5 (R R R R)
        [
          { id: "TC-501", status: "booked" },
          { id: "TC-502", status: "booked" },
          { id: "TC-503", status: "booked" },
          { id: "TC-504", status: "booked" },
        ],
        // Row 6 (R R R R)
        [
          { id: "TC-601", status: "booked" },
          { id: "TC-602", status: "booked" },
          { id: "TC-603", status: "booked" },
          { id: "TC-604", status: "booked" },
        ],
        // Row 7 (G G R R)
        [
          { id: "TC-701", status: "available" },
          { id: "TC-702", status: "available" },
          { id: "TC-703", status: "booked" },
          { id: "TC-704", status: "booked" },
        ],
        // Row 8 (G G G)
        [
          { id: "TC-801", status: "available" },
          { id: "TC-802", status: "available" },
          { id: "TC-803", status: "available" },
        ],
      ]

      // Add tender checking area seats with angle adjustment
      tenderRows.forEach((row, rowIndex) => {
        row.forEach((seat, colIndex) => {
          const { x, y } = adjustForAngle(
            tenderStartX + colIndex * colSpacing,
            tenderStartY + rowIndex * rowSpacing,
            rowIndex,
            colIndex,
          )
          mockSeats.push({
            id: seat.id,
            x,
            y,
            width: 40,
            height: 25,
            status: seat.status,
            type: "standard",
            zone: "tender",
            angle: angle,
          })
        })
      })

      // CUBICAL AREA - Top block
      // Define the grid parameters with angle adjustment
      const cubicalStartX = 510
      const cubicalStartY = 320
      const cubicalRowSpacing = 40
      const cubicalColSpacing = 45

      // Top block - 3 rows of 5 seats (all red)
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 5; col++) {
          const { x, y } = adjustForAngle(
            cubicalStartX + col * cubicalColSpacing,
            cubicalStartY + row * cubicalRowSpacing,
            row,
            col,
          )
          mockSeats.push({
            id: `CB-T${row + 1}-${col + 1}`,
            x,
            y,
            width: 40,
            height: 25,
            status: "booked",
            type: "standard",
            zone: "cubical",
            angle: angle,
          })
        }
      }

      // Middle block - 3 rows of 8 seats (all red)
      const middleBlockY = cubicalStartY + 120
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
          const { x, y } = adjustForAngle(
            cubicalStartX + col * cubicalColSpacing,
            middleBlockY + row * cubicalRowSpacing,
            row + 3, // Offset for previous rows
            col,
          )
          mockSeats.push({
            id: `CB-M${row + 1}-${col + 1}`,
            x,
            y,
            width: 40,
            height: 25,
            status: "booked",
            type: "standard",
            zone: "cubical",
            angle: angle,
          })
        }
      }

      // Bottom left block - 2 rows of 3 seats
      const bottomLeftX = 420
      const bottomLeftY = 640

      // Define the pattern
      const bottomLeftPattern = [
        // Row 1 (G G R)
        [
          { id: "CB-BL1-1", status: "available" },
          { id: "CB-BL1-2", status: "available" },
          { id: "CB-BL1-3", status: "booked" },
        ],
        // Row 2 (G G R)
        [
          { id: "CB-BL2-1", status: "available" },
          { id: "CB-BL2-2", status: "available" },
          { id: "CB-BL2-3", status: "booked" },
        ],
      ]

      // Add bottom left seats with angle adjustment
      bottomLeftPattern.forEach((row, rowIndex) => {
        row.forEach((seat, colIndex) => {
          const { x, y } = adjustForAngle(
            bottomLeftX + colIndex * cubicalColSpacing,
            bottomLeftY + rowIndex * cubicalRowSpacing,
            rowIndex + 8, // Offset for previous rows
            colIndex,
          )
          mockSeats.push({
            id: seat.id,
            x,
            y,
            width: 40,
            height: 25,
            status: seat.status,
            type: "standard",
            zone: "cubical",
            angle: angle,
          })
        })
      })

      // Bottom right block - 3 rows
      const bottomRightX = 600
      const bottomRightY = 640

      // Define the pattern
      const bottomRightPattern = [
        // Row 1 (G G G)
        [
          { id: "CB-BR1-1", status: "available" },
          { id: "CB-BR1-2", status: "available" },
          { id: "CB-BR1-3", status: "available" },
        ],
        // Row 2 (G G R R R)
        [
          { id: "CB-BR2-1", status: "available" },
          { id: "CB-BR2-2", status: "available" },
          { id: "CB-BR2-3", status: "booked" },
          { id: "CB-BR2-4", status: "booked" },
          { id: "CB-BR2-5", status: "booked" },
        ],
        // Row 3 (R R R R R)
        [
          { id: "CB-BR3-1", status: "booked" },
          { id: "CB-BR3-2", status: "booked" },
          { id: "CB-BR3-3", status: "booked" },
          { id: "CB-BR3-4", status: "booked" },
          { id: "CB-BR3-5", status: "booked" },
        ],
      ]

      // Add bottom right seats with angle adjustment
      bottomRightPattern.forEach((row, rowIndex) => {
        row.forEach((seat, colIndex) => {
          const { x, y } = adjustForAngle(
            bottomRightX + colIndex * cubicalColSpacing,
            bottomRightY + rowIndex * cubicalRowSpacing,
            rowIndex + 10, // Offset for previous rows
            colIndex,
          )
          mockSeats.push({
            id: seat.id,
            x,
            y,
            width: 40,
            height: 25,
            status: seat.status,
            type: "standard",
            zone: "cubical",
            angle: angle,
          })
        })
      })

      // Add one seat that's yours (blue)
      const yourSeat = {
        id: "YR-101",
        x: tenderStartX + colSpacing,
        y: tenderStartY + 20,
        width: 40,
        height: 25,
        status: "yours",
        type: "standard",
        zone: "tender",
        bookedBy: "You",
        angle: angle,
      }
      mockSeats.push(yourSeat)

      // Calculate floor stats
      const total = mockSeats.length
      const available = mockSeats.filter((seat) => seat.status === "available").length
      const booked = mockSeats.filter((seat) => seat.status === "booked").length
      const yours = mockSeats.filter((seat) => seat.status === "yours").length

      setFloorStats({
        total,
        available,
        booked,
        yours,
      })

      return mockSeats
    }

    setSeats(generateSeats())
  }, [])

  // Filter seats based on selected filters and search
  const filteredSeats = seats.filter((seat) => {
    // Filter by zone
    if (selectedZone && seat.zone !== selectedZone) return false

    // Filter by seat type
    if (selectedSeatType && seat.type !== selectedSeatType) return false

    // Filter by search query
    if (searchQuery && !seat.id.toLowerCase().includes(searchQuery.toLowerCase())) return false

    return true
  })

  const handleSeatClick = (seat: Seat) => {
    setSelectedSeat(seat)
    setIsDialogOpen(true)
  }

  const handleBookSeat = () => {
    if (selectedSeat) {
      setSeats(
        seats.map((seat) => (seat.id === selectedSeat.id ? { ...seat, status: "yours", bookedBy: "You" } : seat)),
      )

      // Update floor stats
      setFloorStats((prev) => ({
        ...prev,
        available: prev.available - (selectedSeat.status === "available" ? 1 : 0),
        yours: prev.yours + 1,
      }))

      setIsDialogOpen(false)
    }
  }

  const handleCancelBooking = () => {
    if (selectedSeat) {
      setSeats(
        seats.map((seat) =>
          seat.id === selectedSeat.id ? { ...seat, status: "available", bookedBy: undefined } : seat,
        ),
      )

      // Update floor stats
      setFloorStats((prev) => ({
        ...prev,
        available: prev.available + 1,
        yours: prev.yours - 1,
      }))

      setIsDialogOpen(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    setStartPosition({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - startPosition.x,
      y: e.clientY - startPosition.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5))
  }

  const resetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-[#2A3042]/50 bg-gradient-to-b from-[#1A1F2E] to-[#131725] p-0 shadow-xl">
      <Tabs defaultValue="map" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col border-b border-[#2A3042]/50">
          <div className="flex items-center justify-between p-5">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 shadow-lg">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
                    Unit No. 4A
                  </span>{" "}
                  Station
                </div>
              </h2>
              <p className="text-sm text-[#8A94A8] mt-1 flex items-center">
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-[#8A94A8]" />
                </div>
                <Input
                  type="text"
                  placeholder="Search seat ID..."
                  className="w-56 pl-10 h-10 bg-[#1E2536] border-[#2A3042] text-[#D0D5E0] rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2 bg-[#1E2536] rounded-lg p-1 border border-[#2A3042]">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomIn}
                        className="text-[#D0D5E0] hover:text-white hover:bg-[#2A3042] h-8 w-8 rounded-md"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#2A3042] text-[#D0D5E0] border-[#3A4156]">
                      <p>Zoom in</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Badge className="bg-[#2A3042] text-[#D0D5E0] border-none h-6 px-2 text-xs font-normal">
                  {Math.round(scale * 100)}%
                </Badge>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomOut}
                        className="text-[#D0D5E0] hover:text-white hover:bg-[#2A3042] h-8 w-8 rounded-md"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#2A3042] text-[#D0D5E0] border-[#3A4156]">
                      <p>Zoom out</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetView}
                  className="text-[#8A94A8] hover:text-white hover:bg-[#2A3042] h-10 rounded-lg"
                >
                  Reset View
                </Button>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="text-[#D0D5E0] hover:text-white hover:bg-[#2A3042] h-10 w-10 rounded-lg"
                      >
                        {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#2A3042] text-[#D0D5E0] border-[#3A4156]">
                      <p>{isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="px-5 pb-0">
            <TabsList className="grid w-[400px] grid-cols-3 bg-[#1E2536] p-1 rounded-lg">
              <TabsTrigger
                value="map"
                className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-700 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Floor Map
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-700 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Floor Statistics
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-700 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Floor Information
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="map" className="mt-0 p-0 h-[calc(100vh-180px)]">
          <div
            ref={containerRef}
            className="relative overflow-auto h-full bg-[#131725] cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className="relative transition-transform duration-100"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "0 0",
                left: `${position.x}px`,
                top: `${position.y}px`,
                position: "absolute",
              }}
            >
              {/* Floor plan image with colored rectangles */}
              <div className="relative" style={{ width: "1200px", height: "900px" }}>
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-l3ylJuGEsH0AnMHNlNqg3tN6tU4F8b.png"
                  alt="Floor Plan"
                  fill
                  className="object-contain"
                  onLoad={() => setImageLoaded(true)}
                  priority
                />

                {/* Transparent clickable areas on top of the colored rectangles */}
                {imageLoaded &&
                  filteredSeats.map((seat) => (
                    <div
                      key={seat.id}
                      className={cn(
                        "absolute cursor-pointer flex items-center justify-center text-xs font-medium transition-all duration-200 hover:scale-105",
                        isHovering === seat.id ? "z-10" : "z-1",
                      )}
                      style={{
                        left: `${seat.x}px`,
                        top: `${seat.y}px`,
                        width: `${seat.width}px`,
                        height: `${seat.height}px`,
                        borderRadius: "2px",
                        backgroundColor: seat.status === "yours" ? "rgba(139, 92, 246, 0.7)" : "transparent",
                        border: isHovering === seat.id ? "2px solid rgba(255, 255, 255, 0.9)" : "none",
                        boxShadow: isHovering === seat.id ? "0 0 15px rgba(139, 92, 246, 0.5)" : "none",
                        transform: seat.angle ? `rotate(${seat.angle}deg)` : undefined,
                        transformOrigin: "center center",
                      }}
                      onClick={() => handleSeatClick(seat)}
                      onMouseEnter={() => setIsHovering(seat.id)}
                      onMouseLeave={() => setIsHovering(null)}
                    >
                      {isHovering === seat.id && (
                        <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-[#1E2536]/90 backdrop-blur-md border border-[#2A3042] rounded-lg shadow-lg p-2.5 z-20 whitespace-nowrap min-w-[100px]">
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-semibold text-white mb-1">{seat.id}</span>
                            <span
                              className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full",
                                seat.status === "available"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : seat.status === "yours"
                                    ? "bg-purple-500/20 text-purple-400"
                                    : "bg-rose-500/20 text-rose-400",
                              )}
                            >
                              {seat.status.charAt(0).toUpperCase() + seat.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Quick stats overlay */}
          <div className="absolute bottom-4 right-4 bg-[#1E2536]/80 backdrop-blur-md rounded-lg border border-[#2A3042] p-3 shadow-lg">
            <div className="flex space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                <span className="text-xs text-[#D0D5E0]">{floorStats.available} Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-rose-500 rounded-full mr-2"></div>
                <span className="text-xs text-[#D0D5E0]">{floorStats.booked} Booked</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-xs text-[#D0D5E0]">{floorStats.yours} Your Bookings</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="mt-0 p-6 h-[calc(100vh-180px)] overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-[#1E2536] to-[#1A1F2E] rounded-xl border border-[#2A3042]/50 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-medium text-white">Seat Availability</h3>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Activity className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-emerald-500 rounded-md mr-3"></div>
                    <span className="text-[#D0D5E0]">Available</span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
                    {floorStats.available}
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-rose-500 rounded-md mr-3"></div>
                    <span className="text-[#D0D5E0]">Booked</span>
                  </div>
                  <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/20">{floorStats.booked}</Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-500 rounded-md mr-3"></div>
                    <span className="text-[#D0D5E0]">Your Bookings</span>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/20">{floorStats.yours}</Badge>
                </div>

                <Separator className="bg-[#2A3042]/50 my-3" />

                <div className="flex justify-between items-center p-3 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <div className="flex items-center">
                    <span className="text-[#D0D5E0] font-medium">Total Seats</span>
                  </div>
                  <Badge className="bg-[#2A3042] text-[#D0D5E0] border-[#3A4156]">{floorStats.total}</Badge>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1E2536] to-[#1A1F2E] rounded-xl border border-[#2A3042]/50 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-medium text-white">Zone Distribution</h3>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-indigo-400 mr-3" />
                    <span className="text-[#D0D5E0]">Tender Checking Area</span>
                  </div>
                  <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/20">
                    {seats.filter((seat) => seat.zone === "tender").length}
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-blue-400 mr-3" />
                    <span className="text-[#D0D5E0]">Cubical Area</span>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20">
                    {seats.filter((seat) => seat.zone === "cubical").length}
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-cyan-400 mr-3" />
                    <span className="text-[#D0D5E0]">Cabin</span>
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/20">
                    {seats.filter((seat) => seat.zone === "cabin").length}
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-teal-400 mr-3" />
                    <span className="text-[#D0D5E0]">Design Center</span>
                  </div>
                  <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/20">
                    {seats.filter((seat) => seat.zone === "design").length}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1E2536] to-[#1A1F2E] rounded-xl border border-[#2A3042]/50 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-medium text-white">Booking Statistics</h3>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
                  <Zap className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-purple-400 mr-3" />
                    <span className="text-[#D0D5E0]">Occupancy Rate</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-16 h-2 rounded-full bg-[#2A3042] overflow-hidden mr-3">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-600"
                        style={{
                          width: `${Math.round(((floorStats.booked + floorStats.yours) / floorStats.total) * 100)}%`,
                        }}
                      ></div>
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/20">
                      {Math.round(((floorStats.booked + floorStats.yours) / floorStats.total) * 100)}%
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-fuchsia-400 mr-3" />
                    <span className="text-[#D0D5E0]">Available Rate</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-16 h-2 rounded-full bg-[#2A3042] overflow-hidden mr-3">
                      <div
                        className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-600"
                        style={{ width: `${Math.round((floorStats.available / floorStats.total) * 100)}%` }}
                      ></div>
                    </div>
                    <Badge className="bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/20">
                      {Math.round((floorStats.available / floorStats.total) * 100)}%
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                <h4 className="text-sm font-medium text-white mb-3">Today's Booking Trend</h4>
                <div className="flex items-end justify-between h-20 px-2">
                  {[35, 65, 45, 80, 55, 30, 70, 90, 50, 40, 60, 75].map((height, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div
                        className="w-1.5 rounded-t-sm bg-gradient-to-t from-purple-600 to-indigo-500"
                        style={{ height: `${height}%` }}
                      ></div>
                      <span className="text-[9px] text-[#8A94A8] mt-1">{index + 8}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-[#8A94A8]">8 AM</span>
                  <span className="text-[10px] text-[#8A94A8]">8 PM</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1E2536] to-[#1A1F2E] rounded-xl border border-[#2A3042]/50 p-6 shadow-lg md:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-medium text-white">Floor Facilities</h3>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Coffee className="h-4 w-4 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-white mb-3 flex items-center">
                    <Wifi className="h-4 w-4 text-amber-400 mr-2" />
                    Amenities
                  </h4>
                  <ul className="space-y-2.5">
                    <li className="flex items-center p-2.5 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                      <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full mr-2.5"></div>
                      <span className="text-sm text-[#D0D5E0]">High-speed WiFi throughout the floor</span>
                    </li>
                    <li className="flex items-center p-2.5 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                      <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full mr-2.5"></div>
                      <span className="text-sm text-[#D0D5E0]">Adjustable standing desks in select areas</span>
                    </li>
                    <li className="flex items-center p-2.5 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                      <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full mr-2.5"></div>
                      <span className="text-sm text-[#D0D5E0]">Ergonomic chairs at all workstations</span>
                    </li>
                    <li className="flex items-center p-2.5 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                      <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full mr-2.5"></div>
                      <span className="text-sm text-[#D0D5E0]">Climate controlled environment</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-md font-medium text-white mb-3 flex items-center">
                    <Coffee className="h-4 w-4 text-orange-400 mr-2" />
                    Facilities
                  </h4>
                  <ul className="space-y-2.5">
                    <li className="flex items-center p-2.5 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                      <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full mr-2.5"></div>
                      <span className="text-sm text-[#D0D5E0]">Pantry area with coffee and refreshments</span>
                    </li>
                    <li className="flex items-center p-2.5 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                      <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full mr-2.5"></div>
                      <span className="text-sm text-[#D0D5E0]">Gender-separated restrooms</span>
                    </li>
                    <li className="flex items-center p-2.5 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                      <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full mr-2.5"></div>
                      <span className="text-sm text-[#D0D5E0]">Two staircase access points</span>
                    </li>
                    <li className="flex items-center p-2.5 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                      <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full mr-2.5"></div>
                      <span className="text-sm text-[#D0D5E0]">Two elevator access points (P3 & P4)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1E2536] to-[#1A1F2E] rounded-xl border border-[#2A3042]/50 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-medium text-white">Floor Rules</h3>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg">
                  <Info className="h-4 w-4 text-white" />
                </div>
              </div>
              <ul className="space-y-2.5">
                <li className="flex items-center p-2.5 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <div className="w-2 h-2 bg-gradient-to-r from-rose-500 to-red-600 rounded-full mr-2.5"></div>
                  <span className="text-sm text-[#D0D5E0]">Bookings must be made at least 24 hours in advance</span>
                </li>
                <li className="flex items-center p-2.5 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <div className="w-2 h-2 bg-gradient-to-r from-rose-500 to-red-600 rounded-full mr-2.5"></div>
                  <span className="text-sm text-[#D0D5E0]">Maximum booking duration is 5 consecutive days</span>
                </li>
                <li className="flex items-center p-2.5 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <div className="w-2 h-2 bg-gradient-to-r from-rose-500 to-red-600 rounded-full mr-2.5"></div>
                  <span className="text-sm text-[#D0D5E0]">
                    Cancellations must be made at least 4 hours before booking time
                  </span>
                </li>
                <li className="flex items-center p-2.5 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <div className="w-2 h-2 bg-gradient-to-r from-rose-500 to-red-600 rounded-full mr-2.5"></div>
                  <span className="text-sm text-[#D0D5E0]">
                    No-shows will be recorded and may affect future booking privileges
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="info" className="mt-0 p-6 h-[calc(100vh-180px)] overflow-auto">
          <div className="bg-gradient-to-br from-[#1E2536] to-[#1A1F2E] rounded-xl border border-[#2A3042]/50 p-6 shadow-lg">
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg mr-4">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Unit No. 4A Station</h3>
                <p className="text-[#8A94A8]">Enterprise Workspace Solutions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                  <MapPin className="h-5 w-5 text-purple-400 mr-2" />
                  Location Details
                </h4>
                <div className="space-y-4 text-[#D0D5E0]">
                  <div className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-purple-500 mr-2 shrink-0" />
                    <div>
                      <p className="font-medium">Building Address</p>
                      <p className="text-sm text-[#8A94A8] mt-1">123 Enterprise Way, Business District</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-purple-500 mr-2 shrink-0" />
                    <div>
                      <p className="font-medium">Floor Information</p>
                      <p className="text-sm text-[#8A94A8] mt-1">4th Floor, Wing A, Enterprise Tower</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-purple-500 mr-2 shrink-0" />
                    <div>
                      <p className="font-medium">Access Hours</p>
                      <p className="text-sm text-[#8A94A8] mt-1">24/7 with authorized keycard access</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                  <Users className="h-5 w-5 text-indigo-400 mr-2" />
                  Capacity Information
                </h4>
                <div className="space-y-4 text-[#D0D5E0]">
                  <div className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-indigo-500 mr-2 shrink-0" />
                    <div>
                      <p className="font-medium">Total Capacity</p>
                      <p className="text-sm text-[#8A94A8] mt-1">{floorStats.total} workstations across 4 zones</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-indigo-500 mr-2 shrink-0" />
                    <div>
                      <p className="font-medium">Workspace Types</p>
                      <p className="text-sm text-[#8A94A8] mt-1">
                        Standard desks, standing desks, meeting pods, focus rooms
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-indigo-500 mr-2 shrink-0" />
                    <div>
                      <p className="font-medium">Peak Hours</p>
                      <p className="text-sm text-[#8A94A8] mt-1">Tuesday-Thursday, 10:00 AM - 3:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1A1F2E]/50 rounded-xl border border-[#2A3042]/30 p-5 mb-8">
              <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                <Wifi className="h-5 w-5 text-amber-400 mr-2" />
                Technology & Connectivity
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center p-3 bg-[#1E2536]/70 rounded-lg border border-[#2A3042]/30">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md mr-3">
                    <Wifi className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[#D0D5E0] font-medium">High-Speed WiFi</p>
                    <p className="text-xs text-[#8A94A8]">1 Gbps symmetric connection</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-[#1E2536]/70 rounded-lg border border-[#2A3042]/30">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md mr-3">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[#D0D5E0] font-medium">Power Outlets</p>
                    <p className="text-xs text-[#8A94A8]">USB-C & standard at every desk</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-[#1E2536]/70 rounded-lg border border-[#2A3042]/30">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md mr-3">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[#D0D5E0] font-medium">Wireless Charging</p>
                    <p className="text-xs text-[#8A94A8]">Available at premium desks</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-[#1E2536]/70 rounded-lg border border-[#2A3042]/30">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-md mr-3">
                    <Coffee className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[#D0D5E0] font-medium">Smart Environment</p>
                    <p className="text-xs text-[#8A94A8]">Automated lighting & climate</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600/10 to-indigo-600/10 rounded-xl border border-purple-500/20 p-5">
              <h4 className="text-lg font-medium text-white mb-3">Need Assistance?</h4>
              <p className="text-[#D0D5E0] mb-4">
                Contact the workspace management team for any questions or special requirements.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white border-none">
                  Contact Support
                </Button>
                <Button
                  variant="outline"
                  className="border-[#2A3042] text-[#D0D5E0] hover:bg-[#2A3042] hover:text-white"
                >
                  View Floor Guidelines
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Seat Dialog */}
        {selectedSeat && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md bg-gradient-to-b from-[#1E2536] to-[#1A1F2E] border-[#2A3042] text-white rounded-xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <span className="mr-2 text-lg">Seat {selectedSeat.id}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "ml-2",
                      selectedSeat.status === "available"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : selectedSeat.status === "yours"
                          ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                          : "bg-rose-500/20 text-rose-400 border-rose-500/30",
                    )}
                  >
                    {selectedSeat.status === "yours"
                      ? "Your Booking"
                      : selectedSeat.status.charAt(0).toUpperCase() + selectedSeat.status.slice(1)}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-[#8A94A8]">
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "No date selected"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4 p-3 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <Info className="h-4 w-4 text-[#8A94A8]" />
                  <span className="col-span-3 text-sm text-[#D0D5E0]">
                    {selectedSeat.type.charAt(0).toUpperCase() + selectedSeat.type.slice(1)} Desk
                  </span>
                </div>

                <div className="grid grid-cols-4 items-center gap-4 p-3 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <Calendar className="h-4 w-4 text-[#8A94A8]" />
                  <span className="col-span-3 text-sm text-[#D0D5E0]">
                    {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "No date selected"}
                  </span>
                </div>

                <div className="grid grid-cols-4 items-center gap-4 p-3 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                  <Clock className="h-4 w-4 text-[#8A94A8]" />
                  <span className="col-span-3 text-sm text-[#D0D5E0]">9:00 AM - 5:00 PM</span>
                </div>

                {(selectedSeat.status === "booked" || selectedSeat.status === "yours") && selectedSeat.bookedBy && (
                  <div className="grid grid-cols-4 items-center gap-4 p-3 bg-[#1A1F2E]/50 rounded-lg border border-[#2A3042]/30">
                    <User className="h-4 w-4 text-[#8A94A8]" />
                    <span className="col-span-3 text-sm text-[#D0D5E0]">Booked by: {selectedSeat.bookedBy}</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                {selectedSeat.status === "available" ? (
                  <Button
                    onClick={handleBookSeat}
                    className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white border-none"
                  >
                    Book Seat
                  </Button>
                ) : selectedSeat.status === "yours" ? (
                  <Button
                    variant="destructive"
                    onClick={handleCancelBooking}
                    className="bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white border-none"
                  >
                    Cancel Booking
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-[#2A3042] text-[#D0D5E0] hover:bg-[#2A3042] hover:text-white"
                  >
                    Close
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Tabs>
    </div>
  )
}
