// PRIMUS HOME PRO - Solar Financial Calculations Engine
// Module H: Instant Proposal Generator - Core Calculation Logic
// Provides production estimates, savings forecasts, and financial scenarios

// ============================================================================
// SOLAR SYSTEM & PRODUCTION CONSTANTS
// ============================================================================

/** Panel efficiency (20% - modern residential monocrystalline average) */
export const PANEL_EFFICIENCY = 0.20

/** Inverter DC to AC conversion efficiency (96% standard) */
export const INVERTER_EFFICIENCY = 0.96

/** Annual system degradation rate (0.5% per year - industry standard) */
export const DEGRADATION_RATE = 0.005

/** System lifespan for financial modeling (25 years - standard warranty) */
export const SYSTEM_LIFESPAN_YRS = 25

/** Standard residential panel wattage (400W - 2024 standard) */
export const STANDARD_PANEL_WATTAGE = 400

/** System cost per watt before incentives ($2.50/W national average) */
export const DEFAULT_COST_PER_WATT = 2.50

// ============================================================================
// UTILITY & FINANCIAL CONSTANTS
// ============================================================================

/** Default residential utility rate ($/kWh - U.S. national average) */
export const DEFAULT_UTILITY_RATE = 0.1762

/** Annual utility rate escalation (3.0% - conservative industry projection) */
export const UTILITY_RATE_ESCALATION = 0.03

/** Federal Investment Tax Credit (30% through 2032) */
export const FEDERAL_ITC = 0.30

/** State utility rates lookup table ($/kWh) */
export const STATE_UTILITY_RATES: Record<string, number> = {
  CA: 0.3158,  // California - highest in nation
  NY: 0.2450,  // New York
  MA: 0.2890,  // Massachusetts
  CT: 0.2650,  // Connecticut
  NH: 0.2340,  // New Hampshire
  HI: 0.4320,  // Hawaii - second highest
  AK: 0.2410,  // Alaska
  TX: 0.1420,  // Texas
  FL: 0.1580,  // Florida
  AZ: 0.1390,  // Arizona
  NV: 0.1520,  // Nevada
  CO: 0.1480,  // Colorado
  WA: 0.1180,  // Washington
  OR: 0.1290,  // Oregon
  GA: 0.1450,  // Georgia
  NC: 0.1380,  // North Carolina
  VA: 0.1520,  // Virginia
  MD: 0.1680,  // Maryland
  NJ: 0.1890,  // New Jersey
  PA: 0.1720,  // Pennsylvania
  OH: 0.1540,  // Ohio
  MI: 0.1820,  // Michigan
  IL: 0.1650,  // Illinois
  DEFAULT: 0.1762, // National average
}

/** Default loan terms for financial scenarios */
export const LOAN_TERMS = {
  TERM_10_YEAR: { years: 10, apr: 0.0699 },  // 6.99% APR
  TERM_15_YEAR: { years: 15, apr: 0.0799 },  // 7.99% APR
  TERM_20_YEAR: { years: 20, apr: 0.0849 },  // 8.49% APR
  TERM_25_YEAR: { years: 25, apr: 0.0899 },  // 8.99% APR
}

/** PPA (Power Purchase Agreement) default rate */
export const PPA_RATE_PER_KWH = 0.12  // $0.12/kWh starting rate
export const PPA_ESCALATION_RATE = 0.029  // 2.9% annual escalation

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProductionEstimate {
  systemSizeWatts: number
  systemSizeKW: number
  annualProductionKWh: number
  year1ProductionKWh: number
  lifetimeProductionKWh: number
  degradedProductionByYear: number[]
}

export interface SavingsForecast {
  year1Savings: number
  year5Savings: number
  year10Savings: number
  year25Savings: number
  netSavings25Yr: number
  cumulativeSavingsByYear: number[]
  utilityRatesByYear: number[]
  breakEvenYear: number | null
}

export interface SystemCostBreakdown {
  grossSystemCost: number
  federalITC: number
  stateRebate: number
  totalIncentives: number
  priceAfterITC: number
  effectiveCostPerWatt: number
}

export interface LoanScenario {
  type: 'LOAN'
  termYears: number
  apr: number
  monthlyPayment: number
  totalInterestPaid: number
  totalCost: number
  year1CashFlow: number
  netSavings25Yr: number
}

export interface CashScenario {
  type: 'CASH'
  upfrontCost: number
  year1Savings: number
  paybackYears: number
  roi25Year: number
  netSavings25Yr: number
}

export interface PPAScenario {
  type: 'PPA'
  year1Rate: number
  escalationRate: number
  year1Payment: number
  totalPayments25Yr: number
  netSavings25Yr: number
  ownershipTransfer: boolean
}

export interface FinancialScenarios {
  cash: CashScenario
  loan10Year: LoanScenario
  loan15Year: LoanScenario
  ppa: PPAScenario
  recommendedOption: 'CASH' | 'LOAN_10' | 'LOAN_15' | 'PPA'
}

export interface ProposalData {
  leadId: string
  generatedAt: Date
  production: ProductionEstimate
  costs: SystemCostBreakdown
  savings: SavingsForecast
  financialScenarios: FinancialScenarios
  assumptions: {
    panelEfficiency: number
    inverterEfficiency: number
    degradationRate: number
    utilityRate: number
    utilityEscalation: number
    federalITC: number
    costPerWatt: number
  }
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate total system size in watts
 */
export function calculateSystemSize(
  maxPanelsCount: number,
  panelWattage: number = STANDARD_PANEL_WATTAGE
): { watts: number; kW: number } {
  const watts = maxPanelsCount * panelWattage
  return {
    watts,
    kW: watts / 1000,
  }
}

/**
 * Calculate gross system cost before incentives
 * Cost = System Size (Watts) × Cost Per Watt
 */
export function calculateGrossSystemCost(
  systemSizeWatts: number,
  costPerWatt: number = DEFAULT_COST_PER_WATT
): number {
  return systemSizeWatts * costPerWatt
}

/**
 * Calculate system cost after Federal ITC
 * Cost After ITC = Gross Cost × (1 - ITC Rate)
 */
export function calculateCostAfterITC(
  grossCost: number,
  itcRate: number = FEDERAL_ITC,
  stateRebate: number = 0
): SystemCostBreakdown {
  const federalITC = grossCost * itcRate
  const totalIncentives = federalITC + stateRebate
  const priceAfterITC = grossCost - totalIncentives

  return {
    grossSystemCost: grossCost,
    federalITC,
    stateRebate,
    totalIncentives,
    priceAfterITC,
    effectiveCostPerWatt: priceAfterITC / (grossCost / DEFAULT_COST_PER_WATT),
  }
}

/**
 * Calculate annual solar production (Year 1)
 * 
 * Production = (Sunshine Hours × Panel Count × Panel Wattage × Efficiency × Inverter Eff) / 1000
 * 
 * Note: maxSunshineHoursYear from Google Solar API represents peak sun hours
 * adjusted for the location's solar irradiance
 */
export function calculateAnnualProduction(
  maxSunshineHoursYear: number,
  maxPanelsCount: number,
  panelWattage: number = STANDARD_PANEL_WATTAGE,
  panelEfficiency: number = PANEL_EFFICIENCY,
  inverterEfficiency: number = INVERTER_EFFICIENCY
): number {
  // The formula: kWh = (hours × panels × watts × panel_eff × inverter_eff) / 1000
  // However, Google Solar API's sunshine hours already accounts for irradiance
  // So we use a simplified approach: kWh = sunshine_hours × system_kW × performance_ratio
  const systemKW = (maxPanelsCount * panelWattage) / 1000
  const performanceRatio = panelEfficiency * inverterEfficiency * 5 // Adjustment factor
  
  return maxSunshineHoursYear * systemKW * performanceRatio
}

/**
 * Calculate production for each year accounting for degradation
 */
export function calculateProductionByYear(
  year1Production: number,
  years: number = SYSTEM_LIFESPAN_YRS,
  degradationRate: number = DEGRADATION_RATE
): number[] {
  const productionByYear: number[] = []
  
  for (let year = 0; year < years; year++) {
    const degradationFactor = Math.pow(1 - degradationRate, year)
    productionByYear.push(year1Production * degradationFactor)
  }
  
  return productionByYear
}

/**
 * Calculate lifetime production over 25 years with degradation
 */
export function calculateLifetimeProduction(
  year1Production: number,
  years: number = SYSTEM_LIFESPAN_YRS,
  degradationRate: number = DEGRADATION_RATE
): number {
  const productionByYear = calculateProductionByYear(year1Production, years, degradationRate)
  return productionByYear.reduce((sum, production) => sum + production, 0)
}

/**
 * Calculate utility rates for each year with escalation
 */
export function calculateUtilityRatesByYear(
  startRate: number = DEFAULT_UTILITY_RATE,
  years: number = SYSTEM_LIFESPAN_YRS,
  escalationRate: number = UTILITY_RATE_ESCALATION
): number[] {
  const ratesByYear: number[] = []
  
  for (let year = 0; year < years; year++) {
    const escalationFactor = Math.pow(1 + escalationRate, year)
    ratesByYear.push(startRate * escalationFactor)
  }
  
  return ratesByYear
}

/**
 * Calculate 25-year savings forecast (Cash purchase - no loan payments)
 */
export function calculateSavingsForecast(
  year1Production: number,
  utilityRate: number = DEFAULT_UTILITY_RATE,
  systemCostAfterITC: number,
  years: number = SYSTEM_LIFESPAN_YRS
): SavingsForecast {
  const productionByYear = calculateProductionByYear(year1Production, years)
  const utilityRatesByYear = calculateUtilityRatesByYear(utilityRate, years)
  
  const cumulativeSavingsByYear: number[] = []
  let cumulativeSavings = 0
  let breakEvenYear: number | null = null
  
  for (let year = 0; year < years; year++) {
    const yearSavings = productionByYear[year] * utilityRatesByYear[year]
    cumulativeSavings += yearSavings
    cumulativeSavingsByYear.push(cumulativeSavings)
    
    // Track break-even year (when cumulative savings exceed system cost)
    if (breakEvenYear === null && cumulativeSavings >= systemCostAfterITC) {
      breakEvenYear = year + 1
    }
  }
  
  const netSavings25Yr = cumulativeSavings - systemCostAfterITC
  
  return {
    year1Savings: productionByYear[0] * utilityRatesByYear[0],
    year5Savings: cumulativeSavingsByYear[4] || 0,
    year10Savings: cumulativeSavingsByYear[9] || 0,
    year25Savings: cumulativeSavingsByYear[24] || 0,
    netSavings25Yr,
    cumulativeSavingsByYear,
    utilityRatesByYear,
    breakEvenYear,
  }
}

/**
 * Calculate monthly loan payment
 * M = P × [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  const monthlyRate = annualRate / 12
  const numPayments = termYears * 12
  
  if (monthlyRate === 0) return principal / numPayments
  
  const payment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  
  return payment
}

/**
 * Generate Cash purchase scenario
 */
export function generateCashScenario(
  systemCostAfterITC: number,
  savings: SavingsForecast
): CashScenario {
  const roi25Year = ((savings.netSavings25Yr + systemCostAfterITC) / systemCostAfterITC - 1) * 100
  
  return {
    type: 'CASH',
    upfrontCost: systemCostAfterITC,
    year1Savings: savings.year1Savings,
    paybackYears: savings.breakEvenYear || 0,
    roi25Year,
    netSavings25Yr: savings.netSavings25Yr,
  }
}

/**
 * Generate Loan scenario
 */
export function generateLoanScenario(
  systemCostAfterITC: number,
  savings: SavingsForecast,
  termYears: number,
  apr: number
): LoanScenario {
  const monthlyPayment = calculateMonthlyPayment(systemCostAfterITC, apr, termYears)
  const totalPayments = monthlyPayment * termYears * 12
  const totalInterestPaid = totalPayments - systemCostAfterITC
  
  // Year 1 cash flow = savings - loan payments
  const year1CashFlow = savings.year1Savings - (monthlyPayment * 12)
  
  // Net savings = total utility savings - total loan payments
  const netSavings25Yr = savings.cumulativeSavingsByYear[24] - totalPayments
  
  return {
    type: 'LOAN',
    termYears,
    apr,
    monthlyPayment,
    totalInterestPaid,
    totalCost: totalPayments,
    year1CashFlow,
    netSavings25Yr,
  }
}

/**
 * Generate PPA (Power Purchase Agreement) scenario
 */
export function generatePPAScenario(
  year1Production: number,
  savings: SavingsForecast,
  ppaRate: number = PPA_RATE_PER_KWH,
  escalationRate: number = PPA_ESCALATION_RATE
): PPAScenario {
  const productionByYear = calculateProductionByYear(year1Production, SYSTEM_LIFESPAN_YRS)
  
  let totalPayments = 0
  let currentRate = ppaRate
  
  for (let year = 0; year < SYSTEM_LIFESPAN_YRS; year++) {
    totalPayments += productionByYear[year] * currentRate
    currentRate *= (1 + escalationRate)
  }
  
  const year1Payment = year1Production * ppaRate
  
  // Net savings = utility savings avoided - PPA payments
  const netSavings25Yr = savings.cumulativeSavingsByYear[24] - totalPayments
  
  return {
    type: 'PPA',
    year1Rate: ppaRate,
    escalationRate,
    year1Payment,
    totalPayments25Yr: totalPayments,
    netSavings25Yr,
    ownershipTransfer: true, // Typically transfers after 25 years
  }
}

/**
 * Generate all financial scenarios and recommend the best option
 */
export function generateFinancialScenarios(
  systemCostAfterITC: number,
  savings: SavingsForecast,
  year1Production: number
): FinancialScenarios {
  const cash = generateCashScenario(systemCostAfterITC, savings)
  const loan10Year = generateLoanScenario(
    systemCostAfterITC, 
    savings, 
    LOAN_TERMS.TERM_10_YEAR.years, 
    LOAN_TERMS.TERM_10_YEAR.apr
  )
  const loan15Year = generateLoanScenario(
    systemCostAfterITC, 
    savings, 
    LOAN_TERMS.TERM_15_YEAR.years, 
    LOAN_TERMS.TERM_15_YEAR.apr
  )
  const ppa = generatePPAScenario(year1Production, savings)
  
  // Determine recommended option based on net savings
  let recommendedOption: 'CASH' | 'LOAN_10' | 'LOAN_15' | 'PPA' = 'CASH'
  const scenarios = [
    { key: 'CASH' as const, savings: cash.netSavings25Yr },
    { key: 'LOAN_10' as const, savings: loan10Year.netSavings25Yr },
    { key: 'LOAN_15' as const, savings: loan15Year.netSavings25Yr },
    { key: 'PPA' as const, savings: ppa.netSavings25Yr },
  ]
  
  // Sort by net savings (highest first)
  scenarios.sort((a, b) => b.savings - a.savings)
  recommendedOption = scenarios[0].key
  
  return {
    cash,
    loan10Year,
    loan15Year,
    ppa,
    recommendedOption,
  }
}

/**
 * Get utility rate for a state (with fallback to national average)
 */
export function getUtilityRateForState(stateCode: string): number {
  return STATE_UTILITY_RATES[stateCode.toUpperCase()] || STATE_UTILITY_RATES.DEFAULT
}

/**
 * Main function: Generate complete proposal data from lead solar info
 */
export function generateProposalData(
  leadId: string,
  maxPanelsCount: number,
  maxSunshineHoursYear: number,
  stateCode?: string,
  customUtilityRate?: number
): ProposalData {
  // 1. Calculate system size
  const { watts: systemSizeWatts, kW: systemSizeKW } = calculateSystemSize(maxPanelsCount)
  
  // 2. Calculate costs
  const grossCost = calculateGrossSystemCost(systemSizeWatts)
  const costs = calculateCostAfterITC(grossCost)
  
  // 3. Calculate production
  const year1Production = calculateAnnualProduction(maxSunshineHoursYear, maxPanelsCount)
  const productionByYear = calculateProductionByYear(year1Production)
  const lifetimeProduction = calculateLifetimeProduction(year1Production)
  
  const production: ProductionEstimate = {
    systemSizeWatts,
    systemSizeKW,
    annualProductionKWh: year1Production,
    year1ProductionKWh: year1Production,
    lifetimeProductionKWh: lifetimeProduction,
    degradedProductionByYear: productionByYear,
  }
  
  // 4. Determine utility rate
  const utilityRate = customUtilityRate || 
    (stateCode ? getUtilityRateForState(stateCode) : DEFAULT_UTILITY_RATE)
  
  // 5. Calculate savings
  const savings = calculateSavingsForecast(year1Production, utilityRate, costs.priceAfterITC)
  
  // 6. Generate financial scenarios
  const financialScenarios = generateFinancialScenarios(
    costs.priceAfterITC, 
    savings, 
    year1Production
  )
  
  return {
    leadId,
    generatedAt: new Date(),
    production,
    costs,
    savings,
    financialScenarios,
    assumptions: {
      panelEfficiency: PANEL_EFFICIENCY,
      inverterEfficiency: INVERTER_EFFICIENCY,
      degradationRate: DEGRADATION_RATE,
      utilityRate,
      utilityEscalation: UTILITY_RATE_ESCALATION,
      federalITC: FEDERAL_ITC,
      costPerWatt: DEFAULT_COST_PER_WATT,
    },
  }
}
