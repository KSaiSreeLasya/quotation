import React, { useState } from 'react';
import { X, Download, Mail, CheckCircle2, Loader2, FileText, Plus, Trash2, Sun, Factory, TreeDeciduous, IndianRupee } from 'lucide-react';
import { QuotationData, BillOfMaterial } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { calculateEnvironmentalBenefits } from '../utils/solarCalculations';

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

  // Editable customer details
  const [customerName, setCustomerName] = useState(data.customerName || '');
  const [customerContact, setCustomerContact] = useState(data.customerContact || '');

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
  const [systemSizeKw, setSystemSizeKw] = useState(data.systemSizeKw || 3.3);

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

  // Terms and Conditions items
  const [termsConditions, setTermsConditions] = useState<Array<{ title: string; content: string }>>([
    {
      title: 'Payment Terms',
      content: '> 50% advance with Firm Purchase order and with KYC Documents\n> 40% after getting approval from Local Discom on the Solar Feasibility and in principal Sanction\n> 10% after Installation'
    },
    {
      title: '',
      content: 'The Order booking price is Valid for 3 months only from the date of Advance payment.'
    },
    {
      title: '',
      content: 'Any Statutory variation in taxes and duties from the date of submission of this proposal including change of rates for solar PV system and/or its parts/components/equipment under GST, Imposition of Antidumping Duty (ADD) and/or Safeguard Duty (SDD) on imported modules and cells by the Government of India would be to the clients account and shall be Payable by the client at actual.'
    },
    {
      title: 'Delivery',
      content: '25-35 Working Days from the date of receiving 90% Payment.\nProjected Time lines *\n> 2 days for Feasibility and Inpriciple Sanction\n> 10 Days for Product delivery after 90% payment\n> 10 Days for Plant installation\n> 10 days for Net meter Installation'
    },
    {
      title: '',
      content: 'Make of the products may vary based on the availability in the market and we shall provide equivalent products only quoted in the BOM'
    },
    {
      title: '',
      content: 'Time for load enhancements or any upgradation in the electrical connection will not cover in the standard delivery time lines shall be at extra time. Charges for those activities shall be extra at actual.'
    },
    {
      title: 'Warranty',
      content: '> 5 Years against Manufacturing defects. On complete system with respect to each original manufacturer\'s Terms and Conditions\n> Linear Power Warranty on Solar Modules : 25 Years as per manufacturer\'s terms and conditions\n> Warranty void if Physical Damages and unauthorized usage or tampering of the Machine.'
    },
    {
      title: '',
      content: 'The Price quoted confidential and it is valid for 10 Days from the date of Quote supplied.'
    },
    {
      title: '',
      content: 'Power Generation and Savings are shown purely based on Estimated NASA data.'
    },
    {
      title: '',
      content: 'Net Meter Installation is subject to stock availability with the Local Distribution Company'
    },
    {
      title: '',
      content: 'Charges for Load enhancement if any or Name Change Shall be extra at actuals and shall be extra time required for this process'
    },
    {
      title: '',
      content: 'Order Cancellation attracts deduction of Order processing changes as per terms and conditions of the Company.'
    },
    {
      title: '',
      content: 'The Net meter billing and its Settlement is a sole responsibility of Local Distribution company and no where responsible with Solar System Integrator'
    },
    {
      title: 'Bank Details',
      content: 'Account Holder: AXISO GREEN ENERGIES PVT LTD.\nAccount Number: 50200102457732\nIFSC: HDFC0002390\nAccount Type: CURRENT'
    }
  ]);

  // Customer scope items
  const [customerScope, setCustomerScope] = useState<string[]>([
    'Customer to provide space for storing of materials.',
    'Making the site ready and clearing the terrace / roof of any unwanted items is not included in scope of work. Necessary support will be extended to our Installation team for taking material inside the premises and also to the roof top. The same has to be kept at proper and secure place till completion of installation',
    'Safety of material supplied would be in customer scope after delivery at site',
    'Customer shall provide access to feed in solar power to LT panel located in ground floor of building. Feeder / LT panel for connection to grid will be made available at site and shall be in Customer\'s Scope',
    'Load Distribution from AC LT panel is at Customer scope.',
    'Customer to provide GPRS/WIFI for cloud monitoring',
    'Cleaning of Modules is not in our scope. Customer is request to clean panels once in 15 days or as per site conditions, Cleaning with RO is recommended to avoid scaling on the solar panels',
    'Water & Electricity and any support ladders required for construction of solar power plant shall be in Customer\'s scope'
  ]);

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

  const envBenefits = calculateEnvironmentalBenefits(data.annualGenerationKwh);

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
      pdfContainer.style.padding = '40px 50px';
      pdfContainer.style.fontFamily = '"Segoe UI", Arial, sans-serif';
      pdfContainer.style.color = '#1a1a1a';
      pdfContainer.style.fontSize = '11px';
      pdfContainer.style.lineHeight = '1.5';
      pdfContainer.style.margin = '0';
      pdfContainer.style.boxSizing = 'border-box';

      let html = `
        <style>
          * {
            margin: 0;
            padding: 0;
            word-break: keep-all;
            overflow-wrap: normal;
            page-break-inside: avoid;
            orphans: 2;
            widows: 2;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #2d3748;
            page-break-inside: auto;
          }

          /* Header Styles */
          .company-header {
            display: flex;
            align-items: center;
            gap: 24px;
            padding: 24px 0 28px 0;
            border-bottom: 4px solid #10b981;
            margin-bottom: 28px;
            page-break-inside: avoid;
            page-break-after: avoid;
            word-break: keep-all;
          }
          .company-logo {
            width: 90px;
            height: 90px;
            flex-shrink: 0;
            border-radius: 8px;
            background: #f0fdf4;
            padding: 4px;
            page-break-inside: avoid;
          }
          .company-info {
            flex: 1;
            page-break-inside: avoid;
            word-break: keep-all;
          }
          .company-name {
            font-size: 28px;
            font-weight: 800;
            color: #065f46;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
            page-break-inside: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }
          .company-details {
            font-size: 10px;
            color: #718096;
            line-height: 1.7;
            word-break: keep-all;
            overflow-wrap: normal;
          }

          /* Main Header */
          .pdf-header {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            padding: 36px;
            margin: 0 0 32px 0;
            color: white;
            page-break-inside: avoid;
            page-break-after: avoid;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
            word-break: keep-all;
          }
          .pdf-header-title {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
            page-break-inside: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }
          .pdf-header-subtitle {
            font-size: 13px;
            opacity: 0.95;
            margin-bottom: 12px;
            font-weight: 500;
            page-break-inside: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }
          .pdf-header-ref {
            font-size: 11px;
            opacity: 0.92;
            font-weight: 500;
            page-break-inside: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }

          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
            page-break-inside: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }

          p {
            page-break-after: avoid;
            page-break-inside: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }

          /* Section Headers */
          .section-header {
            background: linear-gradient(90deg, #f0fdf4 0%, #ecfdf5 100%);
            border-bottom: 4px solid #10b981;
            border-left: 6px solid #059669;
            padding: 18px 20px;
            margin: 0 0 30px 0;
            font-size: 14px;
            font-weight: 800;
            color: #065f46;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            page-break-before: avoid !important;
            break-inside: avoid !important;
            break-before: avoid !important;
            break-after: avoid !important;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
            border-radius: 4px;
            word-break: keep-all;
            overflow-wrap: normal;
            orphans: 10;
            widows: 10;
          }

          /* Info Grid */
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-bottom: 26px;
            page-break-inside: avoid;
            word-break: keep-all;
          }
          .info-item {
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            padding: 18px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
            box-shadow: 0 2px 4px rgba(16, 185, 129, 0.08);
            page-break-inside: avoid;
            word-break: keep-all;
          }
          .info-label {
            font-size: 10px;
            color: #059669;
            text-transform: uppercase;
            font-weight: 800;
            margin-bottom: 10px;
            letter-spacing: 0.4px;
            page-break-inside: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }
          .info-value {
            font-size: 16px;
            font-weight: 800;
            color: #065f46;
            word-break: keep-all;
            overflow-wrap: normal;
          }

          /* Info Box */
          .info-box {
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            border: 3px solid #10b981;
            padding: 20px;
            margin-bottom: 24px;
            border-radius: 10px;
            page-break-inside: avoid;
            page-break-after: avoid;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
            word-break: keep-all;
          }
          .info-box-label {
            font-size: 12px;
            color: #059669;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 12px;
            letter-spacing: 0.4px;
            page-break-inside: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }
          .info-box-value {
            color: #1a202c;
            font-size: 14px;
            line-height: 1.8;
            font-weight: 500;
            word-break: keep-all;
            overflow-wrap: normal;
          }

          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            page-break-inside: avoid;
            table-layout: fixed;
            word-break: keep-all;
          }
          th {
            background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
            color: white;
            padding: 16px 14px;
            text-align: left;
            font-weight: 700;
            font-size: 11px;
            letter-spacing: 0.4px;
            text-transform: uppercase;
            page-break-inside: avoid;
            page-break-after: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }
          td {
            border-bottom: 1px solid #e2e8f0;
            padding: 14px;
            font-size: 11px;
            word-break: keep-all;
            overflow-wrap: normal;
            page-break-inside: avoid;
          }
          tr {
            background: white;
            transition: background-color 0.2s ease;
            page-break-inside: avoid;
            page-break-after: avoid;
            word-break: keep-all;
          }
          tr:nth-child(even) { background-color: #f8fafc; }
          tr:hover { background-color: #edf2f7; }
          tbody tr:first-child { border-top: none; }
          thead {
            display: table-header-group;
            page-break-inside: avoid;
            page-break-after: avoid;
            word-break: keep-all;
          }

          /* Special Row Styles */
          .highlight-row { background: linear-gradient(90deg, #fef3c7 0%, #fbbf24 100%) !important; font-weight: 600; }
          .success-row { background: linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%) !important; font-weight: 600; color: #065f46; }
          .total-row { background: linear-gradient(90deg, #10b981 0%, #059669 100%) !important; color: white; font-weight: 600; }

          /* Bill of Materials Table Styles */
          .bom-table {
            width: 100% !important;
            border-collapse: collapse;
            margin: 20px 0 30px 0 !important;
            page-break-inside: avoid;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.12);
            border-radius: 8px;
            overflow: hidden;
            background: white;
          }
          .bom-table thead {
            display: table-header-group;
            page-break-inside: avoid;
            page-break-after: avoid;
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          }
          .bom-header-row {
            page-break-inside: avoid;
            page-break-after: avoid;
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          }
          .bom-header-cell {
            padding: 16px 14px !important;
            font-size: 12px !important;
            font-weight: 800 !important;
            color: white !important;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: none !important;
            page-break-inside: avoid;
            word-break: keep-all;
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          }
          .bom-row {
            page-break-inside: avoid;
            background: white;
            border-bottom: 1px solid #e5f2ed;
            transition: background-color 0.2s ease;
          }
          .bom-row:nth-child(even) {
            background: #f8fdfb;
          }
          .bom-row:hover {
            background: #f0fdf4;
          }
          .bom-cell {
            padding: 14px 14px !important;
            font-size: 12px !important;
            color: #1a1a1a;
            border: none !important;
            page-break-inside: avoid;
            word-break: keep-all;
            line-height: 1.6;
          }
          .bom-number {
            font-weight: 700 !important;
            color: #059669 !important;
            background: rgba(16, 185, 129, 0.08);
          }
          .bom-description {
            font-weight: 600;
            color: #065f46;
          }
          .bom-make {
            color: #475569;
            font-weight: 500;
          }
          .bom-uom {
            color: #1a202c;
            font-weight: 600;
          }
          .bom-quantity {
            color: #059669;
            font-weight: 700 !important;
            background: rgba(16, 185, 129, 0.08);
          }
          .bom-table tbody tr:last-child {
            border-bottom: 2px solid #10b981;
          }

          /* Card Styles */
          .card {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            padding: 24px;
            margin: 20px 0 30px 0;
            page-break-inside: avoid;
            page-break-after: avoid;
            page-break-before: avoid;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
            word-break: keep-all;
          }
          .card-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            page-break-inside: avoid;
            word-break: keep-all;
          }
          .card-item {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 18px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            page-break-inside: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }
          .card-label {
            font-size: 11px;
            color: #718096;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: 0.4px;
            word-break: keep-all;
            overflow-wrap: normal;
          }
          .card-value {
            font-size: 20px;
            font-weight: 800;
            color: #10b981;
            word-break: keep-all;
            overflow-wrap: normal;
          }

          /* Metric Cards */
          .metric-card {
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            border: 2px solid #dcfce7;
            padding: 22px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 3px 8px rgba(16, 185, 129, 0.12);
            page-break-inside: avoid;
            page-break-after: avoid;
            word-break: keep-all;
          }
          .metric-title {
            font-size: 12px;
            color: #059669;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 12px;
            letter-spacing: 0.4px;
            page-break-inside: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }
          .metric-value {
            font-size: 28px;
            font-weight: 900;
            color: #065f46;
            word-break: keep-all;
            overflow-wrap: normal;
          }

          /* Profit Summary */
          .profit-summary {
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            border: 3px solid #10b981;
            border-radius: 10px;
            padding: 24px;
            margin: 24px 0;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
            page-break-inside: avoid;
            page-break-after: avoid;
            page-break-before: avoid;
            orphans: 10;
            widows: 10;
            word-break: keep-all;
          }
          .profit-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 2px solid rgba(16, 185, 129, 0.15);
            page-break-inside: avoid;
            page-break-after: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }
          .profit-item:last-child { border-bottom: none; }
          .profit-label {
            font-size: 12px;
            color: #059669;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            page-break-inside: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }
          .profit-value {
            font-size: 16px;
            font-weight: 800;
            color: #065f46;
            page-break-inside: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }
          .profit-highlight {
            background: linear-gradient(90deg, #059669 0%, #10b981 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-weight: 700;
            box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
            page-break-inside: avoid;
            break-inside: avoid;
            page-break-before: avoid;
            page-break-after: avoid;
            white-space: nowrap;
            overflow: visible;
            word-break: keep-all;
            overflow-wrap: normal;
          }

          /* Keep Together Section */
          .keep-together {
            page-break-inside: avoid;
            margin: 30px 0;
            word-break: keep-all;
          }

          /* Comparison Section */
          .comparison-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 22px;
            margin: 30px 0;
            page-break-inside: avoid;
            word-break: keep-all;
          }
          .comparison-col {
            background: #f7fafc;
            border-radius: 8px;
            padding: 18px;
            page-break-inside: avoid;
            word-break: keep-all;
          }
          .comparison-col h4 {
            font-size: 13px;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 14px;
            border-bottom: 2px solid #10b981;
            padding-bottom: 10px;
            page-break-inside: avoid;
            page-break-after: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }
          .comparison-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            page-break-inside: avoid;
            word-break: keep-all;
          }
          .comparison-label {
            font-size: 11px;
            color: #718096;
            font-weight: 500;
            word-break: keep-all;
            overflow-wrap: normal;
          }
          .comparison-value {
            font-size: 13px;
            font-weight: 700;
            color: #1a202c;
            word-break: keep-all;
            overflow-wrap: normal;
          }

          /* Terms & Scope */
          .terms-item, .scope-item {
            padding: 16px;
            margin-bottom: 16px;
            border-left: 4px solid #10b981;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            page-break-inside: avoid;
            break-inside: avoid;
            page-break-after: auto;
            page-break-before: auto;
            orphans: 10;
            widows: 10;
            word-break: keep-all;
          }
          .terms-serial {
            font-size: 11px;
            margin-bottom: 8px;
            font-weight: 700;
            color: #10b981;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            page-break-inside: avoid;
            word-break: keep-all;
          }
          .terms-title {
            font-weight: 800;
            color: #059669;
            margin-bottom: 10px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            page-break-inside: avoid;
            page-break-after: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }
          .terms-content {
            font-size: 12px;
            color: #2d3748;
            line-height: 1.7;
            white-space: pre-wrap;
            page-break-inside: avoid;
            word-break: keep-all;
          }

          /* Footer */
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            font-size: 10px;
            color: #718096;
            page-break-inside: avoid;
            page-break-before: avoid;
            page-break-after: avoid;
            orphans: 10;
            widows: 10;
            word-break: keep-all;
          }
          .footer-text {
            margin-bottom: 8px;
            page-break-inside: avoid;
            word-break: keep-all;
            overflow-wrap: normal;
          }

          /* Utilities */
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .mb-10 { margin-bottom: 10px; }
          .mb-20 { margin-bottom: 20px; }
          .page-break {
            page-break-after: always !important;
            page-break-inside: avoid !important;
            word-break: keep-all;
          }
          .page-break-before {
            page-break-before: always !important;
            page-break-inside: avoid !important;
            word-break: keep-all;
            margin-top: 0;
            padding-top: 0;
            break-before: page !important;
          }
        </style>

        <!-- Company Header -->
        <div class="company-header">
          <img src="https://cdn.builder.io/api/v1/image/assets%2Fcb8e28b98e7d478c907b197aa0e49640%2F0b85f72529aa43089d684d8542c7bc51?format=webp&width=800&height=1200" alt="AXIVOLT Logo" class="company-logo" />
          <div class="company-info">
            <div class="company-name">AXIVOLT</div>
            <div class="company-details">
              Flat No 101, Manish Residency • Sri Durga Colony, Miyapur<br/>
              Madeenaguda, Hyderabad • Telangana 500049
            </div>
          </div>
        </div>

        <!-- Main Header -->
        <div class="pdf-header">
          <div class="pdf-header-title">SOLAR ENERGY QUOTATION</div>
          <div class="pdf-header-subtitle">Professional Installation & Commissioning</div>
          <div class="pdf-header-ref">Reference: SQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')} | Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        </div>

        <!-- Customer Information -->
        <div class="section-header">CUSTOMER INFORMATION</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Customer Name</div>
            <div class="info-value">${customerName || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Contact Number</div>
            <div class="info-value">${customerContact || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Installation Date</div>
            <div class="info-value">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
          </div>
        </div>

        <div class="info-box">
          <div class="info-box-label">Installation Location</div>
          <div class="info-box-value">${address}</div>
        </div>

        <!-- System Overview Section -->
        <div class="keep-together">
          <div class="section-header">SYSTEM OVERVIEW</div>
          <div class="card-grid">
            <div class="card-item">
              <div class="card-label">Proposed System Size</div>
              <div class="card-value">${systemSizeKw.toFixed(2)} kWp</div>
            </div>
            <div class="card-item">
              <div class="card-label">Number of Panels</div>
              <div class="card-value">${data.panelCount}</div>
            </div>
            <div class="card-item">
              <div class="card-label">Efficiency Rating</div>
              <div class="card-value">${(data.efficiencyFactor * 100).toFixed(0)}%</div>
            </div>
            <div class="card-item">
              <div class="card-label">Annual Generation</div>
              <div class="card-value">${(data.annualGenerationKwh / 1000).toFixed(1)} MWh</div>
            </div>
          </div>
        </div>

        <div class="comparison-grid">
          <div class="comparison-col" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #cbd5e1; border-radius: 10px; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);">
            <h4 style="border-bottom: 3px solid #64748b; padding-bottom: 12px; margin-bottom: 12px; color: #1e293b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Before Solar Installation</h4>
            <div class="comparison-item" style="background: white; padding: 10px 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #94a3b8;">
              <span class="comparison-label" style="color: #64748b;">Monthly Units (kWh)</span>
              <span class="comparison-value" style="color: #1e293b; font-weight: 700;">${monthlyUnitsBefore}</span>
            </div>
            <div class="comparison-item" style="background: white; padding: 10px 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #94a3b8;">
              <span class="comparison-label" style="color: #64748b;">Monthly Bill</span>
              <span class="comparison-value" style="color: #1e293b; font-weight: 700;">₹${monthlyBillBefore.toLocaleString()}</span>
            </div>
            <div class="comparison-item" style="background: white; padding: 10px 12px; border-radius: 6px; border-left: 3px solid #94a3b8;">
              <span class="comparison-label" style="color: #64748b;">Price per Unit</span>
              <span class="comparison-value" style="color: #1e293b; font-weight: 700;">₹${avgPriceBeforeSolar}</span>
            </div>
          </div>

          <div class="comparison-col" style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px solid #86efac; border-radius: 10px; box-shadow: 0 2px 6px rgba(22, 163, 74, 0.12);">
            <h4 style="border-bottom: 3px solid #10b981; padding-bottom: 12px; margin-bottom: 12px; color: #065f46; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">After Solar Installation</h4>
            <div class="comparison-item" style="background: white; padding: 10px 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #10b981;">
              <span class="comparison-label" style="color: #059669;">Monthly Units (kWh)</span>
              <span class="comparison-value" style="color: #065f46; font-weight: 700;">${monthlyUnitsAfter}</span>
            </div>
            <div class="comparison-item" style="background: white; padding: 10px 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #10b981;">
              <span class="comparison-label" style="color: #059669;">Monthly Bill</span>
              <span class="comparison-value" style="color: #065f46; font-weight: 700;">₹${monthlyBillAfter.toLocaleString()}</span>
            </div>
            <div class="comparison-item" style="background: white; padding: 10px 12px; border-radius: 6px; border-left: 3px solid #10b981;">
              <span class="comparison-label" style="color: #059669;">Price per Unit</span>
              <span class="comparison-value" style="color: #065f46; font-weight: 700;">₹${avgPriceAfterSolar}</span>
            </div>
          </div>
        </div>

        <!-- Savings Summary -->
        <div class="card" style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 3px solid #10b981; border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15); padding: 24px;">
          <div class="card-grid">
            <div class="metric-card" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 2px solid #6ee7b7; box-shadow: 0 2px 8px rgba(22, 163, 74, 0.15); border-radius: 10px; padding: 20px;">
              <div class="metric-title" style="color: #059669; font-size: 12px;">Monthly Savings</div>
              <div class="metric-value" style="color: #065f46; font-size: 24px; margin-top: 8px;">₹${(monthlyBillBefore - monthlyBillAfter).toLocaleString()}</div>
            </div>
            <div class="metric-card" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #7dd3fc; box-shadow: 0 2px 8px rgba(3, 105, 161, 0.15); border-radius: 10px; padding: 20px;">
              <div class="metric-title" style="color: #0369a1; font-size: 12px;">Annual Savings</div>
              <div class="metric-value" style="color: #0c4a6e; font-size: 24px; margin-top: 8px;">₹${((monthlyBillBefore - monthlyBillAfter) * 12).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <table style="margin: 20px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <tbody>
            <tr style="background: #f8fafb; border-bottom: 2px solid #e2e8f0;">
              <td style="border: none; padding: 14px 16px; font-weight: 500; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px;">Roof Orientation</td>
              <td class="text-right" style="border: none; padding: 14px 16px; font-weight: 700; color: #10b981; font-size: 13px;">${data.orientation}°</td>
            </tr>
            <tr style="background: #ffffff; border-bottom: 2px solid #e2e8f0;">
              <td style="border: none; padding: 14px 16px; font-weight: 500; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px;">Efficiency Factor</td>
              <td class="text-right" style="border: none; padding: 14px 16px; font-weight: 700; color: #10b981; font-size: 13px;">${(data.efficiencyFactor * 100).toFixed(0)}%</td>
            </tr>
            <tr style="background: #f8fafb; border-bottom: 2px solid #e2e8f0;">
              <td style="border: none; padding: 14px 16px; font-weight: 500; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px;">Shading Exposure</td>
              <td class="text-right" style="border: none; padding: 14px 16px; font-weight: 700; color: #10b981; font-size: 13px;">${(data.shadeFactor * 100).toFixed(0)}%</td>
            </tr>
            <tr style="background: linear-gradient(90deg, #dcfce7 0%, #ecfdf5 100%); border: 2px solid #86efac;">
              <td style="border: none; padding: 16px; font-weight: 700; color: #065f46; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Est. Annual Generation</td>
              <td class="text-right" style="border: none; padding: 16px; font-weight: 800; color: #065f46; font-size: 16px;">${data.annualGenerationKwh.toLocaleString()} kWh</td>
            </tr>
          </tbody>
        </table>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="width: 50px; text-align: center;">Qty</th>
              <th style="width: 70px; text-align: right;">Unit Price</th>
              <th style="width: 70px; text-align: right;">Subtotal</th>
              <th style="width: 50px; text-align: center;">GST %</th>
              <th style="width: 70px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${panelDescription}<br><span style="font-size: 9px; color: #718096;">System: ${systemSizeKw.toFixed(2)}kWp</span></td>
              <td class="text-center">${panelQty}</td>
              <td class="text-right">₹${panelPrice.toLocaleString()}</td>
              <td class="text-right">₹${panelSubTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              <td class="text-center">${panelGst}%</td>
              <td class="text-right" style="font-weight: 600;">₹${panelTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
            </tr>
            <tr>
              <td>${netMeterDescription}</td>
              <td class="text-center">${netMeterQty}</td>
              <td class="text-right">₹${netMeterPrice.toLocaleString()}</td>
              <td class="text-right">₹${netMeterSubTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              <td class="text-center">${netMeterGst}%</td>
              <td class="text-right" style="font-weight: 600;">₹${netMeterTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
            </tr>
            <tr>
              <td>${subsidyDescription}</td>
              <td class="text-center">${subsidyQty}</td>
              <td class="text-right">₹${subsidyPrice.toLocaleString()}</td>
              <td class="text-right">₹${subsidySubTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              <td class="text-center">${subsidyGst}%</td>
              <td class="text-right" style="font-weight: 600;">₹${subsidyTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
            </tr>
            <tr class="total-row">
              <td colspan="4" class="text-right">TOTAL AMOUNT</td>
              <td class="text-center">-</td>
              <td class="text-right">₹${grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
            </tr>
          </tbody>
        </table>

        <!-- Subsidy & Net Amount -->
        <div class="card-grid" style="margin-top: 16px;">
          <div class="card" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #7dd3fc;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1;">
                <div class="info-label" style="color: #0369a1; margin-bottom: 8px;">Government Subsidy</div>
                <div style="font-size: 18px; font-weight: 700; color: #0c4a6e;">₹${(data.subsidy || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                <div style="font-size: 9px; color: #0c4a6e; margin-top: 4px;">Credited to your bank</div>
              </div>
            </div>
          </div>

          <div class="card" style="background: linear-gradient(135deg, #fef08a 0%, #fde047 100%); border: 2px solid #facc15;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1;">
                <div class="info-label" style="color: #854d0e; margin-bottom: 8px;">Your Investment</div>
                <div style="font-size: 18px; font-weight: 700; color: #78350f;">₹${(grandTotal - (data.subsidy || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                <div style="font-size: 9px; color: #78350f; margin-top: 4px;">After subsidy deduction</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Environmental Benefits -->
        <div class="keep-together">
          <div class="section-header">ENVIRONMENTAL IMPACT</div>
          <div class="card" style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 3px solid #10b981; border-radius: 12px; padding: 24px;">
            <div class="card-grid" style="grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px;">
              <div class="metric-card" style="background: white; border: 1px solid #d1fae5; padding: 16px; border-radius: 12px; text-align: center;">
                <div style="font-size: 20px; margin-bottom: 8px;">☀️</div>
                <div style="font-size: 14px; font-weight: 800; color: #065f46;">${(data.annualGenerationKwh / 1000).toFixed(1)} MWh</div>
                <div style="font-size: 9px; color: #059669; text-transform: uppercase; margin-top: 4px;">Clean Energy</div>
              </div>
              <div class="metric-card" style="background: white; border: 1px solid #ffedd5; padding: 16px; border-radius: 12px; text-align: center;">
                <div style="font-size: 20px; margin-bottom: 8px;">🏭</div>
                <div style="font-size: 14px; font-weight: 800; color: #9a3412;">${envBenefits.co2SavedTonsPerYear} Tons</div>
                <div style="font-size: 9px; color: #9a3412; text-transform: uppercase; margin-top: 4px;">CO2 Reduced</div>
              </div>
              <div class="metric-card" style="background: white; border: 1px solid #dcfce7; padding: 16px; border-radius: 12px; text-align: center;">
                <div style="font-size: 20px; margin-bottom: 8px;">🌳</div>
                <div style="font-size: 14px; font-weight: 800; color: #166534;">${Math.round(envBenefits.equivalentTrees)} Trees</div>
                <div style="font-size: 9px; color: #15803d; text-transform: uppercase; margin-top: 4px;">Equivalent planted</div>
              </div>
              <div class="metric-card" style="background: white; border: 1px solid #fef3c7; padding: 16px; border-radius: 12px; text-align: center;">
                <div style="font-size: 20px; margin-bottom: 8px;">💰</div>
                <div style="font-size: 14px; font-weight: 800; color: #854d0e;">₹${((monthlyBillBefore - monthlyBillAfter) * 12).toLocaleString()}</div>
                <div style="font-size: 9px; color: #a16207; text-transform: uppercase; margin-top: 4px;">Yearly Savings</div>
              </div>
            </div>
            <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #065f46; font-weight: 600; background: rgba(255,255,255,0.5); padding: 12px; border-radius: 8px;">
              Over 25 years, you will reduce ${envBenefits.co2Saved25YearsTons} tons of carbon emissions,
              equivalent to planting ${envBenefits.equivalentTrees25Years.toLocaleString()} mature trees.
            </div>
          </div>
        </div>

        <!-- Financial Projection -->
        <div class="keep-together">
          <div class="section-header">FINANCIAL PROJECTION & BENEFITS</div>
          <div class="profit-summary">
            <div class="profit-item">
              <span class="profit-label">Present Monthly Power Bill</span>
              <span class="profit-value">₹${monthlyBillBefore.toLocaleString()}</span>
            </div>
            <div class="profit-item">
              <span class="profit-label">Annual Power Bill</span>
              <span class="profit-value">₹${(annualBillBefore).toLocaleString()}</span>
            </div>
            <div class="profit-item">
              <span class="profit-label">Annual Tariff Increment</span>
              <span class="profit-value">${tariffIncrement}%</span>
            </div>
            <div class="profit-item">
              <span class="profit-label">Projected Bill (25 years)</span>
              <span class="profit-value">₹${powerBill25Years.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div class="profit-highlight" style="margin-top: 16px; background: linear-gradient(90deg, #059669 0%, #10b981 100%); padding: 16px; text-align: center; border-radius: 8px;">
              <div style="font-size: 11px; color: rgba(255, 255, 255, 0.95); text-transform: uppercase; margin-bottom: 8px;">Net Benefit After Your Investment</div>
              <div style="font-size: 24px; color: white; font-weight: 700;">₹${(powerBill25Years - grandTotal).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <div style="font-size: 10px; color: rgba(255, 255, 255, 0.9); margin-top: 6px;">Over 25 years of solar operation</div>
            </div>
          </div>
        </div>

        <!-- Roof Design Layout - Page 2 -->
        <div style="page-break-before: always; page-break-inside: avoid; padding: 0; margin: 0;">
          <div class="section-header">ROOF DESIGN LAYOUT</div>
          <div class="card" style="padding: 20px; margin: 20px 0; border-radius: 10px; border: 2px solid #e2e8f0; background: white; page-break-inside: avoid; text-align: center;">
            ${data.designImage ? `
              <div style="width: 100%; max-width: 600px; margin: 0 auto; page-break-inside: avoid;">
                <img src="${data.designImage}" style="width: 100%; height: auto; border-radius: 8px; border: 1px solid #e2e8f0;" alt="Roof Design Layout" />
              </div>
              <div style="margin-top: 16px; font-size: 11px; color: #718096; font-style: italic;">
                <p>Solar panel placement and system design for optimal energy generation</p>
              </div>
            ` : `
              <div style="padding: 40px 20px; color: #718096; font-size: 12px;">
                <p>No design image available</p>
              </div>
            `}
          </div>
        </div>

        <!-- Bill of Materials - Page 3 -->
        <div style="page-break-before: always; page-break-inside: avoid; padding: 40px 0; margin: 0;">
          <div class="section-header">BILL OF MATERIALS</div>
          <div style="page-break-inside: avoid; margin-top: 30px;">
            <table class="bom-table" style="page-break-inside: avoid;">
              <thead>
                <tr class="bom-header-row">
                  <th class="bom-header-cell" style="width: 50px; text-align: center;">No.</th>
                  <th class="bom-header-cell" style="text-align: left;">Description</th>
                  <th class="bom-header-cell" style="width: 120px;">Make/Brand</th>
                  <th class="bom-header-cell" style="width: 70px; text-align: center;">Unit</th>
                  <th class="bom-header-cell" style="width: 70px; text-align: center;">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${billOfMaterials.map((material, idx) => `
                  <tr class="bom-row" style="page-break-inside: avoid;">
                    <td class="bom-cell bom-number" style="text-align: center;">${idx + 1}</td>
                    <td class="bom-cell bom-description">${material.description}</td>
                    <td class="bom-cell bom-make">${material.make}</td>
                    <td class="bom-cell bom-uom" style="text-align: center;">${material.uom}</td>
                    <td class="bom-cell bom-quantity" style="text-align: center;">${material.quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Terms and Conditions - Page 4 -->
        <div style="page-break-before: always; padding: 20px 0 30px 0; margin: 0; display: flex; flex-direction: column;">
          <div class="section-header" style="margin-bottom: 15px;">TERMS AND CONDITIONS</div>
          <div class="card" style="background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border: 2px solid #10b981; padding: 15px; margin: 0; page-break-inside: avoid;">
            <div style="font-size: 12px; color: #065f46; line-height: 1.7;">
              ${termsConditions.map((item, index) => `
                  <div class="terms-item" style="display: flex; gap: 10px; margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.9); border-radius: 4px; border-left: 3px solid #059669; page-break-inside: avoid; break-inside: avoid;">
                    <span style="font-weight: 800; color: #047857; min-width: 20px; flex-shrink: 0; font-size: 12px;">${index + 1}</span>
                    <div style="flex: 1;">
                      ${item.title ? `<div class="terms-title" style="font-size: 12px; margin-bottom: 5px; font-weight: 700; color: #065f46;">${item.title}</div>` : ''}
                      <div class="terms-content" style="font-size: 11px; line-height: 1.5; color: #065f46;">${item.content}</div>
                    </div>
                  </div>
                `).join('')}
            </div>
          </div>
        </div>

        <!-- Customer Scope - Page 5 with Footer -->
        <div style="page-break-before: always; display: flex; flex-direction: column; padding: 40px 0; margin: 0;">
          <div style="page-break-inside: avoid; flex: 1;">
            <div class="section-header">CUSTOMER SCOPE OF WORK</div>
            <div class="card" style="background: linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%); border: 2px solid #fde047; padding: 30px; margin: 30px 0; page-break-inside: avoid;">
              <div style="font-size: 12px; color: #78350f; line-height: 1.8;">
                ${customerScope.map((item, index) => `
                  <div class="scope-item" style="display: flex; gap: 14px; margin-bottom: 16px; padding: 16px; background: rgba(255,255,255,0.8); border-radius: 6px; border-left: 4px solid #d97706; page-break-inside: avoid; break-inside: avoid; border: 1px solid #fde047;">
                    <span style="font-weight: 800; color: #b45309; min-width: 24px; flex-shrink: 0; font-size: 13px;">${index + 1}</span>
                    <span style="font-size: 12px; line-height: 1.7; color: #78350f;">${item}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Footer - Only on Page 5 (appears at bottom) -->
          <div class="footer" style="page-break-inside: avoid; page-break-before: avoid; padding-top: 30px; margin-top: auto;">
            <div style="background: linear-gradient(90deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px solid #dcfce7; border-radius: 8px; padding: 24px; margin-bottom: 30px; page-break-inside: avoid;">
              <div style="font-size: 14px; font-weight: 700; color: #059669; margin-bottom: 12px;">Thank You for Choosing Solar Energy!</div>
              <div style="font-size: 12px; color: #2d3748; line-height: 1.8;">
                This quotation is valid for <strong>30 days</strong> from the date of issue. For any queries or modifications, please contact our team.<br/>
                <strong>Warranty:</strong> 5 Years manufacturing defect • 25 Years linear power warranty on modules
              </div>
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #718096; line-height: 1.7; page-break-inside: avoid;">
              <div style="margin-bottom: 10px;">This is a professional quotation generated by AXIVOLT Solar Systems.</div>
              <div>Generated: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </div>
      `;

      // Get section marker positions in HTML to split PDF properly
      const bomStartMarker = '<!-- Bill of Materials - Page 3 -->';
      const termsStartMarker = '<!-- Terms and Conditions - Page 4 -->';
      const customerScopeMarker = '<!-- Customer Scope - Page 5 with Footer -->';

      const bomStartIndex = html.indexOf(bomStartMarker);
      const termsStartIndex = html.indexOf(termsStartMarker);
      const customerScopeIndex = html.indexOf(customerScopeMarker);

      // Split HTML into sections
      const beforeBOM = html.substring(0, bomStartIndex);
      const bomSection = html.substring(bomStartIndex, termsStartIndex);
      const termsSection = html.substring(termsStartIndex, customerScopeIndex);
      const customerScopeSection = html.substring(customerScopeIndex);

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Helper function to render HTML section to canvas
      const renderSectionToCanvas = async (htmlContent: string): Promise<string> => {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '900px';
        container.style.backgroundColor = '#ffffff';
        container.style.padding = '40px 50px';
        container.style.fontFamily = '"Segoe UI", Arial, sans-serif';
        container.style.color = '#1a1a1a';
        container.style.fontSize = '11px';
        container.style.lineHeight = '1.5';
        container.style.margin = '0';
        container.style.boxSizing = 'border-box';
        container.style.overflow = 'visible';
        container.style.minHeight = '100vh';

        container.innerHTML = htmlContent;
        document.body.appendChild(container);

        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowHeight: container.scrollHeight,
          windowWidth: 900,
        });

        document.body.removeChild(container);
        return canvas.toDataURL('image/png');
      };

      // Helper function to add image section to PDF on fresh page
      const addSectionToNewPage = async (sectionHtml: string) => {
        pdf.addPage();
        const sectionCanvas = await renderSectionToCanvas(sectionHtml);
        const sectionImgProps = pdf.getImageProperties(sectionCanvas);
        const sectionHeight = (sectionImgProps.height * pdfWidth) / sectionImgProps.width;
        pdf.addImage(sectionCanvas, 'PNG', 0, 0, pdfWidth, sectionHeight);
      };

      // Render before BOM content (Pages 1-2)
      const beforeBOMCanvas = await renderSectionToCanvas(beforeBOM);
      const beforeBOMImgProps = pdf.getImageProperties(beforeBOMCanvas);
      const beforeBOMHeight = (beforeBOMImgProps.height * pdfWidth) / beforeBOMImgProps.width;
      const beforeBOMPages = Math.ceil(beforeBOMHeight / pdfHeight);

      for (let i = 0; i < beforeBOMPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        const yOffset = -(i * pdfHeight);
        pdf.addImage(beforeBOMCanvas, 'PNG', 0, yOffset, pdfWidth, beforeBOMHeight);
      }

      // Add Bill of Materials on fresh page (Page 3)
      await addSectionToNewPage(bomSection);

      // Add Terms and Conditions on fresh page (Page 4)
      await addSectionToNewPage(termsSection);

      // Add Customer Scope on fresh page (Page 5)
      await addSectionToNewPage(customerScopeSection);

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
                <div>
                  <label className="text-xs font-semibold text-slate-600">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-lg font-semibold text-slate-900 border border-slate-300 rounded px-2 py-1 mt-1 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Contact Number</label>
                  <input
                    type="text"
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    className="w-full text-sm text-slate-600 border border-slate-300 rounded px-2 py-1 mt-1 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Enter contact number"
                  />
                </div>
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
                  <span className="font-bold text-slate-900">{systemSizeKw.toFixed(2)} kW</span>
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
                  <div className="flex justify-between items-center py-3 border-b border-green-300">
                    <span className="font-semibold text-slate-900">Present Power Bill</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">₹</span>
                      <input
                        type="number"
                        value={monthlyBillBefore}
                        onChange={(e) => setMonthlyBillBefore(parseFloat(e.target.value) || 0)}
                        className="border border-slate-300 rounded px-3 py-1 w-32 font-bold text-slate-900 text-right"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between py-3 border-b border-green-300">
                    <span className="font-semibold text-slate-900">Power Bill For Next 1 year</span>
                    <span className="font-bold text-slate-900">₹{(annualBillBefore).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-green-300">
                    <span className="font-semibold text-slate-900">Tariff Increment Year on Year</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={tariffIncrement}
                        onChange={(e) => setTariffIncrement(parseFloat(e.target.value) || 0)}
                        className="border border-slate-300 rounded px-3 py-1 w-20 font-bold text-slate-900 text-right"
                        step="0.1"
                      />
                      <span className="text-slate-600 font-semibold">%</span>
                    </div>
                  </div>

                  <div className="flex justify-between py-3 border-b border-green-300">
                    <span className="font-semibold text-slate-900">Power Bill For Next 25 years</span>
                    <span className="font-bold text-slate-900">₹{powerBill25Years.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-green-300">
                    <span className="font-semibold text-slate-900">Proposed Solar power plant</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={systemSizeKw}
                        onChange={(e) => setSystemSizeKw(parseFloat(e.target.value) || 0)}
                        className="border border-slate-300 rounded px-3 py-1 w-20 font-bold text-slate-900 text-right"
                        step="0.01"
                      />
                      <span className="text-slate-600 font-semibold">kWp</span>
                    </div>
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

            {/* Environmental Benefits */}
            <div className="border-t border-slate-200 pt-8">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-8 text-center flex items-center justify-center gap-3">
                  <span className="w-12 h-1 bg-emerald-500 rounded-full"></span>
                  Environmental Benefits
                  <span className="w-12 h-1 bg-emerald-500 rounded-full"></span>
                </h3>

                <div className="grid grid-cols-4 gap-6">
                  {/* Generation */}
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300 shadow-sm border border-amber-100">
                      <Sun className="text-amber-500" size={40} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">{(data.annualGenerationKwh / 1000).toFixed(1)} MWh</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Clean Energy Produced</p>
                    </div>
                  </div>

                  {/* CO2 Savings */}
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300 shadow-sm border border-orange-100">
                      <Factory className="text-orange-500" size={40} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">{envBenefits.co2SavedTonsPerYear} Tons</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">CO2 Emissions Reduced</p>
                    </div>
                  </div>

                  {/* Tree Equivalents */}
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300 shadow-sm border border-emerald-100">
                      <TreeDeciduous className="text-emerald-500" size={40} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">{Math.round(envBenefits.equivalentTrees)} Trees</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Planted Equivalent</p>
                    </div>
                  </div>

                  {/* Savings */}
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300 shadow-sm border border-amber-100">
                      <IndianRupee className="text-amber-600" size={40} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">₹{((monthlyBillBefore - monthlyBillAfter) * 12).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Financial Savings Yearly</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <p className="text-slate-600 font-medium">
                    Over 25 years, you will reduce <span className="text-emerald-600 font-bold">{envBenefits.co2Saved25YearsTons} tons</span> of carbon emissions,
                    equivalent to planting <span className="text-emerald-600 font-bold">{envBenefits.equivalentTrees25Years.toLocaleString()} mature trees</span>.
                  </p>
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

            {/* Terms and Conditions Section */}
            <div className="border-t border-slate-200 pt-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Terms and Conditions</h3>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="space-y-4">
                  {termsConditions.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="font-bold text-amber-900 min-w-fit">{index + 1}.</span>
                      <div className="flex-1">
                        {item.title && (
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const updated = [...termsConditions];
                              updated[index].title = e.target.value;
                              setTermsConditions(updated);
                            }}
                            className="w-full font-bold text-slate-900 mb-2 p-1 border border-amber-300 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder={`Term ${index + 1} Title`}
                          />
                        )}
                        <textarea
                          value={item.content}
                          onChange={(e) => {
                            const updated = [...termsConditions];
                            updated[index].content = e.target.value;
                            setTermsConditions(updated);
                          }}
                          className="w-full p-2 border border-amber-300 rounded text-sm resize-none focus:ring-2 focus:ring-amber-500 outline-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-700 mt-4 italic">These terms and conditions will appear in the PDF before customer scope</p>
              </div>
            </div>

            {/* Customer Scope Section */}
            <div className="border-t border-slate-200 pt-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Customer Scope of Work</h3>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="space-y-4">
                  {customerScope.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="font-bold text-amber-900 min-w-fit">{index + 1}.</span>
                      <textarea
                        value={item}
                        onChange={(e) => {
                          const updated = [...customerScope];
                          updated[index] = e.target.value;
                          setCustomerScope(updated);
                        }}
                        className="w-full p-2 border border-amber-300 rounded text-sm resize-none focus:ring-2 focus:ring-amber-500 outline-none"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-700 mt-4 italic">These scope items will appear in the PDF quotation</p>
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
              className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${sent
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
