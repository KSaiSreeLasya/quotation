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

  const downloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Create a clean, simple HTML structure for PDF
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.width = '900px';
      pdfContainer.style.backgroundColor = '#ffffff';
      pdfContainer.style.padding = '30px';
      pdfContainer.style.fontFamily = '"Segoe UI", Arial, sans-serif';
      pdfContainer.style.color = '#1a1a1a';
      pdfContainer.style.fontSize = '11px';
      pdfContainer.style.lineHeight = '1.5';

      let html = `
        <style>
          body { margin: 0; padding: 0; }
          .company-header { display: flex; align-items: center; gap: 25px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; page-break-inside: avoid; }
          .company-logo { width: 100px; height: 100px; flex-shrink: 0; }
          .company-info { flex: 1; }
          .company-name { font-size: 28px; font-weight: bold; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
          .company-details { font-size: 11px; color: #6b7280; margin: 8px 0 0 0; line-height: 1.6; }
          .pdf-header { background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); padding: 20px 25px; margin: -30px -30px 25px -30px; color: white; page-break-inside: avoid; }
          .pdf-header-title { font-size: 24px; font-weight: bold; margin: 0 0 5px 0; }
          .pdf-header-subtitle { font-size: 11px; opacity: 0.9; margin: 0; }
          .pdf-header-ref { margin-top: 8px; font-size: 10px; opacity: 0.85; }
          .section-header { background-color: #f3f4f6; border-left: 4px solid #0f766e; padding: 10px 12px; margin: 15px 0 12px 0; font-size: 12px; font-weight: bold; color: #1a1a1a; page-break-after: avoid; }
          .section-container { page-break-inside: avoid; margin-bottom: 15px; }
          .info-box { background-color: #fffbeb; border: 1px solid #fcd34d; padding: 12px; margin-bottom: 12px; border-radius: 4px; page-break-inside: avoid; }
          .info-grid { display: flex; gap: 20px; margin-bottom: 20px; page-break-inside: avoid; }
          .info-item { flex: 1; }
          .info-label { font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: bold; margin-bottom: 4px; }
          .info-value { font-size: 13px; font-weight: bold; color: #1a1a1a; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th { background-color: #1f2937; color: white; padding: 8px; text-align: left; font-weight: bold; font-size: 10px; }
          td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 10px; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .highlight-row { background-color: #fef3c7 !important; font-weight: bold; }
          .success-row { background-color: #d1fae5 !important; font-weight: bold; }
          .comparison-table { page-break-inside: avoid; }
          .comparison-table th { background-color: #374151; }
          .comparison-table td { border-color: #d1d5db; }
          .value-right { text-align: right; }
          .quotation-section { page-break-inside: avoid; margin-bottom: 20px; }
          .financial-section { page-break-inside: avoid; margin-bottom: 20px; }
          .bom-section { page-break-inside: avoid; margin-bottom: 20px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 10px; color: #6b7280; text-align: center; page-break-inside: avoid; }
          .footer-divider { height: 1px; background: linear-gradient(90deg, transparent, #d1d5db, transparent); margin: 15px 0; }
          .bill-before { color: #b91c1c; }
          .bill-after { color: #059669; }
        </style>

        <!-- Company Header with Logo -->
        <div class="company-header">
          <img src="https://cdn.builder.io/api/v1/image/assets%2Fcb8e28b98e7d478c907b197aa0e49640%2F0b85f72529aa43089d684d8542c7bc51?format=webp&width=800&height=1200" alt="AXIVOLT Logo" class="company-logo" />
          <div class="company-info">
            <div class="company-name">AXIVOLT</div>
            <div class="company-details">
              📍 Flat No 101, Manish Residency<br/>
              Sri Durga Colony, Miyapur<br/>
              Madeenaguda, Hyderabad<br/>
              Telangana 500049
            </div>
          </div>
        </div>

        <!-- Header -->
        <div class="pdf-header">
          <div class="pdf-header-title">☀️ SOLAR QUOTATION</div>
          <div class="pdf-header-subtitle">Professional Solar Energy Solution</div>
          <div class="pdf-header-ref">Ref: SQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</div>
        </div>

        <!-- Customer Information -->
        <div class="section-header">📋 CUSTOMER INFORMATION</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Customer Name</div>
            <div class="info-value">${data.customerName || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Contact Number</div>
            <div class="info-value">${data.customerContact || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Installation Date</div>
            <div class="info-value">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
        <div class="info-box">
          <div class="info-label" style="margin-bottom: 6px;">📍 Installation Location</div>
          <div style="color: #374151; font-size: 12px;">${address}</div>
        </div>

        <!-- Bi-Directional Metering Diagram -->
        <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e5e7eb;">
          <img src="https://cdn.builder.io/api/v1/image/assets%2Fcb8e28b98e7d478c907b197aa0e49640%2Fc7a086c127c2406aa10980861c14ccf5?format=webp&width=800&height=1200" alt="Bi-Directional Metering Diagram" style="width: 100%; max-width: 100%; height: auto; display: block; margin: 0 auto;" />
        </div>

        <div style="height: 40px;"></div>

        <!-- Electricity Bill Analysis -->
        <div class="section-container" style="margin-bottom: 10px;">
          <div class="section-header" style="margin: 10px 0 10px 0;">💡 ELECTRICITY BILL ANALYSIS</div>
          <table class="comparison-table">
          <thead>
            <tr>
              <th colspan="3">Before Solar Installation</th>
              <th colspan="3">After Solar Installation</th>
            </tr>
            <tr style="background-color: #4b5563;">
              <th style="background-color: inherit;">Metric</th>
              <th style="background-color: inherit; text-align: right;">Value</th>
              <th style="background-color: inherit;"></th>
              <th style="background-color: inherit;">Metric</th>
              <th style="background-color: inherit; text-align: right;">Value</th>
              <th style="background-color: inherit;"></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="bill-before">Monthly Units (kWh)</td>
              <td class="bill-before value-right">${monthlyUnitsBefore}</td>
              <td></td>
              <td class="bill-after">Monthly Units (kWh)</td>
              <td class="bill-after value-right">${monthlyUnitsAfter}</td>
              <td></td>
            </tr>
            <tr>
              <td class="bill-before">Monthly Bill (₹)</td>
              <td class="bill-before value-right" style="font-weight: bold;">₹${monthlyBillBefore.toLocaleString()}</td>
              <td></td>
              <td class="bill-after">Monthly Bill (₹)</td>
              <td class="bill-after value-right" style="font-weight: bold;">₹${monthlyBillAfter.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr>
              <td class="bill-before">Avg Price/Unit (₹)</td>
              <td class="bill-before value-right">₹${avgPriceBeforeSolar}</td>
              <td></td>
              <td class="bill-after">Avg Price/Unit (₹)</td>
              <td class="bill-after value-right">₹${avgPriceAfterSolar}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <!-- Savings Summary -->
        <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border: 2px solid #22c55e; border-radius: 4px; padding: 10px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-around; text-align: center;">
            <div>
              <div style="font-size: 9px; color: #15803d; text-transform: uppercase; font-weight: bold; margin-bottom: 3px;">💰 Monthly Savings</div>
              <div style="font-size: 16px; font-weight: bold; color: #166534;">₹${(monthlyBillBefore - monthlyBillAfter).toLocaleString()}</div>
            </div>
            <div style="border-left: 2px solid rgba(0,0,0,0.1);"></div>
            <div>
              <div style="font-size: 9px; color: #15803d; text-transform: uppercase; font-weight: bold; margin-bottom: 3px;">📈 Annual Savings</div>
              <div style="font-size: 16px; font-weight: bold; color: #166534;">₹${((monthlyBillBefore - monthlyBillAfter) * 12).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <!-- Solar Impact Infographic -->
        <div style="margin: 15px 0; padding: 12px; background-color: #f8f9fa; border-radius: 6px; border: 1px solid #e5e7eb;">
          <img src="https://cdn.builder.io/api/v1/image/assets%2Fcb8e28b98e7d478c907b197aa0e49640%2F94376c4c2a9743b7ad102cb93916310c?format=webp&width=800&height=1200" alt="Solar Impact Summary" style="width: 100%; max-width: 100%; height: auto; display: block; margin: 0 auto;" />
        </div>
        </div>

        <!-- System Specification -->
        <div class="section-container" style="margin-bottom: 10px;">
          <div class="section-header" style="margin: 10px 0 10px 0;">⚙️ SYSTEM SPECIFICATION</div>
          <table>
          <tbody>
            <tr>
              <td style="font-weight: 600; background-color: #f3f4f6; width: 60%;">Number of Panels</td>
              <td style="value-right; background-color: #fffbeb; font-weight: bold;">${data.panelCount}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; background-color: #f3f4f6;">Total System Capacity</td>
              <td style="value-right; background-color: #fffbeb; font-weight: bold;">${data.systemSizeKw.toFixed(2)} kWp</td>
            </tr>
            <tr>
              <td style="font-weight: 600; background-color: #f3f4f6;">Roof Orientation</td>
              <td style="value-right; background-color: #fffbeb; font-weight: bold;">${data.orientation}° (${(data.efficiencyFactor * 100).toFixed(0)}% efficiency)</td>
            </tr>
            <tr>
              <td style="font-weight: 600; background-color: #f3f4f6;">Shading Factor</td>
              <td style="value-right; background-color: #fffbeb; font-weight: bold;">${(data.shadeFactor * 100).toFixed(0)}% exposure</td>
            </tr>
            <tr style="background-color: #dbeafe;">
              <td style="font-weight: 600;">Est. Annual Generation</td>
              <td style="value-right; font-weight: bold; color: #1e40af;">${data.annualGenerationKwh.toLocaleString()} kWh</td>
            </tr>
          </tbody>
        </table>
        </div>

        <!-- Quotation Details -->
        <div class="quotation-section">
          <div class="section-header">💳 QUOTATION DETAILS</div>
          <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="width: 60px; text-align: center;">Qty</th>
              <th style="width: 80px; text-align: right;">Price (₹)</th>
              <th style="width: 80px; text-align: right;">Subtotal (₹)</th>
              <th style="width: 50px; text-align: center;">GST %</th>
              <th style="width: 80px; text-align: right;">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${panelDescription}<br><span style="font-size: 9px; color: #6b7280;">Capacity: ${data.systemSizeKw.toFixed(2)}kWp</span></td>
              <td style="text-align: center;">${panelQty}</td>
              <td style="text-align: right;">₹${panelPrice.toLocaleString()}</td>
              <td style="text-align: right;">₹${panelSubTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              <td style="text-align: center;">${panelGst}%</td>
              <td style="text-align: right; font-weight: bold;">₹${panelTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
            </tr>
            <tr>
              <td>${netMeterDescription}</td>
              <td style="text-align: center;">${netMeterQty}</td>
              <td style="text-align: right;">₹${netMeterPrice.toLocaleString()}</td>
              <td style="text-align: right;">₹${netMeterSubTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              <td style="text-align: center;">${netMeterGst}%</td>
              <td style="text-align: right; font-weight: bold;">₹${netMeterTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
            </tr>
            <tr>
              <td>${subsidyDescription}</td>
              <td style="text-align: center;">${subsidyQty}</td>
              <td style="text-align: right;">₹${subsidyPrice.toLocaleString()}</td>
              <td style="text-align: right;">₹${subsidySubTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              <td style="text-align: center;">${subsidyGst}%</td>
              <td style="text-align: right; font-weight: bold;">₹${subsidyTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
            </tr>
            <tr class="highlight-row">
              <td colspan="4" style="text-align: right; border-right: 2px solid #f59e0b;">TOTAL</td>
              <td style="text-align: center;"></td>
              <td style="text-align: right; background-color: #fbbf24; color: #78350f;">₹${grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
            </tr>
          </tbody>
        </table>

        <!-- Subsidy & Net Amount -->
        <div style="margin-top: 15px; display: grid; gap: 10px;">
          <div class="info-box" style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); border-color: #0284c7;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; color: #0c4a6e;">💰 Subsidy (Credited to Bank)</span>
              <span style="font-size: 14px; font-weight: bold; color: #075985;">₹${(data.subsidy || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
          <div class="info-box" style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); border-color: #d97706;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; color: #92400e;">🏦 Net Amount (Your Investment)</span>
              <span style="font-size: 14px; font-weight: bold; color: #b45309;">₹${(grandTotal - (data.subsidy || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
        </div>

        <!-- Financial Projection -->
        <div class="financial-section">
          <div class="section-header">📊 PROFIT WITH SOLAR</div>
          <div style="margin: 15px 0; padding: 0; background-color: transparent;">
            <img src="https://cdn.builder.io/api/v1/image/assets%2Fcb8e28b98e7d478c907b197aa0e49640%2F18c19d76c43241ceaca5f0662141f48f?format=webp&width=800&height=1200" alt="Profit With Solar" style="width: 100%; max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 4px;" />
          </div>

          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #16a34a; border-radius: 4px; padding: 15px; margin-top: 15px;">
          <table style="margin: 0;">
            <tbody>
              <tr>
                <td style="background-color: transparent; border: none; font-weight: 600; color: #166534;">Present Monthly Power Bill</td>
                <td style="background-color: transparent; border: none; text-align: right; font-weight: bold; color: #166534;">₹${monthlyBillBefore.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="background-color: transparent; border: none; font-weight: 600; color: #166534;">Yearly Power Bill</td>
                <td style="background-color: transparent; border: none; text-align: right; font-weight: bold; color: #166534;">₹${(annualBillBefore).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="background-color: transparent; border: none; font-weight: 600; color: #166534;">Annual Tariff Increment</td>
                <td style="background-color: transparent; border: none; text-align: right; font-weight: bold; color: #166534;">${tariffIncrement}%</td>
              </tr>
              <tr style="border-top: 2px solid rgba(0,0,0,0.1);">
                <td style="background-color: transparent; border: none; font-weight: 600; color: #166534; padding-top: 10px;">Projected Bill (25 years)</td>
                <td style="background-color: transparent; border: none; text-align: right; font-weight: bold; color: #166534; padding-top: 10px;">₹${powerBill25Years.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              </tr>
              <tr style="background-color: #16a34a; color: white; font-weight: bold; border: none;">
                <td style="border: none; padding: 12px; color: white;">✅ Net Benefit After Investment</td>
                <td style="border: none; padding: 12px; text-align: right; font-size: 13px;">₹${(powerBill25Years - grandTotal).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>

        <!-- Bill of Materials -->
        <div class="bom-section">
          <div class="section-header" style="margin-top: 30px;">📦 BILL OF MATERIALS</div>
          <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">S.No</th>
              <th>Material with Specifications</th>
              <th style="width: 120px;">Make/Brand</th>
              <th style="width: 60px; text-align: center;">Unit</th>
              <th style="width: 50px; text-align: center;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${billOfMaterials.map((material, idx) => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                <td>${material.description}</td>
                <td>${material.make}</td>
                <td style="text-align: center;">${material.uom}</td>
                <td style="text-align: center; font-weight: bold;">${material.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-divider"></div>
          <div style="margin-bottom: 10px;">
            <strong>Thank you for choosing solar energy!</strong><br>
            This quotation is valid for 30 days from the date of issue.
          </div>
          <div style="font-size: 9px; color: #9ca3af;">
            This is an automated quotation. For more information, please contact us.<br>
            Generated on ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      `;

      pdfContainer.innerHTML = html;
      document.body.appendChild(pdfContainer);

      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowHeight: pdfContainer.scrollHeight,
        windowWidth: 900,
      });

      document.body.removeChild(pdfContainer);

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
        pdf.addImage(imgData, 'PNG', 0, -(position), pdfWidth, imgHeight);
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
