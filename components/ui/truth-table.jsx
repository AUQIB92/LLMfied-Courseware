'use client'

import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './table';

/**
 * Truth Table Component - Professional textbook-style truth tables
 * 
 * Features:
 * - Clean, academic formatting
 * - Proper spacing and typography
 * - Bold headers with centered text
 * - Alternating row colors for readability
 * - Support for complex logical expressions
 * - Professional borders and styling
 */

const TruthTable = ({ 
  headers = [], 
  rows = [], 
  title = "",
  className = "",
  showRowNumbers = false,
  highlightConclusion = true 
}) => {
  // If no data provided, show a sample truth table for demonstration
  if (!headers.length || !rows.length) {
    headers = ['P', 'Q', 'P ∧ Q', 'P ∨ Q', 'P → Q'];
    rows = [
      ['T', 'T', 'T', 'T', 'T'],
      ['T', 'F', 'F', 'T', 'F'],
      ['F', 'T', 'F', 'T', 'T'],
      ['F', 'F', 'F', 'F', 'T']
    ];
  }

  // Determine if the last column should be highlighted (typically the conclusion)
  const conclusionIndex = highlightConclusion ? headers.length - 1 : -1;

  return (
    <div className={`truth-table-container my-6 ${className}`}>
      {title && (
        <div className="text-center mb-4">
          <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
        </div>
      )}
      
      <div className="flex justify-center">
        <div className="truth-table-wrapper border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
          <Table className="min-w-0">
            <TableHeader className="bg-gray-100">
              <TableRow className="border-b-2 border-gray-300">
                {showRowNumbers && (
                  <TableHead className="w-12 text-center font-bold text-gray-700 border-r border-gray-300 py-3">
                    #
                  </TableHead>
                )}
                {headers.map((header, index) => (
                  <TableHead 
                    key={index}
                    className={`
                      text-center font-bold text-gray-800 py-3 px-6 min-w-[3rem]
                      ${index === conclusionIndex ? 'bg-blue-50 border-l-2 border-blue-300' : ''}
                      ${index < headers.length - 1 ? 'border-r border-gray-300' : ''}
                    `}
                  >
                    <span className="text-base font-bold">{header}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow 
                  key={rowIndex}
                  className={`
                    border-b border-gray-200 hover:bg-gray-25 transition-colors
                    ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  `}
                >
                  {showRowNumbers && (
                    <TableCell className="text-center font-medium text-gray-600 border-r border-gray-200 py-3">
                      {rowIndex + 1}
                    </TableCell>
                  )}
                  {row.map((cell, cellIndex) => (
                    <TableCell 
                      key={cellIndex}
                      className={`
                        text-center py-3 px-6 font-mono text-base font-semibold
                        ${cellIndex === conclusionIndex ? 'bg-blue-25 border-l-2 border-blue-200' : ''}
                        ${cellIndex < row.length - 1 ? 'border-r border-gray-200' : ''}
                        ${cell === 'T' || cell === 'True' || cell === '1' ? 'text-green-700' : ''}
                        ${cell === 'F' || cell === 'False' || cell === '0' ? 'text-red-700' : ''}
                        ${cell !== 'T' && cell !== 'F' && cell !== 'True' && cell !== 'False' && cell !== '1' && cell !== '0' ? 'text-gray-800' : ''}
                      `}
                    >
                      <span className="font-bold text-lg">{cell}</span>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Optional legend for symbols */}
      <div className="text-center mt-3 text-sm text-gray-600">
        <span className="font-medium">Legend:</span>
        <span className="ml-2">T = True, F = False</span>
        <span className="ml-4">∧ = AND, ∨ = OR, → = IMPLIES, ¬ = NOT</span>
      </div>
    </div>
  );
};

/**
 * Pre-built truth tables for common logical operations
 */

export const ModusPonensTable = () => (
  <TruthTable
    title="Modus Ponens: (P ∧ (P → Q)) → Q"
    headers={['P', 'Q', 'P → Q', 'P ∧ (P → Q)', '(P ∧ (P → Q)) → Q']}
    rows={[
      ['T', 'T', 'T', 'T', 'T'],
      ['T', 'F', 'F', 'F', 'T'],
      ['F', 'T', 'T', 'F', 'T'],
      ['F', 'F', 'T', 'F', 'T']
    ]}
    highlightConclusion={true}
  />
);

export const ModusTollensTable = () => (
  <TruthTable
    title="Modus Tollens: ((P → Q) ∧ ¬Q) → ¬P"
    headers={['P', 'Q', 'P → Q', '¬Q', '(P → Q) ∧ ¬Q', '¬P', '((P → Q) ∧ ¬Q) → ¬P']}
    rows={[
      ['T', 'T', 'T', 'F', 'F', 'F', 'T'],
      ['T', 'F', 'F', 'T', 'F', 'F', 'T'],
      ['F', 'T', 'T', 'F', 'F', 'T', 'T'],
      ['F', 'F', 'T', 'T', 'T', 'T', 'T']
    ]}
    highlightConclusion={true}
  />
);

export const BasicLogicTable = () => (
  <TruthTable
    title="Basic Logical Operations"
    headers={['P', 'Q', 'P ∧ Q', 'P ∨ Q', 'P → Q', 'P ↔ Q']}
    rows={[
      ['T', 'T', 'T', 'T', 'T', 'T'],
      ['T', 'F', 'F', 'T', 'F', 'F'],
      ['F', 'T', 'F', 'T', 'T', 'F'],
      ['F', 'F', 'F', 'F', 'T', 'T']
    ]}
    showRowNumbers={true}
  />
);

export default TruthTable;