import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../context/SchoolContext';
import { 
  CreditCard, Plus, Search, Filter, Download, Receipt, 
  CheckCircle2, Clock, AlertTriangle, ArrowUpRight, RefreshCw, Printer
} from 'lucide-react';
import ReceiptModal from '../../components/ReceiptModal';
import PaystackCheckoutModal from '../../components/PaystackCheckoutModal';
import { sendSmsNotification } from '../../lib/smsService';

const FeesModule = () => {
  const { classes, activeTerm, showToast } = useSchool();
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices', 'structures', 'ledger'
  const [invoices, setInvoices] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [paymentsLedger, setPaymentsLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [paystackInvoice, setPaystackInvoice] = useState(null);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [isManualPaymentOpen, setIsManualPaymentOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);

  // Manual payment form
  const [manualAmount, setManualAmount] = useState('');
  const [manualChannel, setManualChannel] = useState('cash');
  const [manualNote, setManualNote] = useState('');

  // Fee structure form
  const [structClassId, setStructClassId] = useState('');
  const [structName, setStructName] = useState('');
  const [structAmount, setStructAmount] = useState('');
  const [structDueDate, setStructDueDate] = useState('');

  const fetchFeesData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Invoices with student and class info
      const { data: invData, error: iErr } = await supabase
        .from('invoices')
        .select(`
          *,
          students (
            id, first_name, last_name, admission_number, class_id,
            classes (name, arm)
          ),
          terms (name)
        `)
        .order('created_at', { ascending: false });

      if (iErr) throw iErr;
      setInvoices(invData || []);

      // 2. Fetch Fee Structures
      const { data: strData, error: sErr } = await supabase
        .from('fee_structures')
        .select(`
          *,
          classes (name, arm),
          terms (name)
        `)
        .order('created_at', { ascending: false });

      if (sErr) throw sErr;
      setFeeStructures(strData || []);

      // 3. Fetch Payments Ledger
      const { data: payData, error: pErr } = await supabase
        .from('payments')
        .select(`
          *,
          students (first_name, last_name, admission_number),
          invoices (invoice_number, total_amount, balance)
        `)
        .order('created_at', { ascending: false });

      if (pErr) throw pErr;
      setPaymentsLedger(payData || []);
    } catch (err) {
      console.error('Error fetching fees data:', err);
      showToast('Error loading financial ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeesData();
  }, []);

  // Summary Metrics
  const totalInvoiced = invoices.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
  const totalCollected = invoices.reduce((acc, curr) => acc + Number(curr.paid_amount || 0), 0);
  const totalOutstanding = invoices.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const sName = `${inv.students?.first_name} ${inv.students?.last_name} ${inv.students?.admission_number} ${inv.invoice_number}`.toLowerCase();
    const matchesSearch = sName.includes(searchQuery.toLowerCase());
    const matchesClass = !classFilter || inv.students?.class_id === classFilter;
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  // Handle Manual Payment Recording
  const handleRecordManualPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment || Number(manualAmount) <= 0) return;

    try {
      const ref = `MAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const { data, error } = await supabase.rpc('process_verified_payment', {
        p_invoice_id: selectedInvoiceForPayment.id,
        p_student_id: selectedInvoiceForPayment.student_id,
        p_amount: Number(manualAmount),
        p_reference: ref,
        p_paystack_ref: null,
        p_channel: manualChannel,
        p_metadata: { notes: manualNote, recorded_by_admin: true }
      });

      if (error) throw error;

      // Dispatch SMS confirmation
      try {
        await sendSmsNotification({
          recipientPhone: selectedInvoiceForPayment.students?.phone || '08034567890',
          recipientName: `${selectedInvoiceForPayment.students?.first_name || ''} ${selectedInvoiceForPayment.students?.last_name || ''}`.trim() || 'Parent',
          eventType: 'FEE_PAYMENT',
          message: `Faith Spring School: Payment of ₦${Number(manualAmount).toLocaleString()} recorded for ${selectedInvoiceForPayment.students?.first_name || 'Pupil'} (${selectedInvoiceForPayment.invoice_number}). Channel: ${manualChannel.toUpperCase()}. Ref: ${ref}`,
          referenceId: ref,
        });
      } catch (smsErr) {
        console.warn('SMS dispatch error:', smsErr);
      }

      showToast(`Payment of ₦${Number(manualAmount).toLocaleString()} recorded successfully!`);
      setIsManualPaymentOpen(false);
      fetchFeesData();

      // Show instant receipt
      if (data?.receipt) {
        setSelectedReceipt({
          ...data.receipt,
          student_name: `${selectedInvoiceForPayment.students?.first_name} ${selectedInvoiceForPayment.students?.last_name}`,
          admission_number: selectedInvoiceForPayment.students?.admission_number,
          description: `Fee Payment - ${selectedInvoiceForPayment.invoice_number}`
        });
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Create Fee Structure
  const handleCreateStructure = async (e) => {
    e.preventDefault();
    if (!structClassId || !structName || Number(structAmount) <= 0 || !activeTerm.id) return;

    try {
      const { error } = await supabase.from('fee_structures').insert({
        term_id: activeTerm.id,
        class_id: structClassId,
        name: structName,
        amount: Number(structAmount),
        due_date: structDueDate || null,
        is_compulsory: true,
      });

      if (error) throw error;
      showToast('Fee structure item added successfully');
      setIsStructureModalOpen(false);
      fetchFeesData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // CSV Export for Outstanding Balances
  const exportDebtorsList = () => {
    const debtors = invoices.filter(i => Number(i.balance) > 0);
    const headers = ['Invoice No,Admission No,Student Name,Class,Total Fee,Amount Paid,Outstanding Balance,Status'];
    const rows = debtors.map(i => {
      const s = i.students;
      const c = s?.classes ? `${s.classes.name} ${s.classes.arm}` : '';
      return `"${i.invoice_number}","${s?.admission_number}","${s?.first_name} ${s?.last_name}","${c}",${i.total_amount},${i.paid_amount},${i.balance},"${i.status}"`;
    });
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Faith_Spring_School_Outstanding_Fees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-navy">Fees & Bursary Management</h1>
          <p className="text-xs text-slate-500">
            Automated Paystack collections, student invoices, receipts, and installment ledgers
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportDebtorsList}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <Download size={15} />
            <span>Debtors List (CSV)</span>
          </button>
          <button
            onClick={() => {
              setStructClassId(classes[0]?.id || '');
              setStructName('');
              setStructAmount('');
              setIsStructureModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-blue/30 transition-all"
          >
            <Plus size={16} />
            <span>Add Fee Structure</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-200">
          <span className="text-slate-400 font-bold uppercase text-[10px] block">Total Invoiced (Term)</span>
          <div className="text-xl font-black text-slate-900 mt-1">₦{totalInvoiced.toLocaleString()}</div>
          <span className="text-[11px] text-slate-500">{invoices.length} Invoices generated</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-200">
          <span className="text-emerald-600 font-bold uppercase text-[10px] block">Total Collected</span>
          <div className="text-xl font-black text-emerald-600 mt-1">₦{totalCollected.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-700 font-semibold">{collectionRate}% collection rate</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-200">
          <span className="text-amber-600 font-bold uppercase text-[10px] block">Outstanding Balance</span>
          <div className="text-xl font-black text-amber-600 mt-1">₦{totalOutstanding.toLocaleString()}</div>
          <span className="text-[11px] text-amber-700 font-semibold">Pending collections</span>
        </div>

        <div className="bg-gradient-to-br from-brand-navy to-slate-900 text-white p-5 rounded-2xl shadow-card border border-slate-800">
          <span className="text-amber-400 font-bold uppercase text-[10px] block flex items-center justify-between">
            <span>Paystack Gateway</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </span>
          <div className="text-base font-bold mt-1">Instant Online Payments</div>
          <span className="text-[11px] text-slate-300">Automated Server Verification Active</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'invoices' ? 'border-brand-blue text-brand-blue font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Student Invoices & Payments ({filteredInvoices.length})
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'structures' ? 'border-brand-blue text-brand-blue font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Fee Structures ({feeStructures.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'ledger' ? 'border-brand-blue text-brand-blue font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payments Audit Ledger ({paymentsLedger.length})
        </button>
      </div>

      {/* Tab 1: Student Invoices */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="py-2 px-3 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
              >
                <option value="">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
              >
                <option value="">All Statuses</option>
                <option value="paid">Fully Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>

              <button onClick={fetchFeesData} className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600">
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Class</th>
                    <th className="py-3 px-3">Total Amount</th>
                    <th className="py-3 px-3">Paid Amount</th>
                    <th className="py-3 px-3">Balance</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredInvoices.map(inv => {
                    const student = inv.students;
                    const isFullyPaid = inv.status === 'paid';
                    const isPartial = inv.status === 'partially_paid';

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900">{student?.first_name} {student?.last_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{student?.admission_number}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-[11px]">
                            {student?.classes?.name} {student?.classes?.arm}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-800">
                          ₦{Number(inv.total_amount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-emerald-600">
                          ₦{Number(inv.paid_amount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-amber-600">
                          ₦{Number(inv.balance).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            isFullyPaid ? 'bg-emerald-100 text-emerald-800' :
                            isPartial ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {inv.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {!isFullyPaid && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedInvoiceForPayment(inv);
                                    setManualAmount(inv.balance);
                                    setIsManualPaymentOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold"
                                  title="Record Cash/Bank Payment"
                                >
                                  Record
                                </button>
                                <button
                                  onClick={() => setPaystackInvoice({
                                    invoice: inv,
                                    student: student
                                  })}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm"
                                  title="Pay via Paystack"
                                >
                                  Paystack
                                </button>
                              </>
                            )}
                            {Number(inv.paid_amount) > 0 && (
                              <button
                                onClick={() => setSelectedReceipt({
                                  receipt_number: `REC-${inv.invoice_number}`,
                                  student_name: `${student?.first_name} ${student?.last_name}`,
                                  admission_number: student?.admission_number,
                                  amount_paid: inv.paid_amount,
                                  balance_remaining: inv.balance,
                                  payment_method: 'Validated Payment',
                                  payment_reference: `REF-${inv.invoice_number}`
                                })}
                                className="p-1 hover:bg-blue-50 text-brand-blue rounded-lg"
                                title="View Receipt"
                              >
                                <Receipt size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Fee Structures */}
      {activeTab === 'structures' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Configured Fee Schedule per Class</h3>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {feeStructures.map(str => (
              <div key={str.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{str.name}</div>
                  <div className="text-slate-500">{str.classes?.name} {str.classes?.arm} • Due: {str.due_date || 'End of Term'}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-brand-navy text-sm">₦{Number(str.amount).toLocaleString()}</div>
                  <span className="text-[10px] text-emerald-600 font-bold">Compulsory</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Payments Audit Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Payments Audit Trail</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-3">Pupil</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Channel</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paymentsLedger.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-brand-blue">{p.payment_reference}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {p.students?.first_name} {p.students?.last_name} ({p.students?.admission_number})
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">₦{Number(p.amount).toLocaleString()}</td>
                    <td className="py-3 px-3 uppercase text-slate-600 font-semibold">{p.channel}</td>
                    <td className="py-3 px-3 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-3">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paystack Checkout Modal */}
      {paystackInvoice && (
        <PaystackCheckoutModal
          invoice={paystackInvoice.invoice}
          student={paystackInvoice.student}
          onSuccess={(receipt) => {
            setPaystackInvoice(null);
            fetchFeesData();
            setSelectedReceipt(receipt);
            showToast('Payment verified successfully via Paystack!');
          }}
          onClose={() => setPaystackInvoice(null)}
        />
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* Manual Payment Modal */}
      {isManualPaymentOpen && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-xs border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-2">Record Offline Fee Payment</h3>
            <p className="text-slate-500 mb-4">
              Enter cash, direct bank transfer or POS collection for {selectedInvoiceForPayment.students?.first_name} {selectedInvoiceForPayment.students?.last_name}
            </p>

            <form onSubmit={handleRecordManualPayment} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Amount Paid (₦) *</label>
                <input
                  type="number"
                  required
                  min="500"
                  max={selectedInvoiceForPayment.balance}
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
                <select
                  value={manualChannel}
                  onChange={(e) => setManualChannel(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                >
                  <option value="cash">Cash in Bursary</option>
                  <option value="bank_transfer">Direct Bank Transfer</option>
                  <option value="pos">POS Terminal</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes / Bank Teller Ref</label>
                <input
                  type="text"
                  placeholder="e.g. First Bank Transfer #109283"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsManualPaymentOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  Save & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Structure Modal */}
      {isStructureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-xs border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-4">Add Class Fee Structure Item</h3>
            <form onSubmit={handleCreateStructure} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Class *</label>
                <select
                  value={structClassId}
                  onChange={(e) => setStructClassId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Fee Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tuition Fee, PTA Levy, Exam Fee"
                  value={structName}
                  onChange={(e) => setStructName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Amount (₦) *</label>
                <input
                  type="number"
                  required
                  min="100"
                  step="100"
                  value={structAmount}
                  onChange={(e) => setStructAmount(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Due Date</label>
                <input
                  type="date"
                  value={structDueDate}
                  onChange={(e) => setStructDueDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsStructureModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl font-bold"
                >
                  Save Fee Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesModule;
