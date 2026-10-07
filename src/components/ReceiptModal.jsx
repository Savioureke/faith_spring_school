import React from 'react';
import { Printer, Download, X, CheckCircle, ShieldCheck } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';

const ReceiptModal = ({ receipt, onClose }) => {
  const { school } = useSchool();

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Modal Controls (Hidden in print) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="text-emerald-400" size={20} />
            <span className="font-bold text-sm">Official School Fee Receipt</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="printable-area p-8 sm:p-10 bg-white text-slate-800">
          {/* Header with Letterhead */}
          <div className="border-b-2 border-brand-navy pb-6 mb-6 text-center relative">
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-full bg-brand-navy text-brand-amber flex items-center justify-center font-black text-2xl border-2 border-brand-amber">
                E
              </div>
            </div>
            <h1 className="text-2xl font-black text-brand-navy uppercase tracking-wider">{school.name}</h1>
            <p className="text-xs text-slate-600 font-medium italic mt-0.5">"{school.motto}"</p>
            <p className="text-xs text-slate-500 mt-1">{school.address}</p>
            <p className="text-xs text-slate-500 font-mono">Tel: {school.phone} | Email: {school.email}</p>
            <div className="mt-3 inline-block bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Payment Receipt • Validated
            </div>
          </div>

          {/* Receipt Meta Details */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Receipt Number</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{receipt.receipt_number || 'EAF-REC-2025-XXXX'}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Date Issued</span>
              <span className="font-semibold text-slate-700">
                {receipt.issued_date ? new Date(receipt.issued_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Student Name</span>
              <span className="font-bold text-slate-900 text-sm">{receipt.student_name || 'Pupil'}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Admission Number</span>
              <span className="font-mono font-bold text-brand-blue">{receipt.admission_number || 'EAF/2025/XXX'}</span>
            </div>
          </div>

          {/* Payment breakdown */}
          <table className="w-full text-xs mb-6">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500 uppercase text-[10px]">
                <th className="py-2">Description</th>
                <th className="py-2 text-center">Payment Method</th>
                <th className="py-2 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr>
                <td className="py-3 font-semibold text-slate-800">
                  {receipt.description || 'School Tuition & Term Fees Payment'}
                </td>
                <td className="py-3 text-center text-slate-600">
                  {receipt.payment_method || 'Paystack Online Gateway'}
                </td>
                <td className="py-3 text-right font-black text-brand-navy text-sm">
                  ₦{Number(receipt.amount_paid || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Balance & Reference */}
          <div className="border-t-2 border-slate-200 pt-4 flex justify-between items-center text-xs">
            <div className="space-y-1">
              <div className="text-slate-500">
                <span className="font-semibold">Transaction Ref:</span> <span className="font-mono text-[11px]">{receipt.payment_reference || 'REF-EAF-XXXX'}</span>
              </div>
              <div className="text-slate-500">
                <span className="font-semibold">Remaining Balance:</span>{' '}
                <span className={Number(receipt.balance_remaining) > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                  ₦{Number(receipt.balance_remaining || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Authorized Stamp</div>
              <div className="mt-1 inline-flex items-center space-x-1 border-2 border-emerald-600 text-emerald-700 font-black text-[11px] px-2.5 py-1 rounded tracking-widest uppercase transform -rotate-3">
                <CheckCircle size={12} />
                <span>EAF BURSARY • PAID</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-400">
            This is an official computer-generated receipt from Faith Spring School Management Portal. No signature required.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
