"use client"

import React from 'react'
import ReliableMathRenderer from '../ReliableMathRenderer'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from './chart'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

interface EnhancedContentRendererProps {
  content: string
  className?: string
}

export const EnhancedContentRenderer: React.FC<EnhancedContentRendererProps> = ({ 
  content, 
  className = "" 
}) => {
  const processContent = (rawContent: string) => {
    if (!rawContent) return ''
    
    let processedContent = rawContent
    
    // Process truth tables first (before other table processing)
    processedContent = processTruthTables(processedContent)
    
    // Process HTML tables
    processedContent = processHTMLTables(processedContent)
    
    // Process markdown tables
    processedContent = processMarkdownTables(processedContent)
    
    // Process charts and visualizations
    processedContent = processCharts(processedContent)
    
    // Process code blocks
    processedContent = processCodeBlocks(processedContent)
    
    // Fix common HTML issues
    processedContent = fixHTMLIssues(processedContent)
    
    return processedContent
  }

  const processTruthTables = (content: string) => {
    // Enhanced truth table pattern - handles various formats
    const truthTablePattern = /(\|[^|\n]*\|(?:\n\|[^|\n]*\|)*)/g
    
    return content.replace(truthTablePattern, (match) => {
      const lines = match.trim().split('\n')
      if (lines.length < 2) return match
      
      // Check if this looks like a truth table
      const firstRow = lines[0].split('|').map(cell => cell.trim()).filter(cell => cell.length > 0)
      const secondRow = lines[1].split('|').map(cell => cell.trim()).filter(cell => cell.length > 0)
      
      // Skip if not a proper table format
      if (firstRow.length === 0 || secondRow.length === 0) return match
      
      // Check if it contains truth table-like content
      const hasTruthValues = lines.some(line => 
        line.includes('T') || line.includes('F') || 
        line.includes('true') || line.includes('false') ||
        line.includes('1') || line.includes('0')
      )
      
      if (!hasTruthValues && !firstRow.some(cell => 
        cell.includes('p') || cell.includes('q') || cell.includes('∧') || 
        cell.includes('∨') || cell.includes('¬') || cell.includes('→')
      )) {
        return match // Not a truth table, process as regular table
      }
      
      const allRows = lines.map(line => 
        line.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0)
      )
      
      if (allRows.length < 2) return match
      
      const headerRow = allRows[0]
      const dataRows = allRows.slice(1)
      
      return `
        <div class="truth-table-container my-8">
          <div class="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-t-xl border-l-4 border-purple-500">
            <h4 class="font-bold text-purple-800 flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Truth Table
            </h4>
          </div>
          <div class="overflow-x-auto">
            <table class="truth-table min-w-full border-collapse bg-white shadow-lg">
              <thead class="bg-gradient-to-r from-purple-600 to-blue-600">
                <tr>
                  ${headerRow.map(header => 
                    `<th class="border border-gray-300 px-6 py-4 text-white font-bold text-center text-lg">${header}</th>`
                  ).join('')}
                </tr>
              </thead>
              <tbody>
                ${dataRows.map((row, index) => `
                  <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-purple-50 transition-all duration-200">
                    ${row.map((cell, cellIndex) => {
                      const isLogicValue = cell.toLowerCase() === 'true' || cell === 'T' || cell === '1' || 
                                          cell.toLowerCase() === 'false' || cell === 'F' || cell === '0'
                      const isTrue = cell.toLowerCase() === 'true' || cell === 'T' || cell === '1'
                      const isFalse = cell.toLowerCase() === 'false' || cell === 'F' || cell === '0'
                      
                      return `<td class="border border-gray-300 px-6 py-4 text-center text-lg font-mono ${
                        isTrue ? 'text-green-600 font-bold bg-green-50' : 
                        isFalse ? 'text-red-600 font-bold bg-red-50' :
                        'text-gray-800'
                      }">${cell}</td>`
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `
    })
  }

  const processHTMLTables = (content: string) => {
    // Enhance existing HTML tables with better styling
    let enhanced = content
    
    // Add classes to tables
    enhanced = enhanced.replace(/<table(?![^>]*class=)[^>]*>/g, (match) => {
      return match.replace('<table', '<table class="enhanced-html-table min-w-full border-collapse border border-gray-300 rounded-lg overflow-hidden shadow-lg my-6"')
    })
    
    // Enhance table headers
    enhanced = enhanced.replace(/<th(?![^>]*class=)[^>]*>/g, (match) => {
      return match.replace('<th', '<th class="bg-gradient-to-r from-indigo-600 to-purple-600 border border-gray-300 px-4 py-3 text-white font-bold text-center"')
    })
    
    // Enhance table cells
    enhanced = enhanced.replace(/<td(?![^>]*class=)[^>]*>/g, (match) => {
      return match.replace('<td', '<td class="border border-gray-300 px-4 py-3 text-center hover:bg-gray-50 transition-colors"')
    })
    
    return enhanced
  }

  const processMarkdownTables = (content: string) => {
    // Convert markdown tables to styled HTML tables
    const tablePattern = /\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)*)/g
    
    return content.replace(tablePattern, (match, headerRow, bodyRows) => {
      const headers = headerRow.split('|').map((h: string) => h.trim()).filter((h: string) => h)
      const rows = bodyRows.trim().split('\n').map((row: string) => 
        row.split('|').map((cell: string) => cell.trim()).filter((cell: string) => cell)
      ).filter((row: string[]) => row.length > 0)
      
      if (headers.length === 0 || rows.length === 0) return match
      
      return `
        <div class="markdown-table-container my-6">
          <div class="overflow-x-auto">
            <table class="markdown-table min-w-full border-collapse border border-gray-300 rounded-lg overflow-hidden shadow-lg">
              <thead class="bg-gradient-to-r from-green-600 to-blue-600">
                <tr>
                  ${headers.map((header: string) => 
                    `<th class="border border-gray-300 px-4 py-3 text-white font-bold text-center">${header}</th>`
                  ).join('')}
                </tr>
              </thead>
              <tbody>
                ${rows.map((row: string[], index: number) => `
                  <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-green-50 transition-colors">
                    ${row.map((cell: string) => 
                      `<td class="border border-gray-300 px-4 py-3 text-center">${cell}</td>`
                    ).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `
    })
  }

  const processCharts = (content: string) => {
    // Process chart definitions in various formats
    let enhanced = content
    
    // Process JSON chart data blocks
    const chartPattern = /```chart(?::(\w+))?\n([\s\S]*?)```/g
    enhanced = enhanced.replace(chartPattern, (match, chartType = 'bar', chartData) => {
      try {
        const data = JSON.parse(chartData.trim())
        return renderChart(chartType, data)
      } catch (error) {
        console.error('Error parsing chart data:', error)
        return `<div class="chart-error bg-red-50 border border-red-200 rounded-lg p-4 my-4"><p class="text-red-600 font-semibold">Chart Error</p><p class="text-red-500 text-sm">Invalid chart data format</p></div>`
      }
    })
    
    // Process inline chart definitions
    const inlineChartPattern = /\[chart:(\w+)\]\(([\s\S]*?)\)/g
    enhanced = enhanced.replace(inlineChartPattern, (match, chartType, chartData) => {
      try {
        const data = JSON.parse(chartData)
        return renderChart(chartType, data)
      } catch (error) {
        console.error('Error parsing inline chart:', error)
        return `<span class="text-red-500">[Invalid Chart Data]</span>`
      }
    })
    
    // Process mathematical function plots
    const functionPlotPattern = /```plot\n([\s\S]*?)```/g
    enhanced = enhanced.replace(functionPlotPattern, (match, plotData) => {
      try {
        const config = JSON.parse(plotData.trim())
        return renderFunctionPlot(config)
      } catch (error) {
        console.error('Error parsing plot data:', error)
        return `<div class="chart-error bg-red-50 border border-red-200 rounded-lg p-4 my-4"><p class="text-red-600 font-semibold">Plot Error</p><p class="text-red-500 text-sm">Invalid plot configuration</p></div>`
      }
    })
    
    return enhanced
  }
  
  const renderChart = (type: string, data: any) => {
    const chartId = `chart_${Math.random().toString(36).substr(2, 9)}`
    
    const { chartData, config, title, description } = data
    
    if (!chartData || !Array.isArray(chartData)) {
      return `<div class="chart-error bg-red-50 border border-red-200 rounded-lg p-4 my-4"><p class="text-red-600 font-semibold">Chart Error</p><p class="text-red-500 text-sm">Missing or invalid chart data</p></div>`
    }
    
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347']
    
    switch (type.toLowerCase()) {
      case 'bar':
        return `
          <div class="chart-container my-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            ${title ? `<h4 class="text-lg font-bold text-gray-800 mb-2">${title}</h4>` : ''}
            ${description ? `<p class="text-gray-600 text-sm mb-4">${description}</p>` : ''}
            <div id="${chartId}" class="chart-placeholder" data-chart-type="bar" data-chart-data='${JSON.stringify(chartData)}' data-chart-config='${JSON.stringify(config || {})}' style="width: 100%; height: 400px;">
              <div class="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                <div class="text-center">
                  <div class="text-2xl mb-2">📊</div>
                  <p class="text-gray-600">Bar Chart</p>
                  <p class="text-sm text-gray-500">${chartData.length} data points</p>
                </div>
              </div>
            </div>
          </div>
        `
      
      case 'line':
        return `
          <div class="chart-container my-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            ${title ? `<h4 class="text-lg font-bold text-gray-800 mb-2">${title}</h4>` : ''}
            ${description ? `<p class="text-gray-600 text-sm mb-4">${description}</p>` : ''}
            <div id="${chartId}" class="chart-placeholder" data-chart-type="line" data-chart-data='${JSON.stringify(chartData)}' data-chart-config='${JSON.stringify(config || {})}' style="width: 100%; height: 400px;">
              <div class="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                <div class="text-center">
                  <div class="text-2xl mb-2">📈</div>
                  <p class="text-gray-600">Line Chart</p>
                  <p class="text-sm text-gray-500">${chartData.length} data points</p>
                </div>
              </div>
            </div>
          </div>
        `
      
      case 'pie':
        return `
          <div class="chart-container my-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            ${title ? `<h4 class="text-lg font-bold text-gray-800 mb-2">${title}</h4>` : ''}
            ${description ? `<p class="text-gray-600 text-sm mb-4">${description}</p>` : ''}
            <div id="${chartId}" class="chart-placeholder" data-chart-type="pie" data-chart-data='${JSON.stringify(chartData)}' data-chart-config='${JSON.stringify(config || {})}' style="width: 100%; height: 400px;">
              <div class="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                <div class="text-center">
                  <div class="text-2xl mb-2">🥧</div>
                  <p class="text-gray-600">Pie Chart</p>
                  <p class="text-sm text-gray-500">${chartData.length} segments</p>
                </div>
              </div>
            </div>
          </div>
        `
      
      default:
        return `
          <div class="chart-container my-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            ${title ? `<h4 class="text-lg font-bold text-gray-800 mb-2">${title}</h4>` : ''}
            ${description ? `<p class="text-gray-600 text-sm mb-4">${description}</p>` : ''}
            <div class="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
              <div class="text-center">
                <div class="text-2xl mb-2">📊</div>
                <p class="text-gray-600">Unsupported chart type: ${type}</p>
              </div>
            </div>
          </div>
        `
    }
  }
  
  const renderFunctionPlot = (config: any) => {
    const { function: func, xRange, title, description } = config
    const plotId = `plot_${Math.random().toString(36).substr(2, 9)}`
    
    return `
      <div class="plot-container my-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
        ${title ? `<h4 class="text-lg font-bold text-gray-800 mb-2">${title}</h4>` : ''}
        ${description ? `<p class="text-gray-600 text-sm mb-4">${description}</p>` : ''}
        <div id="${plotId}" class="plot-placeholder" data-function='${JSON.stringify(func)}' data-x-range='${JSON.stringify(xRange)}' style="width: 100%; height: 400px;">
          <div class="flex items-center justify-center h-full bg-gray-50 rounded-lg">
            <div class="text-center">
              <div class="text-2xl mb-2">📐</div>
              <p class="text-gray-600">Function Plot</p>
              <p class="text-sm text-gray-500">f(x) = ${func}</p>
            </div>
          </div>
        </div>
      </div>
    `
  }

  const processCodeBlocks = (content: string) => {
    // Enhance code blocks with better styling
    const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g
    
    return content.replace(codeBlockPattern, (match, language, code) => {
      return `
        <div class="code-block-container my-6">
          <div class="bg-gray-800 rounded-t-lg px-4 py-2 flex items-center justify-between">
            <span class="text-gray-300 text-sm font-medium">${language || 'Code'}</span>
            <div class="flex space-x-2">
              <div class="w-3 h-3 bg-red-500 rounded-full"></div>
              <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <pre class="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto"><code class="language-${language || 'text'}">${code.trim()}</code></pre>
        </div>
      `
    })
  }

  const fixHTMLIssues = (content: string) => {
    let fixed = content
    
    // Fix unclosed tags
    fixed = fixed.replace(/<br>/g, '<br/>')
    fixed = fixed.replace(/<hr>/g, '<hr/>')
    
    // Ensure proper paragraph wrapping
    fixed = fixed.replace(/\n\n+/g, '</p><p>')
    
    // Fix list formatting
    fixed = fixed.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>')
    
    return fixed
  }

  const processedContent = processContent(content)

  return (
    <div className={`enhanced-content-renderer ${className}`}>
      <style jsx>{`
        .enhanced-content-renderer {
          line-height: 1.7;
        }
        
        .truth-table-container,
        .markdown-table-container,
        .code-block-container {
          margin: 1.5rem 0;
        }
        
        .truth-table,
        .enhanced-html-table,
        .markdown-table {
          font-size: 0.95rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .truth-table th,
        .enhanced-html-table th,
        .markdown-table th {
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .truth-table td,
        .enhanced-html-table td,
        .markdown-table td {
          transition: all 0.2s ease;
        }
        
        .truth-table tbody tr:hover,
        .enhanced-html-table tbody tr:hover,
        .markdown-table tbody tr:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        .code-block-container pre {
          font-family: 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9rem;
          line-height: 1.5;
        }
        
        .enhanced-content-renderer :global(.prose) {
          max-width: none;
        }
        
        .enhanced-content-renderer :global(.prose table) {
          margin: 1.5rem 0;
        }
      `}</style>
      
      <ReliableMathRenderer 
        content={processedContent} 
        className="prose prose-lg max-w-none enhanced-prose"
      />
    </div>
  )
}

export default EnhancedContentRenderer