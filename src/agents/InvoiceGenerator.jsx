import React, { useState } from 'react';
import { useLeadStore } from '../store/leadStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function InvoiceGenerator() {
  const { leads } = useLeadStore();
  const { user } = useAuthStore();
  const [selectedLead, setSelectedLead] = useState(null);
  const [items, setItems] = useState([{ desc: '', qty: 1, rate: 0 }]);
  const [invoiceNum, setInvoiceNum] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [dueDate, setDueDate] = useState('');
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');

  const convertedLeads = leads.filter(l => l.status === 'converted' || l.status === 'meeting_booked');

  const addItem = () => setItems([...items, { desc: '', qty: 1, rate: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => { const updated = [...items]; updated[i][field] = value; setItems(updated); };

  const subtotal = items.reduce((s, i) => s + (i.qty * i.rate), 0);
  const taxAmount = subtotal * (tax / 100);
  const total = subtotal + taxAmount;

  const generatePDF = () => {
    if (!selectedLead) { toast.error('Select a client'); return; }
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice ${invoiceNum}</title>
<style>body{font-family:'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:40px}
.header{display:flex;justify-content:space-between;margin-bottom:40px}
.company h1{color:#4c1d95;margin:0}.invoice-title{text-align:right}
.invoice-title h2{color:#7c3aed;margin:0;font-size:28px}
table{width:100%;border-collapse:collapse;margin:20px 0}
th{background:#f5f3ff;padding:12px;text-align:left;font-size:14px}
td{padding:12px;border-bottom:1px solid #e5e7eb}
.total-row{font-weight:bold;font-size:18px}
.footer{margin-top:40px;padding-top:20px;border-top:2px solid #e5e7eb;font-size:12px;color:#6b7280}
@media print{body{-webkit-print-color-adjust:exact}}</style></head><body>
<div class="header"><div class="company"><h1>Nuage Digital</h1><p>nuage-digital.com<br>contact@nuage-digital.com</p></div>
<div class="invoice-title"><h2>INVOICE</h2><p>#${invoiceNum}<br>Date: ${new Date().toLocaleDateString()}<br>Due: ${dueDate || 'Upon Receipt'}</p></div></div>
<div style="margin-bottom:30px"><strong>Bill To:</strong><br>${selectedLead.businessName}<br>${selectedLead.email || ''}<br>${selectedLead.city || ''}</div>
<table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>
${items.map(i => `<tr><td>${i.desc || 'Service'}</td><td>${i.qty}</td><td>$${i.rate}</td><td>$${(i.qty*i.rate).toFixed(2)}</td></tr>`).join('')}</tbody></table>
<div style="text-align:right;margin-top:20px"><p>Subtotal: $${subtotal.toFixed(2)}</p><p>Tax (${tax}%): $${taxAmount.toFixed(2)}</p><p class="total-row" style="font-size:20px;color:#7c3aed">Total: $${total.toFixed(2)}</p></div>
${notes ? `<div style="margin-top:20px"><strong>Notes:</strong><br>${notes}</div>` : ''}
<div class="footer"><p>Thank you for your business!</p><p>Payment via bank transfer or credit card</p></div></body></html>`;
    const w = window.open('','_blank','width=900,height=700'); w.document.write(html); w.document.close();
    setTimeout(() => { w.print(); toast.success('🖨️ Print → Save as PDF'); }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between"><div><h1 className="text-2xl font-bold">🧾 Invoice Generator</h1><p className="text-sm text-gray-500">Create professional invoices</p></div>
        <button onClick={generatePDF} disabled={!selectedLead || items.length===0} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">📄 Generate Invoice</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-sm mb-3">👤 Client</h3>
            <select value={selectedLead?.id||''} onChange={e=>setSelectedLead(convertedLeads.find(l=>l.id==e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Select client...</option>{convertedLeads.map(l=><option key={l.id} value={l.id}>{l.businessName}</option>)}</select>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
            <div><label className="text-xs">Invoice #</label><input value={invoiceNum} onChange={e=>setInvoiceNum(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
            <div><label className="text-xs">Due Date</label><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
            <div><label className="text-xs">Tax %</label><input type="number" value={tax} onChange={e=>setTax(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between mb-4"><h3 className="font-semibold">📋 Items</h3><button onClick={addItem} className="text-sm text-blue-600">+ Add Item</button></div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                <input placeholder="Description" value={item.desc} onChange={e=>updateItem(i,'desc',e.target.value)} className="col-span-5 px-2 py-1.5 border rounded text-sm" />
                <input type="number" placeholder="Qty" value={item.qty} onChange={e=>updateItem(i,'qty',Number(e.target.value))} className="col-span-2 px-2 py-1.5 border rounded text-sm" />
                <input type="number" placeholder="Rate" value={item.rate} onChange={e=>updateItem(i,'rate',Number(e.target.value))} className="col-span-3 px-2 py-1.5 border rounded text-sm" />
                <div className="col-span-1 text-sm font-medium">${(item.qty*item.rate).toFixed(0)}</div>
                <button onClick={()=>removeItem(i)} className="col-span-1 text-red-500 text-xs">✕</button>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t text-right space-y-1">
              <p className="text-sm">Subtotal: <span className="font-bold">${subtotal.toFixed(2)}</span></p>
              <p className="text-sm">Tax: <span className="font-bold">${taxAmount.toFixed(2)}</span></p>
              <p className="text-lg font-bold text-purple-700">Total: ${total.toFixed(2)}</p>
            </div>
            <div className="mt-4"><label className="text-xs">Notes</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows="2" className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}