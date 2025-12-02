// PRIMUS HOME PRO - Accept Proposal Server Action
// Handles e-signature capture and proposal acceptance

'use server'

import { prisma } from '@/lib/db/prisma'
import { headers } from 'next/headers'
import type { ActionResponse } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

interface AcceptProposalInput {
  proposalId: string
  accessToken: string
  signatureImageBase64: string
  selectedScenario: 'CASH' | 'LOAN_10' | 'LOAN_15' | 'PPA'
  customerName: string
  customerEmail: string
}

interface AcceptProposalResult {
  proposalId: string
  leadId: string
  acceptedAt: Date
  selectedScenario: string
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate Base64 image string
 * - Must start with valid data URI prefix
 * - Must not exceed max size (5MB)
 * - Must be PNG or JPEG
 */
function validateSignatureImage(base64: string): { valid: boolean; error?: string } {
  if (!base64) {
    return { valid: false, error: 'Signature is required' }
  }

  // Check for valid data URI prefix
  const validPrefixes = ['data:image/png;base64,', 'data:image/jpeg;base64,']
  const hasValidPrefix = validPrefixes.some((prefix) => base64.startsWith(prefix))
  
  if (!hasValidPrefix) {
    return { valid: false, error: 'Invalid signature format' }
  }

  // Check size (Base64 is ~33% larger than binary, so 5MB binary = ~6.67MB Base64)
  const maxSize = 7 * 1024 * 1024 // 7MB in Base64
  if (base64.length > maxSize) {
    return { valid: false, error: 'Signature image too large' }
  }

  // Basic sanitization: ensure no script tags or suspicious content
  const lowerBase64 = base64.toLowerCase()
  if (lowerBase64.includes('<script') || lowerBase64.includes('javascript:')) {
    return { valid: false, error: 'Invalid signature content' }
  }

  return { valid: true }
}

/**
 * Validate email format
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Get client IP address from headers
 */
async function getClientIP(): Promise<string> {
  const headersList = await headers()
  
  // Check various headers for IP (Vercel, Cloudflare, etc.)
  const forwardedFor = headersList.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIP = headersList.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

// ============================================================================
// PUBLIC PROPOSAL ACCESS (Token-based)
// ============================================================================

/**
 * Get proposal details for public viewing (requires valid access token)
 * This is a secure, token-validated endpoint for customers to view their proposal
 */
export async function getPublicProposalDetails(
  proposalId: string,
  accessToken: string
): Promise<ActionResponse<{
  proposal: {
    id: string
    status: string
    systemSizeKW: number
    panelCount: number
    annualProductionKWh: number
    grossSystemCost: number
    federalITC: number
    priceAfterITC: number
    year1Savings: number
    netSavings25Yr: number
    breakEvenYear: number | null
    cashScenario: any
    loan10YearScenario: any
    loan15YearScenario: any
    ppaScenario: any
    recommendedOption: string
    generatedAt: Date
    expiresAt: Date | null
  }
  lead: {
    name: string | null
    address: string | null
  }
  siteSurvey: {
    roofImageUrl: string | null
    totalRoofAreaSqM: number | null
  } | null
}>> {
  try {
    // Validate inputs
    if (!proposalId || !accessToken) {
      return { success: false, error: 'Invalid request' }
    }

    // Fetch proposal with token validation
    const proposal = await prisma.proposal.findFirst({
      where: {
        id: proposalId,
        accessToken: accessToken, // Token MUST match
      },
      include: {
        Lead: {
          include: {
            siteSurvey: true,
          },
        },
      },
    })

    // If no proposal found OR token doesn't match, return error
    if (!proposal) {
      return { success: false, error: 'Proposal not found or access denied' }
    }

    // Check if proposal has expired
    if (proposal.expiresAt && new Date() > proposal.expiresAt) {
      return { success: false, error: 'This proposal has expired' }
    }

    // Check if already accepted
    if (proposal.status === 'accepted') {
      return { success: false, error: 'This proposal has already been accepted' }
    }

    // Update status to 'viewed' if still draft/sent
    if (proposal.status === 'draft' || proposal.status === 'sent') {
      await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'viewed' },
      })

      // Create lead event
      await prisma.leadEvent.create({
        data: {
          leadId: proposal.leadId,
          type: 'PROPOSAL_VIEWED',
          content: 'Customer viewed the proposal',
          metadata: { proposalId },
        },
      })
    }

    return {
      success: true,
      data: {
        proposal: {
          id: proposal.id,
          status: proposal.status,
          systemSizeKW: proposal.systemSizeKW,
          panelCount: proposal.panelCount,
          annualProductionKWh: proposal.annualProductionKWh,
          grossSystemCost: proposal.grossSystemCost,
          federalITC: proposal.federalITC,
          priceAfterITC: proposal.priceAfterITC,
          year1Savings: proposal.year1Savings,
          netSavings25Yr: proposal.netSavings25Yr,
          breakEvenYear: proposal.breakEvenYear,
          cashScenario: proposal.cashScenario,
          loan10YearScenario: proposal.loan10YearScenario,
          loan15YearScenario: proposal.loan15YearScenario,
          ppaScenario: proposal.ppaScenario,
          recommendedOption: proposal.recommendedOption,
          generatedAt: proposal.generatedAt,
          expiresAt: proposal.expiresAt,
        },
        lead: {
          name: proposal.Lead.name,
          address: proposal.Lead.address,
        },
        siteSurvey: proposal.Lead.siteSurvey
          ? {
              roofImageUrl: proposal.Lead.siteSurvey.roofImageUrl,
              totalRoofAreaSqM: proposal.Lead.siteSurvey.totalRoofAreaSqM,
            }
          : null,
      },
    }
  } catch (error) {
    console.error('[Proposal] Error fetching public proposal:', error)
    return { success: false, error: 'Failed to load proposal' }
  }
}

// ============================================================================
// ACCEPT PROPOSAL ACTION
// ============================================================================

/**
 * Accept a proposal with e-signature
 * - Validates access token
 * - Validates and stores signature
 * - Updates proposal status to 'accepted'
 * - Updates lead stage to 'Closed'
 * - Creates audit trail
 */
export async function acceptProposal(
  input: AcceptProposalInput
): Promise<ActionResponse<AcceptProposalResult>> {
  try {
    const { proposalId, accessToken, signatureImageBase64, selectedScenario, customerName, customerEmail } = input

    // Validate inputs
    if (!proposalId || !accessToken) {
      return { success: false, error: 'Invalid request' }
    }

    if (!customerName || customerName.trim().length < 2) {
      return { success: false, error: 'Please enter your full name' }
    }

    if (!customerEmail || !validateEmail(customerEmail)) {
      return { success: false, error: 'Please enter a valid email address' }
    }

    if (!['CASH', 'LOAN_10', 'LOAN_15', 'PPA'].includes(selectedScenario)) {
      return { success: false, error: 'Please select a payment option' }
    }

    // Validate signature
    const signatureValidation = validateSignatureImage(signatureImageBase64)
    if (!signatureValidation.valid) {
      return { success: false, error: signatureValidation.error || 'Invalid signature' }
    }

    // Fetch and validate proposal
    const proposal = await prisma.proposal.findFirst({
      where: {
        id: proposalId,
        accessToken: accessToken, // Token MUST match
      },
      include: {
        Lead: true,
      },
    })

    if (!proposal) {
      return { success: false, error: 'Proposal not found or access denied' }
    }

    // Check if already accepted
    if (proposal.status === 'accepted') {
      return { success: false, error: 'This proposal has already been accepted' }
    }

    // Check if expired
    if (proposal.expiresAt && new Date() > proposal.expiresAt) {
      return { success: false, error: 'This proposal has expired' }
    }

    // Get client IP for audit
    const ipAddress = await getClientIP()
    const signedAt = new Date()

    // Update proposal with signature and acceptance
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: 'accepted',
        signedAt,
        signatureImage: signatureImageBase64,
        selectedScenario,
        customerName: customerName.trim(),
        customerEmail: customerEmail.toLowerCase().trim(),
        ipAddress,
      },
    })

    // Update lead stage to Closed
    await prisma.lead.update({
      where: { id: proposal.leadId },
      data: {
        stage: 'Closed',
        email: proposal.Lead.email || customerEmail.toLowerCase().trim(),
        name: proposal.Lead.name || customerName.trim(),
      },
    })

    // Create lead events for audit trail
    await prisma.leadEvent.createMany({
      data: [
        {
          leadId: proposal.leadId,
          type: 'PROPOSAL_ACCEPTED',
          content: `Proposal accepted with ${selectedScenario} payment option`,
          metadata: {
            proposalId,
            selectedScenario,
            customerName,
            customerEmail,
            signedAt: signedAt.toISOString(),
            ipAddress,
          },
        },
        {
          leadId: proposal.leadId,
          type: 'STAGE_CHANGE',
          content: 'Lead moved to Closed stage',
          metadata: {
            fromStage: proposal.Lead.stage,
            toStage: 'Closed',
            reason: 'Proposal accepted',
          },
        },
      ],
    })

    console.log(`[Proposal] Proposal ${proposalId} accepted by ${customerName} (${customerEmail})`)

    return {
      success: true,
      data: {
        proposalId: updatedProposal.id,
        leadId: updatedProposal.leadId,
        acceptedAt: signedAt,
        selectedScenario: updatedProposal.selectedScenario || selectedScenario,
      },
    }
  } catch (error) {
    console.error('[Proposal] Error accepting proposal:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept proposal',
    }
  }
}

// ============================================================================
// GENERATE SHAREABLE LINK
// ============================================================================

/**
 * Generate a shareable link for a proposal
 * Called by the sales rep to get a link to send to the customer
 */
export async function getProposalShareLink(
  proposalId: string
): Promise<ActionResponse<{ url: string; expiresAt: Date | null }>> {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        accessToken: true,
        expiresAt: true,
        status: true,
      },
    })

    if (!proposal) {
      return { success: false, error: 'Proposal not found' }
    }

    if (proposal.status === 'accepted') {
      return { success: false, error: 'This proposal has already been accepted' }
    }

    // Update status to 'sent' if still draft
    if (proposal.status === 'draft') {
      await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'sent' },
      })
    }

    // Construct the public URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const url = `${baseUrl}/proposals/${proposal.id}/${proposal.accessToken}`

    return {
      success: true,
      data: {
        url,
        expiresAt: proposal.expiresAt,
      },
    }
  } catch (error) {
    console.error('[Proposal] Error generating share link:', error)
    return { success: false, error: 'Failed to generate link' }
  }
}
