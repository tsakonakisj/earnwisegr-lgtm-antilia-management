import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { company } from '../../lib/company';

interface ContractData {
  reservation: {
    id: string;
    customer: {
      name: string;
      phone: string;
      email: string;
      country: string;
      license_number: string;
      birth_date: string;
    };
    vehicle: {
      plate: string;
      brand: string;
      model: string;
      category: string;
    };
    pickup_date: string;
    return_date: string;
    pickup_station: string;
    return_station: string;
    daily_rate: number;
    insurance_type: string;
    insurance_rate: number;
    total_amount: number;
    extras: Array<{ name: string; quantity: number; price: number }>;
    fuel_level?: number;
    odometer?: number;
    damages?: Array<{ description: string }>;
    accessories_given?: string[];
    deposit_amount?: number;
    payment_method?: string;
  };
}

interface ContractGeneratorProps {
  data: ContractData;
}

let cachedFontBase64: string | null = null;
let fontLoadFailed = false;

async function loadUnicodeFont(): Promise<string | null> {
  if (fontLoadFailed) return null;
  if (cachedFontBase64) return cachedFontBase64;
  try {
    const response = await fetch(
      'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans@latest/greek-400-normal.ttf'
    );
    if (!response.ok) throw new Error('Font fetch failed');
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    cachedFontBase64 = btoa(binary);
    return cachedFontBase64;
  } catch {
    fontLoadFailed = true;
    return null;
  }
}

function registerFont(doc: jsPDF, fontBase64: string) {
  doc.addFileToVFS('NotoSans-Regular.ttf', fontBase64);
  doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
}

function hasNonLatin(text: string): boolean {
  return /[^\u0000-\u024F]/.test(text);
}

function fmtDate(iso: string, locale = 'el-GR'): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

function fmtDateTime(iso: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('el-GR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

function calcDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(diff / 86400000));
}

function fuelFraction(pct: number): string {
  if (pct >= 100) return '8/8 (100%)';
  if (pct >= 87.5) return '7/8';
  if (pct >= 75) return '6/8 (3/4)';
  if (pct >= 62.5) return '5/8';
  if (pct >= 50) return '4/8 (1/2)';
  if (pct >= 37.5) return '3/8';
  if (pct >= 25) return '2/8 (1/4)';
  if (pct >= 12.5) return '1/8';
  return '0/8 (0%)';
}

const ContractGenerator: React.FC<ContractGeneratorProps> = ({ data }) => {
  const [generating, setGenerating] = useState(false);

  const generateContract = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const PW = 210;
      const M = 14;
      const CW = PW - M * 2; // 182mm
      let y = 0;

      const r = data.reservation;
      const days = calcDays(r.pickup_date, r.return_date);
      const insuranceFull = r.insurance_type === 'full';
      const franchise = insuranceFull ? 0 : 500;

      // Load Greek font
      const fontBase64 = await loadUnicodeFont();
      let unicode = false;
      if (fontBase64) {
        registerFont(doc, fontBase64);
        unicode = true;
      }

      // Font helpers
      const gr = (text: string) => {
        if (unicode && hasNonLatin(text)) doc.setFont('NotoSans', 'normal');
        else doc.setFont('helvetica', 'normal');
      };
      const bold = () => doc.setFont('helvetica', 'bold');
      const normal = () => doc.setFont('helvetica', 'normal');
      const rgb = (r: number, g: number, b: number) => doc.setTextColor(r, g, b);
      const fill = (r: number, g: number, b: number) => doc.setFillColor(r, g, b);
      const draw = (r: number, g: number, b: number) => doc.setDrawColor(r, g, b);
      const lw = (w: number) => doc.setLineWidth(w);

      const txt = (text: string, x: number, yy: number, opts?: { align?: 'left' | 'center' | 'right'; maxWidth?: number }) => {
        gr(text);
        doc.text(text, x, yy, opts as any);
        normal();
      };

      const sectionHeader = (title: string, x: number, yy: number, w: number) => {
        fill(13, 71, 161);
        doc.rect(x, yy, w, 7, 'F');
        rgb(255, 255, 255);
        doc.setFontSize(8.5);
        bold();
        doc.text(title, x + 3, yy + 5);
        rgb(0, 0, 0);
        normal();
        return yy + 9;
      };

      const row = (label: string, value: string, x: number, yy: number, colW: number): number => {
        doc.setFontSize(7.5);
        rgb(100, 100, 100);
        normal();
        doc.text(label, x + 2, yy);
        rgb(20, 20, 20);
        doc.setFontSize(8.5);
        gr(value);
        const lines = doc.splitTextToSize(value || '-', colW - 6);
        doc.text(lines, x + 2, yy + 4);
        normal();
        return yy + 4 + lines.length * 4.5;
      };

      // ═══════════════════════════════════════
      // HEADER
      // ═══════════════════════════════════════
      fill(13, 71, 161);
      doc.rect(0, 0, PW, 30, 'F');

      // Company details (left)
      rgb(255, 255, 255);
      doc.setFontSize(17);
      bold();
      doc.text(company.contractHeader, M, 11);

      doc.setFontSize(8);
      normal();
      doc.text(company.address, M, 17);
      doc.text(`Tel: ${company.phone}  |  ${company.email}  |  ${company.website}`, M, 22);
      doc.text(`ΑΦΜ: ${company.taxNumber}  |  Αρ.Μητρώου: ${company.registrationNumber}`, M, 27);

      // Contract title box (right)
      fill(255, 255, 255);
      doc.rect(PW - 70, 4, 57, 22, 'F');
      rgb(13, 71, 161);
      doc.setFontSize(9);
      bold();
      doc.text('ΣΥΜΒΟΛΑΙΟ ΕΝΟΙΚΙΑΣΗΣ', PW - 41.5, 12, { align: 'center' });
      doc.text('CAR RENTAL AGREEMENT', PW - 41.5, 17.5, { align: 'center' });
      doc.setFontSize(7.5);
      normal();
      rgb(80, 80, 80);
      doc.text(`No: ${r.id.substring(0, 8).toUpperCase()}`, PW - 41.5, 22, { align: 'center' });

      y = 34;

      // ═══════════════════════════════════════
      // META ROW
      // ═══════════════════════════════════════
      rgb(0, 0, 0);
      doc.setFontSize(7.5);
      normal();
      const metaDate = new Date().toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      doc.text(`Ημερομηνία Εκτύπωσης / Print Date: ${metaDate}`, M, y);
      doc.text(`Αρ. Κράτησης / Booking Ref: ${r.id.substring(0, 8).toUpperCase()}`, PW / 2, y, { align: 'center' });

      draw(13, 71, 161);
      lw(0.5);
      y += 2;
      doc.line(M, y, PW - M, y);
      y += 4;

      // ═══════════════════════════════════════
      // TWO COLUMNS: CUSTOMER | VEHICLE
      // ═══════════════════════════════════════
      const half = CW / 2 - 2;
      const col2 = M + half + 4;

      y = sectionHeader('ΣΤΟΙΧΕΙΑ ΠΕΛΑΤΗ  /  CUSTOMER INFORMATION', M, y, half);
      const customerStartY = y;
      y = row('Ονοματεπώνυμο / Name', r.customer.name, M, y, half);
      y = row('Τηλέφωνο / Phone', r.customer.phone, M, y, half);
      y = row('Email', r.customer.email, M, y, half);
      y = row('Χώρα / Country', r.customer.country, M, y, half);
      y = row('Αρ. Άδειας / License No', r.customer.license_number, M, y, half);
      y = row('Ημ. Γέννησης / Date of Birth', r.customer.birth_date ? fmtDate(r.customer.birth_date) : '-', M, y, half);
      const customerEndY = y;

      let yv = sectionHeader('ΣΤΟΙΧΕΙΑ ΟΧΗΜΑΤΟΣ  /  VEHICLE INFORMATION', col2, customerStartY - 9, half);
      yv = row('Πινακίδα / License Plate', r.vehicle.plate, col2, yv, half);
      yv = row('Όχημα / Vehicle', `${r.vehicle.brand} ${r.vehicle.model}`, col2, yv, half);
      yv = row('Κατηγορία / Category', r.vehicle.category, col2, yv, half);

      if (r.fuel_level !== undefined)
        yv = row('Επίπεδο Καυσίμου / Fuel Level', fuelFraction(r.fuel_level), col2, yv, half);
      if (r.odometer !== undefined)
        yv = row('Χιλιόμετρα Παραλαβής / Odometer', `${r.odometer.toLocaleString()} km`, col2, yv, half);

      y = Math.max(customerEndY, yv) + 3;

      draw(200, 200, 200);
      lw(0.3);
      doc.line(M, y, PW - M, y);
      y += 4;

      // ═══════════════════════════════════════
      // RENTAL PERIOD
      // ═══════════════════════════════════════
      y = sectionHeader('ΠΕΡΙΟΔΟΣ ΕΝΟΙΚΙΑΣΗΣ  /  RENTAL PERIOD', M, y, CW);

      // Pickup
      const halfCW = CW / 2 - 2;
      let yp = y;
      rgb(100, 100, 100);
      doc.setFontSize(7.5);
      doc.text('Παραλαβή / PICK-UP', M + 2, yp);
      yp += 4;
      rgb(0, 0, 0);
      doc.setFontSize(8.5);
      bold();
      txt(fmtDateTime(r.pickup_date), M + 2, yp);
      yp += 5;
      normal();
      txt(r.pickup_station || '-', M + 2, yp);
      yp += 5;

      let yr = y;
      rgb(100, 100, 100);
      doc.setFontSize(7.5);
      doc.text('Επιστροφή / RETURN', col2 + 2, yr);
      yr += 4;
      rgb(0, 0, 0);
      doc.setFontSize(8.5);
      bold();
      txt(fmtDateTime(r.return_date), col2 + 2, yr);
      yr += 5;
      normal();
      txt(r.return_station || '-', col2 + 2, yr);
      yr += 5;

      // Days badge center
      const daysX = M + halfCW + 2;
      fill(240, 244, 255);
      draw(13, 71, 161);
      lw(0.4);
      doc.rect(daysX - 2, y - 1, 10, 14, 'FD');
      rgb(13, 71, 161);
      doc.setFontSize(12);
      bold();
      doc.text(String(days), daysX + 3, y + 5.5, { align: 'center' });
      doc.setFontSize(6.5);
      normal();
      doc.text('ημέρ.', daysX + 3, y + 10, { align: 'center' });
      doc.text('days', daysX + 3, y + 13, { align: 'center' });

      y = Math.max(yp, yr) + 2;

      draw(200, 200, 200);
      lw(0.3);
      doc.line(M, y, PW - M, y);
      y += 4;

      // ═══════════════════════════════════════
      // INSURANCE & PAYMENT (two columns)
      // ═══════════════════════════════════════
      const insStartY = y;
      y = sectionHeader('ΑΣΦΑΛΙΣΗ  /  INSURANCE', M, y, half);

      const insType = insuranceFull ? 'ΠΛΗΡΗΣ ΚΑΛΥΨΗ / FULL COVERAGE' : 'ΒΑΣΙΚΗ / BASIC';
      rgb(0, 0, 0);
      doc.setFontSize(9);
      bold();
      txt(insType, M + 2, y);
      y += 5;

      doc.setFontSize(7.5);
      normal();
      rgb(50, 50, 50);
      const insCoverage = insuranceFull
        ? ['Κάλυψη κλοπής / Theft cover', 'Κάλυψη ζημιών / Collision damage', 'Τρίτοι / Third party liability', 'Franchise: EUR 0']
        : ['Τρίτοι / Third party liability', `Franchise: EUR ${franchise.toFixed(2)}`, 'Εξαιρείται κλοπή / Theft excluded', 'Εξαιρείται CDW / CDW excluded'];

      insCoverage.forEach(line => {
        const bullet = insuranceFull ? '✓ ' : '• ';
        doc.text(bullet + line, M + 2, y);
        y += 4;
      });

      y = row('Τέλος Ασφάλισης / Insurance Fee', `EUR ${Number(r.insurance_rate).toFixed(2)} / ημέρα (day)`, M, y + 1, half);

      let yPay = insStartY;
      yPay = sectionHeader('ΠΛΗΡΩΜΗ  /  PAYMENT', col2, yPay, half);

      const payMethod = r.payment_method
        ? (r.payment_method === 'cash' ? 'Μετρητά / Cash' : 'Κάρτα / Card')
        : '-';
      yPay = row('Τρόπος Πληρωμής / Payment Method', payMethod, col2, yPay, half);

      if (r.deposit_amount !== undefined)
        yPay = row('Εγγύηση / Deposit', `EUR ${Number(r.deposit_amount).toFixed(2)}`, col2, yPay, half);

      yPay = row('Ημερήσιο Τέλος / Daily Rate', `EUR ${Number(r.daily_rate).toFixed(2)}`, col2, yPay, half);
      yPay = row('Αριθμός Ημερών / Days', String(days), col2, yPay, half);

      if (r.extras && r.extras.length > 0) {
        r.extras.forEach(ex => {
          yPay = row(`${ex.name} (x${ex.quantity})`, `EUR ${(ex.price * ex.quantity).toFixed(2)}`, col2, yPay, half);
        });
      }

      // Total box
      fill(13, 71, 161);
      doc.rect(col2, yPay, half, 10, 'F');
      rgb(255, 255, 255);
      doc.setFontSize(8);
      bold();
      doc.text('ΣΥΝΟΛΟ / TOTAL:', col2 + 2, yPay + 4.5);
      doc.setFontSize(11);
      doc.text(`EUR ${Number(r.total_amount).toFixed(2)}`, col2 + half - 3, yPay + 7, { align: 'right' });
      yPay += 12;

      y = Math.max(y, yPay) + 2;

      draw(200, 200, 200);
      lw(0.3);
      doc.line(M, y, PW - M, y);
      y += 4;

      // ═══════════════════════════════════════
      // VEHICLE CONDITION
      // ═══════════════════════════════════════
      const hasConditionData = r.fuel_level !== undefined || r.odometer !== undefined ||
        (r.accessories_given && r.accessories_given.length > 0) ||
        (r.damages && r.damages.length > 0);

      if (hasConditionData) {
        y = sectionHeader('ΚΑΤΑΣΤΑΣΗ ΟΧΗΜΑΤΟΣ ΠΑΡΑΛΑΒΗΣ  /  VEHICLE CONDITION AT PICK-UP', M, y, CW);

        // Fuel gauge visual
        if (r.fuel_level !== undefined) {
          doc.setFontSize(7.5);
          rgb(80, 80, 80);
          doc.text('Καύσιμα / Fuel:', M + 2, y);
          const gaugeX = M + 30;
          const gaugeW = 60;
          const gaugeH = 5;
          draw(180, 180, 180);
          lw(0.3);
          fill(230, 230, 230);
          doc.rect(gaugeX, y - 4, gaugeW, gaugeH, 'FD');
          const fillPct = r.fuel_level / 100;
          const fillColor = r.fuel_level > 60 ? [46, 125, 50] : r.fuel_level > 25 ? [230, 120, 0] : [198, 40, 40];
          fill(fillColor[0], fillColor[1], fillColor[2]);
          draw(fillColor[0], fillColor[1], fillColor[2]);
          doc.rect(gaugeX, y - 4, gaugeW * fillPct, gaugeH, 'F');
          rgb(0, 0, 0);
          doc.text(`${fuelFraction(r.fuel_level)}`, gaugeX + gaugeW + 3, y);
          y += 6;
        }

        if (r.odometer !== undefined) {
          doc.setFontSize(7.5);
          rgb(80, 80, 80);
          doc.text('Χιλιόμετρα Παραλαβής / Odometer at Pick-up:', M + 2, y);
          rgb(0, 0, 0);
          doc.setFontSize(8.5);
          bold();
          doc.text(`${r.odometer.toLocaleString()} km`, M + 85, y);
          normal();
          y += 6;
        }

        if (r.accessories_given && r.accessories_given.length > 0) {
          doc.setFontSize(7.5);
          rgb(80, 80, 80);
          doc.text('Αξεσουάρ που Παραδόθηκαν / Accessories Provided:', M + 2, y);
          y += 4;
          rgb(0, 0, 0);
          doc.setFontSize(8);
          normal();
          const accLine = r.accessories_given.join('  •  ');
          const accLines = doc.splitTextToSize(accLine, CW - 4);
          txt(accLine, M + 4, y);
          y += accLines.length * 4.5 + 2;
        }

        if (r.damages && r.damages.length > 0) {
          doc.setFontSize(7.5);
          rgb(150, 50, 0);
          bold();
          doc.text('Προϋπάρχουσες Ζημιές / Pre-existing Damages:', M + 2, y);
          y += 4;
          r.damages.forEach((d, i) => {
            rgb(100, 40, 0);
            normal();
            doc.setFontSize(8);
            const dmgLines = doc.splitTextToSize(`${i + 1}. ${d.description}`, CW - 8);
            txt(`${i + 1}. ${d.description}`, M + 4, y);
            y += dmgLines.length * 4.5;
          });
          y += 2;
        } else {
          doc.setFontSize(7.5);
          rgb(46, 125, 50);
          doc.text('Δεν καταγράφηκαν ζημιές κατά την παραλαβή. / No damages noted at pick-up.', M + 2, y);
          y += 5;
        }

        rgb(0, 0, 0);
        draw(200, 200, 200);
        lw(0.3);
        doc.line(M, y, PW - M, y);
        y += 4;
      }

      // ═══════════════════════════════════════
      // TERMS & CONDITIONS
      // ═══════════════════════════════════════
      y = sectionHeader('ΟΡΟΙ & ΠΡΟΫΠΟΘΕΣΕΙΣ  /  TERMS & CONDITIONS', M, y, CW);

      const terms = [
        '1. Το όχημα παραδίδεται στον ενοικιαστή στην κατάσταση που αναγράφεται παραπάνω. / The vehicle is delivered to the renter in the condition stated above.',
        '2. Το όχημα πρέπει να επιστραφεί με το ίδιο επίπεδο καυσίμου. Τυχόν έλλειψη χρεώνεται. / Vehicle must be returned with the same fuel level. Shortfall will be charged.',
        '3. Ο ενοικιαστής ευθύνεται πλήρως για κάθε ζημιά κατά την ενοικίαση πέραν της franchise. / Renter is liable for all damage during rental up to the franchise amount.',
        '4. Καθυστερημένη επιστροφή χρεώνεται EUR 10/ώρα. / Late returns are charged EUR 10.00 per hour.',
        '5. Απαγορεύεται το κάπνισμα και η μεταφορά ζώων. / Smoking and pets are strictly prohibited.',
        '6. Σε περίπτωση ατυχήματος ειδοποιήστε άμεσα την εταιρεία και τις αρχές. / In case of accident, notify the company and authorities immediately.',
        '7. Απαγορεύεται η οδήγηση υπό την επήρεια αλκοόλ ή ναρκωτικών. / Driving under the influence of alcohol or drugs is strictly forbidden.',
      ];

      doc.setFontSize(6.8);
      normal();
      rgb(40, 40, 40);
      terms.forEach(term => {
        const lines = doc.splitTextToSize(term, CW - 2);
        lines.forEach((line: string) => {
          txt(line, M + 1, y);
          y += 3.8;
        });
        y += 0.5;
      });

      y += 3;

      // ═══════════════════════════════════════
      // DECLARATION
      // ═══════════════════════════════════════
      fill(255, 248, 225);
      draw(230, 180, 0);
      lw(0.4);
      doc.rect(M, y, CW, 10, 'FD');
      rgb(80, 60, 0);
      doc.setFontSize(7.5);
      normal();
      const decl = 'Με την υπογραφή μου βεβαιώνω ότι έχω διαβάσει, κατανοήσει και αποδέχομαι τους παραπάνω όρους. / By signing below I confirm that I have read, understood and accept the above terms.';
      const declLines = doc.splitTextToSize(decl, CW - 4);
      doc.text(declLines, M + 2, y + 4);
      y += 13;

      // Check if we need a new page for signatures
      if (y > 255) {
        doc.addPage();
        y = 20;
      }

      // ═══════════════════════════════════════
      // SIGNATURES
      // ═══════════════════════════════════════
      y = sectionHeader('ΥΠΟΓΡΑΦΕΣ  /  SIGNATURES', M, y, CW);

      const sigW = CW / 3 - 3;
      const sigH = 25;
      const sig1x = M;
      const sig2x = M + sigW + 4;
      const sig3x = M + (sigW + 4) * 2;

      // Box 1: Customer
      draw(180, 180, 180);
      lw(0.3);
      fill(252, 252, 252);
      doc.rect(sig1x, y, sigW, sigH, 'FD');
      rgb(80, 80, 80);
      doc.setFontSize(7);
      normal();
      doc.text('Υπογραφή Πελάτη', sig1x + sigW / 2, y + 4, { align: 'center' });
      doc.text('Customer Signature', sig1x + sigW / 2, y + 7.5, { align: 'center' });
      rgb(20, 20, 20);
      doc.setFontSize(7.5);
      gr(r.customer.name);
      const nameLines = doc.splitTextToSize(r.customer.name, sigW - 4);
      doc.text(nameLines, sig1x + sigW / 2, y + 20, { align: 'center' });
      draw(100, 100, 100);
      doc.line(sig1x + 4, y + sigH - 2, sig1x + sigW - 4, y + sigH - 2);

      // Box 2: Company Agent
      fill(252, 252, 252);
      draw(180, 180, 180);
      doc.rect(sig2x, y, sigW, sigH, 'FD');
      rgb(80, 80, 80);
      doc.setFontSize(7);
      normal();
      doc.text('Εκπρόσωπος Εταιρείας', sig2x + sigW / 2, y + 4, { align: 'center' });
      doc.text('Company Agent', sig2x + sigW / 2, y + 7.5, { align: 'center' });
      draw(100, 100, 100);
      doc.line(sig2x + 4, y + sigH - 2, sig2x + sigW - 4, y + sigH - 2);

      // Box 3: Date / Ημερομηνία
      fill(252, 252, 252);
      draw(180, 180, 180);
      doc.rect(sig3x, y, sigW, sigH, 'FD');
      rgb(80, 80, 80);
      doc.setFontSize(7);
      normal();
      doc.text('Ημερομηνία / Date', sig3x + sigW / 2, y + 4, { align: 'center' });
      rgb(20, 20, 20);
      doc.setFontSize(8.5);
      bold();
      doc.text(metaDate, sig3x + sigW / 2, y + 15, { align: 'center' });
      normal();
      doc.setFontSize(7);
      rgb(80, 80, 80);
      doc.text('Τόπος / Place:', sig3x + sigW / 2, y + 20, { align: 'center' });
      draw(100, 100, 100);
      doc.line(sig3x + 4, y + sigH - 2, sig3x + sigW - 4, y + sigH - 2);

      y += sigH + 5;

      // ═══════════════════════════════════════
      // FOOTER
      // ═══════════════════════════════════════
      const footerY = 287;
      draw(200, 200, 200);
      lw(0.3);
      doc.line(M, footerY - 3, PW - M, footerY - 3);
      rgb(120, 120, 120);
      doc.setFontSize(6.5);
      normal();
      doc.text(`${company.name}  |  ${company.address}  |  ${company.phone}  |  ${company.email}  |  ${company.website}`, PW / 2, footerY, { align: 'center' });
      doc.text(`ΑΦΜ: ${company.taxNumber}  |  ${company.registrationNumber}`, PW / 2, footerY + 4, { align: 'center' });

      doc.save(`contract-${r.id.substring(0, 8)}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={generateContract}
      disabled={generating}
      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <DocumentTextIcon className="h-4 w-4 mr-1" />
      {generating ? 'Δημιουργία...' : 'Σύμβολαιο PDF'}
    </button>
  );
};

export default ContractGenerator;
