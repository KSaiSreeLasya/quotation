import React, { useState } from 'react';
import { X, Download, Mail, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { QuotationData } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface QuotationPreviewProps {
  data: QuotationData;
  address: string;
  onClose: () => void;
}

const QuotationPreview: React.FC<QuotationPreviewProps> = ({ data, address, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPDF = async () => {
    const element = document.getElementById('quotation-content');
    if (!element) return;

    setIsDownloading(true);
    try {
      // Add a temporary class to handle problematic CSS during capture
      element.classList.add('pdf-capture');
      
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        backgroundColor: '#ffffff',
        ignoreElements: (el) => el.classList.contains('no-pdf'),
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('quotation-content');
          if (clonedElement) {
            const allElements = clonedElement.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
              const el = allElements[i] as HTMLElement;
              try {
                // Remove problematic filters
                el.style.backdropFilter = 'none';
                (el.style as any).webkitBackdropFilter = 'none';
                el.style.filter = 'none';
                el.style.transition = 'none';
                el.style.animation = 'none';
                
                // Get computed style to check for oklab/oklch
                const computed = window.getComputedStyle(el);
                
                // Check color
                if (computed.color.includes('okl')) {
                  el.style.color = '#0f172a'; // Default slate-900
                }
                
                // Check background
                if (computed.backgroundColor.includes('okl')) {
                  if (el.classList.contains('bg-amber-500')) el.style.backgroundColor = '#f59e0b';
                  else if (el.classList.contains('bg-slate-50')) el.style.backgroundColor = '#f8fafc';
                  else if (el.classList.contains('bg-slate-900')) el.style.backgroundColor = '#0f172a';
                  else if (el.classList.contains('bg-emerald-50')) el.style.backgroundColor = '#ecfdf5';
                  else el.style.backgroundColor = 'transparent';
                }
                
                // Check border
                if (computed.borderColor.includes('okl')) {
                  el.style.borderColor = '#e2e8f0'; // Default slate-200
                }

                // Check fill/stroke for SVG elements
                if (el instanceof SVGElement) {
                  const fill = el.getAttribute('fill');
                  if (fill && fill.includes('okl')) el.setAttribute('fill', 'currentColor');
                  const stroke = el.getAttribute('stroke');
                  if (stroke && stroke.includes('okl')) el.setAttribute('stroke', 'currentColor');
                }
              } catch (e) {
                // Ignore errors for individual elements
              }
            }
          }
        }
      });

      element.classList.remove('pdf-capture');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      // Add image with margins
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Solar_Quotation_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Failed to generate PDF. Please try again or check the console for details.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/send-quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, quotationData: data }),
      });
      const result = await response.json();
      if (result.success) {
        setSent(true);
        setTimeout(() => setSent(false), 3000);
      }
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Solar Quotation</h2>
              <p className="text-xs text-slate-500">Ref: SQ-{new Date().getFullYear()}-{Math.floor(Math.random() * 10000)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8" id="quotation-content">
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Customer Details</h3>
                <p className="text-lg font-semibold text-slate-900">{data.customerName || 'N/A'}</p>
                <p className="text-sm text-slate-600">{data.customerContact || 'N/A'}</p>
                <p className="text-sm text-slate-500 mt-2">{address}</p>
                <p className="text-sm text-slate-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
              </div>

              {data.designImage && (
                <div className="mt-8">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Roof Design Layout</h3>
                  <div className="relative aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                    <img 
                      src={data.designImage} 
                      alt="Solar Design" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-500">
                      DESIGN PREVIEW
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 italic">
                    * Layout shows panels relative to the defined roof boundary.
                  </p>
                </div>
              )}

              <div className="mt-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">System Specification</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-600">Number of Panels</span>
                    <span className="font-bold text-slate-900">{data.panelCount}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-600">Total System Size</span>
                    <span className="font-bold text-slate-900">{data.systemSizeKw.toFixed(2)} kW</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-600">Roof Orientation</span>
                    <span className="font-bold text-slate-900">{data.orientation}° ({(data.efficiencyFactor * 100).toFixed(0)}% efficiency)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-600">Shading Factor</span>
                    <span className="font-bold text-slate-900">{(data.shadeFactor * 100).toFixed(0)}% exposure</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-600">Est. Annual Generation</span>
                    <span className="font-bold text-slate-900">{data.annualGenerationKwh.toLocaleString()} kWh</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-600">Est. Annual Savings</span>
                    <span className="font-bold text-emerald-600">₹{data.annualSavings.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Investment Breakdown</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Solar Panels ({data.panelCount} units)</span>
                  <span className="font-medium text-slate-900">₹{data.breakdown.panels.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Mounting Structure</span>
                  <span className="font-medium text-slate-900">₹{data.breakdown.structure.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Inverter & Components</span>
                  <span className="font-medium text-slate-900">₹{data.breakdown.inverter.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Installation & Labor</span>
                  <span className="font-medium text-slate-900">₹{data.breakdown.installation.toLocaleString()}</span>
                </div>
                
                <div className="pt-4 border-t border-slate-200 flex justify-between">
                  <span className="font-bold text-slate-900">Total System Cost</span>
                  <span className="font-bold text-slate-900">₹{data.totalCost.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-emerald-600 font-medium bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <span>Government Subsidy (30%)</span>
                  <span>-₹{data.subsidy.toLocaleString()}</span>
                </div>

                <div className="pt-6 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Final Amount</p>
                    <p className="text-3xl font-black text-slate-900">₹{data.finalAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payback Period</p>
                    <p className="text-lg font-bold text-slate-900">~{(data.finalAmount / data.annualSavings).toFixed(1)} Years</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">25-Year Savings</p>
                    <p className="text-lg font-bold text-emerald-700">₹{(data.annualSavings * 25 * 0.9).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-8">
          <div className="flex gap-3">
            <button
              onClick={downloadPDF}
              disabled={isDownloading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </button>
          </div>

          <form onSubmit={handleSendEmail} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm"
            />
            <button
              type="submit"
              disabled={isSending || sent}
              className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                sent 
                ? 'bg-emerald-500 text-white' 
                : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {isSending ? <Loader2 size={18} className="animate-spin" /> : sent ? <CheckCircle2 size={18} /> : <Mail size={18} />}
              {sent ? 'Sent!' : 'Email'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuotationPreview;
