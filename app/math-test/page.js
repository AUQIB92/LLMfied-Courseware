import DirectMathTest from '@/components/DirectMathTest';
import MathTestComponent from '@/components/MathTestComponent';

export default function MathTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <MathTestComponent />
        <DirectMathTest />
      </div>
    </div>
  );
}