"use client";

import { useEffect, useRef } from "react";
import type { VisNode, VisEdge } from "@/lib/types";
import "vis-network/styles/vis-network.min.css";

interface NetworkGraphProps {
  nodesData: VisNode[];
  edgesData: VisEdge[];
}

export function NetworkGraph({ nodesData, edgesData }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (!containerRef.current || nodesData.length === 0) return;

    let cancelled = false;

    async function init() {
      const { Network } = await import("vis-network/standalone");
      const { DataSet } = await import("vis-data/standalone");

      if (cancelled || !containerRef.current) return;

      if (networkRef.current) {
        networkRef.current.destroy();
      }

      const nodes = new DataSet(nodesData as never);
      const edges = new DataSet(edgesData as never);
      const allNodeIds = nodes.getIds();

      const baseNodeStyles = new Map(
        nodesData.map((node) => [node.id, node.color])
      );

      const network = new Network(
        containerRef.current,
        { nodes, edges } as never,
        {
          layout: { hierarchical: false },
          physics: false,
          nodes: {
            chosen: false,
            borderWidth: 1,
            borderWidthSelected: 2,
          },
          edges: { selectionWidth: 2, chosen: false },
          interaction: {
            dragNodes: true,
            selectConnectedEdges: true,
            zoomView: true,
            dragView: true,
          },
        }
      );

      const resetHighlight = () => {
        nodes.update(
          allNodeIds.map((id) => ({
            id,
            opacity: 1,
            font: { color: "#e5e5e5" },
            color: baseNodeStyles.get(String(id)),
          })) as never
        );
        edges.update(
          edges.getIds().map((id) => ({
            id,
            color: { color: "#737373", highlight: "#e5e5e5", opacity: 1 },
            width: 2,
          })) as never
        );
      };

      network.on("selectNode", (params: { nodes: string[] }) => {
        const selectedNode = params.nodes[0];
        const connectedNodes = network.getConnectedNodes(selectedNode) as string[];
        const connectedEdges = network.getConnectedEdges(selectedNode) as string[];
        const activeNodes = new Set([selectedNode, ...connectedNodes]);

        nodes.update(
          allNodeIds.map((id) => {
            const nodeId = String(id);
            const isActive = activeNodes.has(nodeId);
            const isSelected = nodeId === selectedNode;
            const base = baseNodeStyles.get(nodeId);

            return {
              id,
              opacity: isActive ? 1 : 0.2,
              font: { color: isActive ? "#fafafa" : "#525252" },
              color: isSelected
                ? { background: "#262626", border: "#a3a3a3" }
                : isActive
                  ? { background: base?.background ?? "#1a1a1a", border: "#737373" }
                  : base,
            };
          }) as never
        );

        edges.update(
          edges.getIds().map((id) => ({
            id,
            color: {
              color: connectedEdges.includes(String(id)) ? "#e5e5e5" : "#737373",
              highlight: "#e5e5e5",
              opacity: connectedEdges.includes(String(id)) ? 1 : 0.15,
            },
            width: connectedEdges.includes(String(id)) ? 3 : 1,
          })) as never
        );
      });

      network.on("deselectNode", resetHighlight);
      network.on("click", (params: { nodes: string[] }) => {
        if (params.nodes.length === 0) resetHighlight();
      });

      network.once("afterDrawing", () => {
        network.fit({
          animation: { duration: 600, easingFunction: "easeInOutQuad" },
        });
      });

      networkRef.current = network;
    }

    init();

    return () => {
      cancelled = true;
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [nodesData, edgesData]);

  return (
    <div className="relative h-[520px] overflow-hidden rounded-xl border border-border bg-surface">
      {nodesData.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-muted">
          Uruchom solver, aby zobaczyć graf
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-full w-full cursor-grab active:cursor-grabbing"
        />
      )}
    </div>
  );
}
