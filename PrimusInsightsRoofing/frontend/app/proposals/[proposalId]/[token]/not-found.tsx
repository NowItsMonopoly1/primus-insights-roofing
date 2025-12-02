// PRIMUS HOME PRO - Proposal Not Found Page
// Displayed when proposal is invalid, expired, or access denied

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sun, AlertTriangle, ArrowLeft } from 'lucide-react'

export default function ProposalNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle>Proposal Not Found</CardTitle>
          <CardDescription className="text-base">
            This proposal may have expired, been removed, or the link is invalid.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <p>Possible reasons:</p>
            <ul className="mt-2 list-inside list-disc text-left">
              <li>The proposal link has expired</li>
              <li>The proposal has already been accepted</li>
              <li>The link was copied incorrectly</li>
              <li>The proposal was withdrawn</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact your solar consultant.
            </p>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
