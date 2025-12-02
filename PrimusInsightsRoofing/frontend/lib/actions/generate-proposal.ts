// PRIMUS HOME PRO - Generate Proposal Server Action
// Module H: Instant Proposal Generator
// Creates financial proposals from solar site analysis data

'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@clerk/nextjs/server'
import {
  generateProposalData,
  getUtilityRateForState,
  STANDARD_PANEL_WATTAGE,
  type ProposalData,
} from '@/lib/solar/solar-calculations'
import type { ActionResponse } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

interface GenerateProposalInput {
  leadId: string
  stateCode?: string
  customUtilityRate?: number
}

interface ProposalSummary {
  id: string
  leadId: string
  systemSizeKW: number
  panelCount: number
  priceAfterITC: number
  netSavings25Yr: number
  breakEvenYear: number | null
  recommendedOption: string
  generatedAt: Date
}

// ============================================================================
// MAIN SERVER ACTION
// ============================================================================

/**
 * Generate a financial proposal for a lead with solar data
 * 
 * Flow:
 * 1. Verify lead exists and has solar data
 * 2. Calculate production estimates
 * 3. Calculate costs with incentives
 * 4. Generate 25-year savings forecast
 * 5. Create financial scenarios (Cash, Loan, PPA)
 * 6. Store proposal in database
 * 7. Create lead event for tracking
 */
export async function generateProposal(
  input: GenerateProposalInput
): Promise<ActionResponse<ProposalSummary>> {
  try {
    // Authenticate user
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Fetch lead with solar data
    const lead = await prisma.lead.findUnique({
      where: { id: input.leadId },
      include: { siteSurvey: true },
    })

    if (!lead) {
      return { success: false, error: 'Lead not found' }
    }

    // Verify lead belongs to user
    if (lead.userId !== user.id) {
      return { success: false, error: 'Unauthorized access to lead' }
    }

    // Check if solar data is available
    if (!lead.solarEnriched || !lead.maxPanelsCount || !lead.maxSunshineHoursYear) {
      return { 
        success: false, 
        error: 'Solar analysis required before generating proposal. Please ensure the lead has an address and solar data has been fetched.' 
      }
    }

    // Determine state code from address if not provided
    let stateCode = input.stateCode
    if (!stateCode && lead.address) {
      // Try to extract state from address (simple regex)
      const stateMatch = lead.address.match(/\b([A-Z]{2})\b(?=\s*\d{5}|\s*$)/i)
      stateCode = stateMatch ? stateMatch[1].toUpperCase() : undefined
    }

    // Generate proposal data using calculation engine
    const proposalData = generateProposalData(
      lead.id,
      lead.maxPanelsCount,
      lead.maxSunshineHoursYear,
      stateCode,
      input.customUtilityRate
    )

    // Store proposal in database
    const proposal = await prisma.proposal.create({
      data: {
        leadId: lead.id,
        
        // System Specifications
        systemSizeWatts: proposalData.production.systemSizeWatts,
        systemSizeKW: proposalData.production.systemSizeKW,
        panelCount: lead.maxPanelsCount,
        panelWattage: STANDARD_PANEL_WATTAGE,
        
        // Production Estimates
        annualProductionKWh: proposalData.production.annualProductionKWh,
        lifetimeProductionKWh: proposalData.production.lifetimeProductionKWh,
        
        // Cost Breakdown
        grossSystemCost: proposalData.costs.grossSystemCost,
        federalITC: proposalData.costs.federalITC,
        stateRebate: proposalData.costs.stateRebate,
        priceAfterITC: proposalData.costs.priceAfterITC,
        costPerWatt: proposalData.costs.effectiveCostPerWatt,
        
        // Savings Projections
        year1Savings: proposalData.savings.year1Savings,
        netSavings25Yr: proposalData.savings.netSavings25Yr,
        breakEvenYear: proposalData.savings.breakEvenYear,
        
        // Financial Scenarios
        cashScenario: proposalData.financialScenarios.cash as unknown as object,
        loan10YearScenario: proposalData.financialScenarios.loan10Year as unknown as object,
        loan15YearScenario: proposalData.financialScenarios.loan15Year as unknown as object,
        ppaScenario: proposalData.financialScenarios.ppa as unknown as object,
        recommendedOption: proposalData.financialScenarios.recommendedOption,
        
        // Assumptions
        utilityRate: proposalData.assumptions.utilityRate,
        utilityEscalation: proposalData.assumptions.utilityEscalation,
        panelEfficiency: proposalData.assumptions.panelEfficiency,
        degradationRate: proposalData.assumptions.degradationRate,
        
        // Metadata
        stateCode,
        status: 'draft',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    // Create lead event for tracking
    await prisma.leadEvent.create({
      data: {
        leadId: lead.id,
        type: 'PROPOSAL_GENERATED',
        content: `Financial proposal generated: ${proposalData.production.systemSizeKW.toFixed(1)}kW system, $${Math.round(proposalData.savings.netSavings25Yr).toLocaleString()} estimated 25-year savings`,
        metadata: {
          proposalId: proposal.id,
          systemSizeKW: proposalData.production.systemSizeKW,
          priceAfterITC: proposalData.costs.priceAfterITC,
          netSavings25Yr: proposalData.savings.netSavings25Yr,
          recommendedOption: proposalData.financialScenarios.recommendedOption,
        },
      },
    })

    // Update lead stage to Qualified if still New
    if (lead.stage === 'New') {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { stage: 'Qualified' },
      })
    }

    console.log(`[Proposal] Generated proposal ${proposal.id} for lead ${lead.id}`)

    return {
      success: true,
      data: {
        id: proposal.id,
        leadId: proposal.leadId,
        systemSizeKW: proposal.systemSizeKW,
        panelCount: proposal.panelCount,
        priceAfterITC: proposal.priceAfterITC,
        netSavings25Yr: proposal.netSavings25Yr,
        breakEvenYear: proposal.breakEvenYear,
        recommendedOption: proposal.recommendedOption,
        generatedAt: proposal.generatedAt,
      },
    }
  } catch (error) {
    console.error('[Proposal] Error generating proposal:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate proposal',
    }
  }
}

/**
 * Get all proposals for a lead
 */
export async function getLeadProposals(
  leadId: string
): Promise<ActionResponse<ProposalSummary[]>> {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return { success: false, error: 'Unauthorized' }
    }

    const proposals = await prisma.proposal.findMany({
      where: { leadId },
      orderBy: { generatedAt: 'desc' },
      select: {
        id: true,
        leadId: true,
        systemSizeKW: true,
        panelCount: true,
        priceAfterITC: true,
        netSavings25Yr: true,
        breakEvenYear: true,
        recommendedOption: true,
        generatedAt: true,
      },
    })

    return { success: true, data: proposals }
  } catch (error) {
    console.error('[Proposal] Error fetching proposals:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch proposals',
    }
  }
}

/**
 * Get full proposal details
 */
export async function getProposalDetails(
  proposalId: string
): Promise<ActionResponse<ProposalData & { id: string; status: string }>> {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return { success: false, error: 'Unauthorized' }
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { Lead: true },
    })

    if (!proposal) {
      return { success: false, error: 'Proposal not found' }
    }

    // Reconstruct ProposalData from stored fields
    const proposalData: ProposalData & { id: string; status: string } = {
      id: proposal.id,
      status: proposal.status,
      leadId: proposal.leadId,
      generatedAt: proposal.generatedAt,
      production: {
        systemSizeWatts: proposal.systemSizeWatts,
        systemSizeKW: proposal.systemSizeKW,
        annualProductionKWh: proposal.annualProductionKWh,
        year1ProductionKWh: proposal.annualProductionKWh,
        lifetimeProductionKWh: proposal.lifetimeProductionKWh,
        degradedProductionByYear: [], // Not stored, would need recalculation
      },
      costs: {
        grossSystemCost: proposal.grossSystemCost,
        federalITC: proposal.federalITC,
        stateRebate: proposal.stateRebate,
        totalIncentives: proposal.federalITC + proposal.stateRebate,
        priceAfterITC: proposal.priceAfterITC,
        effectiveCostPerWatt: proposal.costPerWatt,
      },
      savings: {
        year1Savings: proposal.year1Savings,
        year5Savings: 0, // Would need recalculation
        year10Savings: 0,
        year25Savings: 0,
        netSavings25Yr: proposal.netSavings25Yr,
        cumulativeSavingsByYear: [],
        utilityRatesByYear: [],
        breakEvenYear: proposal.breakEvenYear,
      },
      financialScenarios: {
        cash: proposal.cashScenario as any,
        loan10Year: proposal.loan10YearScenario as any,
        loan15Year: proposal.loan15YearScenario as any,
        ppa: proposal.ppaScenario as any,
        recommendedOption: proposal.recommendedOption as any,
      },
      assumptions: {
        panelEfficiency: proposal.panelEfficiency,
        inverterEfficiency: 0.96,
        degradationRate: proposal.degradationRate,
        utilityRate: proposal.utilityRate,
        utilityEscalation: proposal.utilityEscalation,
        federalITC: 0.30,
        costPerWatt: proposal.costPerWatt,
      },
    }

    return { success: true, data: proposalData }
  } catch (error) {
    console.error('[Proposal] Error fetching proposal details:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch proposal details',
    }
  }
}

/**
 * Update proposal status
 */
export async function updateProposalStatus(
  proposalId: string,
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'expired'
): Promise<ActionResponse<{ id: string; status: string }>> {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return { success: false, error: 'Unauthorized' }
    }

    const proposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status },
      select: { id: true, status: true, leadId: true },
    })

    // Create lead event for status changes
    if (status === 'sent' || status === 'accepted') {
      await prisma.leadEvent.create({
        data: {
          leadId: proposal.leadId,
          type: status === 'sent' ? 'PROPOSAL_SENT' : 'PROPOSAL_ACCEPTED',
          content: `Proposal ${status}`,
          metadata: { proposalId: proposal.id },
        },
      })
    }

    // Update lead stage to Closed if proposal accepted
    if (status === 'accepted') {
      await prisma.lead.update({
        where: { id: proposal.leadId },
        data: { stage: 'Closed' },
      })
    }

    return { success: true, data: { id: proposal.id, status: proposal.status } }
  } catch (error) {
    console.error('[Proposal] Error updating proposal status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update proposal status',
    }
  }
}
