import React, { useState, useEffect, useRef, useCallback } from "react";
import useSchemaStore from "../stores/useSchemaStore";
import mermaid from "mermaid";
import { renderMermaid } from "../utils/mermaidUtils";
import { ExpandIcon, Download } from "lucide-react";
import { toPng } from 'html-to-image';

export default function ERDPreview() {
  const { mermaidText } = useSchemaStore();
  const animationStyles = {
    transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
    opacity: 1
  };
  const [expanded, setExpanded] = useState(false);
  const normalDiagramRef = useRef(null);
  const expandedDiagramRef = useRef(null);
  const normalContainerRef = useRef(null);
  const expandedContainerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const [transform, setTransform] = useState({ translate: { x: 0, y: 0 }, scale: 1 });
  const [expandedTransform, setExpandedTransform] = useState({ translate: { x: 0, y: 0 }, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // Detect Tailwind dark mode class on <html>
const [darkMode, setDarkMode] = useState(
  () => document.documentElement.classList.contains('dark')
);

useEffect(() => {
  // Observe changes to class attribute on <html> to toggle darkMode
  const observer = new MutationObserver(() => {
    setDarkMode(document.documentElement.classList.contains('dark'));
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}, []);

// Initialize mermaid with theme based on darkMode
useEffect(() => {
  setLoading(true); // Start loading

  const timeout = setTimeout(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: darkMode ? "dark" : "default",
      themeVariables: darkMode
        ? {
            primaryColor: "#1f2937",
            primaryTextColor: "#111827",
            lineColor: "#374151",
            fontFamily: "Fira Code, monospace"
          }
        : {
            primaryColor: "#ffffff",
            primaryTextColor: "#1f2937",
            lineColor: "#4b5563",
            fontFamily: "Fira Code, monospace"
          }
    });

    try {
      renderMermaid(normalDiagramRef.current, mermaidText);
      if (expanded && expandedDiagramRef.current) {
        renderMermaid(expandedDiagramRef.current, mermaidText);
      }
    } catch (err) {
      console.error("Mermaid render failed:", err);
    } finally {
      // Delay a little to avoid flash
      setTimeout(() => setLoading(false), 150);
    }

  }, 100);

  return () => clearTimeout(timeout);
}, [darkMode, mermaidText, expanded]);


  useEffect(() => {
    renderMermaid(normalDiagramRef.current, mermaidText);
    if (expanded) renderMermaid(expandedDiagramRef.current, mermaidText);
  }, [mermaidText, expanded]);

  useEffect(() => {
    setTransform({ translate: { x: 0, y: 0 }, scale: 1 });
    setExpandedTransform({ translate: { x: 0, y: 0 }, scale: 1 });
  }, [mermaidText]);

  const handleMouseDown = (e, isExp) => {
    setIsDragging(true);
    const current = isExp ? expandedTransform : transform;
    setStartPos({ x: e.clientX - current.translate.x, y: e.clientY - current.translate.y });
    e.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e, isExp) => {
    if (!isDragging) return;
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;
    if (isExp) {
      setExpandedTransform(prev => ({ ...prev, translate: { x: newX, y: newY } }));
    } else {
      setTransform(prev => ({ ...prev, translate: { x: newX, y: newY } }));
    }
  };

  const handleMouseUp = (isExp) => {
    setIsDragging(false);
    const tgt = isExp ? expandedContainerRef.current : normalContainerRef.current;
    if (tgt) tgt.style.cursor = 'grab';
  };

  const handleWheel = useCallback((e, isExp) => {
    e.preventDefault();
    const current = isExp ? expandedTransform : transform;
    const setter = isExp ? setExpandedTransform : setTransform;
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.5, current.scale + delta), 3);
    const rect = e.currentTarget?.getBoundingClientRect?.();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const nt = {
      x: mx - (mx - current.translate.x) * (newScale / current.scale),
      y: my - (my - current.translate.y) * (newScale / current.scale)
    };
    setter({ scale: newScale, translate: nt });
  }, [transform, expandedTransform]);

  useEffect(() => {
    const c = normalContainerRef.current;
    if (c) {
      const wheelHandler = e => handleWheel(e, false);
      c.addEventListener('wheel', wheelHandler, { passive: false });
      return () => c.removeEventListener('wheel', wheelHandler);
    }
  }, [handleWheel]);

  useEffect(() => {
    if (!expanded) return;
    const c = expandedContainerRef.current;
    if (c) {
      const wheelHandler = e => handleWheel(e, true);
      c.addEventListener('wheel', wheelHandler, { passive: false });
      return () => c.removeEventListener('wheel', wheelHandler);
    }
  }, [handleWheel, expanded]);

  const handleExportPNG = () => {
    const svg = normalDiagramRef.current?.querySelector('svg');
    if (!svg) return;
    toPng(svg, { cacheBust: true, pixelRatio: 3 })
      .then(dataUrl => {
        const link = document.createElement('a');
        link.download = 'layernexus_erd.png';
        link.href = dataUrl;
        link.click();
      })
      .catch(err => console.error(err));
  };

  const handleClose = () => {
    setExpanded(false);
    setExpandedTransform({ translate: { x: 0, y: 0 }, scale: 1 });
  };

  if (!mermaidText) return null;

  return (
    <>
      <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setExpanded(true)}
            className="px-3 py-1.5 rounded-lg flex items-center gap-2 bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 transition"
          >
            <ExpandIcon className="w-4 h-4" /> Expand
          </button>
          <button
            onClick={handleExportPNG}
            className="px-3 py-1.5 rounded-lg flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            <Download className="w-4 h-4" /> Export as PNG
          </button>
        </div>
        <div
          ref={normalContainerRef}
          className="relative h-[40vh] sm:h-[50vh] lg:h-[60vh] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950"
          onMouseDown={e => handleMouseDown(e, false)}
          onMouseMove={e => handleMouseMove(e, false)}
          onMouseUp={() => handleMouseUp(false)}
          onMouseLeave={() => handleMouseUp(false)}
          style={{ cursor: 'grab' }}
        >
<div className="relative w-full h-full">
  {loading && (
    <div className="absolute inset-0 z-10 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center">
      <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )}

  <div
    ref={normalDiagramRef}
    className="mermaid origin-top-left text-gray-900 dark:text-gray-100"
    style={{
      transform: `translate(${transform.translate.x}px, ${transform.translate.y}px) scale(${transform.scale})`,
      transition: 'transform 0.15s ease-out'
    }}
  >
    {mermaidText}
  </div>
</div>
          <div className="absolute bottom-4 right-4 bg-gray-200 px-3 py-1 rounded-lg text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            {Math.round(transform.scale * 100)}%
          </div>
        </div>
      </div>

      {expanded && (
        <div className="fixed inset-0 bg-white/80 dark:bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expanded ERD</h3>
              <button
                onClick={handleClose}
                className="text-gray-900 dark:text-gray-200 hover:text-gray-700 dark:hover:text-gray-400 transition"
              >
                ✕ Close
              </button>
            </div>
            <div
              ref={expandedContainerRef}
              className="flex-1 overflow-hidden relative p-4"
              onMouseDown={e => handleMouseDown(e, true)}
              onMouseMove={e => handleMouseMove(e, true)}
              onMouseUp={() => handleMouseUp(true)}
              onMouseLeave={() => handleMouseUp(true)}
              style={{ cursor: 'grab' }}
            >
              <div
                ref={expandedDiagramRef}
                className="mermaid origin-top-left text-gray-900 dark:text-gray-100"
                style={{ transform: `translate(${expandedTransform.translate.x}px, ${expandedTransform.translate.y}px) scale(${expandedTransform.scale})`, transition: 'transform 0.15s ease-out' }}
              >
                {mermaidText}
              </div>
              <div className="absolute bottom-4 right-4 bg-gray-200 px-3 py-1 rounded-lg text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                {Math.round(expandedTransform.scale * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
