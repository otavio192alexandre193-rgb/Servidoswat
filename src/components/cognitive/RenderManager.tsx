import React, { useEffect, useState, useRef } from 'react';
import NetworkRenderer from './renderers/NetworkRenderer';
import TreeRenderer from './renderers/TreeRenderer';
import TimelineRenderer from './renderers/TimelineRenderer';
import FlowchartRenderer from './renderers/FlowchartRenderer';
import DashboardRenderer from './renderers/DashboardRenderer';
import { Lead, OperationalFlow, OperationalOS } from '../../types';

export type ViewMode = 
  | 'network' 
  | 'tree-horizontal' 
  | 'radial' 
  | 'timeline' 
  | 'flowchart' 
  | 'dashboard';

interface Node {
  id: string;
  group: number;
  radius: number;
  lead?: Lead;
  label: string;
  detail?: string;
  color?: string;
  isCluster?: boolean;
  isAlert?: boolean;
  data?: any;
}

interface Link {
  source: any;
  target: any;
  value: number;
  label?: string;
}

interface RenderManagerProps {
  viewMode: ViewMode;
  nodes: Node[];
  links: Link[];
  width?: number; // fallback
  height?: number; // fallback
  onNodeClick?: (node: Node) => void;
  onNodeDoubleClick?: (event: any, node: Node) => void;
  selectedNode: Node | null;
  highlightFilter: string;
  searchTerm: string;

  // Additional props for analytical dashboard engine
  leads: Lead[];
  properties?: any[];
  operationalFlows?: OperationalFlow[];
  importBatches?: OperationalOS[];
  onUpdateLeadField?: (leadId: string, updates: Partial<Lead>) => void;
}

export default function RenderManager(props: RenderManagerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: props.width || 800, height: props.height || 600 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
           setDimensions({
             width: entry.contentRect.width,
             height: entry.contentRect.height
           });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const rendererProps = { ...props, width: dimensions.width, height: dimensions.height };

  // Unified "Motor Cognitivo" Router mapping view modes to 6 specialized renderers
  const renderContent = () => {
    switch (props.viewMode) {
      // 1. Renderizador Hierárquico (Árvore e Radial)
      case 'tree-horizontal':
      case 'radial':
         return <TreeRenderer {...rendererProps} />;

      // 2. Renderizador de Processo (Fluxograma)
      case 'flowchart':
         return <FlowchartRenderer {...rendererProps} />;

      // 3. Renderizador Temporal (Timeline)
      case 'timeline':
         return <TimelineRenderer {...rendererProps} />;

      // 4. Renderizador de Relacionamentos (Grafo / Mapa em Rede)
      case 'network':
         return <NetworkRenderer {...rendererProps} is3D={false} />;

      // 5. Renderizador Analítico (Dashboard Visual Dinâmico)
      case 'dashboard':
         return (
           <DashboardRenderer 
             nodes={props.nodes}
             links={props.links}
             leads={props.leads}
             operationalFlows={props.operationalFlows}
             importBatches={props.importBatches}
             width={dimensions.width}
             height={dimensions.height}
             onNodeClick={props.onNodeClick}
             onUpdateLeadField={props.onUpdateLeadField}
             selectedNode={props.selectedNode}
           />
         );

      default:
         return <NetworkRenderer {...rendererProps} is3D={false} />;
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative">
       {renderContent()}
    </div>
  );
}
