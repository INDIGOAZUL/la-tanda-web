/**
 * Email Templates - Payment Notifications
 * Dark-themed, invoice-style HTML emails for La Tanda payment events
 * Optimized for Gmail, Outlook, Yahoo Mail rendering
 *
 * @version 1.1.0
 * @date 2026-02-21
 */

'use strict';

// HTML-escape user data
function esc(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Format currency
function fmtL(amount) {
    const num = parseFloat(amount);
    if (!Number.isFinite(num)) return 'L. 0.00';
    return 'L. ' + num.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format date to Honduras locale
function fmtDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Payment method labels
function methodLabel(method) {
    const labels = {
        cash: 'Efectivo',
        bank_transfer: 'Transferencia Bancaria',
        mobile_money: 'Dinero M\u00f3vil',
        card: 'Tarjeta',
        crypto: 'Criptomoneda',
        wallet: 'Billetera LTD'
    };
    return labels[method] || method || 'Efectivo';
}

// Base email layout wrapper — Gmail/Outlook/Yahoo compatible
function baseLayout(title, preheader, bodyContent, footerEmail) {
    return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(title)}</title>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<style>
table { border-collapse: collapse; }
td { font-family: Arial, sans-serif; }
</style>
<![endif]-->
<style>
@media only screen and (max-width: 620px) {
    .email-container { width: 100% !important; max-width: 100% !important; }
    .email-body { padding: 20px 16px !important; }
    .info-table td { font-size: 13px !important; }
    .cta-btn { padding: 14px 28px !important; font-size: 15px !important; }
    .header-logo { width: 36px !important; height: 36px !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<!-- Preheader (preview text in inbox, hidden from email body) -->
<div style="display:none;font-size:1px;color:#0a0e1a;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
${esc(preheader)}${'&#847; &zwnj; &nbsp; '.repeat(30)}
</div>

<!--[if mso]>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0e1a;">
<tr><td align="center">
<![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0e1a;">
<tr><td align="center" style="padding:24px 16px;">

<!--[if mso]>
<table role="presentation" width="600" cellpadding="0" cellspacing="0" align="center"><tr><td>
<![endif]-->
<table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:0 auto;">

<!-- Header -->
<tr><td style="background-color:#00FFFF;padding:14px 24px;border-radius:8px 8px 0 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="vertical-align:middle;" width="44">
<img src="https://latanda.online/assets/logo-latanda-latest.png" alt="La Tanda" class="header-logo" width="40" height="40" style="display:block;border:0;width:40px;height:40px;border-radius:8px;">
</td>
<td style="vertical-align:middle;padding-left:12px;">
<span style="font-size:22px;font-weight:700;color:#0f172a;letter-spacing:0.5px;">La Tanda</span>
</td>
<td align="right" style="vertical-align:middle;">
<span style="font-size:13px;color:#0f172a;font-weight:600;background-color:rgba(15,23,42,0.12);padding:4px 10px;border-radius:4px;">Pagos</span>
</td>
</tr>
</table>
</td></tr>

<!-- Body -->
<tr><td class="email-body" style="background-color:#1e293b;padding:28px 24px;border-radius:0 0 8px 8px;">
${bodyContent}
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 24px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<p style="margin:0;font-size:12px;color:#64748b;text-align:center;line-height:1.6;">
Este correo fue enviado a ${esc(footerEmail || '')}.<br>
Puedes ajustar tus preferencias de notificaci&oacute;n en
<a href="https://latanda.online/configuracion" style="color:#00FFFF;text-decoration:none;">latanda.online/configuraci&oacute;n</a>
</p>
<p style="margin:12px 0 0;font-size:11px;color:#475569;text-align:center;">
&copy; ${new Date().getFullYear()} La Tanda &mdash; Honduras
</p>
</td></tr>
</table>
</td></tr>

</table>
<!--[if mso]>
</td></tr></table>
<![endif]-->

</td></tr>
</table>
<!--[if mso]>
</td></tr></table>
<![endif]-->

</body>
</html>`;
}

// Utility: info row for invoice-style layout
function infoRow(label, value, color) {
    return `<tr>
<td style="padding:8px 0;font-size:14px;color:#94a3b8;border-bottom:1px solid #334155;line-height:1.4;">${esc(label)}</td>
<td align="right" style="padding:8px 0;font-size:14px;color:${color || '#e2e8f0'};font-weight:500;border-bottom:1px solid #334155;line-height:1.4;">${esc(value)}</td>
</tr>`;
}

// Utility: CTA button (VML for Outlook, HTML for others)
function ctaButton(text, href, bgColor, textColor) {
    bgColor = bgColor || '#00FFFF';
    textColor = textColor || '#0f172a';
    return `<div style="text-align:center;margin-top:24px;">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(href)}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="14%" fillcolor="${bgColor}" stroke="f">
<w:anchorlock/>
<center style="color:${textColor};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">${esc(text)}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="${esc(href)}" class="cta-btn" style="display:inline-block;padding:12px 32px;background-color:${bgColor};color:${textColor};font-weight:600;font-size:14px;text-decoration:none;border-radius:6px;mso-hide:all;">${esc(text)}</a>
<!--<![endif]-->
</div>`;
}

/**
 * 1. Payment Recorded - sent to member when coordinator records their payment
 */
function paymentRecordedEmail(data) {
    const subject = `Pago registrado - ${data.groupName} (Ciclo ${data.cycle})`;
    const preheader = `Tu pago de ${fmtL(data.amount)} en ${data.groupName} fue registrado exitosamente. C\u00f3digo: ${data.confirmationCode}`;

    let positionsNote = '';
    if (data.numPositions && data.numPositions > 1) {
        positionsNote = `
<div style="background-color:#0c1929;border-radius:6px;padding:10px 14px;margin-top:12px;border-left:3px solid #00FFFF;">
<p style="margin:0;font-size:12px;color:#67e8f9;line-height:1.4;">
Tienes ${esc(String(data.numPositions))} n&uacute;meros en este grupo. ${data.contributionsCompleted ? 'Llevas ' + esc(String(data.contributionsCompleted)) + '/' + esc(String(data.numPositions)) + ' pagos este ciclo.' : ''}
</p>
</div>`;
    }

    const body = `
<h2 style="margin:0 0 4px;font-size:20px;color:#e2e8f0;font-weight:600;">Pago Registrado</h2>
<p style="margin:0 0 20px;font-size:14px;color:#94a3b8;">Tu coordinador ha registrado tu pago exitosamente.</p>

<div style="background-color:#0f172a;border-radius:8px;padding:16px;margin-bottom:20px;border-left:4px solid #00FFFF;">
<table role="presentation" class="info-table" width="100%" cellpadding="0" cellspacing="0">
${infoRow('Grupo', data.groupName)}
${infoRow('Monto', fmtL(data.amount), '#00FFFF')}
${infoRow('Ciclo', data.cycle)}
${infoRow('M\u00e9todo', methodLabel(data.paymentMethod))}
${infoRow('C\u00f3digo', data.confirmationCode, '#00FFFF')}
${infoRow('Registrado por', data.coordinatorName)}
${infoRow('Fecha', fmtDate(data.date))}
</table>
</div>

<div style="background-color:#052e16;border-radius:8px;padding:12px 16px;text-align:center;border:1px solid #166534;">
<p style="margin:0;font-size:13px;color:#86efac;line-height:1.4;">&#10003; Tu pago ha sido verificado y registrado. No necesitas hacer nada m&aacute;s.</p>
</div>
${positionsNote}`;

    return {
        subject,
        html: baseLayout(subject, preheader, body, data.memberEmail)
    };
}

/**
 * 2. Payment Reminder - 1st reminder (1-3 days late)
 */
function paymentReminderEmail(data) {
    const subject = `Recordatorio de pago - ${data.groupName}`;
    const preheader = `Hola ${data.memberName}, tienes un pago pendiente de ${fmtL(data.amountOwed)} en ${data.groupName}.`;

    let positionsNote = '';
    if (data.numPositions && data.numPositions > 1) {
        positionsNote = `
${infoRow('N\u00fameros', data.numPositions)}
${infoRow('Pagos completados', (data.contributionsCompleted || 0) + '/' + data.numPositions)}`;
    }

    const body = `
<h2 style="margin:0 0 4px;font-size:20px;color:#e2e8f0;font-weight:600;">Recordatorio de Pago</h2>
<p style="margin:0 0 20px;font-size:14px;color:#94a3b8;">Hola ${esc(data.memberName)}, tienes un pago pendiente.</p>

<div style="background-color:#0f172a;border-radius:8px;padding:16px;margin-bottom:20px;border-left:4px solid #f59e0b;">
<table role="presentation" class="info-table" width="100%" cellpadding="0" cellspacing="0">
${infoRow('Grupo', data.groupName)}
${infoRow('Monto pendiente', fmtL(data.amountOwed), '#f59e0b')}
${infoRow('D\u00edas de atraso', data.daysLate + ' d\u00eda' + (data.daysLate !== 1 ? 's' : ''))}
${positionsNote}
</table>
</div>

${ctaButton('Realizar Pago', 'https://latanda.online/groups', '#00FFFF', '#0f172a')}

<p style="margin:20px 0 0;font-size:13px;color:#64748b;text-align:center;line-height:1.4;">Si ya realizaste tu pago, tu coordinador lo verificar&aacute; pronto.</p>`;

    return {
        subject,
        html: baseLayout(subject, preheader, body, data.memberEmail)
    };
}

/**
 * 3. Payment Late - 2nd reminder (4-7 days late)
 */
function paymentLateEmail(data) {
    const subject = `Pago atrasado - ${data.groupName}`;
    const preheader = `URGENTE: Tu pago de ${fmtL(data.amountOwed)} tiene ${data.daysLate} d\u00edas de atraso en ${data.groupName}.`;

    let positionsNote = '';
    if (data.numPositions && data.numPositions > 1) {
        positionsNote = `
${infoRow('N\u00fameros', data.numPositions)}
${infoRow('Pagos completados', (data.contributionsCompleted || 0) + '/' + data.numPositions)}`;
    }

    const body = `
<h2 style="margin:0 0 4px;font-size:20px;color:#ef4444;font-weight:600;">&#9888;&#65039; Pago Atrasado</h2>
<p style="margin:0 0 20px;font-size:14px;color:#94a3b8;">Hola ${esc(data.memberName)}, tu pago tiene varios d&iacute;as de atraso.</p>

<div style="background-color:#0f172a;border-radius:8px;padding:16px;margin-bottom:20px;border-left:4px solid #ef4444;">
<table role="presentation" class="info-table" width="100%" cellpadding="0" cellspacing="0">
${infoRow('Grupo', data.groupName)}
${infoRow('Monto pendiente', fmtL(data.amountOwed), '#ef4444')}
${infoRow('D\u00edas de atraso', data.daysLate + ' d\u00eda' + (data.daysLate !== 1 ? 's' : ''), '#ef4444')}
${positionsNote}
</table>
</div>

<div style="background-color:#1a0a0a;border-radius:8px;padding:12px 16px;border:1px solid #7f1d1d;margin-bottom:20px;">
<p style="margin:0;font-size:13px;color:#fca5a5;line-height:1.5;">
<strong>Importante:</strong> El incumplimiento prolongado puede resultar en la suspensi&oacute;n de tu membres&iacute;a en el grupo.
Contacta a tu coordinador si tienes dificultades para realizar el pago.
</p>
</div>

${ctaButton('Pagar Ahora', 'https://latanda.online/groups', '#ef4444', '#ffffff')}`;

    return {
        subject,
        html: baseLayout(subject, preheader, body, data.memberEmail)
    };
}

/**
 * 4. Suspension Warning - 3rd reminder (8+ days late, pre-suspension)
 */
function suspensionWarningEmail(data) {
    const subject = `Advertencia de suspensi\u00f3n - ${data.groupName}`;
    const preheader = `ALERTA: Tu cuenta en ${data.groupName} ser\u00e1 suspendida si no regularizas tu pago de ${fmtL(data.amountOwed)}.`;

    let positionsNote = '';
    if (data.numPositions && data.numPositions > 1) {
        positionsNote = `
${infoRow('N\u00fameros', data.numPositions)}
${infoRow('Pagos completados', (data.contributionsCompleted || 0) + '/' + data.numPositions)}`;
    }

    const body = `
<h2 style="margin:0 0 4px;font-size:20px;color:#ef4444;font-weight:600;">&#128680; Riesgo de Suspensi&oacute;n</h2>
<p style="margin:0 0 20px;font-size:14px;color:#94a3b8;">Hola ${esc(data.memberName)}, tu cuenta est&aacute; en riesgo de ser suspendida.</p>

<div style="background-color:#0f172a;border-radius:8px;padding:16px;margin-bottom:20px;border-left:4px solid #ef4444;">
<table role="presentation" class="info-table" width="100%" cellpadding="0" cellspacing="0">
${infoRow('Grupo', data.groupName)}
${infoRow('Monto pendiente', fmtL(data.amountOwed), '#ef4444')}
${infoRow('D\u00edas de atraso', data.daysLate + ' d\u00eda' + (data.daysLate !== 1 ? 's' : ''), '#ef4444')}
${positionsNote}
</table>
</div>

<div style="background-color:#1a0a0a;border-radius:8px;padding:16px;border:1px solid #991b1b;margin-bottom:20px;">
<p style="margin:0 0 8px;font-size:15px;color:#fca5a5;font-weight:600;">Tu cuenta ser&aacute; suspendida si no regularizas tu pago.</p>
<p style="margin:0;font-size:13px;color:#fca5a5;line-height:1.5;">
La suspensi&oacute;n implica la p&eacute;rdida temporal de acceso al grupo y sus beneficios.
Contacta inmediatamente a tu coordinador para resolver esta situaci&oacute;n.
</p>
</div>

${ctaButton('Regularizar Pago', 'https://latanda.online/groups', '#ef4444', '#ffffff')}`;

    return {
        subject,
        html: baseLayout(subject, preheader, body, data.memberEmail)
    };
}

/**
 * 5. Coordinator Late Alert - daily digest of late members
 */
function coordinatorLateAlertEmail(data) {
    const memberCount = (data.lateMembers || []).length;
    const subject = `${memberCount} miembro${memberCount !== 1 ? 's' : ''} con pago atrasado - ${data.groupName}`;
    const preheader = `Resumen diario: ${memberCount} miembro${memberCount !== 1 ? 's' : ''} con pagos pendientes en ${data.groupName}.`;

    let totalOwed = 0;
    let membersRows = '';
    for (const m of (data.lateMembers || [])) {
        const owed = parseFloat(m.amountOwed) || 0;
        totalOwed += owed;
        membersRows += `<tr>
<td style="padding:10px 12px;font-size:13px;color:#e2e8f0;border-bottom:1px solid #334155;line-height:1.4;">${esc(m.memberName || m.user_id)}</td>
<td align="center" style="padding:10px 12px;font-size:13px;color:#f59e0b;border-bottom:1px solid #334155;line-height:1.4;">${m.daysLate} d&iacute;a${m.daysLate !== 1 ? 's' : ''}</td>
<td align="right" style="padding:10px 12px;font-size:13px;color:#ef4444;font-weight:500;border-bottom:1px solid #334155;line-height:1.4;">${fmtL(m.amountOwed)}</td>
</tr>`;
    }

    // Summary row
    membersRows += `<tr>
<td colspan="2" style="padding:10px 12px;font-size:13px;color:#94a3b8;font-weight:600;">Total pendiente</td>
<td align="right" style="padding:10px 12px;font-size:14px;color:#ef4444;font-weight:700;">${fmtL(totalOwed)}</td>
</tr>`;

    const body = `
<h2 style="margin:0 0 4px;font-size:20px;color:#e2e8f0;font-weight:600;">Reporte de Pagos Atrasados</h2>
<p style="margin:0 0 6px;font-size:14px;color:#94a3b8;">Hola ${esc(data.coordinatorName)}, aqu&iacute; est&aacute; el resumen diario de <strong style="color:#e2e8f0;">${esc(data.groupName)}</strong>.</p>
<p style="margin:0 0 20px;font-size:12px;color:#64748b;">${fmtDate(new Date())}</p>

<!-- Summary badge -->
<div style="text-align:center;margin-bottom:20px;">
<span style="display:inline-block;background-color:#7f1d1d;color:#fca5a5;font-size:13px;font-weight:600;padding:6px 16px;border-radius:20px;">
${memberCount} miembro${memberCount !== 1 ? 's' : ''} con pago atrasado
</span>
</div>

<div style="background-color:#0f172a;border-radius:8px;padding:4px;margin-bottom:20px;overflow-x:auto;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr style="background-color:#1a2332;">
<td style="padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Miembro</td>
<td align="center" style="padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Atraso</td>
<td align="right" style="padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Pendiente</td>
</tr>
${membersRows}
</table>
</div>

${ctaButton('Ver Panel de Grupo', 'https://latanda.online/groups', '#00FFFF', '#0f172a')}

<p style="margin:20px 0 0;font-size:13px;color:#64748b;text-align:center;line-height:1.4;">Puedes registrar pagos en nombre de los miembros desde el panel de coordinador.</p>`;

    return {
        subject,
        html: baseLayout(subject, preheader, body, data.coordinatorEmail)
    };
}


function distributionExecutedEmail(data) {
    const subject = 'Distribución de Ciclo ' + esc(String(data.cycle)) + ' - ' + esc(data.groupName);
    const preheader = 'Recibiste ' + fmtL(data.netAmount) + ' de la distribución del ciclo ' + data.cycle;

    const body = `
<h2 style="margin:0 0 6px;font-size:22px;color:#f8fafc;font-weight:700;">Distribución Completada</h2>
<p style="margin:0 0 24px;font-size:15px;color:#94a3b8;">Hola ${esc(data.beneficiaryName)}, se ejecutó la distribución de tu grupo.</p>

<div style="background:#0f172a;border-radius:8px;overflow:hidden;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
${infoRow('Grupo', esc(data.groupName))}
${infoRow('Monto Bruto', fmtL(data.grossAmount))}
${infoRow('Comisión Coordinador', '- ' + fmtL(data.coordinatorFee), '#f59e0b')}
${infoRow('Comisión Plataforma', '- ' + fmtL(data.platformFee), '#f59e0b')}
${infoRow('Monto Neto', fmtL(data.netAmount), '#00FFFF')}
${infoRow('Ciclo', String(data.cycle))}
${infoRow('Fecha', fmtDate(data.date))}
</table>
</div>

<div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:16px;margin:0 0 24px;text-align:center;">
<p style="margin:0;font-size:15px;color:#10b981;font-weight:600;">&#10003; Distribución acreditada exitosamente</p>
<p style="margin:8px 0 0;font-size:13px;color:#94a3b8;">El monto neto ha sido registrado en tu grupo.</p>
</div>

${ctaButton('Ver Mi Grupo', 'https://latanda.online/groups', '#00FFFF', '#0f172a')}

<p style="margin:20px 0 0;font-size:13px;color:#64748b;text-align:center;line-height:1.4;">Si tienes preguntas, contacta al coordinador de tu grupo.</p>`;

    return {
        subject,
        html: baseLayout(subject, preheader, body, data.beneficiaryEmail)
    };
}

module.exports = {
    paymentRecordedEmail,
    paymentReminderEmail,
    paymentLateEmail,
    suspensionWarningEmail,
    coordinatorLateAlertEmail,
    distributionExecutedEmail
};
