'use client'

// PRIMUS HOME PRO - E-Signature Pad Component
// HTML Canvas-based signature capture with Base64 export

import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Eraser, Check, PenTool } from 'lucide-react'

interface ESignaturePadProps {
  onSignatureChange?: (signatureBase64: string | null) => void
  width?: number
  height?: number
  lineColor?: string
  lineWidth?: number
}

export function ESignaturePad({
  onSignatureChange,
  width = 500,
  height = 200,
  lineColor = '#1e40af',
  lineWidth = 2,
}: ESignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Set drawing styles
    ctx.strokeStyle = lineColor
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Fill with white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Draw signature line
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(40, height - 40)
    ctx.lineTo(width - 40, height - 40)
    ctx.stroke()

    // Reset for drawing
    ctx.strokeStyle = lineColor
    ctx.lineWidth = lineWidth
  }, [width, height, lineColor, lineWidth])

  // Get position relative to canvas
  const getPosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }, [])

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pos = getPosition(e)
    setIsDrawing(true)
    setLastPos(pos)
  }, [getPosition])

  // Draw
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const pos = getPosition(e)

    ctx.beginPath()
    ctx.moveTo(lastPos.x, lastPos.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()

    setLastPos(pos)
    
    if (!hasSignature) {
      setHasSignature(true)
    }
  }, [isDrawing, lastPos, getPosition, hasSignature])

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false)
      
      // Export signature
      const canvas = canvasRef.current
      if (canvas && hasSignature) {
        const signatureBase64 = canvas.toDataURL('image/png')
        onSignatureChange?.(signatureBase64)
      }
    }
  }, [isDrawing, hasSignature, onSignatureChange])

  // Clear signature
  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Clear and redraw background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Redraw signature line
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(40, canvas.height - 40)
    ctx.lineTo(canvas.width - 40, canvas.height - 40)
    ctx.stroke()

    // Reset for drawing
    ctx.strokeStyle = lineColor
    ctx.lineWidth = lineWidth

    setHasSignature(false)
    onSignatureChange?.(null)
  }, [lineColor, lineWidth, onSignatureChange])

  // Get signature as Base64
  const getSignatureBase64 = useCallback((): string | null => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return null
    return canvas.toDataURL('image/png')
  }, [hasSignature])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5 text-blue-600" />
          Electronic Signature
        </CardTitle>
        <CardDescription>
          Please sign below to accept this proposal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Canvas Container */}
          <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-white">
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair touch-none"
              style={{ maxWidth: '100%', height: 'auto', aspectRatio: `${width}/${height}` }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            
            {/* Placeholder text */}
            {!hasSignature && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-muted-foreground/50">
                <span className="text-sm">Sign here</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSignature}
              disabled={!hasSignature}
            >
              <Eraser className="mr-2 h-4 w-4" />
              Clear
            </Button>

            {hasSignature && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>Signature captured</span>
              </div>
            )}
          </div>

          {/* Legal text */}
          <p className="text-xs text-muted-foreground">
            By signing above, you acknowledge that you have read and agree to the terms of this
            proposal. This electronic signature is legally binding and constitutes your acceptance
            of the solar installation agreement.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Export utility to get signature
export function useSignature() {
  const [signature, setSignature] = useState<string | null>(null)
  
  return {
    signature,
    setSignature,
    hasSignature: !!signature,
    clearSignature: () => setSignature(null),
  }
}
