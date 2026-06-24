'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function generateQuotationPDF(quotation, client, { isRelease = false } = {}) {
  const doc     = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const ro      = quotation.releaseOrder;
  const docType = isRelease && ro ? 'RELEASE ORDER' : 'QUOTATION';
  const docNum  = isRelease && ro ? ro.orderNumber  : quotation.quotationNumber;
  const docDate = isRelease && ro ? ro.releasedAt   : quotation.createdAt;

  const RED  = [200, 16, 46];
  const W    = 210;
  const L    = 14;
  const R    = W - 14;

  /* ── Brand ── */
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(...RED);
  doc.text('PainterPro', L, 18);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
  doc.text('Authorized Nippon Paint Dealer', L, 24);

  /* ── Doc type ── */
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(25, 25, 25);
  doc.text(docType, R, 18, { align: 'right' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
  doc.text(`No: ${docNum}`, R, 24, { align: 'right' });
  doc.text(`Date: ${new Date(docDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, R, 29, { align: 'right' });
  if (isRelease && ro) doc.text(`Ref: ${quotation.quotationNumber}`, R, 34, { align: 'right' });

  /* ── Red line ── */
  doc.setDrawColor(...RED); doc.setLineWidth(0.9);
  doc.line(L, 37, R, 37);

  /* ── Client info ── */
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(160, 160, 160);
  doc.text('BILL TO', L, 44);

  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(25, 25, 25);
  doc.text(client?.name || '-', L, 50);

  let cy = 56;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
  if (client?.company)   { doc.text(client.company,               L, cy); cy += 5; }
  if (client?.mobile)    { doc.text(`Tel: ${client.mobile}`,      L, cy); cy += 5; }
  if (client?.email)     { doc.text(`Email: ${client.email}`,     L, cy); cy += 5; }
  const addr = [client?.address?.area, client?.address?.city, client?.address?.state, client?.address?.pincode].filter(Boolean).join(', ');
  if (addr)              { doc.text(addr,                         L, cy, { maxWidth: 90 }); cy += 5; }
  if (client?.gstNumber) { doc.text(`GSTIN: ${client.gstNumber}`, L, cy); cy += 5; }

  /* ── Products table ── */
  const items     = quotation.items || [];
  const hasColour = items.some((i) => i.colourHex);

  const head = [['#', 'Product', 'Pack', 'Qty', ...(hasColour ? ['Colour'] : []), 'Unit Price', 'Amount']];
  const body = items.map((it, i) => [
    i + 1,
    it.productName,
    it.size ? `${it.size.qty}${it.size.unit}` : '-',
    it.quantity,
    ...(hasColour ? [it.colourHex || '-'] : []),
    it.size?.price ? `Rs. ${fmt(it.size.price)}` : '-',
    it.amount      ? `Rs. ${fmt(it.amount)}`     : '-',
  ]);

  const colStyles = {
    0: { cellWidth: 8,  halign: 'center' },
    2: { cellWidth: 18, halign: 'center' },
    3: { cellWidth: 12, halign: 'center' },
  };
  if (hasColour) {
    colStyles[4] = { cellWidth: 18, halign: 'center' };
    colStyles[5] = { cellWidth: 26, halign: 'right' };
    colStyles[6] = { cellWidth: 28, halign: 'right', fontStyle: 'bold' };
  } else {
    colStyles[4] = { cellWidth: 26, halign: 'right' };
    colStyles[5] = { cellWidth: 28, halign: 'right', fontStyle: 'bold' };
  }

  autoTable(doc, {
    startY: Math.max(cy + 5, 73),
    head,
    body,
    theme: 'grid',
    headStyles: { fillColor: RED, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
    bodyStyles: { fontSize: 9, cellPadding: 3, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: colStyles,
  });

  /* ── Totals ── */
  const fy          = doc.lastAutoTable.finalY + 5;
  const totalAmount = quotation.totalAmount  || 0;
  const discountAmt = quotation.discountAmount || 0;
  const grandTotal  = quotation.grandTotal   || totalAmount;

  let ty = fy;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 100, 100);
  doc.text('Subtotal:', 155, ty, { align: 'right' });
  doc.text(`Rs. ${fmt(totalAmount)}`, R, ty, { align: 'right' });

  if (discountAmt > 0) {
    ty += 6;
    doc.setTextColor(...RED);
    doc.text('Discount:', 155, ty, { align: 'right' });
    doc.text(`- Rs. ${fmt(discountAmt)}`, R, ty, { align: 'right' });
  }

  ty += 7;
  doc.setDrawColor(...RED); doc.setLineWidth(0.5);
  doc.line(130, ty - 2, R, ty - 2);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(25, 25, 25);
  doc.text('Grand Total:', 155, ty + 5, { align: 'right' });
  doc.text(`Rs. ${fmt(grandTotal)}`, R, ty + 5, { align: 'right' });

  /* ── Notes ── */
  let ny = ty + 16;
  if (quotation.notes) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text('NOTES', L, ny);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
    doc.text(quotation.notes, L, ny + 5, { maxWidth: 100 });
    ny += 16;
  }
  if (isRelease && ro?.notes) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text('RELEASE NOTES', L, ny);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
    doc.text(ro.notes, L, ny + 5, { maxWidth: 100 });
    ny += 16;
  }

  /* ── Signatures ── */
  const sigY = Math.max(ny + 10, ty + 35);
  doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
  doc.line(L, sigY, L + 55, sigY);
  doc.line(130, sigY, R, sigY);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(160, 160, 160);
  doc.text('Customer Signature', L, sigY + 5);
  doc.text('Authorized Signature', 130, sigY + 5);

  /* ── Footer ── */
  const pH = doc.internal.pageSize.height;
  doc.setDrawColor(...RED); doc.setLineWidth(0.8);
  doc.line(L, pH - 18, R, pH - 18);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(180, 180, 180);
  doc.text('Thank you for your business!  ·  Generated by PainterPro', W / 2, pH - 11, { align: 'center' });

  return doc;
}
