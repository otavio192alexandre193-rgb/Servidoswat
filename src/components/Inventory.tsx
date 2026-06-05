/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { 
  Package, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CornerDownRight, 
  DollarSign, 
  SlidersHorizontal,
  FolderMinus,
  Edit2,
  Box,
  Layers,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';

interface InventoryProps {
  inventory: InventoryItem[];
  onAddProduct: (newProduct: InventoryItem) => void;
  onUpdateStock: (id: string, delta: number) => void;
  onDeleteProduct: (id: string) => void;
}

export default function Inventory({
  inventory,
  onAddProduct,
  onUpdateStock,
  onDeleteProduct
}: InventoryProps) {
  const [isAdding, setIsAdding] = useState(false);
  
  // Form fields states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Serviços Financeiros');
  const [quantity, setQuantity] = useState(1);
  const [minQuantity, setMinQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [notes, setNotes] = useState('');

  // Filtering states
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');

  const categories = [
    'todos',
    'Dispositivos',
    'Papelaria',
    'Serviços Financeiros',
    'Marketing',
    'Contratos'
  ];

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) return;

    const newItem: InventoryItem = {
      id: `prod-${Date.now()}`,
      name,
      sku: sku.toUpperCase(),
      category,
      quantity: Number(quantity) || 0,
      minQuantity: Number(minQuantity) || 0,
      price: Number(price) || 0,
      status: quantity <= 0 ? 'indisponivel' : quantity < minQuantity ? 'baixo_estoque' : 'disponivel',
      notes
    };

    onAddProduct(newItem);
    setIsAdding(false);

    // Reset fields
    setName('');
    setSku('');
    setCategory('Serviços Financeiros');
    setQuantity(1);
    setMinQuantity(1);
    setPrice(0);
    setNotes('');
  };

  // Filter items
  const filteredProducts = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'todos' ? true : item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate items with low stock or alerts
  const alertItems = inventory.filter(item => item.quantity < item.minQuantity);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Metrics of Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <div className="space-y-1">
            <span className="text-[10px] tracking-wider uppercase font-black text-zinc-500 font-mono">Diferentes Itens</span>
            <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{inventory.length}</h3>
          </div>
          <div className="p-2 border-2 border-zinc-950 rounded-xl bg-indigo-50">
            <Box className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-red-50 text-red-950 border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <div className="space-y-1">
            <span className="text-[10px] tracking-wider uppercase font-black text-red-600 font-mono">⚠️ Alerta Crítico</span>
            <h3 className="text-2xl font-black font-mono tracking-tight">{alertItems.length} Baixo estoque</h3>
          </div>
          <div className="p-2 border-2 border-zinc-950 rounded-xl bg-white animate-pulse">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <div className="space-y-1">
            <span className="text-[10px] tracking-wider uppercase font-black text-zinc-500 font-mono">Quantidade Total</span>
            <h3 className="text-3xl font-black text-zinc-900 tracking-tight">
              {inventory.reduce((acc, current) => acc + current.quantity, 0)} un
            </h3>
          </div>
          <div className="p-2 border-2 border-zinc-950 rounded-xl bg-zinc-100">
            <Layers className="w-6 h-6 text-zinc-500" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-zinc-900 text-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <div className="space-y-1">
            <span className="text-[10px] tracking-wider uppercase font-black text-indigo-400 font-mono">Valor Total de Ativos</span>
            <h3 className="text-2xl font-black text-white font-mono tracking-tight">
              {inventory.reduce((acc, current) => acc + (current.quantity * current.price), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
            </h3>
          </div>
          <div className="p-2 border-2 border-zinc-950 rounded-xl bg-zinc-800">
            <DollarSign className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Control Action Bar */}
      <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-zinc-950 uppercase italic tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <span>Painel do Estoque e Portfólio</span>
          </h2>
          <p className="text-xs text-zinc-500 font-medium">Contraste, organize e libere ativos financeiros ou suprimentos comerciais para seu time de campo.</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs uppercase border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] transition hover:translate-y-[-2px] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? 'Minimizar Formulário' : 'Novo Produto/Portfólio'}</span>
        </button>
      </div>

      {/* Product Creator Form */}
      {isAdding && (
        <form onSubmit={handleCreateProduct} className="bg-white border-4 border-zinc-950 p-6 rounded-2xl space-y-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-scaleIn">
          <div className="border-b-2 border-zinc-100 pb-3">
            <h3 className="text-sm font-black text-zinc-950 uppercase italic">📦 Cadastrar novo item de estoque ou serviço</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-zinc-805">
            {/* Name */}
            <div className="md:col-span-6 space-y-1.5">
              <label htmlFor="prod-name" className="block text-xs font-black text-zinc-700 uppercase font-mono">Nome do Item *</label>
              <input
                type="text"
                id="prod-name"
                required
                placeholder="Ex: Maquininha cicloCRED Pro ou Letra de Câmbio 11.5%"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm text-zinc-950 font-bold focus:bg-white outline-none"
              />
            </div>

            {/* SKU / Code */}
            <div className="md:col-span-3 space-y-1.5">
              <label htmlFor="prod-sku" className="block text-xs font-black text-zinc-700 uppercase font-mono">Código / SKU *</label>
              <input
                type="text"
                id="prod-sku"
                required
                placeholder="Ex: SKU-MACH-PRO"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm text-zinc-950 font-mono font-bold focus:bg-white outline-none"
              />
            </div>

            {/* Category */}
            <div className="md:col-span-3 space-y-1.5">
              <label htmlFor="prod-cat" className="block text-xs font-black text-zinc-700 uppercase font-mono">Categoria</label>
              <select
                id="prod-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm text-zinc-950 font-extrabold focus:bg-white outline-none"
              >
                {categories.filter(c => c !== 'todos').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Initial Stock Quantity */}
            <div className="md:col-span-3 space-y-1.5">
              <label htmlFor="prod-qty" className="block text-xs font-black text-zinc-700 uppercase font-mono">Quantidade Inicial</label>
              <input
                type="number"
                id="prod-qty"
                min={0}
                required
                placeholder="10"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm font-mono text-zinc-950 font-bold focus:bg-white outline-none"
              />
            </div>

            {/* Alert Threshold */}
            <div className="md:col-span-3 space-y-1.5">
              <label htmlFor="prod-min" className="block text-xs font-black text-zinc-700 uppercase font-mono">Mínimo Alerta de Baixo Estoque</label>
              <input
                type="number"
                id="prod-min"
                min={0}
                required
                placeholder="3"
                value={minQuantity}
                onChange={(e) => setMinQuantity(Number(e.target.value) || 0)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm font-mono text-zinc-950 font-bold focus:bg-white outline-none"
              />
            </div>

            {/* Price */}
            <div className="md:col-span-3 space-y-1.5">
              <label htmlFor="prod-price" className="block text-xs font-black text-zinc-700 uppercase font-mono">Preço por Unidade (R$)</label>
              <input
                type="number"
                id="prod-price"
                placeholder="150"
                value={price || ''}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm font-mono text-zinc-950 font-bold focus:bg-white outline-none"
              />
            </div>

            {/* Notes / Description */}
            <div className="md:col-span-12 space-y-1.5">
              <label htmlFor="prod-notes" className="block text-xs font-black text-zinc-700 uppercase font-mono">Detalhes Adicionais</label>
              <textarea
                id="prod-notes"
                rows={2}
                placeholder="Insira notas técnicas do produto, taxas de aplicação do serviço financeiro ou especificações de entrega"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm text-zinc-950 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-zinc-150">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2.5 bg-zinc-100 border-2 border-zinc-950 hover:bg-zinc-200 text-zinc-900 font-black rounded-xl text-xs uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl uppercase tracking-wider border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
            >
              Adicionar no CRM
            </button>
          </div>
        </form>
      )}

      {/* Search and Filters for the Database / Items Grid */}
      <div className="bg-white border-4 border-zinc-950 rounded-3xl p-6 space-y-5 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] select-none">
        
        {/* Actions inside list */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b pb-4">
          <input
            type="text"
            placeholder="🔍 Buscar por nome do item ou código SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:max-w-md bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold outline-none focus:bg-white"
          />

          {/* Quick Categories filter Belt */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-lg border-2 ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white border-zinc-950 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-950 hover:bg-zinc-100'
                }`}
              >
                {cat === 'todos' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Database list Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-zinc-200 rounded-2xl font-mono text-zinc-400 font-extrabold uppercase">
            Nenhum item localizado no banco de dados de suprimentos.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(item => {
              const isBelowThreshold = item.quantity < item.minQuantity;

              return (
                <div 
                  key={item.id} 
                  className={`border-4 border-zinc-950 rounded-2xl p-5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between transition-all hover:bg-zinc-50 ${
                    isBelowThreshold ? 'bg-red-50/40 border-red-900 shadow-[3px_3px_0px_0px_rgba(239,68,68,1)]' : 'bg-white'
                  }`}
                >
                  <div className="space-y-3.5">
                    
                    {/* Header: Code / Category */}
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[9px] uppercase font-mono font-black tracking-wider text-indigo-600">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-mono font-black bg-zinc-900 text-zinc-155 px-2 py-0.5 rounded text-white select-all">
                        {item.sku}
                      </span>
                    </div>

                    {/* Product Name */}
                    <div>
                      <h4 className="font-sans font-black text-sm uppercase tracking-tight text-zinc-950 leading-tight">
                        {item.name}
                      </h4>
                      {item.notes && (
                        <p className="text-[11px] font-medium text-zinc-500 mt-1 lines-clamp-2">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Stock quantity dynamic manager */}
                    <div className="flex items-center justify-between bg-zinc-100 p-2.5 rounded-xl border border-zinc-200">
                      <div>
                        <span className="text-[9px] font-mono font-black text-zinc-500 uppercase block">Saldo em Estoque</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-base font-mono font-black ${isBelowThreshold ? 'text-red-700' : 'text-zinc-950'}`}>
                            {item.quantity} unidades
                          </span>
                        </div>
                      </div>

                      {/* Stock controls delta buttons */}
                      <div className="flex gap-2.5 select-none">
                        <button
                          onClick={() => onUpdateStock(item.id, -1)}
                          title="Remover 1 unidade do estoque"
                          className="p-1 px-1.5 rounded-lg border border-zinc-950 bg-white hover:bg-red-100 text-zinc-900 hover:text-red-700 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-0.5"
                        >
                          <ArrowDownCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onUpdateStock(item.id, 1)}
                          title="Adicionar 1 unidade ao estoque"
                          className="p-1 px-1.5 rounded-lg border border-zinc-950 bg-white hover:bg-emerald-100 text-indigo-950 hover:text-emerald-700 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-0.5"
                        >
                          <ArrowUpCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Low stock indicators warning banner */}
                    {isBelowThreshold && (
                      <div className="flex items-center gap-1.5 text-red-700 bg-red-100/50 p-2 border border-red-300 rounded-lg text-[10px] uppercase font-mono font-extrabold animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>Atenção: Margem crítica (Mín. {item.minQuantity})</span>
                      </div>
                    )}

                  </div>

                  {/* Actions Footer */}
                  <div className="flex gap-2 justify-between items-center pt-3.5 border-t border-zinc-200 mt-4 h-8 select-none">
                    <span className="text-xs font-mono font-black text-indigo-600">
                      Un: {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </span>

                    <button
                      onClick={() => onDeleteProduct(item.id)}
                      title="Excluir item de estoque"
                      className="px-3 py-1 bg-white hover:bg-red-50 text-red-600 border border-zinc-950 text-[10px] font-black uppercase rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
