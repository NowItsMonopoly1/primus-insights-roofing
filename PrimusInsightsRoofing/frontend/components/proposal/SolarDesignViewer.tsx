'use client'

// PRIMUS HOME PRO - Solar Design Viewer Component
// Displays roof satellite imagery with panel layout and key stats

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sun, Zap, Grid3X3, Ruler } from 'lucide-react'

interface SolarDesignViewerProps {
  imageUrl?: string | null
  systemSizeKW: number
  panelCount: number
  annualProductionKWh: number
  roofAreaSqM?: number | null
}

export function SolarDesignViewer({
  imageUrl,
  systemSizeKW,
  panelCount,
  annualProductionKWh,
  roofAreaSqM,
}: SolarDesignViewerProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-yellow-600" />
          Your Solar System Design
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Roof Image */}
        <div className="relative aspect-video bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Roof satellite view with solar panel layout"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <div className="text-center">
                <Sun className="mx-auto h-16 w-16 text-yellow-500/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Solar design visualization
                </p>
              </div>
            </div>
          )}
          
          {/* Overlay Stats */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span className="font-bold">{systemSizeKW.toFixed(1)} kW System</span>
              </div>
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-blue-400" />
                <span>{panelCount} Panels</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          <StatCard
            icon={<Zap className="h-5 w-5 text-yellow-600" />}
            label="System Size"
            value={`${systemSizeKW.toFixed(1)} kW`}
          />
          <StatCard
            icon={<Grid3X3 className="h-5 w-5 text-blue-600" />}
            label="Solar Panels"
            value={`${panelCount} panels`}
          />
          <StatCard
            icon={<Sun className="h-5 w-5 text-orange-600" />}
            label="Annual Production"
            value={`${Math.round(annualProductionKWh).toLocaleString()} kWh`}
          />
          {roofAreaSqM && (
            <StatCard
              icon={<Ruler className="h-5 w-5 text-green-600" />}
              label="Roof Area Used"
              value={`${Math.round(roofAreaSqM)} m²`}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3 text-center">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
