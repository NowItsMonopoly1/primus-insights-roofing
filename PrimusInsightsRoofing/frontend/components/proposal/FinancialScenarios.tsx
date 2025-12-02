'use client'

// PRIMUS HOME PRO - Financial Scenarios Component
// Displays Cash, Loan, and PPA options in a comparative format

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { DollarSign, TrendingUp, CheckCircle2, Wallet, CreditCard, Handshake } from 'lucide-react'

interface CashScenario {
  type: 'CASH'
  upfrontCost: number
  year1Savings: number
  paybackYears: number
  roi25Year: number
  netSavings25Yr: number
}

interface LoanScenario {
  type: 'LOAN'
  termYears: number
  apr: number
  monthlyPayment: number
  totalInterestPaid: number
  totalCost: number
  year1CashFlow: number
  netSavings25Yr: number
}

interface PPAScenario {
  type: 'PPA'
  year1Rate: number
  escalationRate: number
  year1Payment: number
  totalPayments25Yr: number
  netSavings25Yr: number
  ownershipTransfer: boolean
}

interface FinancialScenariosProps {
  cashScenario: CashScenario
  loan10YearScenario: LoanScenario
  loan15YearScenario: LoanScenario
  ppaScenario: PPAScenario
  recommendedOption: string
  onSelectScenario?: (scenario: 'CASH' | 'LOAN_10' | 'LOAN_15' | 'PPA') => void
  selectedScenario?: string
}

export function FinancialScenarios({
  cashScenario,
  loan10YearScenario,
  loan15YearScenario,
  ppaScenario,
  recommendedOption,
  onSelectScenario,
  selectedScenario,
}: FinancialScenariosProps) {
  const [activeTab, setActiveTab] = useState<'CASH' | 'LOAN_10' | 'LOAN_15' | 'PPA'>(
    (selectedScenario as any) || (recommendedOption as any) || 'CASH'
  )

  const handleSelect = (scenario: 'CASH' | 'LOAN_10' | 'LOAN_15' | 'PPA') => {
    setActiveTab(scenario)
    onSelectScenario?.(scenario)
  }

  const scenarios = [
    { key: 'CASH' as const, label: 'Cash', icon: Wallet, data: cashScenario },
    { key: 'LOAN_10' as const, label: '10-Year Loan', icon: CreditCard, data: loan10YearScenario },
    { key: 'LOAN_15' as const, label: '15-Year Loan', icon: CreditCard, data: loan15YearScenario },
    { key: 'PPA' as const, label: 'PPA', icon: Handshake, data: ppaScenario },
  ]

  const activeScenario = scenarios.find((s) => s.key === activeTab)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Your Financial Options
        </CardTitle>
        <CardDescription>
          Choose the payment option that works best for you
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Tab Buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          {scenarios.map((scenario) => {
            const Icon = scenario.icon
            const isRecommended = scenario.key === recommendedOption
            const isActive = scenario.key === activeTab
            
            return (
              <Button
                key={scenario.key}
                variant={isActive ? 'default' : 'outline'}
                className={cn(
                  'relative flex-1 min-w-[120px]',
                  isActive && 'ring-2 ring-primary ring-offset-2'
                )}
                onClick={() => handleSelect(scenario.key)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {scenario.label}
                {isRecommended && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] text-white">
                    ✓
                  </span>
                )}
              </Button>
            )
          })}
        </div>

        {/* Scenario Details */}
        {activeTab === 'CASH' && (
          <CashDetails scenario={cashScenario} />
        )}
        {activeTab === 'LOAN_10' && (
          <LoanDetails scenario={loan10YearScenario} />
        )}
        {activeTab === 'LOAN_15' && (
          <LoanDetails scenario={loan15YearScenario} />
        )}
        {activeTab === 'PPA' && (
          <PPADetails scenario={ppaScenario} />
        )}

        {/* Net Savings Highlight */}
        <div className="mt-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-6 text-center border border-green-200">
          <div className="flex items-center justify-center gap-2 text-green-700">
            <TrendingUp className="h-6 w-6" />
            <span className="text-sm font-medium uppercase tracking-wide">
              25-Year Net Savings
            </span>
          </div>
          <div className="mt-2 text-4xl font-bold text-green-600">
            ${Math.round(activeScenario?.data.netSavings25Yr || 0).toLocaleString()}
          </div>
          <p className="mt-2 text-sm text-green-600/70">
            Estimated total savings over the system lifetime
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function CashDetails({ scenario }: { scenario: CashScenario }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <DetailCard
          label="Upfront Cost"
          value={`$${Math.round(scenario.upfrontCost).toLocaleString()}`}
          description="After 30% Federal Tax Credit"
        />
        <DetailCard
          label="First Year Savings"
          value={`$${Math.round(scenario.year1Savings).toLocaleString()}`}
          description="Annual utility savings"
        />
        <DetailCard
          label="Payback Period"
          value={`${scenario.paybackYears} years`}
          description="Time to recoup investment"
          highlight
        />
        <DetailCard
          label="25-Year ROI"
          value={`${Math.round(scenario.roi25Year)}%`}
          description="Return on investment"
          highlight
        />
      </div>
      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
        <strong>Best for:</strong> Homeowners with available capital who want maximum long-term savings
        and immediate ownership of their solar system.
      </div>
    </div>
  )
}

function LoanDetails({ scenario }: { scenario: LoanScenario }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <DetailCard
          label="Monthly Payment"
          value={`$${Math.round(scenario.monthlyPayment).toLocaleString()}`}
          description={`${scenario.termYears}-year term at ${(scenario.apr * 100).toFixed(2)}% APR`}
        />
        <DetailCard
          label="Year 1 Cash Flow"
          value={`$${Math.round(scenario.year1CashFlow).toLocaleString()}`}
          description={scenario.year1CashFlow >= 0 ? 'Net positive!' : 'Net cost first year'}
          highlight={scenario.year1CashFlow >= 0}
        />
        <DetailCard
          label="Total Interest"
          value={`$${Math.round(scenario.totalInterestPaid).toLocaleString()}`}
          description="Over loan term"
        />
        <DetailCard
          label="Total Loan Cost"
          value={`$${Math.round(scenario.totalCost).toLocaleString()}`}
          description="Principal + interest"
        />
      </div>
      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
        <strong>Best for:</strong> Homeowners who want to own their system with $0 down while 
        spreading the cost over time. Tax credit can be applied to reduce loan principal.
      </div>
    </div>
  )
}

function PPADetails({ scenario }: { scenario: PPAScenario }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <DetailCard
          label="Year 1 Rate"
          value={`$${scenario.year1Rate.toFixed(3)}/kWh`}
          description="Price per kWh of solar produced"
        />
        <DetailCard
          label="Annual Escalation"
          value={`${(scenario.escalationRate * 100).toFixed(1)}%`}
          description="Rate increase per year"
        />
        <DetailCard
          label="Est. Year 1 Payment"
          value={`$${Math.round(scenario.year1Payment).toLocaleString()}`}
          description="Based on estimated production"
        />
        <DetailCard
          label="25-Year Total"
          value={`$${Math.round(scenario.totalPayments25Yr).toLocaleString()}`}
          description="All payments over term"
        />
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-800">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <strong>$0 Down, No Ownership Risk:</strong> The provider owns, maintains, and guarantees
          the system. You simply pay for the solar power at a rate lower than your utility.
          {scenario.ownershipTransfer && ' Ownership transfers to you after 25 years.'}
        </div>
      </div>
    </div>
  )
}

function DetailCard({
  label,
  value,
  description,
  highlight = false,
}: {
  label: string
  value: string
  description?: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        highlight ? 'border-green-200 bg-green-50' : 'border-border bg-muted/30'
      )}
    >
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={cn('text-2xl font-bold', highlight && 'text-green-600')}>{value}</div>
      {description && (
        <div className="mt-1 text-xs text-muted-foreground">{description}</div>
      )}
    </div>
  )
}
