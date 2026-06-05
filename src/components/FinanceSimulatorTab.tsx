/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Calendar, 
  Percent, 
  Info, 
  Download,
  CheckCircle,
  HelpCircle,
  Wand2,
  TrendingUp,
  Award,
  Users,
  Sparkles,
  Building,
  Home,
  AlertTriangle
} from 'lucide-react';
import { Lead } from '../types';
import { triggerSensoryFeedback } from '../utils/sensory';

interface FinanceSimulatorTabProps {
  leads: Lead[];
  theme?: 'claro' | 'escuro' | 'galatico';
  accSettings?: any;
  addNotification?: (title: string, msg: string, type: 'success' | 'warning' | 'info') => void;
  awardXP?: (xp: number, cause: string) => void;
}

const table275k = [
  { income: 1700, rateSem: 4.85, finSem: 98615.39, rateCom: 4.33, finCom: 105162.27, subsidyCom: 55000, subsidySem: 16500, firstPay: 510 },
  { income: 1800, rateSem: 4.85, finSem: 104647.29, rateCom: 4.33, finCom: 111594.60, subsidyCom: 55000, subsidySem: 16500, firstPay: 540 },
  { income: 1900, rateSem: 4.85, finSem: 110679.19, rateCom: 4.33, finCom: 118026.93, subsidyCom: 55000, subsidySem: 16500, firstPay: 570 },
  { income: 2000, rateSem: 4.85, finSem: 116711.09, rateCom: 4.33, finCom: 124459.26, subsidyCom: 50777, subsidySem: 15233, firstPay: 600 },
  { income: 2100, rateSem: 4.85, finSem: 122742.99, rateCom: 4.33, finCom: 130891.59, subsidyCom: 44812, subsidySem: 13443, firstPay: 630 },
  { income: 2160.01, rateSem: 5.11, finSem: 122464.69, rateCom: 4.59, finCom: 130454.43, subsidyCom: 41729, subsidySem: 12518, firstPay: 630 },
  { income: 2200, rateSem: 5.11, finSem: 124802.43, rateCom: 4.59, finCom: 132944.70, subsidyCom: 39562, subsidySem: 11868, firstPay: 660 },
  { income: 2300, rateSem: 5.11, finSem: 130648.25, rateCom: 4.59, finCom: 139171.90, subsidyCom: 34440, subsidySem: 10332, firstPay: 690 },
  { income: 2400, rateSem: 5.11, finSem: 136494.07, rateCom: 4.59, finCom: 145399.10, subsidyCom: 29735, subsidySem: 8920, firstPay: 720 },
  { income: 2500, rateSem: 5.11, finSem: 142339.89, rateCom: 4.59, finCom: 151626.30, subsidyCom: 25438, subsidySem: 7631, firstPay: 750 },
  { income: 2605, rateSem: 5.11, finSem: 148185.71, rateCom: 4.59, finCom: 157853.50, subsidyCom: 21538, subsidySem: 6461, firstPay: 780 },
  { income: 2700, rateSem: 5.11, finSem: 154031.53, rateCom: 4.59, finCom: 164080.70, subsidyCom: 18026, subsidySem: 5407, firstPay: 810 },
  { income: 2800, rateSem: 5.11, finSem: 159877.35, rateCom: 4.59, finCom: 170307.90, subsidyCom: 14893, subsidySem: 4467, firstPay: 840 },
  { income: 2850.01, rateSem: 5.37, finSem: 153138.16, rateCom: 4.85, finCom: 162956.18, subsidyCom: 13589, subsidySem: 4076, firstPay: 840 },
  { income: 2900, rateSem: 5.37, finSem: 155971.83, rateCom: 4.85, finCom: 165971.52, subsidyCom: 12242, subsidySem: 3672, firstPay: 870 },
  { income: 3000, rateSem: 5.37, finSem: 161640.30, rateCom: 4.85, finCom: 172003.41, subsidyCom: 9818, subsidySem: 2945, firstPay: 900 },
  { income: 3100, rateSem: 5.37, finSem: 167308.77, rateCom: 4.85, finCom: 178035.30, subsidyCom: 7744, subsidySem: 2323, firstPay: 930 },
  { income: 3200, rateSem: 5.37, finSem: 172977.24, rateCom: 4.85, finCom: 184067.19, subsidyCom: 6011, subsidySem: 1803, firstPay: 960 },
  { income: 3200.01, rateSem: 5.64, finSem: 167817.80, rateCom: 5.11, finCom: 178389.71, subsidyCom: 6072, subsidySem: 1821, firstPay: 960 },
  { income: 3300, rateSem: 5.64, finSem: 173316.63, rateCom: 5.11, finCom: 184234.94, subsidyCom: 4659, subsidySem: 0, firstPay: 990 },
  { income: 3400, rateSem: 5.64, finSem: 178816.01, rateCom: 5.11, finCom: 190080.76, subsidyCom: 3571, subsidySem: 0, firstPay: 1020 },
  { income: 3500, rateSem: 5.64, finSem: 184315.39, rateCom: 5.11, finCom: 195926.58, subsidyCom: 2799, subsidySem: 0, firstPay: 1050 },
  { income: 3500.01, rateSem: 6.16, finSem: 173749.93, rateCom: 5.64, finCom: 184315.95, subsidyCom: 2858, subsidySem: 0, firstPay: 1050 },
  { income: 3600, rateSem: 6.16, finSem: 178933.54, rateCom: 5.64, finCom: 189814.78, subsidyCom: 2384, subsidySem: 0, firstPay: 1080 },
  { income: 3700, rateSem: 6.16, finSem: 184117.67, rateCom: 5.64, finCom: 195314.16, subsidyCom: 2214, subsidySem: 0, firstPay: 1110 },
  { income: 3800, rateSem: 6.16, finSem: 189301.80, rateCom: 5.64, finCom: 200813.54, subsidyCom: 2192, subsidySem: 0, firstPay: 1140 },
  { income: 3900, rateSem: 6.16, finSem: 194485.93, rateCom: 5.64, finCom: 206312.92, subsidyCom: 2171, subsidySem: 0, firstPay: 1170 },
  { income: 4000, rateSem: 6.16, finSem: 199670.06, rateCom: 5.64, finCom: 211812.30, subsidyCom: 2149, subsidySem: 0, firstPay: 1200 },
  { income: 4000.01, rateSem: 7.22, finSem: 178491.12, rateCom: 6.69, finCom: 188601.32, subsidyCom: 0, subsidySem: 0, firstPay: 1200 },
  { income: 4100, rateSem: 7.22, finSem: 183124.89, rateCom: 6.69, finCom: 193497.56, subsidyCom: 0, subsidySem: 0, firstPay: 1230 },
  { income: 4200, rateSem: 7.22, finSem: 187759.13, rateCom: 6.69, finCom: 198394.29, subsidyCom: 0, subsidySem: 0, firstPay: 1260 },
  { income: 4300, rateSem: 7.22, finSem: 192393.37, rateCom: 6.69, finCom: 203291.02, subsidyCom: 0, subsidySem: 0, firstPay: 1290 },
  { income: 4400, rateSem: 7.22, finSem: 197027.61, rateCom: 6.69, finCom: 208187.75, subsidyCom: 0, subsidySem: 0, firstPay: 1320 },
  { income: 4500, rateSem: 7.22, finSem: 201661.85, rateCom: 6.69, finCom: 213084.48, subsidyCom: 0, subsidySem: 0, firstPay: 1350 },
  { income: 4600, rateSem: 7.22, finSem: 206296.09, rateCom: 6.69, finCom: 217981.21, subsidyCom: 0, subsidySem: 0, firstPay: 1380 },
  { income: 4700, rateSem: 7.22, finSem: 210930.33, rateCom: 6.69, finCom: 220000.00, subsidyCom: 0, subsidySem: 0, firstPay: 1410 },
  { income: 4800, rateSem: 7.22, finSem: 215564.57, rateCom: 6.69, finCom: 220000.00, subsidyCom: 0, subsidySem: 0, firstPay: 1440 },
  { income: 4863, rateSem: 7.22, finSem: 218484.11, rateCom: 6.69, finCom: 220000.00, subsidyCom: 0, subsidySem: 0, firstPay: 1459 },
  { income: 4900, rateSem: 7.22, finSem: 220000.00, rateCom: 6.69, finCom: 220000.00, subsidyCom: 0, subsidySem: 0, firstPay: 1469 },
  { income: 5000, rateSem: 7.22, finSem: 220000.00, rateCom: 6.69, finCom: 220000.00, subsidyCom: 0, subsidySem: 0, firstPay: 1469 }
];

export default function FinanceSimulatorTab({
  leads,
  theme = 'escuro',
  accSettings,
  addNotification,
  awardXP
}: FinanceSimulatorTabProps) {
  // Simulator Navigation Switcher
  const [activeSim, setActiveSim] = useState<'financing' | 'sales'>('financing');

  // Common/Interactive Selected Lead State
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');

  // ==========================================
  // CALCULATOR 1: FINANCIAMENTO HABITACIONAL (REGRAS & SUBSÍDIOS)
  // ==========================================
  const [grossIncome, setGrossIncome] = useState<number>(4000); // Gross household income (Renda Familiar)
  const [applicantAge, setApplicantAge] = useState<number>(32); // Age
  const [hasDependents, setHasDependents] = useState<boolean>(false); // Dependents?
  const [hasFGTS, setHasFGTS] = useState<boolean>(false); // FGTS for 3+ years?
  const [hasInterestReducer, setHasInterestReducer] = useState<boolean>(false); // Redutor de Juros CEF -0.5%
  const [hasCasaPaulista, setHasCasaPaulista] = useState<boolean>(true); // Subsídio Casa Paulista SP (Governo de SP)
  const [simulatedPropertyPrice, setSimulatedPropertyPrice] = useState<number>(275000); // Property cost
  const [loanMonths, setLoanMonths] = useState<number>(360); // Amortization period in months (max 420)
  const [amortizationSystem, setAmortizationSystem] = useState<'SAC' | 'PRICE'>('SAC');

  // NOVOS PARAMETROS REQUISITADOS
  const [professionType, setProfessionType] = useState<'CLT' | 'AUTONOMO'>('CLT');
  const [cltIncome, setCltIncome] = useState<number>(4000);
  const [autonomoIncome, setAutonomoIncome] = useState<number>(4000);
  const [isMarried, setIsMarried] = useState<boolean>(false);
  const [spouseIncome, setSpouseIncome] = useState<number>(0);
  const [dependentsQty, setDependentsQty] = useState<number>(0);

  // Identificação e controle de exportação customizados
  const [clientCustomName, setClientCustomName] = useState<string>('Cliente Avulso');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Checklist de documentos físicos obrigatórios
  const [docCpfCnh, setDocCpfCnh] = useState<boolean>(false);
  const [docEndereco, setDocEndereco] = useState<boolean>(false);
  const [docRenda, setDocRenda] = useState<boolean>(false);
  const [docExtratos, setDocExtratos] = useState<boolean>(false);

  // Efeito reativo para calcular a renda consolidada (grossIncome) automaticamente com base nas seleções
  useEffect(() => {
    const baseIncome = professionType === 'CLT' ? cltIncome : autonomoIncome;
    const aggregated = baseIncome + (isMarried ? spouseIncome : 0);
    setGrossIncome(aggregated);
  }, [professionType, cltIncome, autonomoIncome, isMarried, spouseIncome]);

  // Efeito reativo para definir hasDependents com base no estado civil ou quantidade de dependentes
  useEffect(() => {
    // Casado ou quantidade de dependentes maior que zero define o direito de subsídio unificado
    setHasDependents(isMarried || dependentsQty > 0);
  }, [isMarried, dependentsQty]);

  // Estados especiais para Entrada Facilitada Construtora
  const [tempoObra, setTempoObra] = useState<number>(36); // Tempo de obra em meses
  const [valorAto, setValorAto] = useState<number>(15000); // Valor da parcela de ato / sinal
  const [valorAnual, setValorAnual] = useState<number>(5000); // Cada parcela anual (total de 2 parcelas = 2 * valorAnual)
  const [valorChaves, setValorChaves] = useState<number>(10000); // Parcela na entrega de chaves

  // Outputs of Calculator 1
  const [calculatedSubsidy, setCalculatedSubsidy] = useState<number>(0);
  const [applicableInterestRate, setApplicableInterestRate] = useState<number>(0);
  const [maxMonthlyPayment, setMaxMonthlyPayment] = useState<number>(0);
  const [financedAmount, setFinancedAmount] = useState<number>(0);
  const [firstPayment, setFirstPayment] = useState<number>(0);
  const [lastPayment, setLastPayment] = useState<number>(0);
  const [requiredDownpayment, setRequiredDownpayment] = useState<number>(0);
  const [mcmvBracketName, setMcmvBracketName] = useState<string>('');

  // Handle selected lead's budget or details if loaded
  useEffect(() => {
    if (selectedLeadId) {
      const parentLead = leads.find(l => l.id === selectedLeadId);
      if (parentLead) {
        if (parentLead.value > 0) {
          setSimulatedPropertyPrice(parentLead.value);
          setSalesPropertyPrice(parentLead.value); // also feed calculator 2
        }
        setClientCustomName(parentLead.name);
        if (addNotification) {
          addNotification(
            '👤 LEAD VINCULADO',
            `Perfil de ${parentLead.name} carregado no simulador habitacional.`,
            'info'
          );
        }
      }
    }
  }, [selectedLeadId, leads]);

  // Recalculate Bank Financing (Regras e Subsídios)
  useEffect(() => {
    // Pagamento máximo tolerável = 30% da renda familiar bruta
    const paymentCapacity = grossIncome * 0.30;

    let rate = 4.25; // Default interest rate
    let subsidy = 0;
    let bracket = '';
    let finalFinanced = 0;

    // Se o valor do imóvel simulado for exatamente 275.000 (tabela de avaliação do PDF)
    if (simulatedPropertyPrice === 275000) {
      // Encontra a linha mais próxima do grossIncome na tabela de 275k
      const row = table275k.reduce((prev, curr) => 
        Math.abs(curr.income - grossIncome) < Math.abs(prev.income - grossIncome) ? curr : prev
      );

      // Determina taxas e subsídios com base nas variáveis do usuário (FGTS ou Redutor de Juros CEF)
      const useReducer = hasInterestReducer || hasFGTS;
      rate = useReducer ? row.rateCom : row.rateSem;
      subsidy = hasDependents ? row.subsidyCom : row.subsidySem;
      
       let tableFinanced = useReducer ? row.finCom : row.finSem;
 
       finalFinanced = tableFinanced;
      
      // Classificação do enquadramento conforme a tabela e regras MCMV (HIS1/HIS2)
      if (grossIncome <= 3200) {
        bracket = 'HIS 1 - Faixa 1 (MCMV)';
      } else if (grossIncome <= 4400) {
        bracket = 'HIS 1 - Faixa 2 (MCMV)';
      } else if (grossIncome <= 8000) {
        bracket = 'HIS 2 - Faixa 3 (MCMV)';
      } else {
        bracket = 'SBPE (Livre Habitacional)';
      }
    } else {
      // Caso geral: estimador dinâmico de regras MCMV / SBPE para outros valores de imóvel
      const useReducer = hasInterestReducer || hasFGTS;
      if (grossIncome <= 2645) {
        bracket = 'Faixa 1 (MCMV)';
        rate = useReducer ? 4.0 : 4.5;
        const factor = (grossIncome - 1412) / (2640 - 1412);
        subsidy = Math.max(20000, 55000 - factor * 30000);
        if (hasDependents) subsidy += 3000;
      } else if (grossIncome <= 4400) {
        bracket = 'Faixa 2 (MCMV)';
        rate = useReducer ? 4.75 : 5.25;
        const factor = (grossIncome - 2640) / (4400 - 2640);
        subsidy = Math.max(10000, 25000 - factor * 15000);
        if (hasDependents) subsidy += 2000;
      } else if (grossIncome <= 8000) {
        bracket = 'Faixa 3 (MCMV)';
        rate = useReducer ? 6.0 : 6.5;
        subsidy = hasDependents ? 5000 : 0;
      } else {
        bracket = 'SBPE (Livre habitacional)';
        rate = 9.8;
        subsidy = 0;
      }

      let maxFundingPct = 0.80;
      if (grossIncome <= 4400 && useReducer) {
        maxFundingPct = 0.80;
      } else if (grossIncome <= 4400 && !useReducer) {
        maxFundingPct = 0.70;
      }
      
      const maxFinancivel = simulatedPropertyPrice * maxFundingPct;
      finalFinanced = maxFinancivel;

      // Age restriction check
      const maxYears = Math.min(35, 80 - applicantAge);
      const calculatedMonths = Math.min(loanMonths, maxYears * 12);
      const monthlyRate = (rate / 100) / 12;
      const priceAmortization = maxFinancivel / calculatedMonths;
      const initialInterest = maxFinancivel * monthlyRate;
      const sacFirstPay = priceAmortization + initialInterest;
      
      if (sacFirstPay > paymentCapacity) {
        const allowableFinancing = paymentCapacity / ( (1 / calculatedMonths) + (monthlyRate * 0.75) );
        finalFinanced = Math.min(maxFinancivel, Math.max(allowableFinancing, 0));
      }
    }

    // Adiciona o subsidio estadual Casa Paulista de SP caso habilitado
    let stateSubsidy = 0;
    if (hasCasaPaulista) {
      if (grossIncome <= 4400) {
        stateSubsidy = 13000;
      } else if (grossIncome <= 8000) {
        stateSubsidy = 10000;
      }
    }
    subsidy += stateSubsidy;

    if (finalFinanced > simulatedPropertyPrice - subsidy) {
      finalFinanced = Math.max(0, simulatedPropertyPrice - subsidy);
    }

    // Calcula primeira e última parcela baseando-se no prazo e sistema de amortização
    const maxYears = Math.min(35, 80 - applicantAge);
    const calculatedMonths = Math.min(loanMonths, maxYears * 12);
    if (loanMonths > calculatedMonths && addNotification) {
      setLoanMonths(calculatedMonths);
    }

    const monthlyRate = (rate / 100) / 12;
    let actualFirstPay = 0;
    let actualLastPay = 0;

    if (simulatedPropertyPrice === 275000) {
      const row = table275k.reduce((prev, curr) => 
        Math.abs(curr.income - grossIncome) < Math.abs(prev.income - grossIncome) ? curr : prev
      );
      if (amortizationSystem === 'SAC') {
        actualFirstPay = Math.min(paymentCapacity, row.firstPay);
        const priceAmortization = finalFinanced / calculatedMonths;
        actualLastPay = priceAmortization + (priceAmortization * monthlyRate);
      } else {
        // PRICE system with row fallback, or calculated PRICE
        const priceFactor = (monthlyRate * Math.pow(1 + monthlyRate, calculatedMonths)) / (Math.pow(1 + monthlyRate, calculatedMonths) - 1);
        const fixedMonthly = finalFinanced * priceFactor;
        actualFirstPay = Math.min(paymentCapacity, fixedMonthly);
        actualLastPay = Math.min(paymentCapacity, fixedMonthly);
      }
    } else {
      if (amortizationSystem === 'SAC') {
        const priceAmortization = finalFinanced / calculatedMonths;
        actualFirstPay = Math.min(paymentCapacity, priceAmortization + (finalFinanced * monthlyRate));
        actualLastPay = priceAmortization + (priceAmortization * monthlyRate);
      } else {
        // General PRICE
        const priceFactor = (monthlyRate * Math.pow(1 + monthlyRate, calculatedMonths)) / (Math.pow(1 + monthlyRate, calculatedMonths) - 1);
        const fixedMonthly = finalFinanced * priceFactor;
        actualFirstPay = Math.min(paymentCapacity, fixedMonthly);
        actualLastPay = Math.min(paymentCapacity, fixedMonthly);
      }
    }

    // Downpayment (Entrada) = Property Price - Subsidy - Financed Amount
    const reqDown = Math.max(0, simulatedPropertyPrice - subsidy - finalFinanced);

    setCalculatedSubsidy(Math.round(subsidy));
    setApplicableInterestRate(rate);
    setMaxMonthlyPayment(Math.round(paymentCapacity));
    setFinancedAmount(Math.round(finalFinanced));
    setFirstPayment(Math.round(actualFirstPay));
    setLastPayment(Math.round(actualLastPay));
    setRequiredDownpayment(Math.round(reqDown));
    setMcmvBracketName(bracket);

  }, [grossIncome, applicantAge, hasDependents, hasFGTS, hasInterestReducer, simulatedPropertyPrice, loanMonths, amortizationSystem, hasCasaPaulista]);


  // ==========================================
  // CALCULATOR 2: SIMULADOR DE VENDA (FLUXO DE PARCELAS / DISPONÍVEL)
  // ==========================================
  const [salesPropertyPrice, setSalesPropertyPrice] = useState<number>(380000);
  const [salesConstructionMonths, setSalesConstructionMonths] = useState<number>(36);
  
  // Percentages distribution
  const [salesEntradaPct, setSalesEntradaPct] = useState<number>(10); // Downpayment %
  const [salesAnnualPct, setSalesAnnualPct] = useState<number>(5); // Percentage for each of the 2 annuals
  const [salesChavesPct, setSalesChavesPct] = useState<number>(10); // Chaves %
  const [salesFinanciamentoPct, setSalesFinanciamentoPct] = useState<number>(65); // Bank financing post-construction

  // Output calculations for Sales simulator
  const [salesEntradaVal, setSalesEntradaVal] = useState<number>(0);
  const [salesAnnualVal, setSalesAnnualVal] = useState<number>(0); 
  const [salesChavesVal, setSalesChavesVal] = useState<number>(0);
  const [salesFinanciamentoVal, setSalesFinanciamentoVal] = useState<number>(0);
  const [salesMonthlyWorkVal, setSalesMonthlyWorkVal] = useState<number>(0);
  const [salesLeftoverForMonthlies, setSalesLeftoverForMonthlies] = useState<number>(0);
  const [salesMonthlyWorkPct, setSalesMonthlyWorkPct] = useState<number>(0);

  // Auto compile Calculator 2 values based on inputs
  useEffect(() => {
    const price = salesPropertyPrice;
    
    const calculatedEntrada = (price * salesEntradaPct) / 100;
    const calculatedOneAnnual = (price * salesAnnualPct) / 100;
    const total2Annuals = calculatedOneAnnual * 2;
    const calculatedChaves = (price * salesChavesPct) / 100;
    const calculatedFinancing = (price * salesFinanciamentoPct) / 100;

    // Amortize leftover into monthlies during the available availability period (fluxo de obras)
    const totalOutlays = calculatedEntrada + total2Annuals + calculatedChaves + calculatedFinancing;
    const leftover = price - totalOutlays;

    const monthlyVal = leftover > 0 ? (leftover / salesConstructionMonths) : 0;
    const monthlyPct = (leftover / price) * 100;

    setSalesEntradaVal(calculatedEntrada);
    setSalesAnnualVal(calculatedOneAnnual);
    setSalesChavesVal(calculatedChaves);
    setSalesFinanciamentoVal(calculatedFinancing);
    setSalesLeftoverForMonthlies(leftover);
    setSalesMonthlyWorkVal(monthlyVal);
    setSalesMonthlyWorkPct(monthlyPct);

  }, [salesPropertyPrice, salesConstructionMonths, salesEntradaPct, salesAnnualPct, salesChavesPct, salesFinanciamentoPct]);


  // Presets applying for sales calculator 
  const applyPresetProfile = (presetKey: string) => {
    triggerSensoryFeedback('click', accSettings);
    
    if (presetKey === 'mcmv_padrao') {
      setSalesEntradaPct(10);
      setSalesAnnualPct(3); // 3% x 2 = 6%
      setSalesChavesPct(8);
      setSalesFinanciamentoPct(70);
      if (addNotification) addNotification('📊 PRESORT MCMV', 'Configurações de fluxo de obras para o Minha Casa Minha Vida aplicadas.', 'success');
    } else if (presetKey === 'sbpe_classe_media') {
      setSalesEntradaPct(15);
      setSalesAnnualPct(5); // 5% x 2 = 10%
      setSalesChavesPct(10);
      setSalesFinanciamentoPct(60);
      if (addNotification) addNotification('📊 PRESET SBPE', 'Configurações equilibradas de fluxo SBPE médio-padrão aplicadas.', 'success');
    } else {
      setSalesEntradaPct(20);
      setSalesAnnualPct(8); // 8% x 2 = 16%
      setSalesChavesPct(15);
      setSalesFinanciamentoPct(40);
      if (addNotification) addNotification('📊 PRESET INVESTIDOR', 'Amortizações agressivas para o investidor de liquidez do estoque.', 'info');
    }
  };


  // Helper para download de arquivo CSV/Excel estruturado
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportação 1: Tabela estruturada em CSV
  const handleExportCSV1 = () => {
    triggerSensoryFeedback('success', accSettings);
    if (awardXP) awardXP(120, 'EXPORTACAO_PLANILHA_FINANCIAMENTO');
    
    const clientName = clientCustomName || 'Cliente Avulso';
    const totalFac = valorAto + (2 * valorAnual) + valorChaves;
    const difRestante = Math.max(0, requiredDownpayment - totalFac);
    const valMensalObra = tempoObra > 0 ? (difRestante / tempoObra) : 0;
    
    const csvContent = [
      ["--- SIMULACAO DE FINANCIAMENTO HABITACIONAL CAIXA / cicloCRED ---"],
      ["Variavel", "Valor Estimado", "Descritivo Tecnico"],
      ["Cliente / Proponente", clientName, "Nome completo na proposta"],
      ["Regime de Comprovacao de Renda", professionType === 'CLT' ? '💼 CLT (Holerite)' : '🚀 Autônomo (Extrato)', "Modo de analise de credito"],
      ["Renda Proponente Principal", `R$ ${ (professionType === 'CLT' ? cltIncome : autonomoIncome).toLocaleString('pt-BR') }`, "Renda individual"],
      ["Composicao Familiar (Casado)", isMarried ? `Sim (+ R$ ${spouseIncome.toLocaleString('pt-BR')} do conjuge)` : "Nao", "Agregação de renda familiar"],
      ["Quantidade de Dependentes", `${dependentsQty} dependente(s)`, "Bonus MCMV aplicados"],
      ["Renda Familiar Consolidada", `R$ ${grossIncome.toLocaleString('pt-BR')}`, "Renda familiar total"],
      ["Enquadramento Habitacional", mcmvBracketName, "Faixa de qualificacao MCMV"],
      ["Idade do Proponente", `${applicantAge} anos`, "Termo limitante de amortizacao"],
      ["Tempo de FGTS (3+ anos)", hasFGTS ? "Ativo (Taxa de Juros Reduzida)" : "Inativo", "Regra de bonificacao de juros"],
      ["Sistema de Amortizacao", amortizationSystem, "Tabela de amortizacao contratada (SAC ou PRICE)"],
      ["Prazo Solicitado", `${loanMonths} meses`, "Tempo total de parcelas bancarias"],
      [""],
      ["--- RESULTADOS E BENEFICIOS HABITACIONAIS ---"],
      ["Preco do Imovel Simulado", `R$ ${simulatedPropertyPrice.toLocaleString('pt-BR')}`, "Avaliacao da Unidade"],
      ["Taxa Nominal de Juros", `${applicableInterestRate}% a.a.`, "Taxa de juros anualizada"],
      ["Subsidio Habitacional (Desconto Caixa)", `R$ ${calculatedSubsidy.toLocaleString('pt-BR')}`, "Fator de desconto direto do Governo"],
      ["Saldo Financiado Garantido Caixa", `R$ ${financedAmount.toLocaleString('pt-BR')}`, "Fundo Caixa a ser repassado"],
      ["Primeira Prestacao Bancaria", `R$ ${firstPayment.toLocaleString('pt-BR')}`, "Mensalidade inicial corrigida"],
      ["Ultima Prestacao Bancaria", `R$ ${lastPayment.toLocaleString('pt-BR')}`, "Prestacao final de quitacao"],
      ["Capacidade Recomendada (30% Renda)", `R$ ${maxMonthlyPayment.toLocaleString('pt-BR')}`, "Margem de comprometimento maxima"],
      ["Valor de Entrada Necessaria (Recursos Proprios)", `R$ ${requiredDownpayment.toLocaleString('pt-BR')}`, "Total devido a Construtora"],
      [""],
      ["--- PLANO DE PARCELAMENTO FACILITADO (PERIODO DE OBRAS) ---"],
      ["Ato Real de Sinal de Entrada", `R$ ${valorAto.toLocaleString('pt-BR')}`, "Ato no fechamento do contrato"],
      ["2x Parcelas Baloes Anuais (Cada)", `R$ ${valorAnual.toLocaleString('pt-BR')}`, `Totalizando R$ ${(2 * valorAnual).toLocaleString('pt-BR')}`],
      ["Parcela de Chaves (Entrega)", `R$ ${valorChaves.toLocaleString('pt-BR')}`, "Exigido para entrega de chaves"],
      ["Saldo Residual para Parcelar na Obra", `R$ ${difRestante.toLocaleString('pt-BR')}`, "Diferenca a diluir nas parcelas de obra"],
      ["Mensalidade no Periodo de Obras", `${tempoObra} parcelas de R$ ${Math.round(valMensalObra).toLocaleString('pt-BR')} /mes`, `Amortizado durante os ${tempoObra} meses em obras`],
      [""],
      ["--- DOSSIE DIGITAL DE DOCUMENTOS FISICOS ---"],
      ["Documento CPF / CNH com foto", docCpfCnh ? "CONFIRMADO [✓]" : "PENDENTE [ ]", "ID Fisica"],
      ["Comprovante de Endereco (<90 dias)", docEndereco ? "CONFIRMADO [✓]" : "PENDENTE [ ]", "Contas basicas de consumo"],
      ["Comprovante de Renda (Holerite/IPRF)", docRenda ? "CONFIRMADO [✓]" : "PENDENTE [ ]", "Demonstrativos oficiais de renda"],
      ["Extratos Bancarios Consolidados", docExtratos ? "CONFIRMADO [✓]" : "PENDENTE [ ]", "Soma dos ultimos 3 meses com carimbos"],
      ["Status Consolidado do Dossie", docCpfCnh && docEndereco && docRenda && docExtratos ? "COMPLETO (Pronto para CAIXA)" : `EM ANALISE (${[docCpfCnh, docEndereco, docRenda, docExtratos].filter(Boolean).length}/4)`, "Dossie fiscal do comprador"]
    ].map(row => row.join(";")).join("\n");

    downloadCSV(csvContent, `Spreadsheet_Financiamento_MCMV_${clientName.replace(/\s+/g, "_")}.csv`);
    if (addNotification) {
      addNotification('📊 PLANILHA EXPORTADA', 'Planilha de enquadramento (CSV) gerada e baixada com sucesso!', 'success');
    }
  };

  // Exportação 2: Tabela de fluxo de obras estruturada em CSV
  const handleExportCSV2 = () => {
    triggerSensoryFeedback('success', accSettings);
    if (awardXP) awardXP(120, 'EXPORTACAO_PLANILHA_FLUXO_Obras');
    
    const clientName = clientCustomName || 'Cliente Avulso';
    let csvData = [
      ["--- TABELA DE AMORTIZACOES NO PERIODO DE OBRAS CONSTRUTORA ---"],
      ["Modulo", "Descritivo da Parcela", "Percentual (%)", "Valor Estimado (R$)"],
      ["Sinal Prontidao", "Ato de recursos proprios na assinatura", `${salesEntradaPct}%`, `R$ ${salesEntradaVal.toLocaleString('pt-BR')}`]
    ];
    
    // Adiciona o fluxo dos meses
    for (let m = 1; m <= salesConstructionMonths; m++) {
      const isAnnual = m % 12 === 0 && m < salesConstructionMonths;
      csvData.push([
        `Mes ${m}`,
        `Mensalidade Periodo de Obras #${m}`,
        `${(salesMonthlyWorkPct / salesConstructionMonths).toFixed(2)}%`,
        `R$ ${salesMonthlyWorkVal.toLocaleString('pt-BR')}`
      ]);
      if (isAnnual) {
        csvData.push([
          `Mes ${m}`,
          `📣 Intermediaria de Reforco Anual`,
          `${salesAnnualPct}%`,
          `R$ ${salesAnnualVal.toLocaleString('pt-BR')}`
        ]);
      }
    }
    
    csvData.push([
      `Mes ${salesConstructionMonths}`,
      "🔑 Parcela final de chaves / Habite-se",
      `${salesChavesPct}%`,
      `R$ ${salesChavesVal.toLocaleString('pt-BR')}`
    ]);
    
    csvData.push([
      "Pos-Obra",
      "🏦 Repasse Caixa Economica Federal / SBPE",
      `${salesFinanciamentoPct}%`,
      `R$ ${salesFinanciamentoVal.toLocaleString('pt-BR')}`
    ]);
    
    csvData.push([""]);
    csvData.push(["--- RESUMO EXECUTIVO ---"]);
    csvData.push(["Valor do Imovel", `R$ ${salesPropertyPrice.toLocaleString('pt-BR')}`]);
    csvData.push(["Meses de Obras Disponivel", `${salesConstructionMonths} meses`]);
    csvData.push(["Status de Fechamento", isSalesBalanced ? "PLANILHA DUPLICADA 100%" : "PLANILHA REQUER EQUILIBRIO"]);
    
    const csvContent = csvData.map(row => row.join(";")).join("\n");
    downloadCSV(csvContent, `Roteiro_Fluxo_Obras_${clientName.replace(/\s+/g, "_")}.csv`);
    
    if (addNotification) {
      addNotification('📊 PLANILHA EXPORTADA', 'Planilha de fluxo periódico (CSV) baixada com sucesso!', 'success');
    }
  };

  // Copying / Exporting functions for both simulations (Fallback text copy keeps compatibility)
  const handleExportSimulation1 = () => {
    triggerSensoryFeedback('success', accSettings);
    if (awardXP) awardXP(150, 'EXPORTACAO_SIMULACAO_FINACEIRA_1');

    const totalFacAvulso = valorAto + (2 * valorAnual) + valorChaves;
    const difRestante = Math.max(0, requiredDownpayment - totalFacAvulso);
    const valMensalObra = tempoObra > 0 ? (difRestante / tempoObra) : 0;

    const leadName = clientCustomName || 'Cliente Avulso';
    const textStr = `
=== SIMULAÇÃO DE FINANCIAMENTO HABITACIONAL CAIXA / cicloCRED ===
Cliente: ${leadName}
Perfil Técnico: Renda R$ ${grossIncome.toLocaleString('pt-BR')} | Idade: ${applicantAge} anos
Faixa de Enquadramento: ${mcmvBracketName}
Tabela de Amortização: ${amortizationSystem}

----------------------------------------------------------------------------------
🏢 Valor Estimado do Imóvel: R$ ${simulatedPropertyPrice.toLocaleString('pt-BR')}
🛡️ Taxa de Juros Anual: ${applicableInterestRate}% a.a.
🎁 Subsídio Habitacional Concedido: R$ ${calculatedSubsidy.toLocaleString('pt-BR')}
💳 Saldo Bancário Financiado (Caixa): R$ ${financedAmount.toLocaleString('pt-BR')}
💰 Primeira Parcela Mensal (Banco): R$ ${firstPayment.toLocaleString('pt-BR')}
📉 Última Parcela Mensal (Banco): R$ ${lastPayment.toLocaleString('pt-BR')}
💵 Entrada de Recursos Próprios Necessária: R$ ${requiredDownpayment.toLocaleString('pt-BR')}

--- PLANO DE ENTRADA FACILITADA COM A CONSTRUTORA ---
⚡ Sinal/Ato: R$ ${valorAto.toLocaleString('pt-BR')}
📅 2 Balões Anuais: 2x de R$ ${valorAnual.toLocaleString('pt-BR')} (Total R$ ${(2 * valorAnual).toLocaleString('pt-BR')})
🔑 Parcela de Chaves: R$ ${valorChaves.toLocaleString('pt-BR')}
🧱 Saldo Restante para Período de Obras: R$ ${difRestante.toLocaleString('pt-BR')}
📈 Mensais Período Obras: ${tempoObra} parcelas mensais de R$ ${Math.round(valMensalObra).toLocaleString('pt-BR')} /mês
----------------------------------------------------------------------------------
Simulado em ${new Date().toLocaleDateString('pt-BR')} via Central Credi cicloCRED CRM Inteligente.
`;

    navigator.clipboard.writeText(textStr);
    if (addNotification) {
      addNotification('📋 SIMULAÇÃO COPIADA', 'Demonstrativo completo (Caixa + Entrada Facilitada Construtora) copiado!', 'success');
    }
  };

  const handleExportSimulation2 = () => {
    triggerSensoryFeedback('success', accSettings);
    if (awardXP) awardXP(150, 'EXPORTACAO_SIMULACAO_FINACEIRA_2');

    const leadName = clientCustomName || 'Cliente Avulso';
    const textStr = `
=== SIMULAÇÃO DE VENDA & FLUXO DE OBRAS - cicloCRED ===
Cliente: ${leadName}
Valor da Unidade: R$ ${salesPropertyPrice.toLocaleString('pt-BR')}
Disponibilidade / Fluxo Obras: ${salesConstructionMonths} meses

----------------------------------------------------------------------------------
1. Entrada Sinal (Assinatura): R$ ${salesEntradaVal.toLocaleString('pt-BR')} (${salesEntradaPct}%)
2. Parcelas Mensais de Obra: ${salesConstructionMonths}x de R$ ${salesMonthlyWorkVal.toLocaleString('pt-BR')} (Total: R$ ${salesLeftoverForMonthlies.toLocaleString('pt-BR')} | ${salesMonthlyWorkPct.toFixed(1)}%)
3. Balões Anuais Intermediários: 2x de R$ ${salesAnnualVal.toLocaleString('pt-BR')} (Total: R$ ${(salesAnnualVal * 2).toLocaleString('pt-BR')} | ${salesAnnualPct * 2}%)
4. Parcela de Chaves (Entrega): R$ ${salesChavesVal.toLocaleString('pt-BR')} (${salesChavesPct}%)
5. Financiamento Pós-Obra Bancário: R$ ${salesFinanciamentoVal.toLocaleString('pt-BR')} (${salesFinanciamentoPct}%)
----------------------------------------------------------------------------------
Tabela Consolidada Planilha: 100% | R$ ${salesPropertyPrice.toLocaleString('pt-BR')}
Simulado via cicloCRED CRM Inteligente em ${new Date().toLocaleDateString('pt-BR')}.
`;

    navigator.clipboard.writeText(textStr);
    if (addNotification) {
      addNotification('📋 PLANILHA COPIADA', 'Planilha de fluxo de obras e disponível copiada para área de transferência!', 'success');
    }
  };

  const isSalesBalanced = Math.abs((salesEntradaPct + (salesAnnualPct * 2) + salesChavesPct + salesFinanciamentoPct + salesMonthlyWorkPct) - 100) < 0.1;

  return (
    <>
      <div className="print:hidden space-y-6 animate-fadeIn">
      
      {/* Master Interactive Selector Header */}
      <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] text-zinc-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 px-2.5 bg-indigo-100 border border-indigo-400 text-indigo-800 text-[9px] font-black uppercase tracking-wider font-mono rounded-lg">
                ★ Calculadoras Inteligentes
              </span>
              <span className="text-zinc-500 font-mono text-[9px] uppercase font-bold">Aprovação cicloCRED CAIXA instantânea</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tight text-zinc-950 flex items-center gap-1.5">
              <Calculator className="w-6 h-6 text-indigo-600" />
              <span>Simulador Habitacional Caixa & Entrada Facilitada</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Calcule o enquadramento de regras, taxas e subsídios Minha Casa Minha Vida juntamente com o plano de parcelamento facilitado da entrada.
            </p>
          </div>

          {/* Quick Lead Global Selector */}
          <div className="min-w-[200px] w-full md:w-auto">
            <span className="block text-[8.5px] font-mono font-black text-zinc-400 uppercase mb-1">Vincular Cliente Global</span>
            <select
              value={selectedLeadId}
              onChange={(e) => {
                triggerSensoryFeedback('click', accSettings);
                setSelectedLeadId(e.target.value);
              }}
              className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2 text-xs font-bold"
            >
              <option value="">-- [Selecionar Lead Integrado] --</option>
              {leads.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CALCULATOR 1 SCREEN: FINANCIAMENTO HABITACIONAL */}
      {activeSim === 'financing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Inputs Section (4/12 width) */}
          <div className="lg:col-span-4 bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="border-b pb-2">
              <span className="text-[10px] font-mono font-black text-indigo-650 uppercase">Formulário Habitacional</span>
              <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight">Parâmetros de Renda Caixa</h3>
            </div>

            {/* Name of the Client for Proposal personalization */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono font-black text-zinc-650 uppercase">Nome do Cliente (Ficha/Proposta)</label>
              <input
                type="text"
                value={clientCustomName}
                onChange={(e) => setClientCustomName(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: João da Silva"
              />
            </div>

            {/* Simulated property cost */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono font-black text-zinc-650 uppercase">Preço Pretendido de Venda (R$)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-zinc-400 font-bold">R$</span>
                <input
                  type="number"
                  value={simulatedPropertyPrice || ''}
                  onChange={(e) => setSimulatedPropertyPrice(Number(e.target.value) || 0)}
                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl py-2 pl-9 pr-3 text-xs font-bold"
                />
              </div>
            </div>

            {/* Tipo de Regime de Renda (CLT / AUTÔNOMO) */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-black text-zinc-650 uppercase">Regime de Comprovação de Renda</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerSensoryFeedback('click', accSettings);
                    setProfessionType('CLT');
                  }}
                  className={`py-2 px-3 border-2 text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    professionType === 'CLT'
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-[1.5px_1.5px_0px_0px_rgba(99,102,241,1)]'
                      : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-300 text-zinc-500'
                  }`}
                >
                  💼 CLT (Holerite)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerSensoryFeedback('click', accSettings);
                    setProfessionType('AUTONOMO');
                  }}
                  className={`py-2 px-3 border-2 text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    professionType === 'AUTONOMO'
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-[1.5px_1.5px_0px_0px_rgba(99,102,241,1)]'
                      : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-300 text-zinc-500'
                  }`}
                >
                  🚀 Autônomo (Extrato)
                </button>
              </div>
            </div>

            {/* Dynamic Income Input based on selection */}
            {professionType === 'CLT' ? (
              <div className="space-y-1 animate-fadeIn">
                <label className="block text-[10px] font-mono font-black text-zinc-650 uppercase">Renda no Holerite (R$)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-zinc-400 font-bold">R$</span>
                  <input
                    type="number"
                    value={cltIncome || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setCltIncome(val);
                    }}
                    className="w-full bg-indigo-50/50 border-2 border-indigo-950 rounded-xl py-2 pl-9 pr-3 text-xs font-mono font-black text-indigo-950"
                    placeholder="Valor integral do holerite"
                  />
                </div>
                <p className="text-[9px] text-zinc-400 font-mono leading-none">Demonstrada via holerites ou carteira de trabalho oficial.</p>
              </div>
            ) : (
              <div className="space-y-1 animate-fadeIn">
                <label className="block text-[10px] font-mono font-black text-zinc-650 uppercase">Renda no Extrato Bancário (R$)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-zinc-400 font-bold">R$</span>
                  <input
                    type="number"
                    value={autonomoIncome || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setAutonomoIncome(val);
                    }}
                    className="w-full bg-amber-50/45 border-2 border-amber-950 rounded-xl py-2 pl-9 pr-3 text-xs font-mono font-black text-amber-950"
                    placeholder="Média de depósitos em conta pf"
                  />
                </div>
                <p className="text-[9px] text-zinc-400 font-mono leading-none">Comprovada por extratos consolidados dos últimos 3 meses.</p>
              </div>
            )}

            {/* Estado Civil e Renda do Cônjuge (Casado) */}
            <div className="p-3 bg-zinc-50 border-2 border-zinc-950 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b pb-1">
                <span className="block font-mono font-black text-[9px] uppercase tracking-wider text-zinc-500">Composição Familiar</span>
                <span className="text-[8.5px] font-mono font-bold text-zinc-400">Atributos MCMV</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="civil-married"
                  type="checkbox"
                  checked={isMarried}
                  onChange={(e) => {
                    triggerSensoryFeedback('click', accSettings);
                    setIsMarried(e.target.checked);
                  }}
                  className="w-4 h-4 rounded text-indigo-600 border-zinc-950 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="civil-married" className="cursor-pointer select-none text-xs font-extrabold text-zinc-900 leading-none">
                  💍 Proponente é Casado(a)?
                </label>
              </div>

              {/* Dynamic Spouse Aggregation input */}
              {isMarried && (
                <div className="space-y-1 mt-2 p-2 bg-white border border-dashed border-zinc-300 rounded-xl animate-scaleIn">
                  <label className="block text-[9px] font-mono font-black text-indigo-900 uppercase">Renda da Esposa/Cônjuge (R$)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-zinc-400 font-bold">R$</span>
                    <input
                      type="number"
                      value={spouseIncome || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setSpouseIncome(val);
                      }}
                      className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-lg p-1.5 pl-7 text-xs font-mono font-black text-zinc-900"
                      placeholder="Esposa/Cônjuge"
                    />
                  </div>
                  <span className="text-[8.5px] text-indigo-600 font-medium block mt-1">
                    ✓ Renda agregada automaticamente à composição familiar.
                  </span>
                </div>
              )}

              {/* Quantidade de Dependentes selection */}
              <div className="space-y-1">
                <label className="block text-[9.5px] font-mono font-black text-zinc-650 uppercase">Quantidade de Dependentes</label>
                <select
                  value={dependentsQty}
                  onChange={(e) => {
                    triggerSensoryFeedback('click', accSettings);
                    setDependentsQty(Number(e.target.value));
                  }}
                  className="w-full bg-white border-2 border-zinc-950 rounded-xl p-2 text-xs font-mono font-bold"
                >
                  <option value={0}>Nenhum dependente (0)</option>
                  <option value={1}>1 Dependente Ativo</option>
                  <option value={2}>2 Dependentes Ativos</option>
                  <option value={3}>3 ou mais Dependentes</option>
                </select>
                <p className="text-[8.5px] text-zinc-400 font-mono tracking-tight leading-none mt-1">
                  *Dependentes na ficha ativam bônus máximos de subsídio MCMV.
                </p>
              </div>
            </div>

            {/* Read-Only Consolidada Gross Income Indicator */}
            <div className="p-3 bg-indigo-950 text-indigo-100 rounded-2xl border-2 border-zinc-950 flex justify-between items-center shadow-sm">
              <div>
                <span className="block text-[8px] font-mono font-black uppercase tracking-wider text-indigo-300 leading-none">Renda Bruta Coletiva</span>
                <strong className="block text-sm font-mono font-black text-white mt-1">R$ {grossIncome.toLocaleString('pt-BR')}</strong>
              </div>
              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-black bg-indigo-500 text-white tracking-widest uppercase">
                Consolidada
              </span>
            </div>

            {/* Applicant Age and Terms */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Applicant Age */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-black text-zinc-650 uppercase">Idade do Comprador</label>
                <input
                  type="number"
                  min={18}
                  max={80}
                  value={applicantAge || ''}
                  onChange={(e) => setApplicantAge(Number(e.target.value) || 30)}
                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2 text-xs font-mono font-black font-semibold"
                />
              </div>

              {/* Installment Term (Months) */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-black text-zinc-650 uppercase">Prazo de Financiamento</label>
                <select
                  value={loanMonths}
                  onChange={(e) => setLoanMonths(Number(e.target.value))}
                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2 text-xs font-mono font-bold"
                >
                  <option value={420}>420 meses (35 anos)</option>
                  <option value={360}>360 meses (30 anos)</option>
                  <option value={240}>240 meses (20 anos)</option>
                  <option value={120}>120 meses (10 anos)</option>
                </select>
              </div>
            </div>

            {/* Subsidies and FGTS options row with the requested Redutor de Juros checkbox option */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-xs font-semibold">
                <div className="flex items-start gap-2">
                  <input
                    id="has-fgts-reduz"
                    type="checkbox"
                    checked={hasFGTS}
                    onChange={(e) => {
                      triggerSensoryFeedback('click', accSettings);
                      setHasFGTS(e.target.checked);
                    }}
                    className="w-4 h-4 rounded text-emerald-600 border-zinc-950 focus:ring-emerald-500 cursor-pointer mt-0.5"
                  />
                  <div className="cursor-pointer select-none">
                    <label htmlFor="has-fgts-reduz" className="block text-[11px] font-extrabold text-emerald-950 leading-none">
                      Tem 3 anos de FGTS?
                    </label>
                    <p className="text-[9px] text-emerald-800 font-mono font-medium leading-tight mt-1">
                       ✓ Juros Caixa reduzidos automaticamente!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-2xl text-xs font-semibold">
                <div className="flex items-start gap-2">
                  <input
                    id="has-interest-reducer"
                    type="checkbox"
                    checked={hasInterestReducer}
                    onChange={(e) => {
                      triggerSensoryFeedback('click', accSettings);
                      setHasInterestReducer(e.target.checked);
                    }}
                    className="w-4 h-4 rounded text-amber-600 border-zinc-950 focus:ring-amber-500 cursor-pointer mt-0.5"
                  />
                  <div className="cursor-pointer select-none">
                    <label htmlFor="has-interest-reducer" className="block text-[11px] font-extrabold text-amber-950 leading-none">
                      Redutor de Juros CEF?
                    </label>
                    <p className="text-[9px] text-amber-800 font-mono font-medium leading-tight mt-1">
                       ✓ Aplica juros bonificados (-0.52% de taxa).
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border-2 border-indigo-400 rounded-2xl text-xs font-semibold">
                <div className="flex items-start gap-2">
                  <input
                    id="has-casa-paulista"
                    type="checkbox"
                    checked={hasCasaPaulista}
                    onChange={(e) => {
                      triggerSensoryFeedback('click', accSettings);
                      setHasCasaPaulista(e.target.checked);
                    }}
                    className="w-4 h-4 rounded text-indigo-600 border-zinc-950 focus:ring-indigo-500 cursor-pointer mt-0.5"
                  />
                  <div className="cursor-pointer select-none">
                    <label htmlFor="has-casa-paulista" className="block text-[11px] font-extrabold text-indigo-950 leading-none">
                      Subsídio Casa Paulista (SP)?
                    </label>
                    <p className="text-[9px] text-indigo-800 font-mono font-medium leading-tight mt-1">
                       ✓ Até +R$ 13.000 de subsídio estadual SP.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Amortization Switch */}
            <div className="space-y-1 text-xs">
              <label className="block text-[10px] font-mono font-black text-zinc-650 uppercase">Sistema de Amortização Bancária</label>
              <div className="grid grid-cols-2 gap-2 text-center">
                {['SAC', 'PRICE'].map((sys) => (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => {
                      triggerSensoryFeedback('click', accSettings);
                      setAmortizationSystem(sys as any);
                    }}
                    className={`py-2 border-2 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer ${
                      amortizationSystem === sys 
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                        : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-350 text-zinc-500'
                    }`}
                  >
                    TIPO {sys}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results section (8/12 width) */}
          <div className="lg:col-span-8 bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-zinc-900 space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono font-black text-indigo-600 block leading-none">Amortização Simulada Caixa</span>
                <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950 mt-1">Tabela de Resultados Habitação</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    triggerSensoryFeedback('click', accSettings);
                    setShowPrintModal(true);
                  }}
                  className="py-1.5 px-3 bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-black uppercase border-2 border-zinc-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer flex items-center gap-1"
                  title="Visualizar Proposta Oficial no Formato A4 e Imprimir para PDF"
                >
                  <span className="text-xs">📄</span>
                  <span>Exportar Relatório PDF</span>
                </button>
                <button
                  onClick={handleExportCSV1}
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase border-2 border-zinc-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer flex items-center gap-1"
                  title="Baixar planilha de dados estruturados para MS Excel"
                >
                  <span className="text-xs">📊</span>
                  <span>Baixar Planilha Excel</span>
                </button>
                <button
                  onClick={handleExportSimulation1}
                  className="py-1.5 px-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[10px] font-bold uppercase border border-zinc-350 rounded-xl transition cursor-pointer flex items-center gap-1"
                  title="Copiar texto simples resumo"
                >
                  <span className="text-xs">📋</span>
                  <span>Copiar</span>
                </button>
              </div>
            </div>

            {/* Metrics visual cards block */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-indigo-50 border-2 border-indigo-400 rounded-2xl text-center space-y-0.5 shadow-sm">
                <span className="block text-[9px] font-mono font-extrabold text-indigo-700 uppercase">Enquadramento MCMV</span>
                <strong className="block text-xs font-black text-indigo-950 font-sans">{mcmvBracketName}</strong>
              </div>

              <div className="p-3 bg-zinc-55 border-2 border-zinc-950 rounded-2xl text-center space-y-0.5 shadow-sm">
                <span className="block text-[9px] font-mono font-extrabold text-zinc-650 uppercase">Subsídio Concedido</span>
                <strong className="block text-xs font-black text-zinc-900 font-mono tracking-tight">R$ {calculatedSubsidy.toLocaleString('pt-BR')}</strong>
              </div>

              <div className="p-3 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-center space-y-0.5 shadow-sm">
                <span className="block text-[9px] font-mono font-extrabold text-emerald-700 uppercase">Juros Nominal</span>
                <strong className="block text-xs font-black text-emerald-950 font-mono">{applicableInterestRate}% a.a.</strong>
              </div>

              <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-2xl text-center space-y-0.5 shadow-sm">
                <span className="block text-[9px] font-mono font-extrabold text-amber-800 uppercase">Amortização</span>
                <strong className="block text-xs font-black text-amber-950 font-sans">{amortizationSystem} / {loanMonths}m</strong>
              </div>
            </div>

            {/* Comparison of payment scales */}
            <div className="bg-zinc-50 border-4 border-zinc-950 p-5 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 text-[100px] font-black font-sans -mr-8 -mb-10 text-zinc-200/40 select-none pointer-events-none">CAIXA</div>
              
              <div className="space-y-4 relative z-10">
                <h4 className="text-[11px] font-mono font-black text-zinc-550 uppercase border-b pb-1">Inteligência Preditiva: Parcelas Mensais</h4>
                
                {/* 1. BANK FINANCING ITEM */}
                <div className="bg-indigo-50/70 p-3 rounded-2xl border-2 border-indigo-200 space-y-2">
                  <span className="text-[10px] font-black text-indigo-900 block uppercase font-mono">🏦 1. Parcela do Financiamento Bancário (Pós-Obra/Quitação)</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-xl border border-indigo-100 flex flex-col justify-center">
                      <span className="text-zinc-500 font-bold block text-[9px] uppercase">Primeira Parcela (SAC)</span>
                      <strong className="text-xs font-black font-mono text-zinc-950">R$ {firstPayment.toLocaleString('pt-BR')} /mês</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-indigo-100 flex flex-col justify-center">
                      <span className="text-zinc-500 font-bold block text-[9px] uppercase">Última Parcela (SAC)</span>
                      <strong className="text-xs font-black font-mono text-zinc-950">R$ {lastPayment.toLocaleString('pt-BR')} /mês</strong>
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-indigo-100 flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500 font-bold">Margem Máxima de Renda (30%):</span>
                    <strong className="font-mono text-indigo-900 font-black">R$ {maxMonthlyPayment.toLocaleString('pt-BR')}</strong>
                  </div>

                  {firstPayment > maxMonthlyPayment && (
                    <div className="flex items-start gap-1 pb-1 text-[9.5px] text-red-800 leading-tight">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-650 shrink-0 mt-0.5 animate-pulse" />
                      <span><strong>⚠️ Parcela excede 30% da renda:</strong> Necessita <strong className="text-indigo-800">agregar renda</strong> com co-adquirentes ou apresentar fiador/avalista!</span>
                    </div>
                  )}
                </div>

                {/* 2. FACILITATED DOWNPAYMENT ITEM */}
                {(() => {
                  const totalFacilitadoAvulso = valorAto + (2 * valorAnual) + valorChaves;
                  const diferencaRestante = Math.max(0, requiredDownpayment - totalFacilitadoAvulso);
                  const valorMensalObra = tempoObra > 0 ? (diferencaRestante / tempoObra) : 0;
                  return (
                    <div className="bg-emerald-50 p-3 rounded-2xl border-2 border-emerald-300 space-y-2">
                      <span className="text-[10px] font-black text-emerald-900 block uppercase font-mono">🧱 2. Parcela da Entrada Facilitada (Durante a Obra)</span>
                      
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-white p-2 rounded-xl border border-emerald-100 flex flex-col justify-center">
                          <span className="text-zinc-500 font-bold block text-[9px] uppercase">Mensalidade ({tempoObra}x)</span>
                          <strong className="text-xs font-black font-mono text-emerald-850">R$ {Math.round(valorMensalObra).toLocaleString('pt-BR')} /mês</strong>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-emerald-100 flex flex-col justify-center">
                          <span className="text-zinc-500 font-bold block text-[9px] uppercase">Sinal (Ato) Solicitado</span>
                          <strong className="text-xs font-black font-mono text-zinc-950">R$ {valorAto.toLocaleString('pt-BR')}</strong>
                        </div>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-emerald-100 flex items-center justify-between text-[9.5px]">
                        <span className="text-zinc-500 font-bold">2 Reforços Balão Anual (Cada):</span>
                        <strong className="font-mono text-emerald-800">R$ {valorAnual.toLocaleString('pt-BR')}</strong>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-3 relative z-10">
                <h4 className="text-[11px] font-mono font-black text-zinc-550 uppercase border-b pb-1">Distribuição de Recursos Requeridos</h4>

                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border-2 border-indigo-500">
                    <span className="text-[11.5px] font-black text-indigo-800 uppercase font-mono">Aprovado pela Caixa:</span>
                    <strong className="text-sm font-black font-mono text-indigo-950">R$ {financedAmount.toLocaleString('pt-BR')}</strong>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border-2 border-amber-500">
                    <span className="text-[11.5px] font-black text-amber-800 uppercase font-mono border-amber-350">Entrada de Recursos:</span>
                    <strong className="text-sm font-black font-mono text-amber-950 font-black">R$ {requiredDownpayment.toLocaleString('pt-BR')}</strong>
                  </div>
                </div>

                {simulatedPropertyPrice > 0 && (requiredDownpayment / simulatedPropertyPrice) > 0.18 && (
                  <div className="flex items-start gap-2 p-2.5 bg-amber-50 border-2 border-amber-500 rounded-xl text-[10px] text-zinc-900 leading-tight">
                    <Users className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-850 block uppercase text-[8.5px] font-mono">👥 ENTRADA REQUERIDA SUPERIOR A 18%</strong>
                      <span>A entrada de {((requiredDownpayment / simulatedPropertyPrice) * 100).toFixed(1)}% superou o limite recomendado de 18% (R$ {(simulatedPropertyPrice * 0.18).toLocaleString('pt-BR')}). <strong className="text-amber-900">É preciso agregar renda, compor um co-adquirente ou um fiador</strong> para aumentar o financiamento e viabilizar a entrada.</span>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-zinc-400 leading-tight font-medium">
                  *A entrada requerida de R$ {requiredDownpayment.toLocaleString('pt-BR')} será calculada no plano facilitado abaixo.
                </p>
              </div>
            </div>

            {/* CHECKLIST DE ENQUADRAMENTO E DOSSIÊ DE DOCUMENTOS */}
            <div className="bg-zinc-50 border-4 border-zinc-950 p-6 rounded-3xl space-y-4 shadow-[4px_4px_0px_0px_rgba(30,58,138,0.9)] animate-fadeIn">
              <div className="border-b-2 border-zinc-200 pb-2.5 flex justify-between items-center">
                <div>
                  <span className="p-1 px-2.5 bg-indigo-100 border border-indigo-400 text-indigo-800 text-[9px] font-black uppercase tracking-wider font-mono rounded-lg">
                    📋 Checklist de Qualificação
                  </span>
                  <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight mt-1">
                    Dossiê do Cliente & Parâmetros de Enquadramento
                  </h3>
                </div>
                <div className="text-right text-[10px] font-mono font-bold text-zinc-500">
                  cicloCRED Caixa v2026
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Modificadores do Financiamento (Enquadramento Técnico) */}
                <div className="space-y-3.5 bg-white border-2 border-zinc-950 p-4 rounded-2xl">
                  <h4 className="text-xs font-black uppercase text-indigo-950 border-b pb-1 font-sans flex items-center gap-1.5 animate-fadeIn">
                    <span className="text-indigo-600">⚙️</span> Enquadramento Técnico (Modificadores)
                  </h4>
                  
                  <div className="space-y-2.5 text-xs">
                    
                    {/* CLT vs Autônomo */}
                    <div className="flex justify-between items-start border-b border-zinc-100 pb-1.5 animate-fadeIn">
                      <div>
                        <span className="font-extrabold text-zinc-900 block">Regime de Renda:</span>
                        <span className="text-[10px] text-zinc-500 font-medium">Comprovação ativa para liberação</span>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                          professionType === 'CLT' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {professionType === 'CLT' ? '💼 CLT (Holerite)' : '🚀 Autônomo (Extrato)'}
                        </span>
                        <span className="block font-mono font-black text-xs text-zinc-900 mt-1">
                          R$ {(professionType === 'CLT' ? cltIncome : autonomoIncome).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {/* Estado Civil (Casado) */}
                    <div className="flex justify-between items-start border-b border-zinc-100 pb-1.5 animate-fadeIn">
                      <div>
                        <span className="font-extrabold text-zinc-900 block">Estado Civil do Proponente:</span>
                        <span className="text-[10px] text-zinc-500 font-medium">Composição de renda</span>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                          isMarried ? 'bg-purple-100 text-purple-800' : 'bg-zinc-100 text-zinc-650'
                        }`}>
                          {isMarried ? '💍 Casado(a)' : '👤 Solteiro(a)'}
                        </span>
                        {isMarried && (
                          <span className="block text-[10.5px] text-zinc-650 font-bold mt-1">
                            + R$ {spouseIncome.toLocaleString('pt-BR')} (Esposa)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dependentes */}
                    <div className="flex justify-between items-start border-b border-zinc-100 pb-1.5 animate-fadeIn">
                      <div>
                        <span className="font-extrabold text-zinc-900 block">Quantidade de Dependentes:</span>
                        <span className="text-[10px] text-zinc-500 font-medium">Fator de bonificação de subsídio</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-extrabold bg-zinc-100 px-2 py-0.5 rounded text-zinc-850">
                          {dependentsQty} Dependente(s)
                        </span>
                        <span className="block text-[9.5px] text-emerald-600 font-extrabold mt-1">
                          {hasDependents ? '✓ Elegível para Bônus' : 'Sem dependentes adicionais'}
                        </span>
                      </div>
                    </div>

                    {/* 3 Anos de FGTS */}
                    <div className="flex justify-between items-start border-b border-zinc-100 pb-1.5 animate-fadeIn">
                      <div>
                        <span className="font-extrabold text-zinc-900 block">Tempo de FGTS (3+ anos):</span>
                        <span className="text-[10px] text-zinc-500 font-medium">Desconto automático de juros</span>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                          hasFGTS ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-400'
                        }`}>
                          {hasFGTS ? '✓ Ativo (- Juros)' : 'Inativo (Padrão)'}
                        </span>
                        <span className="block text-[9px] text-zinc-400 font-bold mt-1">
                          {hasFGTS ? 'Juros reduzem automaticamente' : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Redutor de Juros CEF */}
                    <div className="flex justify-between items-start border-b border-zinc-100 pb-1.5 animate-fadeIn">
                      <div>
                        <span className="font-extrabold text-zinc-900 block">Redutor de Juros CEF:</span>
                        <span className="text-[10px] text-zinc-500 font-medium">Taxas de juros subsidiadas CEF</span>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                          hasInterestReducer ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-400'
                        }`}>
                          {hasInterestReducer ? '✓ Ativo (-0.52%)' : 'Inativo / Balcão'}
                        </span>
                        <span className="block text-[9px] text-zinc-400 font-bold mt-1">
                          {hasInterestReducer ? 'Redutor de associação ativo' : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Resumo Renda + Subsídios */}
                    <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-200 animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-blue-950 uppercase text-[9.5px]">Enquadramento MCMV:</span>
                        <span className="text-[10.5px] font-mono font-extrabold text-blue-800">{mcmvBracketName}</span>
                      </div>
                      <p className="text-[9px] text-zinc-500 mt-1">
                        Sua Renda familiar consolidada de <strong>R$ {grossIncome.toLocaleString('pt-BR')}</strong> e dependentes liberaram <strong>R$ {calculatedSubsidy.toLocaleString('pt-BR')}</strong> de subsídios habitacionais diretos Caixa{hasCasaPaulista ? ` (com fomento estadual Casa Paulista de R$ ${ (grossIncome <= 4400 ? 13000 : 10000).toLocaleString('pt-BR') } integrado)` : ''}.
                      </p>
                    </div>

                  </div>
                </div>

                {/* 2. Checklist Físico de Documentação */}
                <div className="space-y-3.5 bg-white border-2 border-zinc-950 p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-indigo-950 border-b pb-1 font-sans flex items-center gap-1.5">
                      <span className="text-indigo-600">📂</span> Documentação Física Oficial
                    </h4>
                    <p className="text-[10px] text-zinc-550 mb-3 font-medium">
                      Marque os documentos confirmados e verificados para compor o dossiê digital cicloCRED e dar entrada na aprovação Caixa:
                    </p>

                    <div className="space-y-2.5">
                      
                      {/* 1. CPF/CNH */}
                      <label 
                        className={`flex items-start gap-3 p-2 border-2 rounded-xl cursor-pointer transition-all ${
                          docCpfCnh ? 'bg-emerald-50 border-emerald-400' : 'bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={docCpfCnh}
                          onChange={(e) => {
                            triggerSensoryFeedback('click', accSettings);
                            setDocCpfCnh(e.target.checked);
                          }}
                          className="w-4 h-4 rounded text-emerald-600 border-zinc-950 focus:ring-emerald-500 cursor-pointer mt-0.5"
                        />
                        <div className="text-xs select-none">
                          <span className={`font-black uppercase tracking-tight block ${docCpfCnh ? 'text-emerald-950' : 'text-zinc-800'}`}>
                            🪪 CPF / CNH
                          </span>
                          <span className="text-[10px] text-zinc-500 block">Documento de identificação oficial com foto dentro da validade</span>
                        </div>
                      </label>

                      {/* 2. COMPROVANTE DE ENDEREÇO */}
                      <label 
                        className={`flex items-start gap-3 p-2 border-2 rounded-xl cursor-pointer transition-all ${
                          docEndereco ? 'bg-emerald-50 border-emerald-400' : 'bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={docEndereco}
                          onChange={(e) => {
                            triggerSensoryFeedback('click', accSettings);
                            setDocEndereco(e.target.checked);
                          }}
                          className="w-4 h-4 rounded text-emerald-600 border-zinc-950 focus:ring-emerald-500 cursor-pointer mt-0.5"
                        />
                        <div className="text-xs select-none">
                          <span className={`font-black uppercase tracking-tight block ${docEndereco ? 'text-emerald-950' : 'text-zinc-800'}`}>
                            🏠 COMPROVANTE DE ENDEREÇO
                          </span>
                          <span className="text-[10px] text-zinc-500 block">Contas de água, luz ou gás com prazo menor que 90 dias</span>
                        </div>
                      </label>

                      {/* 3. COMPROVANTE DE RENDA */}
                      <label 
                        className={`flex items-start gap-3 p-2 border-2 rounded-xl cursor-pointer transition-all ${
                          docRenda ? 'bg-emerald-50 border-emerald-400' : 'bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={docRenda}
                          onChange={(e) => {
                            triggerSensoryFeedback('click', accSettings);
                            setDocRenda(e.target.checked);
                          }}
                          className="w-4 h-4 rounded text-emerald-600 border-zinc-950 focus:ring-emerald-500 cursor-pointer mt-0.5"
                        />
                        <div className="text-xs select-none">
                          <span className={`font-black uppercase tracking-tight block ${docRenda ? 'text-emerald-950' : 'text-zinc-800'}`}>
                            💰 COMPROVANTE DE RENDA
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            {professionType === 'CLT' 
                              ? 'Exigido: 3 últimos Holerites de CLT ativos' 
                              : 'Exigido: Declaração Oficial de Renda ou IRPF do Autônomo'
                            }
                          </span>
                        </div>
                      </label>

                      {/* 4. EXTRATOS */}
                      <label 
                        className={`flex items-start gap-3 p-2 border-2 rounded-xl cursor-pointer transition-all ${
                          docExtratos ? 'bg-emerald-50 border-emerald-400' : 'bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={docExtratos}
                          onChange={(e) => {
                            triggerSensoryFeedback('click', accSettings);
                            setDocExtratos(e.target.checked);
                          }}
                          className="w-4 h-4 rounded text-emerald-600 border-zinc-950 focus:ring-emerald-500 cursor-pointer mt-0.5"
                        />
                        <div className="text-xs select-none">
                          <span className={`font-black uppercase tracking-tight block ${docExtratos ? 'text-emerald-950' : 'text-zinc-800'}`}>
                            📊 EXTRATOS BANCÁRIOS
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            {professionType === 'CLT'
                              ? 'Obrigatório para CLT: Extratos bancários para aprovação complementar'
                              : 'Obrigatório para Autônomo: Extratos consolidados dos últimos 3 meses'
                            }
                          </span>
                        </div>
                      </label>

                    </div>
                  </div>

                  {/* Status do Dossie Banner */}
                  <div className={`mt-4 p-2.5 border-2 rounded-xl text-center text-xs font-black font-mono flex items-center justify-center gap-2 ${
                    docCpfCnh && docEndereco && docRenda && docExtratos
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-[2px_2px_0px_0px_rgba(16,185,129,1)]'
                      : 'bg-zinc-100 border-zinc-300 text-zinc-500'
                  }`}>
                    {docCpfCnh && docEndereco && docRenda && docExtratos ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>🗂️ DOSSIÊ COMPLETO E PRONTO PARA APROVAÇÃO CAIXA!</span>
                      </>
                    ) : (
                      <span>⏳ DOSSIÊ EM CURSO ({[docCpfCnh, docEndereco, docRenda, docExtratos].filter(Boolean).length}/4 DOCUMENTOS)</span>
                    )}
                  </div>

                </div>

              </div>
            </div>

            {/* PLANO DE PARCELAMENTO FACILITADO COM A CONSTRUTORA */}
            <div className="bg-zinc-900 text-white p-5 rounded-2xl space-y-4 border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden animate-fadeIn">
              <div className="absolute right-3 top-3 opacity-10 rotate-12 select-none pointer-events-none">
                <Building className="w-20 h-20 text-white" />
              </div>

              <div className="border-b border-zinc-800 pb-2 relative z-10 flex justify-between items-center">
                <div>
                  <span className="text-[8.5px] font-mono font-black text-emerald-400 uppercase tracking-widest block leading-none">PLANO CORRETOR CICLOCRED</span>
                  <h4 className="text-xs font-black uppercase text-white tracking-tight flex items-center gap-1.5 mt-1">
                    🏡 Entrada Facilitada Construtora (Período Obras)
                  </h4>
                </div>
                <div className="px-2 py-0.5 rounded text-[8.5px] font-mono font-black uppercase bg-emerald-500 text-zinc-950 tracking-wider">
                  Entrada: R$ {requiredDownpayment.toLocaleString('pt-BR')}
                </div>
              </div>

              {/* Inputs for downpayment facilitation layout */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10 text-xs">
                {/* Parcela de Ato */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono font-black text-zinc-400 uppercase">Ato (Sinal)</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-[10px] text-zinc-500 font-bold">R$</span>
                    <input
                      type="number"
                      value={valorAto || ''}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        setValorAto(val);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-500 rounded-lg p-1.5 pl-6 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* 2 Parcelas Anuais */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono font-black text-zinc-400 uppercase font-black text-amber-400">2x Balões Anuais (Cada)</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-[10px] text-zinc-500 font-bold">R$</span>
                    <input
                      type="number"
                      value={valorAnual || ''}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        setValorAnual(val);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-500 rounded-lg p-1.5 pl-6 text-xs text-white font-mono"
                    />
                  </div>
                  <span className="block text-[8px] text-zinc-500 font-mono">Total de Balões: R$ {(2 * valorAnual).toLocaleString('pt-BR')}</span>
                </div>

                {/* Parcela de Chaves */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono font-black text-zinc-400 uppercase">Chaves</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-[10px] text-zinc-500 font-bold">R$</span>
                    <input
                      type="number"
                      value={valorChaves || ''}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        setValorChaves(val);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-500 rounded-lg p-1.5 pl-6 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Tempo de Obra */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono font-black text-zinc-400 uppercase">Tempo de Obra (Meses)</label>
                  <select
                     value={tempoObra}
                     onChange={(e) => setTempoObra(Number(e.target.value) || 36)}
                     className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-500 rounded-lg p-1.5 text-xs text-white font-mono cursor-pointer"
                  >
                     <option value={12}>12 meses (1 ano)</option>
                     <option value={18}>18 meses</option>
                     <option value={20}>20 meses</option>
                     <option value={24}>24 meses (2 anos)</option>
                     <option value={30}>30 meses</option>
                     <option value={36}>36 meses (3 anos)</option>
                     <option value={48}>48 meses (4 anos)</option>
                  </select>
                </div>
              </div>

              {/* Auto dynamic calculations result band */}
              {(() => {
                const totalFacilitadoAvulso = valorAto + (2 * valorAnual) + valorChaves;
                const diferencaRestante = Math.max(0, requiredDownpayment - totalFacilitadoAvulso);
                const valorMensalObra = tempoObra > 0 ? (diferencaRestante / tempoObra) : 0;

                return (
                  <div className="relative z-10 bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div>
                      <span className="block text-[8px] font-mono font-black text-zinc-500 uppercase leading-none">Total Sinal + Balões</span>
                      <strong className="block text-xs font-sans font-black text-zinc-350 mt-1">
                        R$ {totalFacilitadoAvulso.toLocaleString('pt-BR')}
                      </strong>
                      <span className="text-[8.5px] text-zinc-500 font-mono italic">
                        (Ato + 2 Anuais + Chaves)
                      </span>
                    </div>

                    <div className="border-t md:border-t-0 md:border-l md:border-r border-zinc-800 py-1.5 md:py-0 md:px-3">
                      <span className="block text-[8px] font-mono font-black text-amber-400 uppercase leading-none">Diferença Restante</span>
                      <strong className="block text-xs font-sans font-black text-amber-300 mt-1">
                        R$ {diferencaRestante.toLocaleString('pt-BR')}
                      </strong>
                      <span className="text-[8.5px] text-zinc-500 font-mono italic">
                        (Saldo restante para obras)
                      </span>
                    </div>

                    <div className="bg-emerald-950/55 border border-emerald-800 p-2 text-center rounded-lg">
                      <span className="text-[9px] font-mono font-black text-emerald-300 uppercase block tracking-wider leading-none">
                        MENSAL OBRA ({tempoObra}X)
                      </span>
                      <strong className="block text-sm font-mono font-black text-emerald-400 mt-1">
                        R$ {Math.round(valorMensalObra).toLocaleString('pt-BR')} /mês
                      </strong>
                      <span className="text-[8px] text-zinc-400 block mt-0.5 font-sans">
                        Dividido automaticamente pelo tempo de obra
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Smart info list bullet */}
            <div className="p-4 border-2 border-dashed border-zinc-200 rounded-2xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-650 space-y-1">
                <span className="font-extrabold uppercase text-zinc-950 font-sans block">Sua simulação está qualificada em altíssimo nível!</span>
                <p>O simulador cicloCRED estima os indexadores habitacionais baseando-se nas regras de concessão da Caixa Econômica Federal 2026. A comprovação de renda e simulação podem sofrer alterações após exame final de documentos cadastrados do cliente.</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CALCULATOR 2 SCREEN: SIMULADOR DE FLUXO DE VENDA OBRAS */}
      {activeSim === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          
          {/* Inputs Section */}
          <div className="lg:col-span-4 bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5">
            <div className="border-b pb-2">
              <span className="text-[10px] font-mono font-black text-indigo-650 uppercase">Formulário de Venda</span>
              <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight">Fluxo Período Disponível</h3>
            </div>

            {/* Name of the Client for Proposal personalization */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono font-black text-zinc-650 uppercase">Nome do Cliente (Ficha/Proposta)</label>
              <input
                type="text"
                value={clientCustomName}
                onChange={(e) => setClientCustomName(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: João da Silva"
              />
            </div>

            {/* Cost parameters */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono font-black text-zinc-650 uppercase">Valor de Venda do Imóvel (R$)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-zinc-400 font-bold">R$</span>
                <input
                  type="number"
                  value={salesPropertyPrice || ''}
                  onChange={(e) => setSalesPropertyPrice(Number(e.target.value) || 0)}
                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl py-2 pl-9 pr-3 text-xs font-bold"
                />
              </div>
            </div>

            {/* Available construction lifespan months */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono font-black text-zinc-650 uppercase">Lifespan de Obras (Meses de Disponível)</label>
              <input
                type="number"
                min={6}
                max={60}
                value={salesConstructionMonths || ''}
                onChange={(e) => setSalesConstructionMonths(Number(e.target.value) || 36)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs font-mono font-black"
              />
            </div>

            {/* Dynamic Slider Percentages on Vendas */}
            <div className="space-y-4 pt-1">
              <span className="block font-mono font-black text-[9px] uppercase tracking-wider text-zinc-450 border-b pb-1">Ajuste de Fluxo Percentual</span>
              
              {/* Entrada */}
              <div className="space-y-1 bg-zinc-50 p-2.5 rounded-xl border">
                <div className="flex justify-between text-[11.5px] font-sans">
                  <span className="font-extrabold text-zinc-950">Acontecimentos Entrada:</span>
                  <span className="font-mono font-black text-indigo-600">{salesEntradaPct}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={salesEntradaPct}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSalesEntradaPct(val);
                    const totals = val + (salesAnnualPct * 2) + salesChavesPct;
                    if (totals + salesFinanciamentoPct > 100) {
                      setSalesFinanciamentoPct(Math.max(40, 100 - totals));
                    }
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="block text-[9.5px] text-zinc-400 font-mono text-right">
                  R$ {salesEntradaVal.toLocaleString('pt-BR')}
                </span>
              </div>

              {/* Annual intermediate balloons */}
              <div className="space-y-1 bg-zinc-50 p-2.5 rounded-xl border">
                <div className="flex justify-between text-[11.5px] font-sans">
                  <span className="font-extrabold text-zinc-950">2 Balões Anuais (Cada):</span>
                  <span className="font-mono font-black text-amber-600">2x de {salesAnnualPct}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={0.5}
                  value={salesAnnualPct}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSalesAnnualPct(val);
                    const totals = salesEntradaPct + (val * 2) + salesChavesPct;
                    if (totals + salesFinanciamentoPct > 100) {
                      setSalesFinanciamentoPct(Math.max(40, 100 - totals));
                    }
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="block text-[9.5px] text-zinc-400 font-mono text-right">
                  Parcela balão anual: R$ {salesAnnualVal.toLocaleString('pt-BR')}
                </span>
              </div>

              {/* Chaves Delivery */}
              <div className="space-y-1 bg-zinc-50 p-2.5 rounded-xl border">
                <div className="flex justify-between text-[11.5px] font-sans">
                  <span className="font-extrabold text-zinc-950">Entrega de Chaves:</span>
                  <span className="font-mono font-black text-emerald-600">{salesChavesPct}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={20}
                  step={1}
                  value={salesChavesPct}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSalesChavesPct(val);
                    const totals = salesEntradaPct + (salesAnnualPct * 2) + val;
                    if (totals + salesFinanciamentoPct > 100) {
                      setSalesFinanciamentoPct(Math.max(40, 100 - totals));
                    }
                  }}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="block text-[9.5px] text-zinc-400 font-mono text-right">
                  Entrega chaves: R$ {salesChavesVal.toLocaleString('pt-BR')}
                </span>
              </div>

              {/* bank Loan (Final post works) */}
              <div className="space-y-1 bg-zinc-50 p-2.5 rounded-xl border">
                <div className="flex justify-between text-[11.5px] font-sans">
                  <span className="font-extrabold text-zinc-950">Bancário Resto:</span>
                  <span className="font-mono font-black text-blue-600">{salesFinanciamentoPct}%</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={80}
                  step={1}
                  value={salesFinanciamentoPct}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const limitFinan = 100 - (salesEntradaPct + (salesAnnualPct * 2) + salesChavesPct);
                    setSalesFinanciamentoPct(val > limitFinan ? limitFinan : val);
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <span className="block text-[9.5px] text-zinc-400 font-mono text-right">
                  Crédito após habite-se: R$ {salesFinanciamentoVal.toLocaleString('pt-BR')}
                </span>
              </div>

            </div>
          </div>

          {/* Results section */}
          <div className="lg:col-span-8 bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-zinc-900 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 pb-4">
              <div>
                <span className="text-[10px] font-mono font-black text-indigo-650 block uppercase">Resultados demonstrativos</span>
                <h3 className="text-sm font-black text-zinc-950 uppercase">Tabela de Amortizações Período Obra</h3>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => {
                    triggerSensoryFeedback('click', accSettings);
                    setShowPrintModal(true);
                  }}
                  className="py-1.5 px-3 bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-black uppercase border-2 border-zinc-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer flex items-center gap-1"
                  title="Visualizar Proposta no Formato A4 e Imprimir para PDF"
                >
                  <span className="text-xs">📄</span>
                  <span>Exportar PDF</span>
                </button>
                <button
                  onClick={handleExportCSV2}
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase border-2 border-zinc-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer flex items-center gap-1"
                  title="Baixar planilha de fluxo de obras para MS Excel"
                >
                  <span className="text-xs">📊</span>
                  <span>Baixar Planilha</span>
                </button>
                <button
                  onClick={handleExportSimulation2}
                  className="py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[10px] font-bold uppercase border border-zinc-350 rounded-xl transition cursor-pointer flex items-center gap-1"
                >
                  <span className="text-xs">📋</span>
                  <span>Copiar Roteiro</span>
                </button>
                <div className={`px-2 py-1 text-[9px] font-mono font-black uppercase rounded border ${
                  isSalesBalanced ? 'bg-emerald-50 text-emerald-800 border-emerald-400' : 'bg-rose-50 text-rose-800 border-rose-400'
                }`}>
                  {isSalesBalanced ? 'PLANILHA OK' : 'PRECISA AJUSTE'}
                </div>
              </div>
            </div>

            {/* Quick Presets profiles bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[9.5px] font-black font-mono uppercase">
              <span className="text-zinc-400">Presets Perfil:</span>
              <button
                onClick={() => applyPresetProfile('mcmv_padrao')}
                className="px-2.5 py-1 rounded bg-zinc-100 border border-zinc-300 hover:bg-zinc-200"
              >
                MCMV (10%/70%)
              </button>
              <button
                onClick={() => applyPresetProfile('sbpe_classe_media')}
                className="px-2.5 py-1 rounded bg-zinc-100 border border-zinc-300 hover:bg-zinc-200"
              >
                SBPE Médio (15%/60%)
              </button>
              <button
                onClick={() => applyPresetProfile('investidor_agressivo')}
                className="px-2.5 py-1 rounded bg-zinc-100 border border-zinc-300 hover:bg-zinc-200"
              >
                Investidor (20%/40%)
              </button>
            </div>

            {/* Key summary outputs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
              <div className="p-3 bg-zinc-50 border rounded-xl text-center">
                <span className="block text-[8px] font-mono text-zinc-500 uppercase font-black">Preço de Venda</span>
                <strong className="block text-xs font-mono font-black text-zinc-950">R$ {salesPropertyPrice.toLocaleString('pt-BR')}</strong>
              </div>

              <div className="p-3 bg-indigo-50 border rounded-xl text-center">
                <span className="block text-[8px] font-mono text-indigo-700 uppercase font-black">Entrada Recomendada</span>
                <strong className="block text-xs font-mono font-black text-indigo-950">R$ {salesEntradaVal.toLocaleString('pt-BR')}</strong>
              </div>

              <div className="p-3 bg-amber-50 border rounded-xl text-center">
                <span className="block text-[8px] font-mono text-amber-800 uppercase font-black">2 Balões Intermediários</span>
                <strong className="block text-xs font-mono font-black text-amber-950">R$ {salesAnnualVal.toLocaleString('pt-BR')}</strong>
              </div>

              <div className="p-3 bg-emerald-50 border rounded-xl text-center">
                <span className="block text-[8px] font-mono text-emerald-800 uppercase font-black">Mensais Obra ({salesConstructionMonths}x)</span>
                <strong className="block text-xs font-mono font-black text-emerald-950">R$ {salesMonthlyWorkVal.toLocaleString('pt-BR')}</strong>
                <span className="text-[9px] text-zinc-400 font-mono">({salesMonthlyWorkPct.toFixed(1)}%)</span>
              </div>
            </div>

            {salesPropertyPrice > 0 && (salesEntradaVal / salesPropertyPrice) > 0.18 && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-50 border-2 border-amber-500 rounded-xl text-[10px] text-zinc-900 leading-tight">
                <Users className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-850 block uppercase text-[8.5px] font-mono">👥 ENTRADA REQUERIDA SUPERIOR A 18% (PARCELA DE OBRA)</strong>
                  <span>A entrada sinal (ato) recomendada de R$ {salesEntradaVal.toLocaleString('pt-BR')} ({((salesEntradaVal / salesPropertyPrice) * 100).toFixed(1)}%) ultrapassou a recomendação confortável de 18% do valor total do imóvel (R$ {(salesPropertyPrice * 0.18).toLocaleString('pt-BR')}). <strong className="text-indigo-800">É preciso agregar renda, compor um co-adquirente ou um fiador</strong> para otimizar os percentuais e viabilizar o plano de parcelamento!</span>
                </div>
              </div>
            )}

            {/* Detailed month-by-month payment schedule layout matching simulator 1 */}
            <div className="border border-zinc-250 rounded-2xl overflow-hidden bg-zinc-50 max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="bg-zinc-950 text-white font-mono text-[9px] uppercase font-black tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 pl-4">Mês Obra</th>
                    <th className="p-2.5">Descrição Parcela</th>
                    <th className="p-2.5 text-right">Percentual (%)</th>
                    <th className="p-2.5 text-right pr-6">R$ Estimado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {/* Sign check entry */}
                  <tr className="bg-indigo-50/50 font-bold">
                    <td className="p-2.5 pl-4 font-mono">Imediato</td>
                    <td className="p-2.5">Sinal de Recursos Próprios (Assinatura)</td>
                    <td className="p-2.5 text-right font-mono">{salesEntradaPct}%</td>
                    <td className="p-2.5 text-right font-mono pr-6">R$ {salesEntradaVal.toLocaleString('pt-BR')}</td>
                  </tr>

                  {/* Month-by-month mapping loops */}
                  {Array.from({ length: salesConstructionMonths }, (_, idx) => {
                    const m = idx + 1;
                    const isAnnual = m % 12 === 0 && m < salesConstructionMonths;
                    return (
                      <React.Fragment key={m}>
                        <tr className="hover:bg-zinc-100 transition-colors">
                          <td className="p-2 pl-4 font-mono text-zinc-500">Mês {m}</td>
                          <td className="p-2 text-zinc-700">Mensalidade Período de Obras #{m}</td>
                          <td className="p-2 text-right font-mono text-zinc-500">{(salesMonthlyWorkPct / salesConstructionMonths).toFixed(2)}%</td>
                          <td className="p-2 text-right font-mono text-zinc-950 pr-6">R$ {salesMonthlyWorkVal.toLocaleString('pt-BR')}</td>
                        </tr>
                        {isAnnual && (
                          <tr className="bg-amber-50 font-black text-amber-950">
                            <td className="p-2 pl-4 font-mono">Mês {m}</td>
                            <td className="p-2 text-amber-900">📣 Intermediária de Reforço Anual</td>
                            <td className="p-2 text-right font-mono">{salesAnnualPct}%</td>
                            <td className="p-2 text-right font-mono pr-6">R$ {salesAnnualVal.toLocaleString('pt-BR')}</td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Keys delivery */}
                  <tr className="bg-emerald-50 font-black text-emerald-950">
                    <td className="p-2.5 pl-4 font-mono">Mês {salesConstructionMonths}</td>
                    <td className="p-2.5 text-emerald-900">🔑 Saldo Final da Entrega das Chaves / Habite-se</td>
                    <td className="p-2.5 text-right font-mono">{salesChavesPct}%</td>
                    <td className="p-2.5 text-right font-mono pr-6">R$ {salesChavesVal.toLocaleString('pt-BR')}</td>
                  </tr>

                  {/* Bank post-works financing */}
                  <tr className="bg-sky-50 text-sky-950 font-black border-t-2 border-zinc-900">
                    <td className="p-3 pl-4 font-mono">Pós-Obra</td>
                    <td className="p-3 text-sky-900">🏦 Financiamento Imobiliário Caixa / SBPE</td>
                    <td className="p-3 text-right font-mono">{salesFinanciamentoPct}%</td>
                    <td className="p-3 text-right font-mono pr-6">R$ {salesFinanciamentoVal.toLocaleString('pt-BR')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      </div>

      {/* ========================================== */}
      {/* PREVIEW MODAL & PRINT CONTROLS (A4 PREVIEW) */}
      {/* ========================================== */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:hidden animate-fadeIn">
          <div className="bg-zinc-100 border-4 border-zinc-950 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-zinc-900">
            
            {/* Header Toolbar */}
            <div className="bg-zinc-950 text-white p-4 shrink-0 flex flex-wrap gap-3 items-center justify-between border-b-4 border-zinc-950">
              <div className="flex items-center gap-2">
                <span className="text-xl">📄</span>
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase text-indigo-400">Dossiê de Simulação cicloCRED</h4>
                  <strong className="text-sm font-black uppercase tracking-tight block">Ficha de Proposta & Enquadramento Habitacional</strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    triggerSensoryFeedback('success', accSettings);
                    window.print();
                  }}
                  className="py-1.5 px-3 bg-indigo-650 hover:bg-indigo-700 text-white text-[10.5px] font-black uppercase border-2 border-white rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer flex items-center gap-1"
                >
                  <span>🖨️ Imprimir / Salvar PDF</span>
                </button>
                <button
                  onClick={handleExportCSV1}
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-black uppercase border-2 border-zinc-950 rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer flex items-center gap-1"
                >
                  <span>📊 Planilha Excel (CSV)</span>
                </button>
                <button
                  onClick={() => {
                    triggerSensoryFeedback('click', accSettings);
                    setShowPrintModal(false);
                  }}
                  className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10.5px] font-bold rounded-xl transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Hint alert */}
            <div className="bg-amber-50 text-amber-950 border-b-2 border-amber-200 px-6 py-2 text-[10px] font-bold font-mono uppercase flex items-center gap-1.5 shrink-0">
              💡 DICA: Configure o layout de margens como "Nenhum" e ative "Gráficos de plano de fundo" para alinhar perfeitamente na página A4.
            </div>

            {/* A4 Sheet Scroll Canvas */}
            <div className="p-4 sm:p-6 bg-zinc-200 overflow-y-auto flex-1 flex justify-center">
              
              {/* Paper Sheet container */}
              <div className="bg-white text-zinc-900 p-6 font-sans shadow-lg w-full max-w-[21cm] border border-zinc-300 rounded-sm relative text-xs space-y-4">
                
                {/* Official Brand Header */}
                <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-2">
                  <div>
                    <h2 className="text-base font-black uppercase tracking-tight text-zinc-950 flex items-center gap-0.5">
                      <span>SIMULAÇÃO DE CRÉDITO HABITACIONAL</span>
                    </h2>
                    <p className="text-[8px] text-zinc-500 font-mono font-bold uppercase mt-0.5">Estudo Comparativo Neutro — Base do Programa Federal MCMV, Casa Paulista SP e Caixa Econômica Federal</p>
                  </div>
                  <div className="text-right text-[8.5px] font-mono font-bold text-zinc-650">
                    <p>Ficha: <span className="text-zinc-950 font-black">SIM-2026-MCMV-{Math.floor(100000 + Math.random() * 900000)}</span></p>
                    <p>Emissão: <span className="text-zinc-950 font-black">{new Date().toLocaleDateString('pt-BR')}</span></p>
                    <p>Operação: <span className="text-indigo-600 font-black">PROPOSTA FACILITADA</span></p>
                  </div>
                </div>

                {/* 1. Perfil do Comprador e Composição de Renda */}
                <div className="space-y-1">
                  <h4 className="text-[9px] font-black uppercase text-indigo-900 font-mono bg-zinc-100 px-2 py-0.5 rounded">1. Perfil do Comprador e Composição de Renda</h4>
                  <div className="grid grid-cols-3 gap-2 border border-zinc-200 p-2.5 rounded-lg bg-zinc-50/50 text-[10.5px]">
                    <div>
                      <span className="text-[7.5px] text-zinc-400 uppercase block font-semibold">Cliente Final</span>
                      <strong className="text-zinc-800 font-bold block truncate">{clientCustomName || 'Cliente Avulso'}</strong>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-zinc-400 uppercase block font-semibold">Profissão / Origem Renda</span>
                      <strong className="text-zinc-805 font-bold block">{professionType === 'CLT' ? '💼 CLT (Holerite / CTPS)' : '🚀 Autônomo (Extratos)'}</strong>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-zinc-400 uppercase block font-semibold">Renda Declarada Individual</span>
                      <strong className="text-zinc-805 font-bold block font-mono">
                        R$ {(professionType === 'CLT' ? cltIncome : autonomoIncome).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-zinc-400 uppercase block font-semibold">Estado Civil / Proponente</span>
                      <strong className="text-zinc-805 font-bold block">{isMarried ? '💍 Casado / União Estável' : '👤 Solteiro(a)'}</strong>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-zinc-400 uppercase block font-semibold">Aporte Cônjuge (Soma)</span>
                      <strong className="text-zinc-805 font-bold block font-mono">
                        R$ {isMarried ? spouseIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-zinc-400 uppercase block font-semibold">Quantidade Dependentes</span>
                      <strong className="text-zinc-850 font-bold block">{dependentsQty || '0'} dependente(s)</strong>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-zinc-400 uppercase block font-semibold">Tempo de FGTS (3+ anos)</span>
                      <strong className="text-zinc-805 font-bold block">{hasFGTS ? '✓ Sim (Reduz Juros de Balcão)' : 'Inativo / Menor'}</strong>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-zinc-400 uppercase block font-semibold">Idade da Ficha (Seguros)</span>
                      <strong className="text-zinc-805 font-bold block">{applicantAge} anos</strong>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-indigo-700 uppercase block font-black font-mono">RENDA FAMILIAR BRUTA</span>
                      <strong className="text-indigo-900 text-[11.5px] font-black block font-mono">
                        R$ {grossIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>
                {/* 2. Dossiê Físico de Documentação Enquadrado */}
                <div className="space-y-1">
                  <h4 className="text-[9px] font-black uppercase text-indigo-900 font-mono bg-zinc-100 px-2 py-0.5 rounded">2. Dossiê Físico de Documentação Enquadrado</h4>
                  <div className="flex flex-wrap gap-2 p-2 border border-zinc-200 rounded-lg bg-zinc-50/20 text-[9px] tracking-tight">
                    <span className={`px-2 py-1 rounded-md border flex items-center gap-1 font-bold ${docCpfCnh ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                      <span>{docCpfCnh ? '✓' : '✗'}</span>
                      <span>Documento CNH/CPF</span>
                    </span>
                    <span className={`px-2 py-1 rounded-md border flex items-center gap-1 font-bold ${docEndereco ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                      <span>{docEndereco ? '✓' : '✗'}</span>
                      <span>Comprovante Endereço</span>
                    </span>
                    <span className={`px-2 py-1 rounded-md border flex items-center gap-1 font-bold ${docRenda ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                      <span>{docRenda ? '✓' : '✗'}</span>
                      <span>Comprovante Renda</span>
                    </span>
                    <span className={`px-2 py-1 rounded-md border flex items-center gap-1 font-bold ${docExtratos ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                      <span>{docExtratos ? '✓' : '✗'}</span>
                      <span>Extratos Bancários</span>
                    </span>
                  </div>
                </div>

                    {/* CAIXA FINANCING SIMULATOR */}
                    <div className="space-y-1.5">
                      <h4 className="text-[9.5px] font-black uppercase text-indigo-900 font-mono bg-zinc-100 px-2 py-1 rounded">3. Resultado de Crédito Caixa Econômica Federal</h4>
                      <table className="w-full text-left font-mono border border-zinc-200 rounded-lg overflow-hidden text-[10px]">
                        <tbody className="divide-y divide-zinc-200">
                          <tr className="bg-zinc-50">
                            <td className="p-2 pl-3">Faixa MCMV</td>
                            <td className="p-2 font-bold text-zinc-900">{mcmvBracketName}</td>
                            <td className="p-2">Regime Amortização</td>
                            <td className="p-2 font-bold text-zinc-900">{amortizationSystem}</td>
                          </tr>
                          <tr>
                            <td className="p-2 pl-3">Avaliação Imóvel (R$)</td>
                            <td className="p-2 text-zinc-800 font-bold">R$ {simulatedPropertyPrice.toLocaleString('pt-BR')}</td>
                            <td className="p-2">Prazo Caixa Contratado</td>
                            <td className="p-2 text-zinc-805 font-bold">{loanMonths} meses ({loanMonths / 12} anos)</td>
                          </tr>
                          <tr>
                            <td className="p-2 pl-3 text-emerald-800 font-bold">Subsídio MCMV Concedido</td>
                            <td className="p-2 text-emerald-700 font-black">R$ {calculatedSubsidy.toLocaleString('pt-BR')}</td>
                            <td className="p-2 text-zinc-650">Taxa Juros Nominal</td>
                            <td className="p-2 font-black text-zinc-900">{applicableInterestRate}% a.a.</td>
                          </tr>
                          <tr className="bg-indigo-50 font-black">
                            <td className="p-2.5 pl-3 text-indigo-905 uppercase text-[9px]">Aprovado Financiamento Caixa</td>
                            <td className="p-2.5 text-indigo-900 text-xs">R$ {financedAmount.toLocaleString('pt-BR')}</td>
                            <td className="p-2.5 text-zinc-700 uppercase text-[9px]">Entrada Necessária Própria</td>
                            <td className="p-2.5 text-indigo-950 text-xs">R$ {requiredDownpayment.toLocaleString('pt-BR')}</td>
                          </tr>
                          <tr>
                            <td className="p-2 pl-3">1ª Prestação Estimada Caixa</td>
                            <td className="p-2 font-bold text-zinc-800">R$ {firstPayment.toLocaleString('pt-BR')}</td>
                            <td className="p-2">Última Prestação Estimada Caixa</td>
                            <td className="p-2 text-zinc-700">R$ {lastPayment.toLocaleString('pt-BR')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* DOWNPAYMENT FACILITADO SCENARIO */}
                    <div className="space-y-1.5">
                      <h4 className="text-[9.5px] font-black uppercase text-indigo-900 font-mono bg-zinc-100 px-2 py-1 rounded">4. Parcelamento de Entrada Facilitada com a Construtora</h4>
                      <div className="border border-zinc-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left font-mono text-[10px] border-collapse">
                          <thead>
                            <tr className="bg-zinc-100 font-bold border-b border-zinc-200 text-zinc-600">
                              <th className="p-2 pl-3">Fase do Plano</th>
                              <th className="p-2">Descrição Operacional</th>
                              <th className="p-2 text-right pr-4">Financeiro Estimado (R$)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200">
                            <tr>
                              <td className="p-2 pl-3 font-sans font-bold">Ato / Sinal Próprio</td>
                              <td className="p-2 text-zinc-650">Ato irrevogável no fechamento de contrato</td>
                              <td className="p-2 text-right pr-4 font-black text-zinc-900">R$ {valorAto.toLocaleString('pt-BR')}</td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-3 font-sans font-semibold">Balões Intermediários (2 parcelas)</td>
                              <td className="p-2 text-zinc-650">Balões anuais programados para 12 e 24 meses</td>
                              <td className="p-2 text-right pr-4 text-zinc-800">
                                2x de R$ {valorAnual.toLocaleString('pt-BR')} 
                                <span className="text-[9px] text-zinc-400 font-normal block font-sans">Total de R$ {(valorAnual * 2).toLocaleString('pt-BR')}</span>
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-3 font-sans font-semibold">Fração de Chaves (Entrega)</td>
                              <td className="p-2 text-zinc-650">Devido no Habite-se físico da incorporadora</td>
                              <td className="p-2 text-right pr-4 font-bold text-zinc-800">R$ {valorChaves.toLocaleString('pt-BR')}</td>
                            </tr>
                            {(() => {
                              const totalFac = valorAto + (2 * valorAnual) + valorChaves;
                              const difRestante = Math.max(0, requiredDownpayment - totalFac);
                              const valMensalObra = tempoObra > 0 ? (difRestante / tempoObra) : 0;
                              return (
                                <>
                                  <tr className="bg-zinc-50 font-bold">
                                    <td className="p-2 text-indigo-900 pl-3">Saldo Amortizável em Obras</td>
                                    <td className="p-2 text-zinc-500">Saldo residual da entrada estendido</td>
                                    <td className="p-2 text-right pr-4 text-indigo-900">R$ {difRestante.toLocaleString('pt-BR')}</td>
                                  </tr>
                                  <tr className="bg-indigo-50 font-black">
                                    <td className="p-2.5 pl-3 text-indigo-950 uppercase text-[9px] font-sans">🧱 Mensalidade Período Obra (Mensais)</td>
                                    <td className="p-2.5 text-right pr-4 text-indigo-950 text-xs">
                                      {tempoObra} parcelas de R$ {Math.round(valMensalObra).toLocaleString('pt-BR')} /mês
                                    </td>
                                  </tr>
                                </>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPONENTE EXCLUSIVO IMPRESSÃO NATIVA DO BROWSER (A4 ORIGINAL EM window.print) */}
      {/* ========================================================================= */}
      <div id="print-sheet-ciclocred" className="hidden print:block absolute top-0 left-0 text-black bg-white select-none pointer-events-none p-4 font-sans w-[21cm] min-h-[29.7cm] text-[10.5px] leading-tight space-y-3">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-2">
          <div>
            <h1 className="text-base font-black uppercase text-zinc-950">SIMULAÇÃO CRÉDITO HABITACIONAL OFICIAL</h1>
            <p className="text-[8px] text-zinc-500 font-mono font-bold uppercase">VIA DE ARQUIVO REGULAMENTAR • QUALIFICAÇÃO INTEGRANTE MCMV & FLUXO</p>
          </div>
          <div className="text-right text-[8px] font-mono font-bold text-zinc-650">
            <p>Ficha: <span className="text-zinc-950 font-black">SIM-2026-{activeSim === 'financing' ? 'MCMV' : 'INC'}-{Math.floor(100000 + Math.random() * 900000)}</span></p>
            <p>Abertura: <span className="text-zinc-950 font-black">{new Date().toLocaleString('pt-BR')}</span></p>
          </div>
        </div>


            {/* 1. Profile */}
            <div className="space-y-1">
              <h4 className="text-[9px] font-bold uppercase bg-zinc-100 p-0.5 rounded font-mono text-indigo-950">1. Identificação Geral do Cliente e Proponente</h4>
              <div className="grid grid-cols-3 gap-1 p-1.5 border border-zinc-200 rounded text-[9px]">
                <div>Cliente: <strong>{clientCustomName || 'Cliente Avulso'}</strong></div>
                <div>Renda Declarada: <strong>R$ {(professionType === 'CLT' ? cltIncome : autonomoIncome).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
                <div>Tipo Profissional: <strong>{professionType}</strong></div>
                <div>Estado Civil: <strong>{isMarried ? 'Casado' : 'Solteiro'}</strong></div>
                <div>Renda Cônjuge: <strong>R$ {isMarried ? spouseIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</strong></div>
                <div>Dependentes: <strong>{dependentsQty}</strong></div>
                <div>Tempo FGTS (3+ anos): <strong>{hasFGTS ? '✓ Sim' : 'Não'}</strong></div>
                <div>Idade: <strong>{applicantAge} anos</strong></div>
                <div>RENDA INTEGRADA: <strong>R$ {grossIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
              </div>
            </div>

            {/* 2. Documents */}
            <div className="space-y-0.5">
              <h4 className="text-[9px] font-bold uppercase bg-zinc-100 p-0.5 rounded font-mono text-indigo-950">2. Documental de Dossiê Físico</h4>
              <table className="w-full text-left text-[8.5px] border border-zinc-200 rounded">
                <tbody className="divide-y divide-zinc-200">
                  <tr>
                    <td className="p-1 pl-2 font-bold">Documentos CPF e RG / CNH</td>
                    <td className="p-1 text-right">{docCpfCnh ? '[✓] ENQUADRADO' : '[ ] PENDENTE'}</td>
                  </tr>
                  <tr>
                    <td className="p-1 pl-2 font-bold">Comprovante de residência (&lt; 90 dias)</td>
                    <td className="p-1 text-right">{docEndereco ? '[✓] ENQUADRADO' : '[ ] PENDENTE'}</td>
                  </tr>
                  <tr>
                    <td className="p-1 pl-2 font-bold">Comprovantes de renda oficiais (Holerite/CTPS)</td>
                    <td className="p-1 text-right">{docRenda ? '[✓] ENQUADRADO' : '[ ] PENDENTE'}</td>
                  </tr>
                  <tr>
                    <td className="p-1 pl-2 font-bold">Extratos bancários consolidados com carimbos</td>
                    <td className="p-1 text-right">{docExtratos ? '[✓] ENQUADRADO' : '[ ] PENDENTE'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. Financing results */}
            <div className="space-y-0.5">
              <h4 className="text-[9px] font-bold uppercase bg-zinc-100 p-0.5 rounded font-mono text-indigo-950">3. Resultado Habitacional Caixa</h4>
              <table className="w-full text-left font-mono text-[8.5px] border border-zinc-200 rounded">
                <tbody className="divide-y divide-zinc-200">
                  <tr>
                    <td className="p-1 pl-2">Faixa MCMV</td>
                    <td className="p-1 font-bold">{mcmvBracketName}</td>
                    <td className="p-1">Tabela de Amortização</td>
                    <td className="p-1 font-bold">{amortizationSystem}</td>
                  </tr>
                  <tr>
                    <td className="p-1 pl-2">Avaliado (R$)</td>
                    <td className="p-1 font-bold">R$ {simulatedPropertyPrice.toLocaleString('pt-BR')}</td>
                    <td className="p-1">Taxa Juros Nominal</td>
                    <td className="p-1 font-bold">{applicableInterestRate}% a.a.</td>
                  </tr>
                  <tr>
                    <td className="p-1 pl-2 text-emerald-800">Subsídio Caixa (Desconto)</td>
                    <td className="p-1 font-bold text-emerald-700">R$ {calculatedSubsidy.toLocaleString('pt-BR')}</td>
                    <td className="p-1">Prazo Contratado</td>
                    <td className="p-1 font-bold">{loanMonths} meses</td>
                  </tr>
                  <tr className="bg-zinc-100 font-bold">
                    <td className="p-1.5 pl-2 text-indigo-900">APROVADO CAIXA CEF</td>
                    <td className="p-1.5 text-indigo-900 font-bold">R$ {financedAmount.toLocaleString('pt-BR')}</td>
                    <td className="p-1.5 text-zinc-900">ENTRADA REQUERIDA</td>
                    <td className="p-1.5 text-indigo-950 font-bold">R$ {requiredDownpayment.toLocaleString('pt-BR')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Installment plan */}
            <div className="space-y-0.5">
              <h4 className="text-[9px] font-bold uppercase bg-zinc-100 p-0.5 rounded font-mono text-indigo-950">4. Cronograma de Entrada Facilitada (Construtora)</h4>
              <table className="w-full text-left font-mono text-[8.5px] border border-zinc-200 rounded">
                <tbody className="divide-y divide-zinc-200">
                  <tr>
                    <td className="p-1 pl-2">Sinal de Ato (Imediato)</td>
                    <td className="p-1 text-right pr-2">R$ {valorAto.toLocaleString('pt-BR')}</td>
                  </tr>
                  <tr>
                    <td className="p-1 pl-2">Intermediárias Balões Anuais</td>
                    <td className="p-1 text-right pr-2">2x de R$ {valorAnual.toLocaleString('pt-BR')} (Total R$ {(valorAnual*2).toLocaleString('pt-BR')})</td>
                  </tr>
                  <tr>
                    <td className="p-1 pl-2">Parcela de Chaves</td>
                    <td className="p-1 text-right pr-2">R$ {valorChaves.toLocaleString('pt-BR')}</td>
                  </tr>
                  {(() => {
                    const totalFac = valorAto + (2 * valorAnual) + valorChaves;
                    const difRestante = Math.max(0, requiredDownpayment - totalFac);
                    const valMensalObra = tempoObra > 0 ? (difRestante / tempoObra) : 0;
                    return (
                      <>
                        <tr className="bg-zinc-50">
                          <td className="p-1 pl-2 text-indigo-900">Saldo Restante na Obra</td>
                          <td className="p-1 text-right pr-2 text-indigo-900">R$ {difRestante.toLocaleString('pt-BR')}</td>
                        </tr>
                        <tr className="bg-indigo-50 font-black">
                          <td className="p-1.5 pl-2 text-indigo-955">🧱 Mensalidade Período Obra</td>
                          <td className="p-1.5 text-right pr-2 font-black text-indigo-900">
                            {tempoObra} parcelas mensais de R$ {Math.round(valMensalObra).toLocaleString('pt-BR')} /mês
                          </td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>


      </div>
    </>
  );
}
