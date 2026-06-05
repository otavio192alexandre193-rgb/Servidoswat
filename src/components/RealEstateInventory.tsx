/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lead, RealEstateProperty } from '../types';
import { pdfProperties } from '../data/pdfInventory';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Calculator, 
  DollarSign, 
  Sparkles, 
  TableProperties, 
  Download, 
  Upload, 
  Check, 
  AlertCircle, 
  ChevronRight, 
  Info,
  MapPin,
  Home,
  Layers,
  Search,
  CheckCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  FileText,
  Share2,
  Image as ImageIcon,
  ChevronLeft,
  Eye,
  LayoutDashboard,
  Users,
  MessageSquare
} from 'lucide-react';

interface RealEstateInventoryProps {
  leads: Lead[];
  properties: RealEstateProperty[];
  onAddProperty: (prop: RealEstateProperty) => void;
  onAddBulkProperties: (props: RealEstateProperty[]) => void;
  onAddBulkLeads: (leads: Lead[]) => void;
  onDeleteProperty: (id: string) => void;
  onUpdatePropertyStatus: (id: string, status: 'disponivel' | 'reservado' | 'vendido') => void;
  onUpdateProperty?: (prop: RealEstateProperty) => void;
}

export default function RealEstateInventory({
  leads,
  properties,
  onAddProperty,
  onAddBulkProperties,
  onAddBulkLeads,
  onDeleteProperty,
  onUpdatePropertyStatus,
  onUpdateProperty
}: RealEstateInventoryProps) {
  const [activeSubTab, setActiveSubTab] = useState<'estoque' | 'estoque-tabela' | 'importador'>('estoque');

  // Properties filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'apartamento' | 'casa' | 'lote' | 'comercial'>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'disponivel' | 'reservado' | 'vendido'>('todos');
  const [showOnlyMatchingForLead, setShowOnlyMatchingForLead] = useState<string>('');

  // Register state
  const [isRegistering, setIsRegistering] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'apartamento' | 'casa' | 'lote' | 'comercial'>('apartamento');
  const [newPrice, setNewPrice] = useState(0);
  const [newBedrooms, setNewBedrooms] = useState(2);
  const [newSuites, setNewSuites] = useState(1);
  const [newBathrooms, setNewBathrooms] = useState(2);
  const [newParking, setNewParking] = useState(1);
  const [newSize, setNewSize] = useState(75);
  const [newLocation, setNewLocation] = useState('');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // CEP & PDF Proposta states
  const [cepInput, setCepInput] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [selectedBankName, setSelectedBankName] = useState('Caixa Econômica');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Dynamic Media, Books Carousel, and Local Social Sharing States
  const [propertyImages, setPropertyImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600'
  ]);
  const [imageInput, setImageInput] = useState('');
  const [selectedPropertyForMedia, setSelectedPropertyForMedia] = useState<RealEstateProperty | null>(null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'carousel' | 'manage' | 'share'>('carousel');
  const [detailsCarouselIndex, setDetailsCarouselIndex] = useState(0);
  const [cardCarouselIndexes, setCardCarouselIndexes] = useState<Record<string, number>>({});
  const [campaignStatusMessage, setCampaignStatusMessage] = useState('');
  const [isProcessingMediaShare, setIsProcessingMediaShare] = useState(false);

  // States for matching inventory batch transmission
  const [isInventoryBatchDispatching, setIsInventoryBatchDispatching] = useState(false);
  const [activeInventoryBatchIndex, setActiveInventoryBatchIndex] = useState<number>(0);
  const [inventoryBatchCountdown, setInventoryBatchCountdown] = useState<number>(0);
  const [inventoryBatchLog, setInventoryBatchLog] = useState<string[]>([]);
  const [inventoryBatchIsAssistedMode, setInventoryBatchIsAssistedMode] = useState<boolean>(true);

  // Helper to copy dataUrl image block to clipboard as PNG
  const copyImageToClipboard = async (dataUrl: string): Promise<boolean> => {
    try {
      if (!dataUrl) return false;
      if (!navigator.clipboard || !navigator.clipboard.write) {
        console.warn("Clipboard writing is not supported on this browser.");
        return false;
      }

      // Convert Unsplash URL or relative URL or base64 to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      let pngBlob = blob;
      // Modern Clipboard API strictly requires PNG format
      if (blob.type !== 'image/png') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = dataUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        ctx.drawImage(img, 0, 0);
        
        const converted = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!converted) return false;
        pngBlob = converted;
      }
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob })
      ]);
      return true;
    } catch (e) {
      console.warn("Could not copy image automatically to clipboard:", e);
      return false;
    }
  };

  // Matching leads list solver based on price range matching 65% to 125%
  const getMatchingLeadsForProperty = (prop: RealEstateProperty) => {
    return leads.filter(lead => {
      const minBudget = lead.value * 0.65;
      const maxBudget = lead.value * 1.25;
      return prop.price >= minBudget && prop.price <= maxBudget;
    });
  };

  const stopInventoryBatchDispatch = () => {
    setIsInventoryBatchDispatching(false);
    setInventoryBatchLog(prev => [`🛑 [SWAT_ENGINE] Envio em lote interrompido pelo corretor.`, ...prev]);
  };

  const startInventoryBatchDispatch = (prop: RealEstateProperty) => {
    const matchingLeads = getMatchingLeadsForProperty(prop);
    if (matchingLeads.length === 0) return;

    setIsInventoryBatchDispatching(true);
    setActiveInventoryBatchIndex(0);
    setInventoryBatchCountdown(3); // 3 seconds initial warm-up
    setInventoryBatchLog([
      `🚀 [SETUP] Iniciando Transmissão de Ficha de Imóvel para Leads Compatíveis (cicloCRED Match)...`,
      `🏢 Imóvel: ${prop.code} (${prop.title})`,
      `💰 Faixa de Compatibilidade: Match de Valor Elegível`,
      `🎯 Total: ${matchingLeads.length} leads qualificados em budget!`
    ]);
  };

  const executeInventoryBatchItemDispatch = async (prop: RealEstateProperty, index: number) => {
    const matchingLeads = getMatchingLeadsForProperty(prop);
    if (index >= matchingLeads.length) return;

    const leadItem = matchingLeads[index];
    const message = `🎯 MATCH DE IMÓVEL EXCLUSIVO PARA VOCÊ, *${leadItem.name.toUpperCase()}*! 🎯\n\n📌 *${prop.title}*\n📍 Localização: ${prop.neighborhood}, ${prop.location}\n📐 Área útil: ${prop.sizeSqm}m²\n💰 *Valor de Venda:* ${prop.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}\n\nIdentificamos que este imóvel está exatamente dentro do seu perfil de crédito aprovado! Gostaria de agendar uma visita para este final de semana?`;
    
    const activeUrl = (prop.images && prop.images[detailsCarouselIndex]) || prop.imageUrl || '';
    
    setInventoryBatchLog(prev => [`[${new Date().toLocaleTimeString()}] ⏳ Modulando mídias (copiando imagem + baixando arquivo para ${leadItem.name})...`, ...prev]);
    
    // Copy active photo representation to Clipboard and download it
    const imgCopied = await copyImageToClipboard(activeUrl);
    downloadImageFile(activeUrl, `ciclocred_imovel_${prop.code}.png`);

    const cleanPhone = (leadItem.phone || '').replace(/[^0-9]/g, '');
    const defaultPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const waLink = `https://api.whatsapp.com/send?phone=${defaultPhone}&text=${encodeURIComponent(message)}`;

    try {
      window.open(waLink, '_blank');
      setInventoryBatchLog(prev => [
        `[${new Date().toLocaleTimeString()}] ✅ Disparo realizado com sucesso para ${leadItem.name} (${leadItem.phone}) ✔️`,
        imgCopied ? `   👉 DICA: Use Ctrl+V no chat do WhatsApp para colar a linda foto do imóvel!` : `   👉 Imagem baixada! Anexe-a se desejar no chat do WhatsApp.`,
        ...prev
      ]);
    } catch (err) {
      setInventoryBatchLog(prev => [
        `[${new Date().toLocaleTimeString()}] ❌ Erro ao abrir chat de ${leadItem.name}.`,
        ...prev
      ]);
    }

    const nextIdx = index + 1;
    setActiveInventoryBatchIndex(nextIdx);
    setInventoryBatchCountdown(5); // 5s delay for next lead
  };

  // Dispatch countdown hook
  useEffect(() => {
    if (!isInventoryBatchDispatching || !selectedPropertyForMedia) return;

    const matchingLeads = getMatchingLeadsForProperty(selectedPropertyForMedia);
    if (matchingLeads.length === 0) return;

    if (activeInventoryBatchIndex >= matchingLeads.length) {
      setIsInventoryBatchDispatching(false);
      alert(`Envio para todos os ${matchingLeads.length} leads de match efetuado com sucesso (Lote concluído)!`);
      return;
    }

    setInventoryBatchCountdown(activeInventoryBatchIndex === 0 ? 3 : 5);
  }, [isInventoryBatchDispatching, activeInventoryBatchIndex, selectedPropertyForMedia]);

  // Listen for tab return to reset countdown safely
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isInventoryBatchDispatching && selectedPropertyForMedia) {
        const matchingLeads = getMatchingLeadsForProperty(selectedPropertyForMedia);
        if (matchingLeads.length > 0 && activeInventoryBatchIndex < matchingLeads.length) {
          const delay = activeInventoryBatchIndex === 0 ? 3 : 5;
          setInventoryBatchCountdown(delay);
          setInventoryBatchLog(prev => [
            `[${new Date().toLocaleTimeString()}] 👀 Retorno detectado! Redefinindo cronômetro de segurança para ${delay}s...`,
            ...prev
          ]);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isInventoryBatchDispatching, activeInventoryBatchIndex, selectedPropertyForMedia]);

  useEffect(() => {
    if (!isInventoryBatchDispatching || !selectedPropertyForMedia) return;

    const matchingLeads = getMatchingLeadsForProperty(selectedPropertyForMedia);
    if (matchingLeads.length === 0 || activeInventoryBatchIndex >= matchingLeads.length) return;

    if (inventoryBatchCountdown > 0) {
      const timer = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          setInventoryBatchCountdown(prev => prev - 1);
        } else {
          setInventoryBatchLog(prev => {
            if (prev[0]?.includes('⏳ Aguardando retorno ao CRM')) return prev;
            return [
              `[${new Date().toLocaleTimeString()}] ⏳ Aguardando retorno ao CRM para retomar contagem...`,
              ...prev
            ];
          });
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const activeLead = matchingLeads[activeInventoryBatchIndex];
      setInventoryBatchLog(prev => {
        if (prev[0]?.includes('👉 [PRONTO]')) return prev;
        return [
          `[${new Date().toLocaleTimeString()}] 👉 [PRONTO] Linha de transmissão livre! Pressione 'DISPARAR FICHA AGORA' para contactar ${activeLead.name}!`,
          ...prev
        ];
      });

      // Automatically dispatch if in automatic mode
      if (!inventoryBatchIsAssistedMode) {
        executeInventoryBatchItemDispatch(selectedPropertyForMedia, activeInventoryBatchIndex);
      }
    }
  }, [isInventoryBatchDispatching, activeInventoryBatchIndex, inventoryBatchCountdown, selectedPropertyForMedia, inventoryBatchIsAssistedMode]);

  // Keyboard shortcut Enter listener for fast assisted matches batch pacing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isInventoryBatchDispatching && inventoryBatchIsAssistedMode && selectedPropertyForMedia) {
        e.preventDefault();
        executeInventoryBatchItemDispatch(selectedPropertyForMedia, activeInventoryBatchIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInventoryBatchDispatching, inventoryBatchIsAssistedMode, activeInventoryBatchIndex, selectedPropertyForMedia]);

  const downloadImageFile = (dataUrl: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to download image: ", err);
    }
  };

  const shareNativelyWithFile = async (dataUrl: string, title: string, text: string) => {
    try {
      setCampaignStatusMessage('⏳ Preparando arquivos para compartilhamento nativo...');
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      let mimeType = blob.type || 'image/png';
      let extension = 'png';
      if (mimeType.includes('jpeg')) extension = 'jpg';
      if (mimeType.includes('gif')) extension = 'gif';
      
      const file = new File([blob], `imovel_campanha.${extension}`, { type: mimeType });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
          text: text
        });
        setCampaignStatusMessage('✨ Compartilhado com sucesso!');
        setTimeout(() => setCampaignStatusMessage(''), 4000);
      } else {
        await navigator.share({
          title: title,
          text: text
        });
        setCampaignStatusMessage('✨ Link e legenda compartilhados! (Seu navegador não suporta envio de arquivos nativos diretamente)');
        setTimeout(() => setCampaignStatusMessage(''), 4000);
      }
    } catch (err: any) {
      console.warn("Failed native sharing:", err);
      if (err.name !== 'AbortError') {
        setCampaignStatusMessage(`⚠️ O navegador recusou o compartilhamento: ${err.message || err}`);
        setTimeout(() => setCampaignStatusMessage(''), 5000);
      } else {
        setCampaignStatusMessage('❌ Compartilhamento cancelado pelo usuário.');
        setTimeout(() => setCampaignStatusMessage(''), 4000);
      }
    }
  };

  const handlePrintCommercialBook = (property: RealEstateProperty) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Habilite popups no seu navegador para visualizar o Book Comercial.");
      return;
    }

    const currentImages = property.images && property.images.length > 0 
      ? property.images 
      : [property.imageUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600'];

    const imagesHtml = currentImages.map((img, i) => `
      <div class="photo-card" style="margin-bottom: 12px; break-inside: avoid;">
        <img src="${img}" alt="Imóvel ${i + 1}" style="width: 100%; height: 260px; object-fit: cover; border-radius: 8px; border: 2px solid #000;" />
        <div style="font-size: 11px; margin-top: 4px; font-weight: bold; text-align: center; color: #555; text-transform: uppercase;">FOTO COMPLEMENTAR #${i + 1}</div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>BOOK EXCLUSIVO - ${property.code}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;850;900&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              color: #18181b; 
              margin: 40px; 
              background: #fff;
            }
            .header-badge {
              background: #4f46e5;
              color: #fff;
              display: inline-block;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 950;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            h1 { font-size: 28px; font-weight: 900; margin: 15px 0 8px 0; border-bottom: 4px solid #18181b; padding-bottom: 10px; text-transform: uppercase;}
            h2 { font-size: 18px; font-weight: 900; margin-top: 30px; border-bottom: 2px dashed #e4e4e7; padding-bottom: 6px; text-transform: uppercase; }
            .meta-grid { 
              display: grid; 
              grid-template-cols: repeat(4, 1fr); 
              gap: 15px; 
              margin-top: 20px; 
              background: #f4f4f5; 
              padding: 15px; 
              border-radius: 12px; 
              border: 2px solid #18181b;
            }
            .meta-item { text-align: center; }
            .meta-item strong { display: block; font-size: 16px; font-weight: 900; }
            .meta-item span { font-size: 10px; text-transform: uppercase; color: #71717a; font-weight: bold; }
            .price-tag { 
              background: #10b981; 
              color: white; 
              padding: 15px; 
              border-radius: 12px; 
              font-size: 22px; 
              font-weight: 900; 
              text-align: center; 
              margin-top: 20px;
              border: 2px solid #18181b;
            }
            .description { font-size: 14px; line-height: 1.6; color: #3f3f46; margin-top: 15px; }
            .gallery { 
              display: grid; 
              grid-template-cols: repeat(2, 1fr); 
              gap: 15px; 
              margin-top: 25px; 
              }
            .footer-notes { margin-top: 40px; border-top: 1px solid #e4e4e7; padding-top: 15px; font-size: 10px; text-align: center; color: #a1a1aa; font-weight: bold; text-transform: uppercase;}
            @media print {
              body { margin: 20px; }
              .btn-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div class="header-badge">PROSPECTO COMERCIAL REAL - cicloCRED</div>
            <button onclick="window.print()" class="btn-print" style="padding: 10px 20px; background: #000; color: #fff; font-weight: 900; border: none; border-radius: 8px; cursor: pointer; text-transform: uppercase; font-size: 11px;">🖨️ Imprimir / Salvar PDF</button>
          </div>
          <h1>${property.title}</h1>
          <div style="font-size: 14px; color: #71717a; font-weight: bold;">CÓDIGO DE REFERÊNCIA: ${property.code} | LOCALIZAÇÃO: ${property.neighborhood}, ${property.location}</div>
          
          <div class="meta-grid">
            <div class="meta-item">
              <strong>${property.sizeSqm} m²</strong>
              <span>Área Útil</span>
            </div>
            <div class="meta-item">
              <strong>${property.bedrooms}</strong>
              <span>Dormitórios</span>
            </div>
            <div class="meta-item">
              <strong>${property.suites}</strong>
              <span>Suítes</span>
            </div>
            <div class="meta-item">
              <strong>${property.suites > 0 ? property.suites : 'Comum'}</strong>
              <span>Vagas / Padrão</span>
            </div>
          </div>

          <div class="price-tag">
            VALOR DE VENDA: ${property.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>

          <h2>Descrição Geral & Diferenciais</h2>
          <div class="description">
            ${property.description || 'Excelente oportunidade com fluxos de pagamento otimizados, financiamento facilitado via assessoria cicloCRED de aprovação de crédito ágil. Entre em contato para simulação personalizada.'}
          </div>

          <h2>Galeria de Fotos do Carrossel Real</h2>
          <div class="gallery">
            ${imagesHtml}
          </div>

          <div class="footer-notes">
            Este é um documento de oferta comercial expedido pelo CRM cicloCRED em ${new Date().toLocaleDateString('pt-BR')}. Sujeito a alterabilidade e disponibilidade comercial.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCepSearch = async () => {
    const cleanCep = cepInput.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setCepError('CEP inválido. Digite 8 números.');
      return;
    }
    setCepLoading(true);
    setCepError('');
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await resp.json();
      if (data.erro) {
        setCepError('CEP não encontrado.');
      } else {
        setNewNeighborhood(data.bairro || '');
        setNewLocation(`${data.localidade} - ${data.uf}`);
        if (data.logradouro) {
          // Prepend address to desc
          setNewDescription(v => v ? `${data.logradouro}. ${v}` : `${data.logradouro}`);
        }
      }
    } catch (e) {
      setCepError('Erro de conexão ao buscar CEP.');
    } finally {
      setCepLoading(false);
    }
  };

  // Simulator state
  const [simPrice, setSimPrice] = useState<number>(450000);
  const [simDownPayment, setSimDownPayment] = useState<number>(90000); // 20%
  const [simYears, setSimYears] = useState<number>(30);
  const [simIncome, setSimIncome] = useState<number>(12000);
  const [simSelectedLeadId, setSimSelectedLeadId] = useState<string>('');
  
  // Custom CAIXA, MCMV, SBPE, and Sao Paulo rules states
  const [simProgram, setSimProgram] = useState<'mcmv' | 'sbpe'>('mcmv');
  const [simHasDependents, setSimHasDependents] = useState<boolean>(true);
  const [simHasFgtsReduction, setSimHasFgtsReduction] = useState<boolean>(true);
  const [simHasStateSubsidy, setSimHasStateSubsidy] = useState<boolean>(false);
  
  // Connectivity Sync state
  const [isCurySyncActive, setIsCurySyncActive] = useState<boolean>(true);
  const [curySyncLog, setCurySyncLog] = useState<any[]>([
    { time: '10:00:22', text: 'Sincronização iniciada com portal Cury Metropolitana SP' },
    { time: '10:00:23', text: 'Matches cicloCRED e MCMV recalculados para 25 leads ativos' },
    { time: '10:00:24', text: 'Disponibilidade de Caixa Econômica Federal atualizada' }
  ]);

  // Bulk Importer state
  const [importTarget, setImportTarget] = useState<'leads' | 'produtos'>('produtos');
  const [rawPasteData, setRawPasteData] = useState('');
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [isImportSuccess, setIsImportSuccess] = useState(false);

  // Automatically update simulation from selected property or selected lead
  const handleSelectPropertyForSimulation = (prop: RealEstateProperty) => {
    setSimPrice(prop.price);
    // Suggest 20% down payment
    setSimDownPayment(Math.round(prop.price * 0.20));
    setActiveSubTab('simulador');
  };

  // Sync simulator with selected lead value
  useEffect(() => {
    if (simSelectedLeadId) {
      const lead = leads.find(l => l.id === simSelectedLeadId);
      if (lead && lead.value > 0) {
        // Assume lead budget as the property target price
        setSimPrice(lead.value);
        setSimDownPayment(Math.round(lead.value * 0.20));
      }
    }
  }, [simSelectedLeadId, leads]);

  const handleRegisterProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newLocation || !newNeighborhood || newPrice <= 0) return;

    const codeSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `IMO-${newType.toUpperCase().slice(0,3)}-${codeSuffix}`;

    const mainImg = propertyImages.length > 0 ? propertyImages[0] : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600';

    const newProp: RealEstateProperty = {
      id: `prop-${Date.now()}`,
      code,
      title: newTitle,
      type: newType,
      price: newPrice,
      bedrooms: Number(newBedrooms) || 0,
      suites: Number(newSuites) || 0,
      bathrooms: Number(newBathrooms) || 0,
      parkingSpaces: Number(newParking) || 0,
      sizeSqm: Number(newSize) || 0,
      location: newLocation,
      neighborhood: newNeighborhood,
      status: 'disponivel',
      description: newDescription,
      imageUrl: mainImg,
      images: propertyImages.length > 0 ? propertyImages : [mainImg]
    };

    onAddProperty(newProp);
    setIsRegistering(false);

    // Reset fields
    setNewTitle('');
    setNewPrice(0);
    setNewLocation('');
    setNewNeighborhood('');
    setNewDescription('');
    setPropertyImages(['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600']);
    setImageInput('');
  };

  // Lead profiling & recommendation algorithm:
  // Shows real estate that are closely aligned with lead "value" budget (+- 25%)
  const matchesLeadProfile = (prop: RealEstateProperty, leadId: string): boolean => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return true;
    const maxBudget = lead.value * 1.25;
    const minBudget = lead.value * 0.65;
    return prop.price >= minBudget && prop.price <= maxBudget;
  };

  // Filtering properties
  const filteredProperties = properties.filter(prop => {
    const matchesSearch = prop.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prop.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prop.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'todos' ? true : prop.type === typeFilter;
    const matchesStatus = statusFilter === 'todos' ? true : prop.status === statusFilter;
    const matchesLead = showOnlyMatchingForLead ? matchesLeadProfile(prop, showOnlyMatchingForLead) : true;

    return matchesSearch && matchesType && matchesStatus && matchesLead;
  });

  // Calculate matching leads numbers for each property to show dynamic recommendation counts
  const getMatchingLeadsCount = (prop: RealEstateProperty) => {
    return leads.filter(lead => {
      const minBudget = lead.value * 0.65;
      const maxBudget = lead.value * 1.25;
      return prop.price >= minBudget && prop.price <= maxBudget;
    }).length;
  };

  // MCMV / SBPE / CAIXA Lookup Table (based on the PDF Document data)
  const getBracketData = (income: number) => {
    if (income <= 1700) {
      return {
        faixa: 'HIS 1 - Faixa 1 Tier A',
        teto: 275000,
        rateSem: 0.0485,
        rateCom: 0.0433,
        finSem: 98615.39,
        finCom: 105162.27,
        subCom: 55000,
        subSem: 16500,
        parcelaBase: 509.99
      };
    } else if (income <= 2000) {
      return {
        faixa: 'HIS 1 - Faixa 1 Tier B',
        teto: 275000,
        rateSem: 0.0485,
        rateCom: 0.0433,
        finSem: 116711.00,
        finCom: 124459.00,
        subCom: 50777,
        subSem: 15233,
        parcelaBase: 600.00
      };
    } else if (income <= 2400) {
      return {
        faixa: 'HIS 1 - Faixa 1 Tier C',
        teto: 275000,
        rateSem: 0.0511,
        rateCom: 0.0459,
        finSem: 136494.07,
        finCom: 145399.10,
        subCom: 29735,
        subSem: 8920,
        parcelaBase: 719.99
      };
    } else if (income <= 2800) {
      return {
        faixa: 'HIS 1 - Faixa 1 Tier D',
        teto: 275000,
        rateSem: 0.0511,
        rateCom: 0.0459,
        finSem: 159877.00,
        finCom: 170307.00,
        subCom: 14893,
        subSem: 4467,
        parcelaBase: 840.00
      };
    } else if (income <= 3200) {
      return {
        faixa: 'HIS 1 - Faixa 1 Tier E',
        teto: 275000,
        rateSem: 0.0537,
        rateCom: 0.0485,
        finSem: 172977.00,
        finCom: 184067.00,
        subCom: 6011,
        subSem: 1803,
        parcelaBase: 959.99
      };
    } else if (income <= 3500) {
      return {
        faixa: 'HIS 1 - Faixa 2 Tier A',
        teto: 275000,
        rateSem: 0.0564,
        rateCom: 0.0511,
        finSem: 184315.00,
        finCom: 195926.00,
        subCom: 2799,
        subSem: 0,
        parcelaBase: 1050.00
      };
    } else if (income <= 4000) {
      return {
        faixa: 'HIS 1 - Faixa 2 Tier B',
        teto: 275000,
        rateSem: 0.0616,
        rateCom: 0.0564,
        finSem: 199670.00,
        finCom: 211812.00,
        subCom: 2149,
        subSem: 0,
        parcelaBase: 1200.00
      };
    } else if (income <= 4600) {
      return {
        faixa: 'HIS 1 - Faixa 2 Tier C',
        teto: 275000,
        rateSem: 0.0722,
        rateCom: 0.0669,
        finSem: 206296.00,
        finCom: 217981.00,
        subCom: 0,
        subSem: 0,
        parcelaBase: 1380.00
      };
    } else if (income <= 5000) {
      return {
        faixa: 'HIS 1 / HIS 2 - Faixa 3',
        teto: 275000,
        rateSem: 0.0722,
        rateCom: 0.0669,
        finSem: 220000.00,
        finCom: 220000.00,
        subCom: 0,
        subSem: 0,
        parcelaBase: 1469.00
      };
    } else if (income <= 6000) {
      return {
        faixa: 'HIS 2 - Faixa 3 Tier A',
        teto: 400000,
        rateSem: 0.0847,
        rateCom: 0.0793,
        finSem: 239611.00,
        finCom: 252109.00,
        subCom: 0,
        subSem: 0,
        parcelaBase: 1799.00
      };
    } else if (income <= 8000) {
      return {
        faixa: 'HIS 2 - Faixa 3 Tier B',
        teto: 400000,
        rateSem: 0.0847,
        rateCom: 0.0793,
        finSem: 320000.00,
        finCom: 320000.00,
        subCom: 0,
        subSem: 0,
        parcelaBase: 2391.00
      };
    } else if (income <= 9726) {
      return {
        faixa: 'HMP - Faixa 4 Tier A',
        teto: 600000,
        rateSem: 0.1047,
        rateCom: 0.1047,
        finSem: 328298.00,
        finCom: 328298.00,
        subCom: 0,
        subSem: 0,
        parcelaBase: 2918.00
      };
    } else if (income <= 11400) {
      return {
        faixa: 'HMP - Faixa 4 Tier B',
        teto: 600000,
        rateSem: 0.1047,
        rateCom: 0.1047,
        finSem: 386144.00,
        finCom: 386144.00,
        subCom: 0,
        subSem: 0,
        parcelaBase: 3420.00
      };
    } else if (income <= 14900) {
      return {
        faixa: 'SBPE / HMP',
        teto: 750000,
        rateSem: 0.1149,
        rateCom: 0.1149,
        finSem: 381720.00,
        finCom: 381720.00,
        subCom: 0,
        subSem: 0,
        parcelaBase: 3725.00
      };
    } else {
      return {
        faixa: 'SBPE - R2V Alto Padrão',
        teto: 750000,
        rateSem: 0.1149,
        rateCom: 0.1149,
        finSem: 600000.00,
        finCom: 600000.00,
        subCom: 0,
        subSem: 0,
        parcelaBase: 5812.00
      };
    }
  };

  // FINANCING SIMULATION ENGINE (Bank Options Comparison with MCMV / SBPE / CAIXA rules)
  const calculateFinancing = () => {
    const months = simYears * 12;
    const bracket = getBracketData(simIncome);

    // Determine subsidies based on MCMV Brackets and São Paulo state rules
    let baseSubsidy = 0;
    let interestRateCaixa = 0.095; // Default Caixa SBPE standard is 9.5%

    if (simProgram === 'mcmv') {
      interestRateCaixa = simHasFgtsReduction ? bracket.rateCom : bracket.rateSem;
      baseSubsidy = simHasDependents ? bracket.subCom : bracket.subSem;

      // Add São Paulo State Subsidy (Cheque Moradia Paulista) if toggled (typically R$ 13.000,00)
      if (simHasStateSubsidy) {
        baseSubsidy += 13000;
      }
    } else {
      // Standard Caixa SBPE Rate
      interestRateCaixa = 0.095;
      baseSubsidy = 0;
    }

    const bankConfigs = [
      { 
        name: 'Caixa Federal (MCMV/SBPE)', 
        rate: interestRateCaixa, 
        maxFinancingPct: simProgram === 'mcmv' ? 0.82 : 0.80, 
        style: 'SAC', 
        subsidy: baseSubsidy,
        isCaixa: true,
        pdfTabelaBase: bracket.parcelaBase,
        pdfTeto: bracket.teto
      },
      { 
        name: 'Itaú Unibanco', 
        rate: 0.1049, 
        maxFinancingPct: 0.82, 
        style: 'PRICE', 
        subsidy: 0,
        isCaixa: false,
        pdfTabelaBase: 0,
        pdfTeto: bracket.teto
      },
      { 
        name: 'Banco Bradesco', 
        rate: 0.1020, 
        maxFinancingPct: 0.80, 
        style: 'PRICE', 
        subsidy: 0,
        isCaixa: false,
        pdfTabelaBase: 0,
        pdfTeto: bracket.teto
      },
      { 
        name: 'Banco Santander', 
        rate: 0.1099, 
        maxFinancingPct: 0.80, 
        style: 'SAC', 
        subsidy: 0,
        isCaixa: false,
        pdfTabelaBase: 0,
        pdfTeto: bracket.teto
      }
    ];

    return bankConfigs.map(bank => {
      // Valor do imóvel é o teto para cálculo
      const activeCalculationPrice = simProgram === 'mcmv' ? bracket.teto : simPrice;

      // The subsidy acts as equity (reducing the financed loan quantity required)
      const financedAmount = Math.max(0, activeCalculationPrice - simDownPayment - bank.subsidy);
      const monthlyRate = bank.rate / 12;
      let initialInstallment = 0;
      let totalInterest = 0;
      let isViableIncome = true;

      if (financedAmount <= 0) {
        return {
          ...bank,
          activeCalculationPrice,
          financedAmount: 0,
          initialInstallment: 0,
          totalInterest: 0,
          totalFinanced: 0,
          isViableIncome: true,
          installmentToIncomeRatio: 0,
          exceedsMaxLimit: false
        };
      }

      if (bank.isCaixa && simProgram === 'mcmv') {
        // If it is Caixa under MCMV, we prioritize the exact parcel from the spreadsheet table as the base parameter
        // or calculate SAC with standard formula but display spreadsheet parity
        initialInstallment = bank.pdfTabelaBase > 0 ? bank.pdfTabelaBase : (financedAmount / months) + (financedAmount * monthlyRate);
        totalInterest = (financedAmount * monthlyRate * (months + 1)) / 2;
      } else {
        if (bank.style === 'SAC') {
          const principalAmortization = financedAmount / months;
          initialInstallment = principalAmortization + (financedAmount * monthlyRate);
          totalInterest = (financedAmount * monthlyRate * (months + 1)) / 2;
        } else {
          initialInstallment = financedAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
          totalInterest = (initialInstallment * months) - financedAmount;
        }
      }

      // SFH/Caixa rules mandate compromisso de renda limit is 30%
      const installmentToIncomeRatio = simIncome > 0 ? (initialInstallment / simIncome) * 100 : 0;
      if (installmentToIncomeRatio > 30) {
        isViableIncome = false;
      }

      return {
        ...bank,
        activeCalculationPrice,
        financedAmount,
        initialInstallment,
        totalInterest,
        totalFinanced: financedAmount + totalInterest,
        isViableIncome,
        installmentToIncomeRatio,
        exceedsMaxLimit: (simDownPayment + bank.subsidy) < (activeCalculationPrice * (1 - bank.maxFinancingPct))
      };
    });
  };

  const simulatedBanks = calculateFinancing();
  const selectedLeadForSim = leads.find(l => l.id === simSelectedLeadId);

  // DRAG & DROP SPREADSHEETS STATE ENGINE
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [importedFileName, setImportedFileName] = useState('');

  const handleFileImport = (file: File) => {
    setImportedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        let formattedText = text;
        // Simple CSV parser supporting semi-colon and comma splits and replacing them with tabs for the existing processor
        if (!text.includes('\t') && (text.includes(';') || text.includes(','))) {
          const delimiter = text.includes(';') ? ';' : ',';
          const lines = text.split(/\r?\n/);
          formattedText = lines.map(line => {
            return line.split(delimiter).map(cell => cell.trim()).join('\t');
          }).join('\n');
        }
        
        setRawPasteData(formattedText);
        setIsImportSuccess(false);
        setImportErrors([]);
        
        // Triggers the analytical preview logic
        setTimeout(() => {
          const rows = formattedText.split('\n').map(row => row.split('\t').map(cell => cell.trim()));
          if (rows.length > 0) {
            const detectedHeaders = rows[0];
            setImportHeaders(detectedHeaders);
            const parsedItems: any[] = [];
            
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (row.length === 0 || (row.length === 1 && !row[0])) continue;

              if (importTarget === 'leads') {
                const name = row[0] || '';
                const email = row[1] || '';
                const phone = row[2] || '';
                const valueRaw = row[3] || '0';
                const company = row[4] || '';
                const origin = row[5] || 'Planilha Importada';
                const notes = row[6] || 'Importado de arquivo';
                const value = Number(valueRaw.replace(/[^0-9.-]+/g, '')) || 0;
                
                if (name) {
                  parsedItems.push({ name, email, phone, value, company, origin, notes });
                }
              } else {
                const title = row[0] || '';
                const type = (row[1] || 'apartamento').toLowerCase();
                const priceRaw = row[2] || '0';
                const bedrooms = Number(row[3]) || 0;
                const neighborhood = row[4] || 'Bairro Indefinido';
                const description = row[5] || 'Importado de arquivo físico';
                const sizeSqm = Number(row[6]) || 50;
                const price = Number(priceRaw.replace(/[^0-9.-]+/g, '')) || 0;
                
                if (title) {
                  parsedItems.push({
                    title,
                    type,
                    price,
                    bedrooms,
                    suites: 1,
                    bathrooms: 2,
                    parkingSpaces: 1,
                    neighborhood,
                    location: 'São Paulo - SP',
                    description,
                    sizeSqm,
                    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600',
                    images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600']
                  });
                }
              }
            }
            setImportPreview(parsedItems);
          }
        }, 100);
      }
    };
    reader.readAsText(file);
  };

  // BULK PASTE EXCEL/CSV GRID CONTROLLER
  const handleParsePaste = () => {
    if (!rawPasteData.trim()) return;

    const rows = rawPasteData.split('\n').map(row => row.split('\t').map(cell => cell.trim()));
    if (rows.length === 0) return;

    // Detect headers
    const detectedHeaders = rows[0];
    setImportHeaders(detectedHeaders);

    const parsedItems: any[] = [];
    const errors: string[] = [];

    // Parse loop
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0 || (row.length === 1 && !row[0])) continue;

      if (importTarget === 'leads') {
        // Columns expected alignment mockup: 
        // 0: Name, 1: Email, 2: Phone, 3: Value, 4: Company, 5: Origin, 6: Notes
        const name = row[0] || '';
        const email = row[1] || '';
        const phone = row[2] || '';
        const valueRaw = row[3] || '0';
        const company = row[4] || '';
        const origin = row[5] || 'Planilha Comercial';
        const notes = row[6] || 'Importado via colar planilha';

        const value = Number(valueRaw.replace(/[^0-9.-]+/g, '')) || 0;

        if (!name) {
          errors.push(`Linha ${i}: O nome do lead é obrigatório.`);
          continue;
        }

        parsedItems.push({
          id: `lead-bulk-${Date.now()}-${i}`,
          name,
          email: email || `${name.toLowerCase().replace(/\s+/g, '')}@exemplo.com`,
          phone: phone || '(11) 99999-9999',
          company,
          value: value || 250000, // default placeholder budget
          status: 'novo',
          notes,
          origin,
          createdAt: new Date().toISOString().slice(0, 10)
        });
      } else {
        // Target is Properties (Produtos Estoque Imobiliário)
        // 0: Title, 1: Type, 2: Price, 3: Bedrooms, 4: Neighborhood, 5: Description, 6: Area sqm
        const title = row[0] || '';
        const typeRaw = (row[1] || 'apartamento').toLowerCase();
        const priceRaw = row[2] || '0';
        const bedroomsRaw = row[3] || '2';
        const neighborhood = row[4] || '';
        const description = row[5] || '';
        const sizeRaw = row[6] || '70';

        const type = ['apartamento', 'casa', 'lote', 'comercial'].includes(typeRaw) 
          ? typeRaw as any 
          : 'apartamento';
        const price = Number(priceRaw.replace(/[^0-9.-]+/g, '')) || 0;
        const bedrooms = Number(bedroomsRaw) || 2;
        const sizeSqm = Number(sizeRaw) || 75;

        if (!title || price <= 0) {
          errors.push(`Linha ${i}: Título e Preço válido são obrigatórios.`);
          continue;
        }

        parsedItems.push({
          id: `prop-bulk-${Date.now()}-${i}`,
          code: `IMO-${type.toUpperCase().slice(0,3)}-${Math.floor(1000 + Math.random() * 9000)}`,
          title,
          type,
          price,
          bedrooms,
          suites: bedrooms > 1 ? 1 : 0,
          bathrooms: bedrooms,
          parkingSpaces: 1,
          sizeSqm,
          location: 'São Paulo - SP',
          neighborhood: neighborhood || 'Centro',
          status: 'disponivel',
          description: description || 'Cadastrado via importação em grade de planilha.',
          imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600'
        });
      }
    }

    setImportPreview(parsedItems);
    setImportErrors(errors);
  };

  const handleApplyBulkImport = () => {
    if (importPreview.length === 0) return;

    if (importTarget === 'leads') {
      onAddBulkLeads(importPreview);
    } else {
      onAddBulkProperties(importPreview);
    }

    setIsImportSuccess(true);
    setRawPasteData('');
    setImportPreview([]);
    setTimeout(() => {
      setIsImportSuccess(false);
    }, 5000);
  };

  // Structured export helper to generate spreadsheets/CSVs
  const handleExportCSV = (src: 'leads' | 'properties') => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (src === 'leads') {
      csvContent += "ID;Nome;Email;Telefone;Orcamento;Canal;Notas;CriadoEm\r\n";
      leads.forEach(l => {
        csvContent += `"${l.id}";"${l.name}";"${l.email}";"${l.phone}";"${l.value}";"${l.origin}";"${l.notes.replace(/"/g, '""')}";"${l.createdAt}"\r\n`;
      });
    } else {
      csvContent += "Codigo;Titulo;Tipo;Preco;Quartos;Bairro;Area_m2;Status\r\n";
      properties.forEach(p => {
        csvContent += `"${p.code}";"${p.title}";"${p.type}";"${p.price}";"${p.bedrooms}";"${p.neighborhood}";"${p.sizeSqm}";"${p.status}"\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", src === 'leads' ? 'Planilha_Leads_cicloCRED.csv' : 'Planilha_Estoque_IMO_cicloCRED.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Upper Navigation Bars */}
      <div className="flex flex-col md:flex-row border-4 border-zinc-950 bg-white p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] select-none gap-1.5">
        <button
          onClick={() => setActiveSubTab('estoque')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl transition ${activeSubTab === 'estoque' ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-zinc-500 hover:bg-zinc-50'}`}
        >
          🏨 Estoque & Matches
        </button>
        <button
          onClick={() => setActiveSubTab('estoque-tabela')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl transition ${activeSubTab === 'estoque-tabela' ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-zinc-500 hover:bg-zinc-50'}`}
        >
          📊 Visão Planilha (Tabela)
        </button>
        <button
          onClick={() => setActiveSubTab('importador')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl transition ${activeSubTab === 'importador' ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-zinc-500 hover:bg-zinc-50'}`}
        >
          📋 Importador Lote
        </button>
      </div>

      {/* RENDER TAB 1: REAL ESTATE INVENTORY & RECOMMENDATIONS */}
      {activeSubTab === 'estoque' && (
        <div className="space-y-6">

          {/* REAL ESTATE DASHBOARD PANEL (Bento Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI 1: Valuation */}
            <div className="bg-white border-4 border-zinc-950 p-4.5 rounded-2xl shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[9px] uppercase font-mono font-black text-indigo-600 tracking-wider">Valuation Carteira</span>
                <span className="text-sm">🏢</span>
              </div>
              <div className="mt-2">
                <h3 className="text-base font-black tracking-tight text-zinc-950 font-mono">
                  {properties.reduce((a, b) => a + b.price, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold mt-1">
                  Ativos Cadastrados: <span className="text-zinc-950 font-black">{properties.length} unidades</span>
                </p>
              </div>
            </div>

            {/* KPI 2: Mix de Tipologias */}
            <div className="bg-white border-4 border-zinc-950 p-4.5 rounded-2xl shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] space-y-2">
              <span className="text-[9px] uppercase font-mono font-black text-emerald-700 tracking-wider">Mix de Tipologias</span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[9px] font-bold text-zinc-500 font-mono">
                <div className="flex justify-between border-b pb-0.5 border-zinc-100">
                  <span>Apartamentos:</span>
                  <span className="text-zinc-950 font-black">{properties.filter(p => p.type === 'apartamento').length}u</span>
                </div>
                <div className="flex justify-between border-b pb-0.5 border-zinc-100">
                  <span>Casas:</span>
                  <span className="text-zinc-950 font-black">{properties.filter(p => p.type === 'casa').length}u</span>
                </div>
                <div className="flex justify-between border-b pb-0.5 border-zinc-100">
                  <span>Lotes:</span>
                  <span className="text-zinc-950 font-black">{properties.filter(p => p.type === 'lote').length}u</span>
                </div>
                <div className="flex justify-between border-b pb-0.5 border-zinc-100">
                  <span>Comerciais:</span>
                  <span className="text-zinc-950 font-black">{properties.filter(p => p.type === 'comercial').length}u</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Status Inventário */}
            <div className="bg-white border-4 border-zinc-950 p-4.5 rounded-2xl shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
              <span className="text-[9px] uppercase font-mono font-black text-amber-700 tracking-wider">Status de Disponibilidade</span>
              <div className="space-y-1.5 mt-2">
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden flex border border-zinc-300">
                  <div 
                    title="Livre"
                    className="bg-emerald-500 h-full" 
                    style={{ width: `${properties.length > 0 ? (properties.filter(p => p.status === 'disponivel').length / properties.length) * 100 : 0}%` }}
                  />
                  <div 
                    title="Reservado"
                    className="bg-amber-400 h-full" 
                    style={{ width: `${properties.length > 0 ? (properties.filter(p => p.status === 'reservado').length / properties.length) * 100 : 0}%` }}
                  />
                  <div 
                    title="Vendido"
                    className="bg-red-500 h-full" 
                    style={{ width: `${properties.length > 0 ? (properties.filter(p => p.status === 'vendido').length / properties.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] font-mono font-black uppercase text-zinc-500">
                  <span className="text-emerald-700">Livre: {properties.filter(p => p.status === 'disponivel').length}</span>
                  <span className="text-amber-700">Resv: {properties.filter(p => p.status === 'reservado').length}</span>
                  <span className="text-rose-700">Vend: {properties.filter(p => p.status === 'vendido').length}</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Tíquete Médio */}
            <div className="bg-white border-4 border-zinc-950 p-4.5 rounded-2xl shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[9px] uppercase font-mono font-black text-indigo-950 tracking-wider">Tíquete Médio Geral</span>
                <span className="text-sm">🧮</span>
              </div>
              <div className="mt-2 font-mono">
                <h3 className="text-xs font-black text-zinc-950 leading-none">
                  {(properties.length > 0 ? properties.reduce((a, b) => a + b.price, 0) / properties.length : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </h3>
                <p className="text-[8px] text-zinc-500 font-bold mt-1 uppercase">
                  Maior Ativo: <span className="text-zinc-950 font-black">{Math.max(...properties.map(p => p.price), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Main action line */}
          <div className="bg-gradient-to-br from-indigo-900 via-zinc-900 to-indigo-950 text-white border-4 border-zinc-950 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-black text-indigo-400 tracking-wider">🏢 Gestão de Portfólio imobiliário cicloCRED</span>
              <h2 className="text-xl font-black uppercase italic tracking-tight">Consolide Carteira de Imóveis para os Leads</h2>
              <p className="text-xs text-zinc-300 font-medium max-w-xl">
                O CRM correlaciona automaticamente o valor de financiamento pré-aprovado do lead com o portfólio físico para entregar recomendações precisas de compra.
              </p>
            </div>

            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 font-extrabold uppercase font-mono rounded-xl border-2 border-zinc-950 text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-0.5"
            >
              {isRegistering ? 'Fechar Formulário' : 'Cadastrar Imóvel Avulso'}
            </button>
          </div>

          {/* New property form */}
          {isRegistering && (
            <form onSubmit={handleRegisterProperty} className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5 animate-scaleIn text-zinc-900">
              <div className="border-b pb-3">
                <h3 className="text-sm font-black uppercase italic text-zinc-950">🏡 Cadastrar Novo Imóvel na Carteira</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-6 space-y-1.5">
                  <label className="block text-xs font-black text-zinc-700 uppercase font-mono">Título do Empreendimento / Casa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Apartamento Residencial Jardim América"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-bold focus:bg-white outline-none"
                  />
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-xs font-black text-zinc-700 uppercase font-mono">Tipo</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-bold outline-none"
                  >
                    <option value="apartamento">Apartamento</option>
                    <option value="casa">Casa</option>
                    <option value="lote">Lote de Condomínio</option>
                    <option value="comercial">Ponto Comercial</option>
                  </select>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-xs font-black text-zinc-700 uppercase font-mono">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newPrice || ''}
                    onChange={(e) => setNewPrice(Number(e.target.value) || 0)}
                    placeholder="750000"
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-mono font-bold focus:bg-white outline-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-black text-zinc-700 uppercase font-mono">Área M²</label>
                  <input
                    type="number"
                    value={newSize || ''}
                    onChange={(e) => setNewSize(Number(e.target.value) || 0)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-mono font-bold"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-black text-zinc-700 uppercase font-mono">Quartos</label>
                  <input
                    type="number"
                    value={newBedrooms}
                    onChange={(e) => setNewBedrooms(Number(e.target.value) || 0)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-bold"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-black text-zinc-700 uppercase font-mono">Suítes</label>
                  <input
                    type="number"
                    value={newSuites}
                    onChange={(e) => setNewSuites(Number(e.target.value) || 0)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-bold"
                  />
                </div>

                <div className="md:col-span-6 space-y-1.5 bg-indigo-50/50 border-2 border-dashed border-indigo-200 p-2.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-black text-indigo-950 uppercase font-mono">Busca Rápida por CEP</label>
                    {cepError && (
                      <span className="text-[10px] text-red-600 font-bold font-mono animate-bounce">
                        ⚠️ {cepError}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: 01310-100"
                      value={cepInput}
                      onChange={(e) => setCepInput(e.target.value)}
                      className="flex-1 bg-white border-2 border-zinc-950 rounded-xl p-2.5 text-xs font-mono font-bold outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCepSearch}
                      disabled={cepLoading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white border-2 border-zinc-950 font-black uppercase text-xs rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition"
                    >
                      {cepLoading ? 'Buscando...' : 'Buscar CEP'}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-xs font-black text-zinc-700 uppercase font-mono">Bairro / Localidade*</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pinheiros"
                    value={newNeighborhood}
                    onChange={(e) => setNewNeighborhood(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-bold"
                  />
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-xs font-black text-zinc-700 uppercase font-mono">Estado e Localização *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: São Paulo - SP"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-bold"
                  />
                </div>

                <div className="md:col-span-12 space-y-1.5">
                  <label className="block text-xs font-black text-zinc-700 uppercase font-mono">Diferenciais e Memorial Descritivo</label>
                  <textarea
                    rows={2}
                    placeholder="Próximo ao metrô, varanda gourmet equipada, acabamentos de primeira linha..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs leading-relaxed"
                  />
                </div>

                {/* 📸 CUSTOM MEDIA BOOK AND PHOTOS CAROUSEL CREATOR BLOCK */}
                <div className="md:col-span-12 space-y-2.5 border-t pt-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <label className="block text-xs font-black text-indigo-950 uppercase font-mono">📸 Mídias, Imagens & Book de Fotos do Imóvel</label>
                    <span className="text-[9px] text-zinc-500 font-bold font-mono uppercase">Vincule múltiplas fotos ao carrossel físico</span>
                  </div>
                  
                  {/* Presets Grid */}
                  <div className="bg-indigo-50/50 p-4.5 rounded-2xl border-2 border-dashed border-indigo-200 space-y-4">
                    <span className="text-[9px] uppercase font-mono font-black text-indigo-900 block">⚡ Galeria de Fotos Premium para o Anúncio (Clique para Adicionar):</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Fachada', url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600' },
                        { name: 'Sala Living', url: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&q=80&w=600' },
                        { name: 'Suíte Master', url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&q=80&w=600' },
                        { name: 'Cozinha Planejada', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600' },
                        { name: 'Lazer & Piscina', url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=600' },
                        { name: 'Varanda Decorada', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=600' }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (!propertyImages.includes(preset.url)) {
                              setPropertyImages(prev => [...prev, preset.url]);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-zinc-950 text-[10px] font-black uppercase rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                          + {preset.name}
                        </button>
                      ))}
                    </div>

                    {/* Manual inputs URL */}
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Inserir link da foto externa (.jpg, .png, .webp)..."
                        value={imageInput}
                        onChange={(e) => setImageInput(e.target.value)}
                        className="flex-1 bg-white border-2 border-zinc-950 rounded-xl p-2.5 text-xs font-mono font-semibold text-zinc-950"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (imageInput.trim()) {
                            setPropertyImages(prev => [...prev, imageInput.trim()]);
                            setImageInput('');
                          }
                        }}
                        className="px-4 py-2.5 bg-indigo-950 text-white font-mono font-black text-xs uppercase rounded-xl hover:bg-zinc-90 w-auto border-2 border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[10px]"
                      >
                        Vincular
                      </button>
                    </div>

                    {/* Active Thumbnails previews */}
                    {propertyImages.length > 0 && (
                      <div className="space-y-2.5">
                        <span className="text-[9px] uppercase font-mono font-black text-zinc-500 block">Fotos no Book do Imóvel ({propertyImages.length}):</span>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1 border-t border-indigo-1 *">
                          {propertyImages.map((img, idx) => (
                            <div key={idx} className="relative aspect-video rounded-lg border border-zinc-950 overflow-hidden group shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                              <img src={img || undefined} className="w-full h-full object-cover" alt="Preview Thumbnail" />
                              <button
                                type="button"
                                onClick={() => setPropertyImages(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 opacity-90 hover:scale-105 transition-all text-[8px] top-1 right-1 w-4 h-4 flex items-center justify-center font-bold"
                                title="Excluir Foto"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="px-4 py-2 bg-zinc-150 border-2 border-zinc-950 text-xs font-black uppercase rounded-xl hover:bg-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 border-2 border-zinc-950 text-white text-xs font-black uppercase rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          )}

          {/* Intelligent matching panel filter & generic searches */}
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-5">
            <div className="flex flex-col lg:flex-row gap-5 justify-between items-start lg:items-center">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-zinc-950 uppercase italic tracking-tight flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Cruzador Inteligente de Perfil do Lead</span>
                </h3>
                <p className="text-xs text-zinc-500 font-medium">Filtre imóveis específicos que combinam com o crédito simulado de um Lead Ativo.</p>
              </div>

              {/* Match selector dropdown */}
              <div className="w-full lg:max-w-xs flex items-center gap-2 bg-zinc-55 p-1 rounded-xl border-2 border-zinc-100 placeholder-zinc-400">
                <select
                  value={showOnlyMatchingForLead}
                  onChange={(e) => setShowOnlyMatchingForLead(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-350 outline-none rounded-lg p-2.5 text-xs font-extrabold text-indigo-950"
                >
                  <option value="">Todos (Sem filtro de Match)</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      🎯 Match para: {lead.name} ({lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* General Filters belt */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por Código, Título, Bairro..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 pl-10 text-xs font-bold text-zinc-950 outline-none focus:bg-white"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs font-bold outline-none text-zinc-950"
              >
                <option value="todos">Todos os Tipos de Imóveis</option>
                <option value="apartamento">Apartamento</option>
                <option value="casa">Casa</option>
                <option value="lote">Lote</option>
                <option value="comercial">Ponto Comercial</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs font-bold outline-none text-zinc-950"
              >
                <option value="todos">Todos os Status</option>
                <option value="disponivel">Disponível</option>
                <option value="reservado">Reservado</option>
                <option value="vendido">Vendido</option>
              </select>

              <div className="flex items-center justify-end">
                {showOnlyMatchingForLead || statusFilter !== 'todos' || typeFilter !== 'todos' || searchQuery ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setTypeFilter('todos');
                      setStatusFilter('todos');
                      setShowOnlyMatchingForLead('');
                    }}
                    className="text-[10px] font-mono font-black uppercase tracking-wider text-red-600 hover:underline"
                  >
                    × Limpar filtros
                  </button>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                    Exibindo {filteredProperties.length} imóveis
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {filteredProperties.map(prop => {
              const leadsCount = getMatchingLeadsCount(prop);

              return (
                <div key={prop.id} className="bg-white border-4 border-zinc-950 rounded-3xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:translate-y-[-2px] transition-all text-zinc-900 w-full">
                  <div>
                    {/* Visual header with image carousels */}
                    <div className="relative h-44 bg-zinc-100 flex items-center justify-center overflow-hidden border-b-4 border-zinc-950 group">
                      {/* Carrossel images solver */}
                      {(() => {
                        const propImages = prop.images && prop.images.length > 0
                          ? prop.images
                          : (prop.imageUrl ? [prop.imageUrl] : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600']);
                        
                        const activeIndex = cardCarouselIndexes[prop.id] || 0;
                        const currentImg = propImages[activeIndex] || prop.imageUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600';

                        const handlePrev = (e: React.MouseEvent) => {
                          e.stopPropagation();
                          const nextIdx = (activeIndex - 1 + propImages.length) % propImages.length;
                          setCardCarouselIndexes(prev => ({ ...prev, [prop.id]: nextIdx }));
                        };

                        const handleNext = (e: React.MouseEvent) => {
                          e.stopPropagation();
                          const nextIdx = (activeIndex + 1) % propImages.length;
                          setCardCarouselIndexes(prev => ({ ...prev, [prop.id]: nextIdx }));
                        };

                        return (
                          <>
                            <img 
                              src={currentImg || undefined} 
                              alt={prop.title}
                              className="w-full h-full object-cover transition-all duration-300"
                              referrerPolicy="no-referrer"
                            />
                            
                            {/* Navigation arrows (only visible if multi-image) */}
                            {propImages.length > 1 && (
                              <>
                                <button 
                                  onClick={handlePrev}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-zinc-900/65 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-zinc-950 text-xs transition border border-zinc-600 w-6 h-6 flex items-center justify-center font-bold"
                                >
                                  ‹
                                </button>
                                <button 
                                  onClick={handleNext}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-900/65 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-zinc-950 text-xs transition border border-zinc-600 w-6 h-6 flex items-center justify-center font-bold"
                                >
                                  ›
                                </button>
                                
                                {/* Photo Book Indicators dots */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                  {propImages.map((_, dotIdx) => (
                                    <span 
                                      key={dotIdx} 
                                      className={`block w-1.5 h-1.5 rounded-full border border-white/50 ${dotIdx === activeIndex ? 'bg-indigo-500 w-3 scale-110' : 'bg-white/40'}`}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </>
                        );
                      })()}

                      <div className="absolute top-2 left-2 bg-zinc-900 border border-zinc-700 text-white text-[10px] font-mono font-black rounded px-2 py-0.5 shadow">
                        {prop.code}
                      </div>

                      {prop.status === 'disponivel' && (
                        <span className="absolute top-2 right-2 bg-emerald-100 border border-emerald-500 text-emerald-850 px-2 py-0.5 rounded text-[9px] uppercase font-black">
                          Disponível
                        </span>
                      )}
                      {prop.status === 'reservado' && (
                        <span className="absolute top-2 right-2 bg-amber-100 border border-amber-500 text-amber-850 px-2 py-0.5 rounded text-[9px] uppercase font-black">
                          Reservado
                        </span>
                      )}
                      {prop.status === 'vendido' && (
                        <span className="absolute top-2 right-2 bg-red-100 border border-red-500 text-red-850 px-2 py-0.5 rounded text-[9px] uppercase font-black">
                          Vendido
                        </span>
                      )}
                    </div>

                    {/* Meta values */}
                    <div className="p-4 space-y-3">
                      <div>
                        <span className="text-[9px] uppercase font-mono font-black text-indigo-600 block mb-0.5">
                          {prop.type === 'apartamento' ? '🏢 Apartamento' : prop.type === 'casa' ? '🏡 Casa Residencial' : prop.type === 'lote' ? '📐 Lote Urbano' : '💼 Comercial'}
                        </span>
                        <h4 className="font-sans font-black text-sm text-zinc-950 leading-snug uppercase tracking-tight truncate" title={prop.title}>
                          {prop.title}
                        </h4>
                        <p className="text-[11px] text-zinc-500 font-bold flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{prop.neighborhood}, {prop.location}</span>
                        </p>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-3 gap-1 px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-center font-mono font-bold text-[10px] select-none text-zinc-500">
                        <div>
                          <span className="block text-zinc-400 text-[8px] uppercase">Área</span>
                          <span className="text-zinc-900">{prop.sizeSqm}m²</span>
                        </div>
                        <div>
                          <span className="block text-zinc-400 text-[8px] uppercase">Quartos</span>
                          <span className="text-zinc-900">{prop.bedrooms} (S:{prop.suites})</span>
                        </div>
                        <div>
                          <span className="block text-zinc-400 text-[8px] uppercase">Vagas</span>
                          <span className="text-zinc-900">{prop.parkingSpaces} vg</span>
                        </div>
                      </div>

                      {/* Desc */}
                      <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed">
                        {prop.description}
                      </p>

                      {/* Recommend highlight based on budget matching */}
                      <div className="pt-2 border-t flex items-center justify-between">
                        <span className="text-xs font-mono font-black text-indigo-700">
                          {prop.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        </span>

                        {leadsCount > 0 ? (
                          <span className="text-[10px] uppercase font-bold font-mono text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{leadsCount} Leads Elegíveis</span>
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase font-mono font-bold text-zinc-400">
                            Sem leads compatíveis
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions bar for cards */}
                  <div className="p-4 bg-zinc-50/70 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 select-none">
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleSelectPropertyForSimulation(prop)}
                        className="flex items-center gap-1 px-2 py-1.5 bg-indigo-50 hover:bg-slate-100 border border-zinc-950 text-[10px] font-black uppercase rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition text-indigo-950"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Simular</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedPropertyForMedia(prop);
                          setDetailsCarouselIndex(0);
                          setMediaModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-zinc-950 text-[10px] font-black uppercase rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition"
                      >
                        <Share2 className="w-3.5 h-3.5 text-white" />
                        <span>Divulgar / Fotos</span>
                      </button>
                    </div>

                    <div className="flex gap-1.5 items-center justify-between sm:justify-end">
                      <select
                        value={prop.status}
                        onChange={(e) => onUpdatePropertyStatus(prop.id, e.target.value as any)}
                        className="bg-white border text-[10px] font-black rounded px-1 outline-none font-mono"
                      >
                        <option value="disponivel">Livre</option>
                        <option value="reservado">Reservar</option>
                        <option value="vendido">Vendido</option>
                      </select>

                      <button
                        onClick={() => onDeleteProperty(prop.id)}
                        title="Remover Imóvel"
                        className="p-1 px-1.5 bg-white border hover:bg-red-50 text-zinc-400 hover:text-red-700 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* RENDER TAB 2: PROPERTIES SPREADSHEET TABLE */}
      {activeSubTab === 'estoque-tabela' && (
        <div className="space-y-6">
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-zinc-900 overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b">
              <div>
                <span className="text-[10px] uppercase font-mono font-black text-indigo-600 block">Tabela de Ativos</span>
                <h3 className="text-lg font-black italic uppercase tracking-tight text-zinc-950">Spreadsheet de Capturas e Estoque</h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5 font-sans">Visão tabular consolidada com filtros, controle de reservas e matching biunívoco com os leads cadastrados.</p>
              </div>
              <span className="text-[10px] font-mono font-black py-1.5 px-3 bg-zinc-100 border border-zinc-350 rounded-lg shrink-0">
                ATIVOS NO CRM: {properties.length} UNIDADES
              </span>
            </div>

            {/* Scrollable table container */}
            <div className="border border-zinc-250 rounded-2xl overflow-hidden shadow-inner bg-zinc-50 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="bg-zinc-950 text-white font-mono text-[10px] uppercase font-black tracking-wider sticky top-0 z-10 font-sans">
                  <tr>
                    <th className="p-3 pl-4">Código</th>
                    <th className="p-3">Empreendimento / Localidade</th>
                    <th className="p-3">Tipologia</th>
                    <th className="p-3 text-right">Área</th>
                    <th className="p-3 text-right">Valor Venda</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center pr-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredProperties.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-400 font-bold uppercase font-mono">
                        Nenhum imóvel corresponde aos filtros vigentes.
                      </td>
                    </tr>
                  ) : (
                    filteredProperties.map((prop) => (
                      <tr key={prop.id} className="hover:bg-zinc-100/70 transition-colors">
                        <td className="p-3 pl-4 font-mono font-black text-indigo-600">
                          {prop.code}
                        </td>
                        <td className="p-3">
                          <div className="leading-tight">
                            <strong className="block text-zinc-900 font-extrabold uppercase truncate max-w-[250px]">{prop.title}</strong>
                            <span className="block text-[10px] text-zinc-450 uppercase font-mono font-bold">{prop.neighborhood}, {prop.location}</span>
                          </div>
                        </td>
                        <td className="p-3 text-zinc-700 capitalize">
                          {prop.type} • {prop.bedrooms} Dorms ({prop.suites} Suíte)
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-zinc-650">
                          {prop.sizeSqm} m²
                        </td>
                        <td className="p-3 text-right font-mono font-black text-zinc-950">
                          {prop.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        </td>
                        <td className="p-3 text-center font-sans">
                          <span className={`inline-block px-2.5 py-1 text-[9px] uppercase font-mono font-black rounded-lg border cursor-pointer select-none transition ${
                            prop.status === 'disponivel' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : prop.status === 'reservado'
                              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                          }`}
                          onClick={() => {
                            const statuses: Array<'disponivel' | 'reservado' | 'vendido'> = ['disponivel', 'reservado', 'vendido'];
                            const nextIndex = (statuses.indexOf(prop.status) + 1) % statuses.length;
                            onUpdatePropertyStatus(prop.id, statuses[nextIndex]);
                          }}
                          >
                            {prop.status === 'disponivel' ? 'Disponível' : prop.status === 'reservado' ? 'Reservado' : 'Vendido'}
                          </span>
                        </td>
                        <td className="p-3 text-center pr-4">
                          <button
                            type="button"
                            onClick={() => onDeleteProperty(prop.id)}
                            className="p-1 px-2.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg border border-rose-200 transition font-mono text-[9px] font-black uppercase cursor-pointer"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SHIELDED PREVIOUS SIMULATOR CODE TO PRESERVE COMPILED SCOPES AND HIDDEN STATES */}
      {false && (
        <div className="hidden">
            
            {/* Input Controls */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <span className="text-[10px] font-mono font-black text-indigo-600 uppercase">Simulador de Hipotecas e Financiamentos cicloCRED</span>
                <h3 className="text-base font-black uppercase italic tracking-tight text-zinc-950">1. Parametrizar Simulação</h3>
              </div>

              {/* Vincular lead */}
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-zinc-700 uppercase font-mono">Simular para Lead Ativo</label>
                <select
                  value={simSelectedLeadId}
                  onChange={(e) => setSimSelectedLeadId(e.target.value)}
                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-bold"
                >
                  <option value="">(Simular Avulso ou escolha Lead)</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} - Orçamento ({l.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })})
                    </option>
                  ))}
                </select>
              </div>

              {/* Valor do imóvel */}
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-zinc-700 uppercase font-mono">Valor Total do Imóvel (R$)</label>
                <input
                  type="number"
                  value={simPrice || ''}
                  onChange={(e) => setSimPrice(Number(e.target.value) || 0)}
                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm font-mono font-bold"
                />
              </div>

              {/* Enquadramento Credit Program Toggle */}
              <div className="space-y-1 select-none">
                <label className="block text-[11px] font-black text-zinc-700 uppercase font-mono">Enquadramento Linha de Crédito</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSimProgram('mcmv');
                      // Auto-adjust down payment for MCMV to standard 20%
                      setSimDownPayment(Math.round(simPrice * 0.20));
                      // Suggest standard Faixa 2 income if current is too high
                      if (simIncome > 8000) setSimIncome(4200);
                    }}
                    className={`p-2.5 rounded-xl text-[10px] font-black uppercase text-center border-2 transition ${
                      simProgram === 'mcmv' 
                        ? 'bg-indigo-600 text-white border-zinc-950 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]' 
                        : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-300 text-zinc-500'
                    }`}
                  >
                    🏠 MCMV (Habitacional)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimProgram('sbpe');
                      if (simIncome < 8000) setSimIncome(12000);
                    }}
                    className={`p-2.5 rounded-xl text-[10px] font-black uppercase text-center border-2 transition ${
                      simProgram === 'sbpe' 
                        ? 'bg-indigo-600 text-white border-zinc-950 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]' 
                        : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-300 text-zinc-500'
                    }`}
                  >
                    🏢 SBPE (Médio/Alto)
                  </button>
                </div>
              </div>

              {/* Caixa MCMV Auxiliares Subsidies Checkbox Grid */}
              {simProgram === 'mcmv' && (
                <div className="p-3 bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-2xl space-y-2 select-none animate-fadeIn">
                  <span className="block text-[9px] font-black tracking-wider uppercase font-mono text-indigo-950">Fatores Relevantes CAIXA Federal</span>
                  
                  <div className="space-y-1.5 text-[11px] text-zinc-950 font-bold">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={simHasDependents}
                        onChange={(e) => setSimHasDependents(e.target.checked)}
                        className="accent-indigo-600 rounded h-3.5 w-3.5"
                      />
                      <span>Possui Dependentes (Aumenta subsídio!)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={simHasFgtsReduction}
                        onChange={(e) => setSimHasFgtsReduction(e.target.checked)}
                        className="accent-indigo-600 rounded h-3.5 w-3.5"
                      />
                      <span>Redutor Conta Ativa FGTS (-0.5% taxa)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={simHasStateSubsidy}
                        onChange={(e) => setSimHasStateSubsidy(e.target.checked)}
                        className="accent-indigo-600 rounded h-3.5 w-3.5"
                      />
                      <span className="text-zinc-900 font-extrabold">Cheque Moradia Paulista (+ R$13k Subsídio SP)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Entrada */}
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-zinc-700 uppercase font-mono">Valor da Entrada de Recursos (R$)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={simDownPayment || ''}
                    onChange={(e) => setSimDownPayment(Number(e.target.value) || 0)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm font-mono font-bold"
                  />
                  <span className="absolute right-3 top-3 text-[10px] font-mono text-zinc-400 font-extrabold">
                    {simPrice > 0 ? ((simDownPayment / simPrice) * 100).toFixed(1) : 0}% do total
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Anos */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-zinc-700 uppercase font-mono">Prazo (Anos)</label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={simYears}
                    onChange={(e) => setSimYears(Number(e.target.value) || 30)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm font-bold"
                  />
                </div>

                {/* Renda */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-zinc-700 uppercase font-mono">Renda Familiar Bruta (R$)</label>
                  <input
                    type="number"
                    value={simIncome || ''}
                    onChange={(e) => setSimIncome(Number(e.target.value) || 0)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl text-xs leading-relaxed text-indigo-950">
                <span className="font-bold flex items-center gap-1 mb-1 font-mono uppercase text-[9px]">
                  <Info className="w-4 h-4 text-indigo-700 shrink-0" />
                  Diretrizes CEF, MCMV & SBPE
                </span>
                <p className="font-semibold text-zinc-750">
                  De acordo com as normas da Caixa Econômica, a prestação mensal simulada não deve comprometer mais que <strong>30%</strong> de sua renda familiar mensal bruta.
                </p>
              </div>
            </div>

            {/* Simulated Comparison results */}
            <div className="lg:col-span-7 space-y-5 border-t lg:border-t-0 lg:border-l pt-5 lg:pt-0 lg:pl-6">
              <div className="flex justify-between items-center pb-3 border-b">
                <div>
                  <h3 className="text-sm font-black text-zinc-950 uppercase italic tracking-tight">2. Análise de Viabilidade Bancária</h3>
                  <p className="text-xs text-zinc-500 font-medium">Bancos listados e comparados sob a taxa média atual no Brasil.</p>
                </div>
                {selectedLeadForSim && (
                  <span className="text-[10px] bg-indigo-150 border border-indigo-400 text-indigo-950 font-mono font-black rounded px-2.5 py-1">
                    Lead: {selectedLeadForSim.name}
                  </span>
                )}
              </div>

              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {simulatedBanks.map(bank => {
                  return (
                    <div 
                      key={bank.name} 
                      className={`border-4 border-zinc-950 rounded-2xl p-4 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] ${
                        !bank.isViableIncome || bank.exceedsMaxLimit ? 'bg-zinc-50 border-zinc-350 opacity-80' : 'bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-sans font-black text-sm text-zinc-950 uppercase">{bank.name}</h4>
                          <span className="text-[10px] font-mono font-black text-zinc-500 uppercase">
                            Amortização: {bank.style} • Taxa: {(bank.rate * 100).toFixed(2)}% a.a.
                          </span>
                        </div>

                        {!bank.isViableIncome ? (
                          <span className="text-[9px] uppercase font-mono font-black bg-rose-100 border border-rose-500 text-rose-700 px-2.5 py-0.5 rounded-full">
                            Renda Insuficiente ({(bank.installmentToIncomeRatio).toFixed(0)}%)
                          </span>
                        ) : bank.exceedsMaxLimit ? (
                          <span className="text-[9px] uppercase font-mono font-black bg-amber-100 border border-amber-500 text-amber-700 px-2.5 py-0.5 rounded-full">
                            Entrada Baixa (&lt;{(100 - bank.maxFinancingPct*100)}%)
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase font-mono font-black bg-emerald-100 border border-emerald-500 text-emerald-800 px-2.5 py-0.5 rounded-full animate-pulse">
                            Excelente Viabilidade
                          </span>
                        )}
                      </div>

                      {/* Financial info items */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 p-2.5 border rounded-xl mt-3 text-center">
                        <div>
                          <span className="block text-[8px] uppercase font-mono text-zinc-400 font-bold">Valor Financiado</span>
                          <span className="text-xs font-mono font-black text-zinc-900">
                            {bank.financedAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] uppercase font-mono text-zinc-400 font-bold">Parcela Mensal</span>
                          <span className="text-xs font-mono font-black text-indigo-755">
                            {bank.initialInstallment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] uppercase font-mono text-zinc-400 font-bold">Total Juros (Acres)</span>
                          <span className="text-xs font-mono font-black text-red-700">
                            {bank.totalInterest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] uppercase font-mono text-zinc-400 font-bold">Custo Total Global</span>
                          <span className="text-xs font-mono font-black text-zinc-950">
                            {bank.totalFinanced.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>

                      {/* Subsídio real-time dynamic calculations showcase */}
                      {bank.subsidy > 0 && (
                        <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-250 text-emerald-900 rounded-xl flex items-center justify-between text-[10px] select-none animate-fadeIn">
                          <div className="space-y-0.5">
                            <span className="font-black tracking-widest uppercase font-mono text-[8.5px] text-emerald-700 block">✓ Subvenções faturadas</span>
                            <span className="font-bold">Subsídio Habitacional Federal CAIXA + Estímulo SP</span>
                          </div>
                          <span className="font-mono font-black border border-emerald-400 bg-emerald-100 text-emerald-950 px-2.5 py-1 rounded shadow-[1px_1px_0px_0px_rgba(16,185,129,0.4)] text-[11px] shrink-0">
                            + {bank.subsidy.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      )}

                      {/* Small recommendations notes */}
                      {bank.isViableIncome && !bank.exceedsMaxLimit && (
                        <p className="text-[10px] text-zinc-500 font-medium mt-2 leading-snug">
                          ✔️ Comprometimento de <strong>{bank.installmentToIncomeRatio.toFixed(1)}%</strong> da renda familiar. Prazo regulamentar de {bank.financedAmount > 0 ? simYears * 12 : 0} meses.
                        </p>
                      )}

                      {/* PDF Proposta Export Button */}
                      {bank.financedAmount > 0 && bank.isViableIncome && !bank.exceedsMaxLimit && (
                        <div className="mt-3 pt-2.5 border-t border-dashed border-zinc-250 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBankName(bank.name);
                              setIsPdfModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white border-2 border-zinc-950 rounded-lg text-[10px] uppercase font-extrabold tracking-wider transition shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-yellow-400" />
                            <span>Contrato / Proposta PDF</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
      )}

      {/* RENDER TAB 3: BULK IMPORTER & EXPORTER SPREADSHEET */}
      {activeSubTab === 'importador' && (
        <div className="space-y-6">
          
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-zinc-900 space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono font-black text-emerald-600 block">Grade de Integração de Imóveis e Lotes</span>
                <h3 className="text-md font-black italic uppercase tracking-tight text-zinc-950">Importador & Exportador de Estoque Comercial (.csv / Excel)</h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">Cadastre múltiplos imóveis, casas e apartamentos colando as linhas de sua planilha profissional diretamente abaixo.</p>
              </div>

              {/* Hardcoded indicator target as requested to keep stock organized */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 text-emerald-950 border border-emerald-300 font-mono text-[10px] font-black select-none">
                <span>🏠 Destino: Estoque de Imóveis</span>
              </div>
            </div>

            {/* PDF Construtora Stock Integration Panel */}
            <div className="p-5 bg-indigo-50 border-4 border-zinc-950 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-left animate-fadeIn">
              <div className="space-y-1 md:max-w-xl">
                <span className="px-2 py-0.5 rounded bg-indigo-500 text-white font-mono text-[8px] font-black uppercase tracking-wider">
                  📋 Catálogo Construtora PDF
                </span>
                <h4 className="text-sm font-black text-zinc-950 uppercase font-mono leading-tight">
                  Tabela de Estoque Pronta Extraída do PDF ({pdfProperties.length} Apartamentos & Unidades)
                </h4>
                <p className="text-[11px] text-indigo-950 leading-relaxed font-sans font-semibold">
                  O assistente detectou as tabelas de empreendimentos credenciados cycleCRED (Cury, Mérito e Dez). Deseja injetá-las em lote no seu acervo de vendas com preços atualizados?
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onAddBulkProperties(pdfProperties);
                  alert(`📥 Sincronizado! ${pdfProperties.length} unidades do PDF da construtora foram importadas com sucesso ao catálogo universal cicloCRED.`);
                }}
                className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-[10px] uppercase rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer shrink-0 transition"
              >
                Carregar {pdfProperties.length} Unidades do PDF
              </button>
            </div>

            {/* Real File Drag & Drop Zone */}
            <div 
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFile(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  handleFileImport(file);
                }
              }}
              className={`border-4 border-dashed rounded-2xl p-6 text-center transition-all select-none flex flex-col items-center justify-center gap-2 ${
                isDraggingFile 
                  ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]' 
                  : 'border-zinc-300 bg-zinc-50 hover:bg-zinc-100/60'
              }`}
            >
              <Upload className={`w-8 h-8 ${isDraggingFile ? 'text-indigo-600' : 'text-zinc-400'}`} />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase font-mono text-zinc-950">
                  Arrastar e Soltar arquivo Planilha (.csv, .txt, .tsv) aqui
                </p>
                <p className="text-[10px] text-zinc-500 font-bold">
                  Ou clique abaixo para selecionar o arquivo local do seu computador
                </p>
              </div>
              
              <label className="mt-2 px-3 py-1.5 bg-white border border-zinc-950 rounded-lg text-[10px] font-black uppercase cursor-pointer hover:bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                Selecionar Arquivo
                <input 
                  type="file" 
                  accept=".csv,.txt,.tsv" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileImport(file);
                    }
                  }} 
                />
              </label>
              
              {importedFileName && (
                <span className="text-[10px] font-mono font-black text-indigo-800 uppercase bg-indigo-100 px-2 py-0.5 rounded">
                  📄 Carregado: {importedFileName}
                </span>
              )}
            </div>

            {/* Paste panel input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-black text-zinc-700 uppercase font-mono">
                <span>Cole os Dados da Planilha (Colunas Separadas por Tab/Espaço)</span>
                <span className="text-[10px] text-zinc-400 font-bold lowercase">Cole linhas inteiras incluindo cabeçalhos!</span>
              </div>

              <textarea
                rows={5}
                value={rawPasteData}
                onChange={(e) => setRawPasteData(e.target.value)}
                placeholder={
                  importTarget === 'leads'
                    ? "Exemplo de colunas (Copie do Excel/Sheets e cole aqui):\nNome\tEmail\tTelefone\tOrçamento\tEmpresa\tCanal\tNotas\nOtavio Alexandre\totavio@exemplo.com\t(11) 98765-4321\t550000\tcicloCRED\tEmail Direct\tInteressado em apartamento de 3 dormitórios."
                    : "Exemplo de colunas imobiliárias:\nTítulo\tTipo\tPreço\tQuartos\tBairro\tDescrição\tÁrea\nApartamento Pinheiros\tapartamento\t680000\t2\tPinheiros\tExcelente lazer residencial\t68"
                }
                className="w-full bg-zinc-50 border-4 border-dashed border-zinc-300 rounded-2xl p-4 text-xs font-mono outline-none focus:border-zinc-950 focus:bg-white leading-relaxed"
              />

              <div className="flex gap-3 justify-end select-none">
                <button
                  onClick={handleParsePaste}
                  disabled={!rawPasteData.trim()}
                  className="px-5 py-3 bg-zinc-90 w-auto text-xs font-black uppercase tracking-wider rounded-xl border-2 border-zinc-950 bg-zinc-900 text-white hover:bg-zinc-950 disabled:opacity-45"
                >
                  Analisar e Processar Planilha
                </button>
              </div>
            </div>

            {/* Error alerts */}
            {importErrors.length > 0 && (
              <div className="border border-red-200 bg-red-50 p-4 rounded-xl space-y-1.5 text-xs text-red-800 font-semibold font-mono">
                <span className="font-extrabold uppercase text-[10px] block">⚠️ Erros de Processamento Encontrados:</span>
                <ul className="list-disc pl-4 space-y-1">
                  {importErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                </ul>
              </div>
            )}

            {/* Preview Spreadsheet Mockup Grid */}
            {importPreview.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center text-xs font-black text-zinc-750 font-mono uppercase">
                  <span>Visualização para Aprovação ({importPreview.length} registros processados)</span>
                  <button
                    onClick={handleApplyBulkImport}
                    className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Confirmar Importação de {importPreview.length} itens
                  </button>
                </div>

                <div className="border border-zinc-300 rounded-xl overflow-x-auto max-h-[300px] shadow-sm font-mono text-zinc-805">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-305 text-zinc-500 uppercase font-black">
                        <th className="p-3">#</th>
                        <th className="p-3">Coluna {importTarget === 'leads' ? 'Name' : 'Título'}</th>
                        <th className="p-3">Coluna {importTarget === 'leads' ? 'Orçamento (Budget)' : 'Preço'}</th>
                        <th className="p-3">Coluna {importTarget === 'leads' ? 'Telefone / Local' : 'Tipo / Bairro'}</th>
                        <th className="p-3">Coluna {importTarget === 'leads' ? 'E-mail / Notas' : 'Memorial'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((item, idx) => (
                        <tr key={idx} className="border-b hover:bg-zinc-50 font-semibold text-zinc-900">
                          <td className="p-3 text-zinc-400 font-bold">{idx + 1}</td>
                          <td className="p-3 truncate max-w-[150px] font-black">{importTarget === 'leads' ? item.name : item.title}</td>
                          <td className="p-3 font-bold text-indigo-700">
                            {(importTarget === 'leads' ? item.value : item.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                          </td>
                          <td className="p-3">{importTarget === 'leads' ? item.phone : `${item.type.toUpperCase()} em ${item.neighborhood}`}</td>
                          <td className="p-3 truncate max-w-[200px] text-zinc-500">{importTarget === 'leads' ? item.notes : item.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {isImportSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-350 rounded-xl flex items-center gap-3.5 text-xs text-emerald-800 font-bold">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <p>Importação realizada com sucesso! Os registros foram acoplados aos bancos de dados internos do CRM ciclocred.</p>
              </div>
            )}

            {/* EXPORTS CARD SECTION */}
            <div className="pt-6 border-t space-y-4 select-none">
              <div>
                <h4 className="text-sm font-black text-zinc-950 uppercase italic">Fazer Download dos Bancos de Dados (Exportar)</h4>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">Baixe seus dados cadastrados de imóveis consolidados em formato CSV para carregar no Excel.</p>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => handleExportCSV('properties')}
                  className="flex items-center gap-2 p-3 bg-white border-2 border-zinc-950 rounded-xl text-xs font-black uppercase text-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50 transition"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Baixar Planilha de Imóveis (.csv)</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* RENDER TAB 4: CONNECTIVITY PORTAL (CURY METROPOLITAN SP & CAIXA INTEGRATOR) */}
      {activeSubTab === 'conectividade-disabled' && (
        <div className="space-y-6">
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-zinc-900 space-y-6 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono font-black text-indigo-600 block">Portal União de Vendas & Portfólio</span>
                <h3 className="text-md font-black italic uppercase tracking-tight text-zinc-950">Conectividade Cury Metropolitana SP & ciclocred</h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">Sincronize lançamentos imobiliários Cury com o banco de captações e conecte diretamente com a esteira do programa Minha Casa Minha Vida (MCMV) e SBPE.</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-950 border-2 border-zinc-950 px-3 py-1.5 rounded-xl font-mono font-black select-none uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                  INTEGRAÇÃO ATIVA
                </span>
              </div>
            </div>

            {/* Sync Controls & Metadata Info */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Left Column: Sync Logs & Control Buttons */}
              <div className="md:col-span-4 bg-zinc-50 border-4 border-zinc-950 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase text-zinc-700 tracking-wider font-mono">Painel de Sincronização Estação Cury</span>
                  </div>
                  
                  <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
                    A cicloCRED atualiza a cada 30 segundos os índices e disponibilidades dos empreendimentos Cury em São Paulo, Guarulhos, ABC e região metropolitana.
                  </p>

                  {/* Programmatic log display */}
                  <div className="bg-zinc-900 text-emerald-400 font-mono text-[9px] p-3 rounded-xl space-y-1.5 h-36 overflow-y-auto border border-zinc-950 leading-relaxed">
                    {curySyncLog.map((log, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-zinc-500 font-bold shrink-0">[{log.time}]</span>
                        <span className="font-medium text-emerald-350">{log.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-300 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                      const newLog = {
                        time: timeStr,
                        text: `Ciclo de verificação concluído. ${properties.length} imóveis no estoque cicloCRED sincronizados com o banco Cury.`
                      };
                      setCurySyncLog(prev => [newLog, ...prev]);
                    }}
                    className="w-full text-center px-3 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white border-2 border-zinc-950 rounded-xl font-mono text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition active:translate-y-0.5 cursor-pointer"
                  >
                    🔄 Recalcular Matches Agora
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCurySyncActive(!isCurySyncActive);
                      const now = new Date();
                      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                      const newLog = {
                        time: timeStr,
                        text: isCurySyncActive ? 'Sincronização contínua PAUSADA pelo usuário.' : 'Sincronização contínua REATIVADA.'
                      };
                      setCurySyncLog(prev => [newLog, ...prev]);
                    }}
                    className={`w-full text-center px-3 py-2 text-zinc-950 border-2 border-zinc-950 rounded-xl font-mono text-[10px] font-black uppercase transition ${isCurySyncActive ? 'bg-amber-100 hover:bg-amber-200' : 'bg-emerald-100 hover:bg-emerald-200'}`}
                  >
                    {isCurySyncActive ? '⏸️ Pausar Integração Cury' : '▶️ Reativar Integração Cury'}
                  </button>
                </div>
              </div>

              {/* Right Column: Key Cury Developments Metropolitan Area (Sao Paulo) */}
              <div className="md:col-span-8 space-y-4">
                <div className="flex justify-between items-center select-none">
                  <span className="text-[11px] font-black uppercase tracking-wider font-mono text-indigo-950 font-extrabold">🏡 Lançamentos Cury em Destaque (Metropolitana SP)</span>
                  <span className="text-[10px] font-bold text-zinc-500">Filtro: Minha Casa Minha Vida (MCMV) e SBPE</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dev 1 */}
                  <div className="bg-white border-4 border-zinc-950 p-4 rounded-2xl shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[8px] bg-zinc-900 text-white font-mono px-2 py-0.5 rounded font-black uppercase">MCMV Faixa 1/2</span>
                        <span className="text-[8px] bg-red-100 border border-red-350 text-red-800 font-black px-2 py-0.5 rounded-full uppercase">ZONA LESTE SP</span>
                      </div>
                      <h4 className="text-xs font-black uppercase mt-1.5 text-zinc-950 font-bold">Cury Dez Metro Itaquera</h4>
                      <p className="text-[10px] text-zinc-500 font-bold mt-1">Av. José Pinheiro Borges, Itaquera - São Paulo</p>
                      
                      <div className="mt-2 text-[10px] space-y-1 text-zinc-700 font-bold">
                        <div className="flex justify-between border-b border-zinc-150 pb-0.5">
                          <span>Teto para Cálculo (HIS 1):</span>
                          <span className="text-zinc-950 font-black">R$ 275.000,00</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-150 pb-0.5">
                          <span>Instalações / Tipologia:</span>
                          <span className="text-zinc-950 font-black font-semibold">Apartamento 2D c/ Varanda e Lazer</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subsídio SP Paulista:</span>
                          <span className="text-emerald-750 font-black">Elegível (R$ 13.000,00)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-dashed border-zinc-200">
                      <button
                        type="button"
                        onClick={() => {
                          setSimPrice(275000);
                          setSimDownPayment(55000); // Faixa 1 standard
                          setSimIncome(2400);
                          setSimProgram('mcmv');
                          setSimHasStateSubsidy(true);
                          setActiveSubTab('simulador');
                        }}
                        className="flex-1 text-center py-2 bg-gradient-to-r from-indigo-700 to-indigo-900 hover:from-indigo-800 hover:to-indigo-950 text-white border-2 border-zinc-950 rounded-lg font-mono text-[9px] font-black uppercase cursor-pointer"
                      >
                        🧮 Simular na CEF
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                          const newLog = {
                            time: timeStr,
                            text: "Match realizado! Sete (7) leads cicloCRED possuem fit de orçamento para Cury Dez Metro Itaquera."
                          };
                          setCurySyncLog(prev => [newLog, ...prev]);
                        }}
                        className="p-2 border border-zinc-950 rounded-lg hover:bg-zinc-50 text-zinc-950 font-mono text-[9px] font-black uppercase cursor-pointer"
                      >
                        🤝 Matches
                      </button>
                    </div>
                  </div>

                  {/* Dev 2 */}
                  <div className="bg-white border-4 border-zinc-950 p-4 rounded-2xl shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[8px] bg-zinc-900 text-white font-mono px-2 py-0.5 rounded font-black uppercase">MCMV Faixa 2/3</span>
                        <span className="text-[8px] bg-blue-100 border border-blue-350 text-blue-800 font-black px-2 py-0.5 rounded-full uppercase">GUARULHOS SP</span>
                      </div>
                      <h4 className="text-xs font-black uppercase mt-1.5 text-zinc-950 font-bold">Cury Dez Guarulhos Centro</h4>
                      <p className="text-[10px] text-zinc-500 font-bold mt-1">Av. Tiradentes, Guarulhos - SP</p>
                      
                      <div className="mt-2 text-[10px] space-y-1 text-zinc-700 font-bold">
                        <div className="flex justify-between border-b border-zinc-150 pb-0.5">
                          <span>Teto para Cálculo (HIS/SBPE):</span>
                          <span className="text-zinc-950 font-black">R$ 400.000,00</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-150 pb-0.5">
                          <span>Instalações / Tipologia:</span>
                          <span className="text-zinc-950 font-black font-semibold">Apartamento 2D c/ Varanda e Suíte</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subsídio SP Paulista:</span>
                          <span className="text-zinc-500 font-black">Não Elegível (Excede Renda)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-dashed border-zinc-200">
                      <button
                        type="button"
                        onClick={() => {
                          setSimPrice(400000);
                          setSimDownPayment(80000); // 20% down
                          setSimIncome(6250);
                          setSimProgram('mcmv');
                          setSimHasStateSubsidy(false);
                          setActiveSubTab('simulador');
                        }}
                        className="flex-1 text-center py-2 bg-gradient-to-r from-indigo-700 to-indigo-900 hover:from-indigo-800 hover:to-indigo-950 text-white border-2 border-zinc-950 rounded-lg font-mono text-[9px] font-black uppercase cursor-pointer"
                      >
                        🧮 Simular na CEF
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                          const newLog = {
                            time: timeStr,
                            text: "Match realizado! Doze (12) leads cicloCRED possuem fit de orçamento para Cury Dez Guarulhos Centro."
                          };
                          setCurySyncLog(prev => [newLog, ...prev]);
                        }}
                        className="p-2 border border-zinc-950 rounded-lg hover:bg-zinc-50 text-zinc-950 font-mono text-[9px] font-black uppercase cursor-pointer"
                      >
                        🤝 Matches
                      </button>
                    </div>
                  </div>

                  {/* Dev 3 */}
                  <div className="bg-white border-4 border-zinc-950 p-4 rounded-2xl shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[8px] bg-zinc-900 text-white font-mono px-2 py-0.5 rounded font-black uppercase">MCMV/SBPE SBPE</span>
                        <span className="text-[8px] bg-amber-100 border border-amber-350 text-amber-800 font-black px-2 py-0.5 rounded-full uppercase">ABC PAULISTA</span>
                      </div>
                      <h4 className="text-xs font-black uppercase mt-1.5 text-zinc-950 font-bold">Cury Único Santo André</h4>
                      <p className="text-[10px] text-zinc-500 font-bold mt-1">Rua Giovanni Battista Pirelli, Santo André - SP</p>
                      
                      <div className="mt-2 text-[10px] space-y-1 text-zinc-700 font-bold">
                        <div className="flex justify-between border-b border-zinc-150 pb-0.5">
                          <span>Teto para Cálculo (SBPE):</span>
                          <span className="text-zinc-950 font-black">R$ 400.000,00</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-150 pb-0.5">
                          <span>Instalações / Tipologia:</span>
                          <span className="text-zinc-950 font-black font-semibold">Apartamento 2D ou 3D c/ Varanda</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subsídio SP Paulista:</span>
                          <span className="text-zinc-500 font-black">Inativo</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-dashed border-zinc-200">
                      <button
                        type="button"
                        onClick={() => {
                          setSimPrice(400000);
                          setSimDownPayment(80000);
                          setSimIncome(8500);
                          setSimProgram('sbpe');
                          setSimHasStateSubsidy(false);
                          setActiveSubTab('simulador');
                        }}
                        className="flex-1 text-center py-2 bg-gradient-to-r from-indigo-700 to-indigo-900 hover:from-indigo-800 hover:to-indigo-950 text-white border-2 border-zinc-950 rounded-lg font-mono text-[9px] font-black uppercase cursor-pointer"
                      >
                        🧮 Simular na CEF
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                          const newLog = {
                            time: timeStr,
                            text: "Match realizado! Dezenove (19) leads cicloCRED possuem fit de orçamento para Cury Único Santo André."
                          };
                          setCurySyncLog(prev => [newLog, ...prev]);
                        }}
                        className="p-2 border border-zinc-950 rounded-lg hover:bg-zinc-50 text-zinc-950 font-mono text-[9px] font-black uppercase cursor-pointer"
                      >
                        🤝 Matches
                      </button>
                    </div>
                  </div>

                  {/* Dev 4 */}
                  <div className="bg-white border-4 border-zinc-950 p-4 rounded-2xl shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[8px] bg-zinc-900 text-white font-mono px-2 py-0.5 rounded font-black uppercase">SBPE Médio-Alto</span>
                        <span className="text-[8px] bg-purple-100 border border-purple-350 text-purple-800 font-black px-2 py-0.5 rounded-full uppercase">PINHEIROS SP</span>
                      </div>
                      <h4 className="text-xs font-black uppercase mt-1.5 text-zinc-950 font-bold font-black">Cury Elite Pinheiros</h4>
                      <p className="text-[10px] text-zinc-500 font-bold mt-1">Rua Cardeal Arcoverde, Pinheiros - São Paulo</p>
                      
                      <div className="mt-2 text-[10px] space-y-1 text-zinc-700 font-bold">
                        <div className="flex justify-between border-b border-zinc-150 pb-0.5">
                          <span>Teto para Cálculo (SBPE):</span>
                          <span className="text-zinc-950 font-black font-mono">R$ 750.000,00</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-150 pb-0.5">
                          <span>Instalações / Tipologia:</span>
                          <span className="text-zinc-950 font-black font-semibold">Apartamento Studio c/ Lazer Rooftop</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subsídio SP Paulista:</span>
                          <span className="text-zinc-500 font-black">Inativo</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-dashed border-zinc-200">
                      <button
                        type="button"
                        onClick={() => {
                          setSimPrice(750000);
                          setSimDownPayment(150000); // 20% down
                          setSimIncome(16000);
                          setSimProgram('sbpe');
                          setSimHasStateSubsidy(false);
                          setActiveSubTab('simulador');
                        }}
                        className="flex-1 text-center py-2 bg-gradient-to-r from-indigo-700 to-indigo-900 hover:from-indigo-800 hover:to-indigo-950 text-white border-2 border-zinc-950 rounded-lg font-mono text-[9px] font-black uppercase cursor-pointer"
                      >
                        🧮 Simular na CEF
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                          const newLog = {
                            time: timeStr,
                            text: "Match realizado! Vinte e quatro (24) leads cicloCRED possuem fit de orçamento para Cury Elite Pinheiros."
                          };
                          setCurySyncLog(prev => [newLog, ...prev]);
                        }}
                        className="p-2 border border-zinc-950 rounded-lg hover:bg-zinc-50 text-zinc-950 font-mono text-[9px] font-black uppercase cursor-pointer"
                      >
                        🤝 Matches
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 5. PDF EXPORT PROPOSAL MODAL */}
      <AnimatePresence>
        {isPdfModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-zinc-100 border-4 border-zinc-950 p-6 rounded-3xl max-w-4xl w-full shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 text-zinc-900"
            >
              {/* Controls Header */}
              <div className="flex justify-between items-center pb-3 border-b-2 border-zinc-200">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2 bg-emerald-100 border-2 border-zinc-950 text-emerald-800 text-[10px] font-black uppercase rounded shadow font-mono">PDF PRONTO</span>
                  <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950 font-mono">Visualização da Proposta cicloCRED</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-zinc-950 text-xs font-black uppercase rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition cursor-pointer"
                  >
                    🖨️ Imprimir / Salvar PDF
                  </button>
                  <button
                    onClick={() => setIsPdfModalOpen(false)}
                    className="px-3 py-2 bg-zinc-200 hover:bg-zinc-350 text-zinc-800 border-2 border-zinc-950 text-xs font-black uppercase rounded-xl transition cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              {/* Document block with high-contrast paper layout */}
              <div 
                id="printable-proposal" 
                className="bg-white border-4 border-zinc-950 p-8 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-sans space-y-6 text-zinc-950 relative overflow-hidden"
              >
                {/* Simulated Stamp / Seal */}
                <div className="absolute top-2.5 right-6 opacity-15 pointer-events-none select-none border-4 border-indigo-755 p-2 uppercase font-mono font-black border-dashed rounded text-indigo-755 text-center text-[10px] scale-125 rotate-12">
                  <span>Aprovação Garantida</span><br />
                  <span className="text-sm">cicloCRED</span>
                </div>

                {/* Corporate Header */}
                <div className="flex justify-between items-start border-b-4 border-zinc-950 pb-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-black bg-indigo-950 text-indigo-200 px-2 py-0.5 rounded uppercase">CRÉDITO IMOBILIÁRIO</span>
                    <h1 className="text-2xl font-black italic tracking-tighter uppercase text-zinc-950">cicloCRED</h1>
                    <p className="text-[10px] text-zinc-500 font-mono font-bold">SOLUÇÕES FINANCEIRAS & CRÉDITO MULTIBANCOS LTDA</p>
                  </div>
                  <div className="text-right font-mono text-[10px] space-y-1 font-bold text-zinc-500">
                    <p className="font-black text-indigo-700">AÇÃO DE FINANCIAMENTO PRELIMINAR</p>
                    <p>Protocolo: <span className="font-black text-zinc-950">SIM-{Date.now().toString().slice(-7)}</span></p>
                    <p>Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                    <p>Assessor: {leads.find(l => l.id === simSelectedLeadId)?.origin || 'CRM cicloCRED'}</p>
                  </div>
                </div>

                {/* Part 1: Client details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-black uppercase text-zinc-900 tracking-wider">I. DADOS DO PROPONENTE (LEAD)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 p-3.5 border border-zinc-950 rounded-xl font-mono text-[11px] font-bold">
                    <div>
                      <span className="block text-zinc-400 text-[8px] uppercase">Nome do Cliente</span>
                      <span className="text-zinc-950 uppercase">{selectedLeadForSim?.name || 'SIMULAÇÃO AVULSA'}</span>
                    </div>
                    <div>
                      <span className="block text-zinc-400 text-[8px] uppercase">E-mail Cadastrado</span>
                      <span className="text-zinc-950 lowercase">{selectedLeadForSim?.email || 'contato@ciclocred.com.br'}</span>
                    </div>
                    <div>
                      <span className="block text-zinc-400 text-[8px] uppercase">Celular / WhatsApp</span>
                      <span className="text-zinc-950">{selectedLeadForSim?.phone || '(11) 99999-9999'}</span>
                    </div>
                  </div>
                </div>

                {/* Part 2: Simulation values */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-black uppercase text-zinc-900 tracking-wider">II. PARÂMETROS DA OPERAÇÃO SIMULADA</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-zinc-50 border border-zinc-250 rounded-xl">
                      <span className="block text-[8px] uppercase font-mono text-zinc-500 font-black">Valor do Imóvel</span>
                      <span className="text-xs font-mono font-black text-zinc-950">
                        {simPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="p-3 bg-zinc-50 border border-zinc-250 rounded-xl">
                      <span className="block text-[8px] uppercase font-mono text-zinc-500 font-black">Recursos Próprios (Entrada)</span>
                      <span className="text-xs font-mono font-black text-emerald-800">
                        {simDownPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="p-3 bg-indigo-50/60 border border-zinc-250 rounded-xl">
                      <span className="block text-[8px] uppercase font-mono text-indigo-900 font-black">Valor Financiado total</span>
                      <span className="text-xs font-mono font-black text-indigo-700">
                        {Math.max(0, simPrice - simDownPayment).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="p-3 bg-zinc-50 border border-zinc-250 rounded-xl">
                      <span className="block text-[8px] uppercase font-mono text-zinc-500 font-black">Prazo do Financiamento</span>
                      <span className="text-xs font-mono font-black text-zinc-950">{simYears} Anos ({simYears * 12} Meses)</span>
                    </div>
                  </div>
                </div>

                {/* Part 3: Bank offer Details */}
                {(() => {
                  const bInfo = simulatedBanks.find(b => b.name === selectedBankName) || simulatedBanks[0];
                  return (
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono font-black uppercase text-zinc-900 tracking-wider">III. DETALHAMENTO DA INSTITUIÇÃO PARCEIRA: {bInfo?.name.toUpperCase()}</h4>
                      <div className="border border-zinc-950 rounded-xl overflow-hidden font-mono text-xs font-bold leading-normal">
                        <div className="grid grid-cols-2 bg-indigo-950 text-white p-3 uppercase font-black text-[10px]">
                          <span>Variáveis</span>
                          <span className="text-right">Valores Estimados</span>
                        </div>
                        <div className="divide-y divide-zinc-250">
                          <div className="flex justify-between p-2.5">
                            <span className="text-zinc-500">Instituição Financeira Lançadora:</span>
                            <span>{bInfo?.name}</span>
                          </div>
                          <div className="flex justify-between p-2.5 bg-zinc-50/50">
                            <span className="text-zinc-500">Modalidade de Parcelas / Amortização:</span>
                            <span>{bInfo?.style === 'SAC' ? 'SAC (Sistema de Amortização Constante)' : 'PRICE (Tabela Price - Prestações Fixas)'}</span>
                          </div>
                          <div className="flex justify-between p-2.5">
                            <span className="text-zinc-500">Taxa de Juros Efetiva Contratada:</span>
                            <span>{((bInfo?.rate || 0) * 100).toFixed(2)}% a.a.</span>
                          </div>
                          <div className="flex justify-between p-2.5 bg-zinc-50/50 text-indigo-950 font-black">
                            <span>Primeira Prestação Mensal Estimada:</span>
                            <span>{(bInfo?.initialInstallment || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                          <div className="flex justify-between p-2.5">
                            <span className="text-zinc-500">Comprometimento de Renda Estimado:</span>
                            <span className={(bInfo?.installmentToIncomeRatio || 0) > 30 ? 'text-rose-700' : 'text-emerald-800'}>
                              {bInfo?.installmentToIncomeRatio.toFixed(1)}% ({(bInfo?.installmentToIncomeRatio || 0) > 30 ? 'Comprometido' : 'Seguro dentro do SFH'})
                            </span>
                          </div>
                          <div className="flex justify-between p-2.5 bg-zinc-50/50 text-red-600 font-black">
                            <span>Custo Estimado de Juros Totais:</span>
                            <span>{(bInfo?.totalInterest || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                          <div className="flex justify-between p-2.5 text-zinc-950 font-black">
                            <span>Soma das Prestações Globais (Total a Pagar):</span>
                            <span>{(bInfo?.totalFinanced || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Part 4: Regulatory Disclaimers */}
                <div className="bg-zinc-50 border border-zinc-250 p-4 rounded-xl text-[10px] space-y-2 text-zinc-500 leading-relaxed">
                  <span className="font-extrabold block text-zinc-900 uppercase font-mono tracking-wider">Declaração de Isenção e Diretrizes Regulatórias</span>
                  <p>
                    1. Esta ficha de simulação representa uma estimativa calculada dinamicamente pelo CRM cicloCRED e não confere promessa implícita de crédito imobiliário definitivo por parte das instituições financeiras parceiras citadas. 
                  </p>
                  <p>
                    2. A concessão definitiva está vinculada à avaliação cadastral, validação de restrições em bureaus de crédito (SPC/Serasa) e laudo de avaliação física do imóvel a ser adquirido, em estrita conformidade com a regulamentação do Banco Central do Brasil.
                  </p>
                </div>

                {/* Sub signatures block */}
                <div className="grid grid-cols-2 gap-10 pt-10 font-mono text-[9px] text-zinc-400 font-bold divide-x border-t border-zinc-200">
                  <div className="text-center pt-8">
                    <p className="font-black text-zinc-900 uppercase">ASSESSORIA CICLOCRED</p>
                    <p>Departamento de Crédito & Crédito Imobiliário</p>
                    <p className="text-zinc-400 mt-1">Validação Digital Garantida no CRM</p>
                  </div>
                  <div className="text-center pt-8 pl-4">
                    <p className="font-black text-zinc-900 uppercase">PROPONENTE COMPRADOR</p>
                    <p>{selectedLeadForSim?.name ? selectedLeadForSim.name.toUpperCase() : 'DECLARANTE RESPONSÁVEL'}</p>
                    <p className="text-zinc-400 mt-1">Assinatura digital pendente de documentos</p>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. REAL ESTATE MEDIA BOOK & LOCAL SOCIAL SHARING CAMPAIGNS CENTRAL (MODAL) */}
      <AnimatePresence>
        {mediaModalOpen && selectedPropertyForMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white border-4 border-zinc-950 p-6 rounded-3xl max-w-4xl w-full shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 text-zinc-900"
            >
              {/* Header */}
              <div className="flex justify-between items-start pb-3 border-b-2 border-zinc-100 uppercase">
                <div>
                  <span className="text-[10px] font-mono font-black text-indigo-600 block">Central de Mídia e Divulgação</span>
                  <h3 className="text-xs font-black text-zinc-950">
                    {selectedPropertyForMedia.code} - {selectedPropertyForMedia.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMediaModalOpen(false);
                    setSelectedPropertyForMedia(null);
                  }}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-2 border-zinc-950 text-xs font-black uppercase rounded-xl transition cursor-pointer"
                >
                  Fechar Central
                </button>
              </div>

              {/* Subtabs for Modal */}
              <div className="flex border-2 border-zinc-950 p-1 bg-zinc-50 rounded-xl select-none text-[10px] font-mono font-black">
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('carousel')}
                  className={`flex-1 py-2 rounded-lg transition ${activeMediaTab === 'carousel' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}
                >
                  🎬 Carrossel & Book Estático
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('manage')}
                  className={`flex-1 py-2 rounded-lg transition ${activeMediaTab === 'manage' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}
                >
                  📸 Adicionar / Administrar Fotos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('share')}
                  className={`flex-1 py-2 rounded-lg transition ${activeMediaTab === 'share' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:bg-zinc-200'}`}
                >
                  📢 Campanhas e Redes Sociais
                </button>
              </div>

              {/* RENDER MODAL TAB 1: CAROUSEL & STATIC BOOK */}
              {activeMediaTab === 'carousel' && (
                <div className="space-y-4">
                  {/* Sliding Visual Carousel */}
                  <div className="relative h-64 bg-zinc-900 rounded-2xl overflow-hidden border-2 border-zinc-950 group">
                    {(() => {
                      const imgs = selectedPropertyForMedia.images && selectedPropertyForMedia.images.length > 0
                        ? selectedPropertyForMedia.images
                        : [selectedPropertyForMedia.imageUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600'];
                      
                      const currentImg = imgs[detailsCarouselIndex] || selectedPropertyForMedia.imageUrl;

                      return (
                        <>
                          <img
                            src={currentImg || undefined}
                            alt="Visual Book"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          
                          {/* Slide overlay tags */}
                          <div className="absolute top-3 left-3 bg-black/60 border border-zinc-700 text-white text-[9px] font-mono font-black rounded-lg px-2.5 py-1">
                            Foto {detailsCarouselIndex + 1} de {imgs.length}
                          </div>

                          {imgs.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={() => setDetailsCarouselIndex(p => (p - 1 + imgs.length) % imgs.length)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 bg-zinc-950/70 text-white w-9 h-9 rounded-full border border-zinc-700 transition flex items-center justify-center font-bold text-lg hover:bg-black"
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                onClick={() => setDetailsCarouselIndex(p => (p + 1) % imgs.length)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-zinc-950/70 text-white w-9 h-9 rounded-full border border-zinc-700 transition flex items-center justify-center font-bold text-lg hover:bg-black"
                              >
                                ›
                              </button>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Static Photo Book Grid (Widgets) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono font-black text-zinc-500 block">📖 Book de Mídias Estáticas & Widgets Técnicos</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(selectedPropertyForMedia.images || [selectedPropertyForMedia.imageUrl]).map((img, idx) => (
                        <div key={idx} className="bg-zinc-50 border-2 border-zinc-950 p-1.5 rounded-xl hover:bg-indigo-50/20 transition group">
                          <img src={img || undefined} className="aspect-video w-full object-cover rounded-lg border border-zinc-300" referrerPolicy="no-referrer" />
                          <div className="mt-1 flex justify-between items-center text-[8px] font-mono text-zinc-500">
                            <span>Widget #{idx + 1}</span>
                            <span className="text-indigo-900 font-extrabold uppercase">Estático</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER MODAL TAB 2: MANAGE AND EDIT PHOTOS (ADMINISTRAR FOTOS) */}
              {activeMediaTab === 'manage' && (
                <div className="space-y-4">
                  <div className="bg-indigo-50/50 border border-indigo-200 p-4 rounded-2xl space-y-3 shadow-inner">
                    <span className="text-xs font-black text-indigo-950 uppercase font-mono block">Adicionar Novas Fotos ao Acervo</span>
                    
                    {/* Drag and Drop and File Upload Picker Container */}
                    <div className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-2xl p-4 bg-white text-center cursor-pointer transition relative group flex flex-col items-center justify-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        onChange={(e) => {
                          if (e.target.files) {
                            const filesArray = Array.from(e.target.files);
                            filesArray.forEach((file) => {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  const base64Str = event.target.result as string;
                                  const currentImages = selectedPropertyForMedia.images || [selectedPropertyForMedia.imageUrl];
                                  if (!currentImages.includes(base64Str)) {
                                    const updatedImgArray = [...currentImages, base64Str];
                                    const updated = {
                                      ...selectedPropertyForMedia,
                                      images: updatedImgArray,
                                      imageUrl: selectedPropertyForMedia.imageUrl || base64Str
                                    };
                                    setSelectedPropertyForMedia(updated);
                                    onUpdateProperty?.(updated);
                                    setDetailsCarouselIndex(updatedImgArray.length - 1);
                                  }
                                }
                              };
                              reader.readAsDataURL(file as File);
                            });
                          }
                        }}
                      />
                      <Upload className="w-8 h-8 text-indigo-600 animate-bounce" />
                      <span className="text-xs font-black text-indigo-950 uppercase font-mono">
                        📂 Abrir Arquivos Locais / Arrastar Fotos
                      </span>
                      <span className="text-[9px] text-zinc-500 uppercase font-bold">
                        Clique aqui para carregar arquivos de imagem do seu computador e inseri-los no carrossel
                      </span>
                    </div>

                    {/* Quick premium presets */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[9px] uppercase font-mono font-black text-zinc-500">Presets de Arquitetura Rápida:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: 'Living Decor', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=600' },
                          { name: 'Cozinha Gourmet', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600' },
                          { name: 'Piscina Club', url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=600' }
                        ].map((presetItem, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              const currentImages = selectedPropertyForMedia.images || [selectedPropertyForMedia.imageUrl];
                              if (!currentImages.includes(presetItem.url)) {
                                const updatedImages = [...currentImages, presetItem.url];
                                const updatedProp = { ...selectedPropertyForMedia, images: updatedImages };
                                setSelectedPropertyForMedia(updatedProp);
                                onUpdateProperty?.(updatedProp);
                                setDetailsCarouselIndex(updatedImages.length - 1);
                              }
                            }}
                            className="px-2 py-1 bg-white hover:bg-zinc-50 border border-zinc-950 text-[9px] font-black uppercase rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
                          >
                            + {presetItem.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Link da imagem externa (.jpg, .png)..."
                        value={imageInput}
                        onChange={(e) => setImageInput(e.target.value)}
                        className="flex-1 bg-white border-2 border-zinc-950 rounded-xl p-2 md:p-2.5 text-xs font-mono font-semibold text-zinc-950"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (imageInput.trim()) {
                            const currentImages = selectedPropertyForMedia.images || [selectedPropertyForMedia.imageUrl];
                            const updatedImages = [...currentImages, imageInput.trim()];
                            const updatedProp = { ...selectedPropertyForMedia, images: updatedImages };
                            setSelectedPropertyForMedia(updatedProp);
                            onUpdateProperty?.(updatedProp);
                            setImageInput('');
                            setDetailsCarouselIndex(updatedImages.length - 1);
                          }
                        }}
                        className="px-4 py-2 bg-zinc-90 w-auto bg-zinc-900 border-2 border-zinc-950 text-white font-mono font-black text-xs uppercase rounded-xl hover:bg-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[10px]"
                      >
                        Vincular Link
                      </button>
                    </div>

                    {/* Manage and deletion layout */}
                    <div className="space-y-1.5 pt-2 border-t border-indigo-100">
                      <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 block">Listagem de Imagens Ativas (Clique para remover):</span>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {((selectedPropertyForMedia.images && selectedPropertyForMedia.images.length > 0)
                          ? selectedPropertyForMedia.images
                          : [selectedPropertyForMedia.imageUrl]).map((img, idx) => (
                            <div key={idx} className="relative aspect-video rounded-lg border-2 border-zinc-950 overflow-hidden group shadow shadow-sm">
                              <img src={img || undefined} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={() => {
                                  let currentImages = selectedPropertyForMedia.images || [selectedPropertyForMedia.imageUrl];
                                  if (currentImages.length <= 1) {
                                    alert("Você necessita manter ao menos 1 foto ativa!");
                                    return;
                                  }
                                  const updated = currentImages.filter((_, i) => i !== idx);
                                  const updatedProp = { ...selectedPropertyForMedia, images: updated, imageUrl: updated[0] };
                                  setSelectedPropertyForMedia(updatedProp);
                                  onUpdateProperty?.(updatedProp);
                                  setDetailsCarouselIndex(0);
                                }}
                                className="absolute inset-0 bg-red-600/90 text-white font-mono font-black text-[9px] uppercase transition flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                              >
                                Excluir
                              </button>
                            </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER MODAL TAB 3: LOCAL SOCIAL SHARE DISPATCHERS */}
              {activeMediaTab === 'share' && (
                <div className="space-y-4 text-zinc-900">
                  {/* Status update alert banner */}
                  {campaignStatusMessage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-indigo-600 border-2 border-zinc-950 p-3 rounded-xl text-white font-mono text-[10px] uppercase font-black tracking-wide flex items-center justify-between shadow-md"
                    >
                      <span>{campaignStatusMessage}</span>
                      <button type="button" onClick={() => setCampaignStatusMessage('')} className="text-white hover:text-zinc-200 font-bold ml-2 text-sm leading-none">×</button>
                    </motion.div>
                  )}

                  {/* Active Media & PDF Book Controller Header */}
                  <div className="bg-zinc-950 text-white p-4 rounded-3xl border-2 border-zinc-950 space-y-3.5 shadow-md">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      {/* Thumbnail of active selected item from carousel */}
                      <div className="relative w-32 aspect-video bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700 shrink-0 shadow-inner">
                        <img
                          src={
                            (selectedPropertyForMedia.images && selectedPropertyForMedia.images[detailsCarouselIndex]) || 
                            selectedPropertyForMedia.imageUrl || 
                            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600'
                          }
                          alt="Thumbnail Ativa"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-1 left-1 bg-black/80 text-[7px] font-mono px-1 rounded">
                          FOTO {detailsCarouselIndex + 1}
                        </div>
                      </div>

                      {/* Info & Core Shared Actions */}
                      <div className="flex-1 space-y-1 text-center md:text-left">
                        <span className="text-[9px] font-mono font-black text-indigo-400 uppercase tracking-widest block">Disparador de Campanha Ativo</span>
                        <h4 className="text-xs font-black uppercase text-zinc-100">{selectedPropertyForMedia.title}</h4>
                        <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                          Selecione o canal abaixo. Nós iremos copiar o roteiro comercial de alta conversão, copiar a imagem do carrossel para o seu Clipboard de imagens e baixá-la localmente. Ao abrir a rede social, basta colar (Ctrl+V ou toque longo) para compartilhar a legenda e a imagem integradas!
                        </p>
                      </div>
                    </div>

                    {/* Integrated System-level actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={async () => {
                          const activeUrl = (selectedPropertyForMedia.images && selectedPropertyForMedia.images[detailsCarouselIndex]) || selectedPropertyForMedia.imageUrl || '';
                          const captionText = `✨ ESPETACULAR: ${selectedPropertyForMedia.title} em ${selectedPropertyForMedia.neighborhood}!\n📐 Área útil de ${selectedPropertyForMedia.sizeSqm}m² com ${selectedPropertyForMedia.bedrooms} quartos.\n💰 Por apenas ${selectedPropertyForMedia.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Faça sua análise cicloCRED!`;
                          await shareNativelyWithFile(activeUrl, selectedPropertyForMedia.title, captionText);
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[9px] font-black uppercase rounded-xl transition cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-indigo-200" />
                        📲 Compartilhar Juntos (Nativo)
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const activeUrl = (selectedPropertyForMedia.images && selectedPropertyForMedia.images[detailsCarouselIndex]) || selectedPropertyForMedia.imageUrl || '';
                          setCampaignStatusMessage('⏳ Copiando imagem e baixando arquivo...');
                          const copied = await copyImageToClipboard(activeUrl);
                          downloadImageFile(activeUrl, `ciclocred_imovel_${selectedPropertyForMedia.code}.png`);
                          if (copied) {
                            setCampaignStatusMessage('✓ Imagem copiada no Clipboard para colar (Ctrl+V) e baixada com sucesso!');
                          } else {
                            setCampaignStatusMessage('✓ Imagem baixada! (Use o arquivo baixado para enviar na rede)');
                          }
                          setTimeout(() => setCampaignStatusMessage(''), 4000);
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-mono text-[9px] font-black uppercase rounded-xl transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-zinc-350" />
                        📥 Baixar Imagem Ativa
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrintCommercialBook(selectedPropertyForMedia)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[9px] font-black uppercase rounded-xl transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-200" />
                        📖 Imprimir Book Comercial (PDF)
                      </button>
                    </div>

                  </div>

                  {/* Matches campaign launcher engine */}
                  {(() => {
                    const matchingLeads = getMatchingLeadsForProperty(selectedPropertyForMedia);
                    return (
                      <div className="bg-indigo-50 border-2 border-indigo-950 p-5 rounded-3xl space-y-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-200">
                          <div>
                            <span className="text-[9px] uppercase font-mono font-black text-indigo-700">Abordagem Inteligente por Lote - cicloCRED Match</span>
                            <h4 className="text-xs font-black text-zinc-950 flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-indigo-650" />
                              <span>Disparar para Leads Compatíveis ({matchingLeads.length})</span>
                            </h4>
                          </div>
                          
                          {!isInventoryBatchDispatching && matchingLeads.length > 0 && (
                            <button
                              type="button"
                              onClick={() => startInventoryBatchDispatch(selectedPropertyForMedia)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-mono font-black text-[10px] uppercase rounded-xl border-2 border-zinc-950 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition"
                            >
                              🚀 Preparar Lote Matches (Sem Falsos Leads)
                            </button>
                          )}
                        </div>

                        {isInventoryBatchDispatching ? (
                          <div className="bg-zinc-950 text-zinc-100 p-4 rounded-2xl border-2 border-zinc-950 font-mono space-y-4 shadow">
                            <div className="flex justify-between items-center text-xs pb-1.5 border-b border-dashed border-zinc-800">
                              <span className="text-amber-400 font-black">LOTE ATIVO: {matchingLeads.length} LEADS QUALIFICADOS</span>
                              <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-900 px-2 py-0.5 rounded animate-pulse">TRANSMITINDO...</span>
                            </div>

                            {/* Mode Toggle Button Row */}
                            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono font-black uppercase text-center select-none bg-zinc-900 p-1 rounded-xl">
                              <button
                                type="button"
                                onClick={() => setInventoryBatchIsAssistedMode(true)}
                                className={`p-1.5 rounded-lg transition ${inventoryBatchIsAssistedMode ? 'bg-indigo-600 text-white font-black' : 'text-zinc-500 hover:bg-zinc-800'}`}
                              >
                                Modo Assistido (Enter ⏎)
                              </button>
                              <button
                                type="button"
                                onClick={() => setInventoryBatchIsAssistedMode(false)}
                                className={`p-1.5 rounded-lg transition ${!inventoryBatchIsAssistedMode ? 'bg-indigo-600 text-white font-black' : 'text-zinc-500 hover:bg-zinc-800'}`}
                              >
                                Modo Automático (Foco-Retorno)
                              </button>
                            </div>

                            {/* Local log display */}
                            <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 h-28 overflow-y-auto text-[10px] space-y-1.5 scrollbar-thin">
                              {inventoryBatchLog.map((log, index) => (
                                <div key={index} className="text-zinc-350">{log}</div>
                              ))}
                            </div>

                            {/* Active queue card block inside inventory campaign */}
                            {(() => {
                              const activeLead = matchingLeads[activeInventoryBatchIndex];
                              if (!activeLead) return null;

                              return (
                                <div className="bg-zinc-900 border border-indigo-500/50 p-3 rounded-xl space-y-3 animate-fadeIn">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="text-[9px] text-zinc-400 block font-bold leading-none">PRÓXIMO CONTATO EM LOTE</span>
                                      <span className="text-xs font-black text-white">{activeLead.name}</span>
                                    </div>
                                    {inventoryBatchCountdown > 0 ? (
                                      <span className="text-[10px] bg-indigo-950 text-indigo-350 border border-indigo-805 px-2 py-0.5 rounded font-black animate-pulse border-indigo-800">⏱️ {inventoryBatchCountdown}s</span>
                                    ) : (
                                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-805 px-2 py-0.5 rounded font-black animate-bounce border-emerald-800 text-emerald-300">🔥 PRONTO</span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => executeInventoryBatchItemDispatch(selectedPropertyForMedia, activeInventoryBatchIndex)}
                                    className={`w-full py-2.5 font-black text-[10px] uppercase rounded-lg border flex items-center justify-center gap-1.5 transition active:scale-95 ${
                                      inventoryBatchCountdown > 0
                                        ? 'bg-amber-500 border-amber-400 text-zinc-950 hover:bg-amber-600'
                                        : 'bg-emerald-500 border-emerald-400 text-white hover:bg-emerald-600 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                    }`}
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>{inventoryBatchCountdown > 0 ? `Abordar Cedo (${inventoryBatchCountdown}s)` : 'DISPARAR FICHA AGORA'}</span>
                                  </button>
                                </div>
                              );
                            })()}

                            {/* Batch progression progress bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] uppercase font-bold text-zinc-400">
                                <span>Progresso Geral:</span>
                                <span>{Math.floor(activeInventoryBatchIndex / matchingLeads.length * 100)}% ({activeInventoryBatchIndex} / {matchingLeads.length})</span>
                              </div>
                              <div className="w-full bg-zinc-900 border border-zinc-700 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-505 bg-indigo-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.floor(activeInventoryBatchIndex / matchingLeads.length * 100)}%` }}
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={stopInventoryBatchDispatch}
                              className="w-full text-center text-[10px] hover:text-rose-400 text-rose-500 font-bold uppercase py-1 border border-dashed border-zinc-800 rounded-lg hover:bg-zinc-900 transition"
                            >
                              Parar Envio
                            </button>
                          </div>
                        ) : (
                          matchingLeads.length === 0 ? (
                            <div className="bg-white/80 border border-zinc-200 rounded-2xl p-4 text-center">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">💡 DICA DE CAPTAÇÃO</span>
                              <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">Este imóvel não possui leads compatíveis na faixa elegível de budget (65% a 125% do valor do imóvel). Cadastre novos leads com perfil de crédito adequado para liberar disparos inteligentes focados!</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-zinc-800 max-h-40 overflow-y-auto bg-white/70 border border-indigo-200 p-3 rounded-2xl">
                              {matchingLeads.map(lead => (
                                <div key={lead.id} className="p-2 border border-zinc-100 bg-white rounded-lg flex justify-between items-center shrink-0">
                                  <div>
                                    <span className="font-bold text-zinc-900">{lead.name}</span>
                                    <span className="block text-[8px] text-zinc-500 font-mono">Budget: {lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                                  </div>
                                  <span className="text-[8.5px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded">Qualificado</span>
                                </div>
                              ))}
                            </div>
                          )
                        )}
                      </div>
                    );
                  })()}

                  {/* CHANNELS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Channel 1: WhatsApp */}
                    <div className="bg-emerald-50 border-2 border-emerald-950 p-4 rounded-2xl space-y-3 shadow-[2px_2px_0px_0px_rgba(16,185,129,0.3)] text-zinc-900">
                      <div className="flex justify-between items-center text-emerald-950">
                        <h4 className="text-xs font-black uppercase font-mono">💬 WhatsApp (Mensagem / Status)</h4>
                        <span className="text-[9px] bg-emerald-100 border border-emerald-400 px-2 py-0.5 rounded-full font-black uppercase text-emerald-800">Ativo</span>
                      </div>
                      
                      <p className="text-[10px] text-zinc-650 font-semibold leading-relaxed">
                        Envia a legenda estruturada, copia a foto selecionada para a área de transferência e baixa a imagem em lote para anexação perfeita na conversa!
                      </p>

                      <div className="space-y-2 pt-2 border-t border-emerald-200">
                        <button
                          type="button"
                          onClick={async () => {
                            const activeUrl = (selectedPropertyForMedia.images && selectedPropertyForMedia.images[detailsCarouselIndex]) || selectedPropertyForMedia.imageUrl || '';
                            const message = `✨ NOVIDADE NO ESTOQUE ✨\n\n📌 *${selectedPropertyForMedia.title}*\n📍 Localização: ${selectedPropertyForMedia.neighborhood}, ${selectedPropertyForMedia.location}\n📐 Área: ${selectedPropertyForMedia.sizeSqm}m²\n🛏️ Quartos: ${selectedPropertyForMedia.bedrooms} (${selectedPropertyForMedia.suites} suíte)\n\n💰 *Valor de Venda:* ${selectedPropertyForMedia.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}\n⚠️ _Simulações e financiamento facilitados pelo SFH._\n\nFale conosco e conquiste sua simulação aprovada instantaneamente!`;
                            
                            setCampaignStatusMessage('⏳ Preparando imagem e copiando legenda...');
                            const imgCopied = await copyImageToClipboard(activeUrl);
                            downloadImageFile(activeUrl, `ciclocred_imovel_${selectedPropertyForMedia.code}.png`);
                            
                            const encoded = encodeURIComponent(message);
                            window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
                            
                            if (imgCopied) {
                              setCampaignStatusMessage('✓ Legenda enviada! Imagem copiada no seu Clipboard, basta usar colar (Ctrl+V) no WhatsApp!');
                            } else {
                              setCampaignStatusMessage('✓ Imagem baixada! Anexe-a na mensagem do WhatsApp.');
                            }
                            setTimeout(() => setCampaignStatusMessage(''), 6000);
                          }}
                          className="w-full text-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-zinc-950 rounded-xl font-mono text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
                        >
                          🚀 Enviar Imagem + Legenda p/ Contato
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const activeUrl = (selectedPropertyForMedia.images && selectedPropertyForMedia.images[detailsCarouselIndex]) || selectedPropertyForMedia.imageUrl || '';
                            const statusText = `🏨 NOVO IMÓVEL EXCLUSIVO EM ${selectedPropertyForMedia.neighborhood.toUpperCase()}! 📐 ${selectedPropertyForMedia.sizeSqm}m² de puro requinte e lazer. Entrada facilitada via cicloCRED! Me chame p/ simular já!`;
                            
                            setCampaignStatusMessage('⏳ Baixando imagem de status...');
                            const imgCopied = await copyImageToClipboard(activeUrl);
                            downloadImageFile(activeUrl, `ciclocred_imovel_${selectedPropertyForMedia.code}.png`);
                            
                            navigator.clipboard.writeText(statusText);
                            window.open('https://web.whatsapp.com', '_blank');
                            
                            setCampaignStatusMessage('✓ Legenda para Status COPIADA! Imagem COPIADA e baixada.');
                            setTimeout(() => setCampaignStatusMessage(''), 5000);
                            alert("Texto copiado! Abra o WhatsApp, inicie a publicação do Status, selecione a foto baixada e cole a legenda.");
                          }}
                          className="w-full text-center px-3 py-2 bg-white hover:bg-emerald-50 border-2 border-emerald-350 rounded-xl font-mono text-[10px] font-bold uppercase transition cursor-pointer"
                        >
                          📋 Status WhatsApp: Baixar e Copiar Legenda
                        </button>
                      </div>
                    </div>

                    {/* Channel 2: Facebook */}
                    <div className="bg-blue-50 border-2 border-blue-950 p-4 rounded-2xl space-y-3 shadow-[2px_2px_0px_0px_rgba(59,130,246,0.3)] text-zinc-900">
                      <div className="flex justify-between items-center text-blue-950">
                        <h4 className="text-xs font-black uppercase font-mono">📘 Facebook (Post / Feed)</h4>
                        <span className="text-[9px] bg-blue-100 border border-blue-400 px-2 py-0.5 rounded-full font-black uppercase text-blue-800">Campanha</span>
                      </div>
                      
                      <p className="text-[10px] text-zinc-555 font-semibold leading-relaxed">
                        Ative anúncios orgânicos ou patrocinados. A foto selecionada será baixada para você carregar do acervo local e a legenda será copiada de modo inteligente.
                      </p>

                      <div className="space-y-2 pt-2 border-t border-blue-200">
                        <button
                          type="button"
                          onClick={async () => {
                            const activeUrl = (selectedPropertyForMedia.images && selectedPropertyForMedia.images[detailsCarouselIndex]) || selectedPropertyForMedia.imageUrl || '';
                            const postText = `🚨 OPORTUNIDADE ÚNICA: ${selectedPropertyForMedia.title}. Localizado em ${selectedPropertyForMedia.neighborhood}, oferecendo ${selectedPropertyForMedia.sizeSqm}m² por ${selectedPropertyForMedia.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Faça sua simulação com as menores taxas do mercado aqui na cicloCRED! #Imobiliaria #Apartamento #Investimento`;
                            
                            setCampaignStatusMessage('⏳ Preparando imagem e copiando anúncio...');
                            await copyImageToClipboard(activeUrl);
                            downloadImageFile(activeUrl, `ciclocred_imovel_${selectedPropertyForMedia.code}.png`);
                            
                            navigator.clipboard.writeText(postText);
                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(selectedPropertyForMedia.imageUrl || '')}`, '_blank');
                            
                            setCampaignStatusMessage('✓ Legenda copiada! Faça o upload da imagem recém-baixada no seu Feed do Facebook.');
                            setTimeout(() => setCampaignStatusMessage(''), 5000);
                          }}
                          className="w-full text-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white border-2 border-zinc-950 rounded-xl font-mono text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
                        >
                          🚀 Copiar Legenda + Baixar Foto e Postar
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const activeUrl = (selectedPropertyForMedia.images && selectedPropertyForMedia.images[detailsCarouselIndex]) || selectedPropertyForMedia.imageUrl || '';
                            const adText = `🏡 Quer morar em ${selectedPropertyForMedia.neighborhood}? Parcela estimada a partir do SFH! Fale agora mesmo com assessor cicloCRED para aprovar seu crédito.`;
                            
                            setCampaignStatusMessage('⏳ Copiando roteiro promocional...');
                            downloadImageFile(activeUrl, `ciclocred_imovel_${selectedPropertyForMedia.code}.png`);
                            navigator.clipboard.writeText(adText);
                            alert("Roteiro copiado! Abra o Facebook Story/Feed e cole a nova cópia comercial junto da foto baixada!");
                          }}
                          className="w-full text-center px-3 py-2 bg-white hover:bg-blue-50 border border-blue-300 rounded-xl font-mono text-[10px] font-bold uppercase transition cursor-pointer"
                        >
                          📋 Copiar Roteiro de Story/Reels
                        </button>
                      </div>
                    </div>

                    {/* Channel 3: Instagram */}
                    <div className="bg-rose-50 border-2 border-rose-950 p-4 rounded-2xl space-y-3 shadow-[2px_2px_0px_0px_rgba(244,63,94,0.3)] text-zinc-900">
                      <div className="flex justify-between items-center text-rose-950">
                        <h4 className="text-xs font-black uppercase font-mono">📸 Instagram (Story / Reels)</h4>
                        <span className="text-[9px] bg-rose-100 border border-rose-400 px-2 py-0.5 rounded-full font-black uppercase text-rose-800">Engajamento</span>
                      </div>
                      
                      <p className="text-[10px] text-zinc-555 font-semibold leading-relaxed">
                        Crie Stories memoráveis. A imagem do carrossel selecionada é copiada e baixada para o seu dispositivo para ser anexada diretamente no rolo de câmera.
                      </p>

                      <div className="space-y-2 pt-2 border-t border-rose-200">
                        <button
                          type="button"
                          onClick={async () => {
                            const activeUrl = (selectedPropertyForMedia.images && selectedPropertyForMedia.images[detailsCarouselIndex]) || selectedPropertyForMedia.imageUrl || '';
                            const script = `🎬 ROTEIRO REELS INSTAGRAM:\n\n[Cena 1 - Gancho]: Mostre a Fachada/Fotos internas do ${selectedPropertyForMedia.title}. "Você moraria aqui pagando menos que um aluguel?"\n\n[Cena 2 - Specs]: Passe pelo book de fotos. "São ${selectedPropertyForMedia.sizeSqm}m² com sacada gourmet integrada e lazer club!"\n\n[Cena 3 - CTA]: Mostre a logo cicloCRED. "Consigo aprovar seu financiamento total em 24h. Link na bio!"`;
                            
                            setCampaignStatusMessage('⏳ Baixando foto e copiando script...');
                            await copyImageToClipboard(activeUrl);
                            downloadImageFile(activeUrl, `ciclocred_imovel_${selectedPropertyForMedia.code}.png`);
                            
                            navigator.clipboard.writeText(script);
                            window.open('https://instagram.com', '_blank');
                            
                            setCampaignStatusMessage('✓ Roteiro profissional de Reels copiado! Anexe a foto baixada no aplicativo.');
                            setTimeout(() => setCampaignStatusMessage(''), 5000);
                          }}
                          className="w-full text-center px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white border-2 border-zinc-950 rounded-xl font-mono text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
                        >
                          🎥 Copiar Script de Reels + Baixar Foto
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            window.open('https://instagram.com', '_blank');
                          }}
                          className="w-full text-center px-3 py-2 bg-white hover:bg-rose-50 border-2 border-rose-350 rounded-xl font-mono text-[10px] font-bold uppercase transition cursor-pointer"
                        >
                          🌐 Abrir Instagram Web
                        </button>
                      </div>
                    </div>

                    {/* Channel 4: Gmail Propaganda */}
                    <div className="bg-red-50 border-2 border-red-950 p-4 rounded-2xl space-y-3 shadow-[2px_2px_0px_0px_rgba(239,68,68,0.3)] text-zinc-900">
                      <div className="flex justify-between items-center text-red-950">
                        <h4 className="text-xs font-black uppercase font-mono">✉️ Gmail (E-mail Propaganda)</h4>
                        <span className="text-[9px] bg-red-100 border border-red-400 px-2 py-0.5 rounded-full font-black uppercase text-red-800">E-mail Mkt</span>
                      </div>
                      
                      <p className="text-[10px] text-zinc-555 font-semibold leading-relaxed">
                        Envie uma propaganda direcionada com foto, especificações do imóvel e proposta de correspondência cicloCRED.
                      </p>

                      <div className="space-y-2 pt-2 border-t border-red-250">
                        <button
                          type="button"
                          onClick={async () => {
                            const activeUrl = (selectedPropertyForMedia.images && selectedPropertyForMedia.images[detailsCarouselIndex]) || selectedPropertyForMedia.imageUrl || '';
                            
                            setCampaignStatusMessage('⏳ Carregando imagem no clipboard do e-mail...');
                            await copyImageToClipboard(activeUrl);
                            downloadImageFile(activeUrl, `ciclocred_imovel_${selectedPropertyForMedia.code}.png`);
                            
                            const subject = encodeURIComponent(`[Ficha do Imóvel] Unidade Exclusiva: ${selectedPropertyForMedia.title}`);
                            const body = encodeURIComponent(`Olá,\n\nVerificamos novas oportunidades correspondentes ao seu perfil cadastrado no CRM cicloCRED:\n\n🏡 Imóvel: ${selectedPropertyForMedia.title}\n📍 Endereço: ${selectedPropertyForMedia.neighborhood}, ${selectedPropertyForMedia.location}\n📐 Área útil: ${selectedPropertyForMedia.sizeSqm}m²\n💰 Preço de Venda: ${selectedPropertyForMedia.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\nCondições facilitadas: Oferecemos aprovação de crédito imobiliário integrada multi-bancos!\n\nSolicite uma visita guiada sem compromisso com nossos corretores parceiros.\n\nAtenciosamente,\nAssessoria cicloCRED`);
                            
                            window.location.href = `mailto:?subject=${subject}&body=${body}`;
                            
                            setCampaignStatusMessage('✓ E-mail aberto! Pressione Ctrl+V no corpo do e-mail para anexar a foto copiada!');
                            setTimeout(() => setCampaignStatusMessage(''), 5000);
                          }}
                          className="w-full text-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white border-2 border-zinc-950 rounded-xl font-mono text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
                        >
                          ✉️ Abrir Cliente de Email (Mailing)
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
