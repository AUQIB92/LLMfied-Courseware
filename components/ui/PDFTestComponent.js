/**
 * PDF Test Component - For testing the fixed PDF export functionality
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Printer, FileText } from 'lucide-react';

const PDFTestComponent = () => {
  const [isExporting, setIsExporting] = useState(false);

  const testPDFExport = async () => {
    setIsExporting(true);
    try {
      const { exportAssignmentPDF } = await import('@/utils/fixed-pdf-export');
      
      const testMetadata = {
        moduleTitle: 'Test Assignment - PDF Export',
        courseTitle: 'PDF Export Test Course',
        institutionName: 'GCET Kashmir',
        instructorName: 'Dr. Auqib Hamid',
        dueDate: new Date(),
        studentName: 'Test Student'
      };

      const result = await exportAssignmentPDF(testMetadata);
      
      if (result) {
        alert('✅ PDF export test successful! Check your downloads folder.');
      } else {
        alert('❌ PDF export test failed');
      }
    } catch (error) {
      console.error('PDF test error:', error);
      alert(`PDF test failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const testSimplePrint = async () => {
    try {
      const { simpleAssignmentPrint } = await import('@/utils/fixed-pdf-export');
      const result = simpleAssignmentPrint();
      
      if (result) {
        alert('✅ Print test successful!');
      } else {
        alert('❌ Print test failed - assignment content not found');
      }
    } catch (error) {
      console.error('Print test error:', error);
      alert(`Print test failed: ${error.message}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Export Test Component
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="assignment-content space-y-4">
          <h3 className="text-lg font-semibold">Sample Assignment Content</h3>
          
          <div className="space-y-3">
            <p><strong>Problem 1:</strong> Solve the quadratic equation: x² - 5x + 6 = 0</p>
            <p><strong>Solution:</strong> Using the quadratic formula or factoring, we get x = 2 or x = 3</p>
            
            <p><strong>Problem 2:</strong> Calculate the derivative of f(x) = 3x² + 2x - 1</p>
            <p><strong>Solution:</strong> f'(x) = 6x + 2</p>
            
            <p><strong>Problem 3:</strong> Find the integral of ∫(2x + 1)dx</p>
            <p><strong>Solution:</strong> ∫(2x + 1)dx = x² + x + C</p>
          </div>
        </div>
        
        <div className="flex gap-4 mt-6">
          <Button 
            onClick={testPDFExport} 
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Testing PDF Export...' : 'Test PDF Export'}
          </Button>
          
          <Button 
            onClick={testSimplePrint}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Test Print Function
          </Button>
          
          <Button 
            onClick={() => window.print()}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Browser Print (Fallback)
          </Button>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Test Instructions:</strong>
          </p>
          <ul className="text-sm text-blue-600 mt-2 space-y-1">
            <li>• Click "Test PDF Export" to test the enhanced PDF generation</li>
            <li>• Click "Test Print Function" to test the simple print dialog</li>
            <li>• Use "Browser Print" as a final fallback option</li>
            <li>• Check browser console for detailed error messages if needed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFTestComponent;