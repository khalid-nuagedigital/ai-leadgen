import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function ABTestAnalyzer() {
  const [testName, setTestName] = useState('');
  const [variantA, setVariantA] = useState({ visitors: 1000, conversions: 50 });
  const [variantB, setVariantB] = useState({ visitors: 1000, conversions: 75 });
  const [result, setResult] = useState(null);

  const calculate = () => {
    const rateA = (variantA.conversions / variantA.visitors) * 100;
    const rateB = (variantB.conversions / variantB.visitors) * 100;
    const lift = ((rateB - rateA) / rateA) * 100;
    const isSignificant = Math.abs(lift) > 10;
    setResult({ rateA: rateA.toFixed(2), rateB: rateB.toFixed(2), lift: lift.toFixed(1), isSignificant, winner: lift > 0 ? 'B' : 'A' });
    toast.success('Analysis complete!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between"><div><h1 className="text-2xl font-bold">🧪 A/B Test Analyzer</h1><p className="text-sm text-gray-500">Compare variants statistically</p></div>
        <button onClick={calculate} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">📊 Calculate</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4"><label className="text-xs">Test Name</label><input value={testName} onChange={e=>setTestName(e.target.value)} placeholder="e.g., Landing Page Test" className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-4"><h3 className="font-semibold text-sm mb-3">Variant A</h3>
              <div className="space-y-2"><div><label className="text-xs">Visitors</label><input type="number" value={variantA.visitors} onChange={e=>setVariantA({...variantA,visitors:Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
              <div><label className="text-xs">Conversions</label><input type="number" value={variantA.conversions} onChange={e=>setVariantA({...variantA,conversions:Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4"><h3 className="font-semibold text-sm mb-3">Variant B</h3>
              <div className="space-y-2"><div><label className="text-xs">Visitors</label><input type="number" value={variantB.visitors} onChange={e=>setVariantB({...variantB,visitors:Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
              <div><label className="text-xs">Conversions</label><input type="number" value={variantB.conversions} onChange={e=>setVariantB({...variantB,conversions:Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div></div>
            </div>
          </div>
        </div>
        <div>
          {result ? (
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <h3 className="font-semibold text-lg">📊 Results</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded-xl"><div className="text-sm text-gray-500">Variant A</div><div className="text-2xl font-bold">{result.rateA}%</div></div>
                <div className="p-4 bg-purple-50 rounded-xl"><div className="text-sm text-purple-600">Variant B</div><div className="text-2xl font-bold text-purple-700">{result.rateB}%</div></div>
              </div>
              <div className={`p-4 rounded-xl text-center ${result.isSignificant ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                <div className="text-3xl font-bold">{result.lift}%</div>
                <div className="text-sm">Lift {result.lift > 0 ? '↑' : '↓'}</div>
                <div className="text-xs mt-1">{result.isSignificant ? '✅ Statistically Significant' : '⚠️ Not Significant'}</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-center">
                <p className="text-lg font-bold">🏆 Winner: Variant {result.winner}</p>
                <p className="text-sm">Variant {result.winner} performed {Math.abs(result.lift)}% better</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400"><p className="text-4xl mb-3">🧪</p><p>Enter data and calculate</p></div>
          )}
        </div>
      </div>
    </div>
  );
}