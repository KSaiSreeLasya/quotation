import React, { useState } from 'react';
import { X, Download, Mail, CheckCircle2, Loader2, FileText, Plus, Trash2 } from 'lucide-react';
import { QuotationData, BillOfMaterial } from '../types';
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

  // Editable quotation fields
  const [panelDescription, setPanelDescription] = useState('Design, Engineering, Supply, Installation and Commissioning of Solar On Grid Power Plant');
  const [panelQty, setPanelQty] = useState(data.panelCount);
  const [panelPrice, setPanelPrice] = useState(data.panelCost ? data.panelCost / data.panelCount : 0);
  const [panelGst, setPanelGst] = useState(data.panelGstPercent);

  const [netMeterDescription, setNetMeterDescription] = useState('Net-Meter Application Fee');
  const [netMeterQty, setNetMeterQty] = useState(1);
  const [netMeterPrice, setNetMeterPrice] = useState(data.netMeterCost || 0);
  const [netMeterGst, setNetMeterGst] = useState(data.netMeterGstPercent);

  const [subsidyDescription, setSubsidyDescription] = useState('Subsidy Application Charges');
  const [subsidyQty, setSubsidyQty] = useState(1);
  const [subsidyPrice, setSubsidyPrice] = useState(data.subsidyCharges || 0);
  const [subsidyGst, setSubsidyGst] = useState(data.subsidyGstPercent);

  // Electricity bill fields
  const [monthlyBillBefore, setMonthlyBillBefore] = useState(data.monthlyBillBefore || 2330);
  const [monthlyBillAfter, setMonthlyBillAfter] = useState(data.monthlyBillAfter || 97.5);
  const [monthlyUnitsBefore, setMonthlyUnitsBefore] = useState(data.monthlyUnitsConsumedBefore || 360);
  const [monthlyUnitsAfter, setMonthlyUnitsAfter] = useState(data.monthlyUnitsConsumedAfter || 50);
  const [tariffIncrement, setTariffIncrement] = useState(data.tariffIncrement || 2);

  // Bill of materials
  const [billOfMaterials, setBillOfMaterials] = useState<BillOfMaterial[]>(
    data.billOfMaterials || [
      { id: '1', sNo: 1, description: 'Solar PV Module: 545Wp Mono PERKT Half cut Bifacial', specifications: '', make: 'RENEW/SAATVIK/ADAANI', uom: 'No', quantity: 6 },
      { id: '2', sNo: 2, description: 'Solar Grid tied inverter: 3kw_1_Phase_MPPT', specifications: '', make: 'SOFAR/FESTON', uom: 'No', quantity: 1 },
      { id: '3', sNo: 3, description: 'Module Mounting Structure: 100% Complete Hot Dip Galvanized', specifications: '', make: 'AXISO', uom: 'Set', quantity: 1 },
      { id: '4', sNo: 4, description: 'DC Distribution Box: IP65 Thermo Plastic Enclosure', specifications: '', make: 'AXISO', uom: 'Set', quantity: 1 },
      { id: '5', sNo: 5, description: 'AC Distribution Box: IP65 Thermo Plastic Enclosure', specifications: '', make: 'AXISO', uom: 'Set', quantity: 1 },
    ]
  );

  // Calculate totals
  const panelSubTotal = panelPrice * panelQty;
  const panelTotal = panelSubTotal * (1 + panelGst / 100);

  const netMeterSubTotal = netMeterPrice * netMeterQty;
  const netMeterTotal = netMeterSubTotal * (1 + netMeterGst / 100);

  const subsidySubTotal = subsidyPrice * subsidyQty;
  const subsidyTotal = subsidySubTotal * (1 + subsidyGst / 100);

  const grandTotal = panelTotal + netMeterTotal + subsidyTotal;
  const avgPriceBeforeSolar = monthlyBillBefore > 0 ? (monthlyBillBefore / monthlyUnitsBefore).toFixed(2) : '0';
  const avgPriceAfterSolar = monthlyBillAfter > 0 ? (monthlyBillAfter / monthlyUnitsAfter).toFixed(2) : '0';
  const annualBillBefore = monthlyBillBefore * 12;
  const powerBill25Years = annualBillBefore * 25 * Math.pow(1 + tariffIncrement / 100, 12);

  const addMaterialRow = () => {
    const newMaterial: BillOfMaterial = {
      id: Date.now().toString(),
      sNo: billOfMaterials.length + 1,
      description: '',
      specifications: '',
      make: '',
      uom: 'No',
      quantity: 1,
    };
    setBillOfMaterials([...billOfMaterials, newMaterial]);
  };

  const removeMaterialRow = (id: string) => {
    setBillOfMaterials(billOfMaterials.filter(m => m.id !== id));
  };

  const updateMaterial = (id: string, field: keyof BillOfMaterial, value: any) => {
    setBillOfMaterials(
      billOfMaterials.map(m => 
        m.id === id ? { ...m, [field]: value } : m
      )
    );
  };

  const convertOklabToHex = (computedStyle: CSSStyleDeclaration): void => {
    // Color mappings for common Tailwind colors used in the quotation
    const oklabToHex: { [key: string]: string } = {
      'oklab(0.972 -0.016 -0.038)': '#f8fafc', // slate-50
      'oklab(0.991 -0.002 0.01)': '#ffffff', // white
      'oklab(0.1 0 0)': '#000000', // black
      'oklab(0.096 0 0)': '#0f172a', // slate-900
      'oklab(0.155 0 0)': '#1e293b', // slate-800
      'oklab(0.965 -0.015 -0.035)': '#f1f5f9', // slate-100
      'oklab(0.944 -0.014 -0.032)': '#e2e8f0', // slate-200
      'oklab(0.965 -0.007 0.02)': '#ecfdf5', // emerald-50
      'oklab(0.955 -0.011 0.024)': '#d1fae5', // emerald-100
      'oklab(0.855 -0.019 0.044)': '#10b981', // emerald-500
      'oklab(0.155 0.007 0.044)': '#065f46', // emerald-900
      'oklab(0.975 -0.008 0.028)': '#dcfce7', // green-100
      'oklab(0.855 -0.014 0.036)': '#22c55e', // green-500
      'oklab(0.976 -0.006 0.032)': '#fef3c7', // amber-100
      'oklab(0.964 0.018 0.101)': '#f59e0b', // amber-500
      'oklab(0.143 0.064 0.109)': '#92400e', // amber-900
    };

    const style = computedStyle.color + (computedStyle.backgroundColor ? ',' + computedStyle.backgroundColor : '');

    // Try to replace oklab colors
    for (const [oklab, hex] of Object.entries(oklabToHex)) {
      if (computedStyle.color.includes('oklab')) {
        // Map common oklab values to hex
        if (computedStyle.color.includes('0.096')) {
          (computedStyle as any).color = '#0f172a';
        } else if (computedStyle.color.includes('0.155')) {
          (computedStyle as any).color = '#1e293b';
        } else {
          (computedStyle as any).color = '#000000';
        }
      }

      if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('oklab')) {
        if (computedStyle.backgroundColor.includes('0.965') && computedStyle.backgroundColor.includes('-0.015')) {
          (computedStyle as any).backgroundColor = '#f8fafc';
        } else if (computedStyle.backgroundColor.includes('0.944')) {
          (computedStyle as any).backgroundColor = '#e2e8f0';
        } else if (computedStyle.backgroundColor.includes('0.965') && computedStyle.backgroundColor.includes('-0.007')) {
          (computedStyle as any).backgroundColor = '#ecfdf5';
        } else if (computedStyle.backgroundColor.includes('0.976') && computedStyle.backgroundColor.includes('-0.008')) {
          (computedStyle as any).backgroundColor = '#dcfce7';
        } else if (computedStyle.backgroundColor.includes('0.964') && computedStyle.backgroundColor.includes('0.018')) {
          (computedStyle as any).backgroundColor = '#f59e0b';
        } else if (computedStyle.backgroundColor.includes('0.975') && computedStyle.backgroundColor.includes('-0.006')) {
          (computedStyle as any).backgroundColor = '#fef3c7';
        } else {
          (computedStyle as any).backgroundColor = '#ffffff';
        }
      }
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('quotation-content');
    if (!element) return;

    setIsDownloading(true);
    try {
      // Create a temporary print-friendly container
      const printContainer = document.createElement('div');
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '-9999px';
      printContainer.style.width = '1200px';
      printContainer.style.backgroundColor = '#ffffff';
      printContainer.innerHTML = element.innerHTML;

      // Process all elements to fix oklab colors and convert inputs
      const allElements = printContainer.querySelectorAll('*');
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const computed = window.getComputedStyle(htmlEl);

        // Fix oklab colors
        if (computed.color.includes('oklab')) {
          if (computed.color.includes('0.096')) {
            htmlEl.style.color = '#0f172a';
          } else if (computed.color.includes('0.155')) {
            htmlEl.style.color = '#1e293b';
          } else if (computed.color.includes('0.972')) {
            htmlEl.style.color = '#64748b';
          } else {
            htmlEl.style.color = '#000000';
          }
        }

        if (computed.backgroundColor.includes('oklab')) {
          if (computed.backgroundColor.includes('0.972') || computed.backgroundColor.includes('0.975')) {
            htmlEl.style.backgroundColor = '#f8fafc';
          } else if (computed.backgroundColor.includes('0.965') && computed.backgroundColor.includes('-0.015')) {
            htmlEl.style.backgroundColor = '#f8fafc';
          } else if (computed.backgroundColor.includes('0.944')) {
            htmlEl.style.backgroundColor = '#e2e8f0';
          } else if (computed.backgroundColor.includes('0.965') && computed.backgroundColor.includes('-0.007')) {
            htmlEl.style.backgroundColor = '#ecfdf5';
          } else if (computed.backgroundColor.includes('0.976') && computed.backgroundColor.includes('-0.008')) {
            htmlEl.style.backgroundColor = '#dcfce7';
          } else if (computed.backgroundColor.includes('0.964') && computed.backgroundColor.includes('0.018')) {
            htmlEl.style.backgroundColor = '#f59e0b';
          } else {
            htmlEl.style.backgroundColor = '#ffffff';
          }
        }

        if (computed.borderColor.includes('oklab')) {
          htmlEl.style.borderColor = '#e2e8f0';
        }
      });

      // Replace all input values with text
      const inputs = printContainer.querySelectorAll('input, textarea');
      inputs.forEach((input) => {
        const span = document.createElement('span');
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
          span.textContent = input.value;
          span.style.color = '#0f172a';
          span.style.fontWeight = input.className.includes('font-bold') ? 'bold' : 'normal';
          span.style.display = 'block';
          span.style.padding = '4px 8px';
          span.style.border = '1px solid #cbd5e1';
          span.style.borderRadius = '4px';
          span.style.backgroundColor = '#ffffff';
          (input.parentNode as HTMLElement)?.replaceChild(span, input);
        }
      });

      // Replace select elements with their selected text
      const selects = printContainer.querySelectorAll('select');
      selects.forEach((select) => {
        const span = document.createElement('span');
        span.textContent = select.value;
        span.style.color = '#0f172a';
        span.style.display = 'block';
        span.style.padding = '4px 8px';
        span.style.border = '1px solid #cbd5e1';
        span.style.borderRadius = '4px';
        span.style.backgroundColor = '#ffffff';
        (select.parentNode as HTMLElement)?.replaceChild(span, select);
      });

      // Remove buttons
      const buttons = printContainer.querySelectorAll('button');
      buttons.forEach(btn => btn.remove());

      document.body.appendChild(printContainer);

      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(printContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowHeight: printContainer.scrollHeight,
        windowWidth: 1200,
      });

      document.body.removeChild(printContainer);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let position = 0;

      while (position < imgHeight) {
        if (position > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imgData,
          'PNG',
          0,
          -(position),
          pdfWidth,
          imgHeight
        );

        position += pdfHeight;
      }

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
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
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
          <div className="space-y-8">
            {/* Header Section */}
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Customer Details</h3>
                <p className="text-lg font-semibold text-slate-900">{data.customerName || 'N/A'}</p>
                <p className="text-sm text-slate-600">{data.customerContact || 'N/A'}</p>
                <p className="text-sm text-slate-500 mt-2">{address}</p>
                <p className="text-sm text-slate-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
              </div>

              {data.designImage && (
                <div>
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
                </div>
              )}
            </div>

            {/* Electricity Bill Comparison */}
            <div className="border-t border-slate-200 pt-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Electricity Bill Analysis</h3>
              <div className="grid grid-cols-2 gap-6">
                {/* Before Solar */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 p-4 border-b border-slate-300">
                    <h4 className="text-sm font-bold text-slate-900">Before Solar Installation</h4>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <label className="font-semibold text-slate-600">Monthly Units (kWh)</label>
                      <input 
                        type="number" 
                        value={monthlyUnitsBefore} 
                        onChange={(e) => setMonthlyUnitsBefore(parseFloat(e.target.value) || 0)}
                        className="border border-slate-300 rounded px-2 py-1"
                      />
                      <label className="font-semibold text-slate-600">Monthly Bill (₹)</label>
                      <input 
                        type="number" 
                        value={monthlyBillBefore} 
                        onChange={(e) => setMonthlyBillBefore(parseFloat(e.target.value) || 0)}
                        className="border border-slate-300 rounded px-2 py-1"
                      />
                      <label className="font-semibold text-slate-600 col-span-2">Avg Price/Unit: ₹{avgPriceBeforeSolar}</label>
                    </div>
                  </div>
                </div>

                {/* After Solar */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-green-100 p-4 border-b border-slate-300">
                    <h4 className="text-sm font-bold text-slate-900">After Solar Installation</h4>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <label className="font-semibold text-slate-600">Monthly Units (kWh)</label>
                      <input 
                        type="number" 
                        value={monthlyUnitsAfter} 
                        onChange={(e) => setMonthlyUnitsAfter(parseFloat(e.target.value) || 0)}
                        className="border border-slate-300 rounded px-2 py-1"
                      />
                      <label className="font-semibold text-slate-600">Monthly Bill (₹)</label>
                      <input 
                        type="number" 
                        value={monthlyBillAfter} 
                        onChange={(e) => setMonthlyBillAfter(parseFloat(e.target.value) || 0)}
                        className="border border-slate-300 rounded px-2 py-1"
                      />
                      <label className="font-semibold text-slate-600 col-span-2">Avg Price/Unit: ₹{avgPriceAfterSolar}</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-emerald-700 font-semibold">Monthly Savings</p>
                    <p className="text-2xl font-bold text-emerald-900">₹{(monthlyBillBefore - monthlyBillAfter).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-emerald-700 font-semibold">Annual Savings</p>
                    <p className="text-2xl font-bold text-emerald-900">₹{((monthlyBillBefore - monthlyBillAfter) * 12).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-emerald-700 font-semibold">Tariff Increment</p>
                    <input 
                      type="number" 
                      value={tariffIncrement} 
                      onChange={(e) => setTariffIncrement(parseFloat(e.target.value) || 0)}
                      className="border border-emerald-300 rounded px-2 py-1 w-20"
                      step="0.1"
                    />
                    <span className="ml-2 text-slate-600">% per year</span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Specification */}
            <div className="border-t border-slate-200 pt-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">System Specification</h3>
              <div className="grid grid-cols-2 gap-4">
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

            {/* Quotation Table */}
            <div className="border-t border-slate-200 pt-8">
              <h3 className="text-lg font-bold text-slate-900 text-center mb-6">QUOTATION</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-200 border border-slate-300">
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-900">Description</th>
                      <th className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-900 w-16">Qty</th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold text-slate-900 w-20">Price(₹)</th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold text-slate-900 w-20">Sub(₹)</th>
                      <th className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-900 w-16">GST%</th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold text-slate-900 w-20">Total(₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Solar Panels Row */}
                    <tr className="border border-slate-300">
                      <td className="border border-slate-300 px-3 py-2 text-slate-900">
                        <textarea
                          value={panelDescription}
                          onChange={(e) => setPanelDescription(e.target.value)}
                          className="w-full p-1 border border-slate-300 rounded text-xs resize-none font-semibold"
                          rows={2}
                        />
                        <div className="text-[10px] text-slate-600 mt-1">Cap: {data.systemSizeKw.toFixed(2)}kWp</div>
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        <input
                          type="number"
                          value={panelQty}
                          onChange={(e) => setPanelQty(parseInt(e.target.value) || 0)}
                          className="w-full p-1 border border-slate-300 rounded text-xs text-center"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right">
                        <input
                          type="number"
                          value={panelPrice}
                          onChange={(e) => setPanelPrice(parseFloat(e.target.value) || 0)}
                          className="w-full p-1 border border-slate-300 rounded text-xs text-right"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right text-slate-900 font-semibold text-xs">{panelSubTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        <input
                          type="number"
                          value={panelGst}
                          onChange={(e) => setPanelGst(parseFloat(e.target.value) || 0)}
                          className="w-full p-1 border border-slate-300 rounded text-xs text-center"
                          step="0.1"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-bold text-slate-900 text-xs">{panelTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    </tr>

                    {/* Net Meter Row */}
                    <tr className="border border-slate-300">
                      <td className="border border-slate-300 px-3 py-2 text-slate-900">
                        <input
                          type="text"
                          value={netMeterDescription}
                          onChange={(e) => setNetMeterDescription(e.target.value)}
                          className="w-full p-1 border border-slate-300 rounded text-xs font-semibold"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        <input
                          type="number"
                          value={netMeterQty}
                          onChange={(e) => setNetMeterQty(parseInt(e.target.value) || 0)}
                          className="w-full p-1 border border-slate-300 rounded text-xs text-center"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right">
                        <input
                          type="number"
                          value={netMeterPrice}
                          onChange={(e) => setNetMeterPrice(parseFloat(e.target.value) || 0)}
                          className="w-full p-1 border border-slate-300 rounded text-xs text-right"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right text-slate-900 font-semibold text-xs">{netMeterSubTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        <input
                          type="number"
                          value={netMeterGst}
                          onChange={(e) => setNetMeterGst(parseFloat(e.target.value) || 0)}
                          className="w-full p-1 border border-slate-300 rounded text-xs text-center"
                          step="0.1"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-bold text-slate-900 text-xs">{netMeterTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    </tr>

                    {/* Subsidy Row */}
                    <tr className="border border-slate-300">
                      <td className="border border-slate-300 px-3 py-2 text-slate-900">
                        <input
                          type="text"
                          value={subsidyDescription}
                          onChange={(e) => setSubsidyDescription(e.target.value)}
                          className="w-full p-1 border border-slate-300 rounded text-xs font-semibold"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        <input
                          type="number"
                          value={subsidyQty}
                          onChange={(e) => setSubsidyQty(parseInt(e.target.value) || 0)}
                          className="w-full p-1 border border-slate-300 rounded text-xs text-center"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right">
                        <input
                          type="number"
                          value={subsidyPrice}
                          onChange={(e) => setSubsidyPrice(parseFloat(e.target.value) || 0)}
                          className="w-full p-1 border border-slate-300 rounded text-xs text-right"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right text-slate-900 font-semibold text-xs">{subsidySubTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        <input
                          type="number"
                          value={subsidyGst}
                          onChange={(e) => setSubsidyGst(parseFloat(e.target.value) || 0)}
                          className="w-full p-1 border border-slate-300 rounded text-xs text-center"
                          step="0.1"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-bold text-slate-900 text-xs">{subsidyTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    </tr>

                    {/* Total Row */}
                    <tr className="bg-amber-50 border border-slate-300 font-bold">
                      <td colSpan={4} className="border border-slate-300 px-3 py-2 text-right text-slate-900 text-sm">TOTAL</td>
                      <td className="border border-slate-300 px-3 py-2 text-center text-slate-900"></td>
                      <td className="border border-slate-300 px-3 py-2 text-right text-amber-700 bg-amber-100 text-sm">{grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Section */}
              <div className="space-y-3 mt-6">
                <div className="flex justify-between text-base p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-900">Subsidy will be credited in your Bank account</span>
                  <span className="font-bold text-emerald-600">₹{(data.subsidy || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-base bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <span className="font-bold text-slate-900">Net Amount to Customer on Solar Investment</span>
                  <span className="font-bold text-amber-700">
                    ₹{(grandTotal - (data.subsidy || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Profit with Solar Section */}
            <div className="border-t border-slate-200 pt-8">
              <div className="bg-green-100 p-6 rounded-lg border border-green-300">
                <h3 className="text-lg font-bold text-slate-900 mb-6 text-center">Profit With Solar</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-green-300">
                    <span className="font-semibold text-slate-900">Present Power Bill</span>
                    <span className="font-bold text-slate-900">₹{monthlyBillBefore.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between py-3 border-b border-green-300">
                    <span className="font-semibold text-slate-900">Power Bill For Next 1 year</span>
                    <span className="font-bold text-slate-900">₹{(annualBillBefore).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between py-3 border-b border-green-300">
                    <span className="font-semibold text-slate-900">Tariff Increment Year on Year</span>
                    <span className="font-bold text-slate-900">{tariffIncrement}%</span>
                  </div>
                  
                  <div className="flex justify-between py-3 border-b border-green-300">
                    <span className="font-semibold text-slate-900">Power Bill For Next 25 years</span>
                    <span className="font-bold text-slate-900">₹{powerBill25Years.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  
                  <div className="flex justify-between py-3 border-b border-green-300">
                    <span className="font-semibold text-slate-900">Proposed Solar power plant</span>
                    <span className="font-bold text-slate-900">{data.systemSizeKw.toFixed(2)} kWp</span>
                  </div>
                  
                  <div className="flex justify-between py-3 border-b border-green-300">
                    <span className="font-semibold text-slate-900">One Time Investment</span>
                    <span className="font-bold text-slate-900">₹{grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  
                  <div className="flex justify-between py-3 bg-green-200 px-4 rounded font-bold">
                    <span className="text-slate-900">Benefit With Solar after your investment</span>
                    <span className="text-slate-900">₹{(powerBill25Years - grandTotal).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill of Materials Section */}
            <div className="border-t border-slate-200 pt-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Bill of Materials</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-orange-200 border border-slate-300">
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-900 w-12">S No</th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-900">Material with Specifications</th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-900 w-32">Make</th>
                      <th className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-900 w-16">UOM</th>
                      <th className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-900 w-16">Qty</th>
                      <th className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-900 w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billOfMaterials.map((material, index) => (
                      <tr key={material.id} className="border border-slate-300">
                        <td className="border border-slate-300 px-3 py-2 text-center text-slate-900 font-semibold">{index + 1}</td>
                        <td className="border border-slate-300 px-3 py-2 text-slate-900">
                          <textarea
                            value={material.description}
                            onChange={(e) => updateMaterial(material.id, 'description', e.target.value)}
                            className="w-full p-1 border border-slate-300 rounded text-xs resize-none"
                            rows={2}
                          />
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-slate-900">
                          <input
                            type="text"
                            value={material.make}
                            onChange={(e) => updateMaterial(material.id, 'make', e.target.value)}
                            className="w-full p-1 border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-center">
                          <select
                            value={material.uom}
                            onChange={(e) => updateMaterial(material.id, 'uom', e.target.value)}
                            className="w-full p-1 border border-slate-300 rounded text-xs"
                          >
                            <option>No</option>
                            <option>Set</option>
                            <option>Ls</option>
                            <option>Ft</option>
                            <option>M</option>
                          </select>
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-center">
                          <input
                            type="number"
                            value={material.quantity}
                            onChange={(e) => updateMaterial(material.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full p-1 border border-slate-300 rounded text-xs text-center"
                          />
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-center">
                          <button
                            onClick={() => removeMaterialRow(material.id)}
                            className="text-rose-600 hover:bg-rose-50 p-1 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={addMaterialRow}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
              >
                <Plus size={18} />
                Add Material
              </button>
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
