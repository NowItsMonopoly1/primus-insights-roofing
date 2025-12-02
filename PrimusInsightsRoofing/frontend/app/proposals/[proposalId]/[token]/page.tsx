// PRIMUS HOME PRO - Public Proposal Presentation Page
// Secure, token-validated page for customers to view and sign proposals

import { notFound } from 'next/navigation'
import { getPublicProposalDetails } from '@/lib/actions/accept-proposal'
import { ProposalPresentation } from './ProposalPresentation'

interface ProposalPageProps {
  params: Promise<{
    proposalId: string
    token: string
  }>
}

export default async function PublicProposalPage({ params }: ProposalPageProps) {
  const { proposalId, token } = await params

  // Fetch proposal with token validation
  const result = await getPublicProposalDetails(proposalId, token)

  if (!result.success) {
    // Return not found for invalid/expired proposals
    notFound()
  }

  const { proposal, lead, siteSurvey } = result.data

  return (
    <ProposalPresentation
      proposalId={proposalId}
      accessToken={token}
      proposal={proposal}
      lead={lead}
      siteSurvey={siteSurvey}
    />
  )
}

// Metadata
export async function generateMetadata({ params }: ProposalPageProps) {
  const { proposalId, token } = await params
  const result = await getPublicProposalDetails(proposalId, token)

  if (!result.success) {
    return {
      title: 'Proposal Not Found | Primus Home Pro',
    }
  }

  const { lead, proposal } = result.data

  return {
    title: `Solar Proposal for ${lead.name || 'Your Home'} | Primus Home Pro`,
    description: `View your personalized ${proposal.systemSizeKW.toFixed(1)}kW solar system proposal with estimated savings of $${Math.round(proposal.netSavings25Yr).toLocaleString()} over 25 years.`,
    robots: 'noindex, nofollow', // Don't index personal proposals
  }
}
