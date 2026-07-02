import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Trash2, Palette, Save, Upload, Plus, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { AccessibilitySettings, triggerSensoryFeedback } from '../utils/sensory';
import { AppBackgrounds, BackgroundConfig } from '../types';

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  backgrounds: AppBackgrounds;
  setBackgrounds: (val: AppBackgrounds) => void;
  activeTab: string;
  accSettings: AccessibilitySettings;
}

export default function PersonalizationModal({
  isOpen,
  onClose,
  backgrounds,
  setBackgrounds,
  activeTab,
  accSettings
}: PersonalizationModalProps) {
  const currentConfig = backgrounds[activeTab] || { images: [], interval: 5000 };
  const [images, setImages] = useState<string[]>(currentConfig.images);
  const [interval, setIntervalVal] = useState<number>(currentConfig.interval);
  const [tempUrl, setTempUrl] = useState('');
  const [applyToAll, setApplyToAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddUrl = () => {
    if (!tempUrl) return;
    triggerSensoryFeedback("click", accSettings);
    setImages(prev => [...prev, tempUrl]);
    setTempUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerSensoryFeedback("click", accSettings);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImages(prev => [...prev, base64]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index: number) => {
    triggerSensoryFeedback("click", accSettings);
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    triggerSensoryFeedback("click", accSettings);
    const newConfig: BackgroundConfig = {
      images,
      interval: Math.max(1000, interval)
    };

    if (applyToAll) {
      const newBackgrounds: AppBackgrounds = {};
      const tabs = ['leads', 'google-workspace', 'settings', 'dashboard', 'database', 'gemini-server'];
      tabs.forEach(tab => {
        newBackgrounds[tab] = newConfig;
      });
      setBackgrounds(newBackgrounds);
    } else {
      setBackgrounds({
        ...backgrounds,
        [activeTab]: newConfig
      });
    }
    onClose();
  };

  const handleClear = () => {
    triggerSensoryFeedback("click", accSettings);
    setImages([]);
    if (applyToAll) {
      setBackgrounds({});
    } else {
      const newBgs = { ...backgrounds };
      delete newBgs[activeTab];
      setBackgrounds(newBgs);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border-2 border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-white font-black uppercase tracking-tighter text-lg leading-tight">Personalização</h2>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Layout & Estética • {activeTab}</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerSensoryFeedback("click", accSettings);
              onClose();
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Image List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" /> Galeria do Carrossel
              </label>
              <span className="text-[9px] font-mono text-zinc-600 uppercase font-black">{images.length} imagens</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="group relative aspect-video rounded-xl border-2 border-zinc-800 overflow-hidden bg-zinc-900">
                  <img src={img} alt={`Bg ${idx}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition-colors shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute top-1 left-1 bg-black/60 text-white text-[8px] font-black px-1 rounded">
                    {idx + 1}
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video rounded-xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-500 hover:text-indigo-400 hover:border-indigo-400/50 transition-all bg-zinc-900/50"
              >
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Upload Local</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Add URL */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Adicionar via URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://exemplo.com/imagem.jpg"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                className="flex-1 bg-zinc-900 border-2 border-zinc-800 text-white p-2.5 rounded-xl focus:outline-none focus:border-indigo-600 font-mono text-xs transition-colors"
              />
              <button
                onClick={handleAddUrl}
                className="w-11 h-11 bg-zinc-800 hover:bg-indigo-600 text-white rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center transition-all active:translate-y-0.5 active:shadow-none"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Timer settings */}
          {images.length > 1 && (
            <div className="p-4 bg-indigo-900/10 border-2 border-indigo-900/20 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Configuração do Carrossel</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase text-zinc-400">
                  <span>Intervalo de Transição</span>
                  <span>{interval / 1000} segundos</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="30000"
                  step="1000"
                  value={interval}
                  onChange={(e) => setIntervalVal(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setApplyToAll(!applyToAll)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-[10px] font-black uppercase ${
                applyToAll 
                ? 'bg-indigo-600 border-zinc-950 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`w-3 h-3 rounded-sm border ${applyToAll ? 'bg-white border-white' : 'border-zinc-600'}`} />
              Aplicar carrossel a todas as páginas
            </button>
          </div>
        </div>

        <div className="p-6 bg-zinc-900/30 border-t border-zinc-800 flex items-center gap-3">
          <button
            onClick={handleClear}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-rose-900/20 hover:text-rose-500 text-zinc-400 rounded-2xl border-2 border-zinc-950 font-black text-[11px] uppercase tracking-widest transition-all"
          >
            <Trash2 className="w-4 h-4" /> Limpar
          </button>
          <button
            onClick={handleSave}
            className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-[11px] uppercase tracking-widest transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Save className="w-4 h-4" /> Salvar Carrossel
          </button>
        </div>
      </div>
    </div>
  );
}
