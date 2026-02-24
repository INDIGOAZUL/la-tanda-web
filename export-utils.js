// =============================================
// EXPORT UTILITIES - PDF & CSV Generation
// Date: 2025-11-25
// =============================================

const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

// Ensure exports directory exists
const exportsDir = path.join(__dirname, 'exports');
if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
}

// =============================================
// PDF GENERATION
// =============================================

const generatePaymentsPDF = async (groupData, payments) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const filename = 'pagos_' + groupData.group_id + '_' + Date.now() + '.pdf';
        const filepath = path.join(exportsDir, filename);
        const stream = fs.createWriteStream(filepath);
        
        doc.pipe(stream);
        
        // Header
        doc.rect(0, 0, 612, 100).fill('#059669');
        doc.fontSize(24).fillColor('white').text('La Tanda', 50, 30);
        doc.fontSize(14).text('Historial de Pagos', 50, 60);
        
        // Group Info
        doc.fillColor('#1f2937').fontSize(16).text(groupData.name || 'Grupo', 50, 120);
        doc.fontSize(10).fillColor('#6b7280')
           .text('Generado: ' + new Date().toLocaleDateString('es-HN'), 50, 145);
        
        // Summary Stats
        const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const completedCount = payments.filter(p => p.status === 'completed').length;
        
        doc.rect(50, 170, 160, 60).fill('#f3f4f6');
        doc.fillColor('#059669').fontSize(18).text('L. ' + totalAmount.toLocaleString(), 60, 185);
        doc.fillColor('#6b7280').fontSize(10).text('Total Recaudado', 60, 210);
        
        doc.rect(230, 170, 160, 60).fill('#f3f4f6');
        doc.fillColor('#3b82f6').fontSize(18).text(completedCount.toString(), 240, 185);
        doc.fillColor('#6b7280').fontSize(10).text('Pagos Completados', 240, 210);
        
        doc.rect(410, 170, 160, 60).fill('#f3f4f6');
        doc.fillColor('#f59e0b').fontSize(18).text(payments.length.toString(), 420, 185);
        doc.fillColor('#6b7280').fontSize(10).text('Total Transacciones', 420, 210);
        
        // Table Header
        var yPos = 260;
        doc.rect(50, yPos, 512, 25).fill('#e5e7eb');
        doc.fillColor('#374151').fontSize(10);
        doc.text('Miembro', 60, yPos + 8);
        doc.text('Monto', 200, yPos + 8);
        doc.text('Metodo', 280, yPos + 8);
        doc.text('Estado', 380, yPos + 8);
        doc.text('Fecha', 460, yPos + 8);
        
        yPos += 25;
        
        // Table Rows
        payments.forEach(function(payment, index) {
            if (yPos > 700) {
                doc.addPage();
                yPos = 50;
            }
            
            var bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
            doc.rect(50, yPos, 512, 25).fill(bgColor);
            doc.fillColor('#1f2937').fontSize(9);
            doc.text(payment.member_name || payment.user_id || 'N/A', 60, yPos + 8, { width: 130 });
            doc.text('L. ' + parseFloat(payment.amount || 0).toLocaleString(), 200, yPos + 8);
            doc.text(payment.payment_method || 'N/A', 280, yPos + 8);
            
            var statusColor = payment.status === 'completed' ? '#059669' : '#f59e0b';
            doc.fillColor(statusColor).text(payment.status || 'pending', 380, yPos + 8);
            doc.fillColor('#1f2937');
            
            var date = payment.payment_date || payment.created_at;
            doc.text(date ? new Date(date).toLocaleDateString('es-HN') : 'N/A', 460, yPos + 8);
            
            yPos += 25;
        });
        
        // Footer
        doc.fillColor('#9ca3af').fontSize(8)
           .text('Generado por La Tanda - Sistema de Grupos de Ahorro', 50, 750, { align: 'center' });
        
        doc.end();
        
        stream.on('finish', function() { resolve({ filename: filename, filepath: filepath }); });
        stream.on('error', reject);
    });
};

const generateMembersPDF = async (groupData, members) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const filename = 'miembros_' + groupData.group_id + '_' + Date.now() + '.pdf';
        const filepath = path.join(exportsDir, filename);
        const stream = fs.createWriteStream(filepath);
        
        doc.pipe(stream);
        
        // Header
        doc.rect(0, 0, 612, 100).fill('#8b5cf6');
        doc.fontSize(24).fillColor('white').text('La Tanda', 50, 30);
        doc.fontSize(14).text('Lista de Miembros', 50, 60);
        
        // Group Info
        doc.fillColor('#1f2937').fontSize(16).text(groupData.name || 'Grupo', 50, 120);
        doc.fontSize(10).fillColor('#6b7280')
           .text('Total Miembros: ' + members.length + ' | Generado: ' + new Date().toLocaleDateString('es-HN'), 50, 145);
        
        // Table Header
        var yPos = 180;
        doc.rect(50, yPos, 512, 25).fill('#e5e7eb');
        doc.fillColor('#374151').fontSize(10);
        doc.text('Nombre', 60, yPos + 8);
        doc.text('Email', 180, yPos + 8);
        doc.text('Rol', 350, yPos + 8);
        doc.text('Estado', 420, yPos + 8);
        doc.text('Ingreso', 490, yPos + 8);
        
        yPos += 25;
        
        var roleLabels = { creator: 'Administrador', coordinator: 'Coordinador', member: 'Miembro' };
        
        members.forEach(function(member, index) {
            if (yPos > 700) {
                doc.addPage();
                yPos = 50;
            }
            
            var bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
            doc.rect(50, yPos, 512, 25).fill(bgColor);
            doc.fillColor('#1f2937').fontSize(9);
            doc.text(member.name || 'Sin nombre', 60, yPos + 8, { width: 110 });
            doc.text(member.email || 'N/A', 180, yPos + 8, { width: 160 });
            
            var roleColor = member.role === 'creator' ? '#8b5cf6' : member.role === 'coordinator' ? '#059669' : '#3b82f6';
            doc.fillColor(roleColor).text(roleLabels[member.role] || member.role, 350, yPos + 8);
            
            var statusColor = member.status === 'active' ? '#059669' : '#ef4444';
            doc.fillColor(statusColor).text(member.status || 'active', 420, yPos + 8);
            doc.fillColor('#1f2937');
            
            var joinDate = member.joined_at || member.created_at;
            doc.text(joinDate ? new Date(joinDate).toLocaleDateString('es-HN') : 'N/A', 490, yPos + 8);
            
            yPos += 25;
        });
        
        doc.fillColor('#9ca3af').fontSize(8)
           .text('Generado por La Tanda - Sistema de Grupos de Ahorro', 50, 750, { align: 'center' });
        
        doc.end();
        
        stream.on('finish', function() { resolve({ filename: filename, filepath: filepath }); });
        stream.on('error', reject);
    });
};

const generateSummaryPDF = async (groupData, stats) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const filename = 'resumen_' + groupData.group_id + '_' + Date.now() + '.pdf';
        const filepath = path.join(exportsDir, filename);
        const stream = fs.createWriteStream(filepath);
        
        doc.pipe(stream);
        
        // Header
        doc.rect(0, 0, 612, 120).fill('#3b82f6');
        doc.fontSize(28).fillColor('white').text('La Tanda', 50, 35);
        doc.fontSize(16).text('Resumen del Grupo', 50, 70);
        doc.fontSize(12).text(groupData.name || 'Grupo', 50, 95);
        
        // Stats Grid
        var yPos = 150;
        var boxWidth = 240;
        var boxHeight = 80;
        
        doc.rect(50, yPos, boxWidth, boxHeight).fill('#dcfce7');
        doc.fillColor('#059669').fontSize(24).text('L. ' + (stats.totalCollected || 0).toLocaleString(), 70, yPos + 20);
        doc.fillColor('#166534').fontSize(11).text('Total Recaudado', 70, yPos + 50);
        
        doc.rect(310, yPos, boxWidth, boxHeight).fill('#dbeafe');
        doc.fillColor('#2563eb').fontSize(24).text((stats.memberCount || 0) + ' / ' + (groupData.max_members || 30), 330, yPos + 20);
        doc.fillColor('#1e40af').fontSize(11).text('Miembros', 330, yPos + 50);
        
        yPos += 100;
        
        doc.rect(50, yPos, boxWidth, boxHeight).fill('#fef3c7');
        doc.fillColor('#d97706').fontSize(24).text((stats.completionRate || 100) + '%', 70, yPos + 20);
        doc.fillColor('#92400e').fontSize(11).text('Tasa de Cumplimiento', 70, yPos + 50);
        
        doc.rect(310, yPos, boxWidth, boxHeight).fill('#f3e8ff');
        doc.fillColor('#7c3aed').fontSize(24).text((stats.paymentCount || 0).toString(), 330, yPos + 20);
        doc.fillColor('#5b21b6').fontSize(11).text('Total de Pagos', 330, yPos + 50);
        
        yPos += 120;
        doc.fillColor('#1f2937').fontSize(14).text('Detalles del Grupo', 50, yPos);
        yPos += 25;
        
        doc.fontSize(10).fillColor('#4b5563');
        doc.text('Tipo: ' + (groupData.type || 'General'), 50, yPos);
        doc.text('Contribucion: L. ' + (groupData.contribution_amount || 0) + ' / ' + (groupData.frequency || 'Mensual'), 250, yPos);
        yPos += 20;
        doc.text('Estado: ' + (groupData.status || 'Activo'), 50, yPos);
        doc.text('Creado: ' + (groupData.created_at ? new Date(groupData.created_at).toLocaleDateString('es-HN') : 'N/A'), 250, yPos);
        
        doc.fillColor('#9ca3af').fontSize(8)
           .text('Generado: ' + new Date().toLocaleString('es-HN') + ' | La Tanda', 50, 750, { align: 'center' });
        
        doc.end();
        
        stream.on('finish', function() { resolve({ filename: filename, filepath: filepath }); });
        stream.on('error', reject);
    });
};

// CSV Generation
const generatePaymentsCSV = async (groupData, payments) => {
    const filename = 'pagos_' + groupData.group_id + '_' + Date.now() + '.csv';
    const filepath = path.join(exportsDir, filename);
    
    const csvWriter = createCsvWriter({
        path: filepath,
        header: [
            { id: 'member_name', title: 'Miembro' },
            { id: 'amount', title: 'Monto' },
            { id: 'payment_method', title: 'Metodo' },
            { id: 'status', title: 'Estado' },
            { id: 'cycle', title: 'Ciclo' },
            { id: 'payment_date', title: 'Fecha Pago' },
            { id: 'created_at', title: 'Fecha Registro' }
        ]
    });
    
    const records = payments.map(function(p) {
        return {
            member_name: p.member_name || p.user_id || 'N/A',
            amount: parseFloat(p.amount || 0).toFixed(2),
            payment_method: p.payment_method || 'N/A',
            status: p.status || 'pending',
            cycle: p.cycle || 1,
            payment_date: p.payment_date ? new Date(p.payment_date).toLocaleDateString('es-HN') : 'N/A',
            created_at: p.created_at ? new Date(p.created_at).toLocaleDateString('es-HN') : 'N/A'
        };
    });
    
    await csvWriter.writeRecords(records);
    return { filename: filename, filepath: filepath };
};

const generateMembersCSV = async (groupData, members) => {
    const filename = 'miembros_' + groupData.group_id + '_' + Date.now() + '.csv';
    const filepath = path.join(exportsDir, filename);
    
    var roleLabels = { creator: 'Administrador', coordinator: 'Coordinador', member: 'Miembro' };
    
    const csvWriter = createCsvWriter({
        path: filepath,
        header: [
            { id: 'name', title: 'Nombre' },
            { id: 'email', title: 'Email' },
            { id: 'phone', title: 'Telefono' },
            { id: 'role', title: 'Rol' },
            { id: 'status', title: 'Estado' },
            { id: 'joined_at', title: 'Fecha Ingreso' }
        ]
    });
    
    const records = members.map(function(m) {
        return {
            name: m.name || 'Sin nombre',
            email: m.email || 'N/A',
            phone: m.phone || 'N/A',
            role: roleLabels[m.role] || m.role || 'Miembro',
            status: m.status || 'active',
            joined_at: m.joined_at ? new Date(m.joined_at).toLocaleDateString('es-HN') : 'N/A'
        };
    });
    
    await csvWriter.writeRecords(records);
    return { filename: filename, filepath: filepath };
};

module.exports = {
    generatePaymentsPDF: generatePaymentsPDF,
    generateMembersPDF: generateMembersPDF,
    generateSummaryPDF: generateSummaryPDF,
    generatePaymentsCSV: generatePaymentsCSV,
    generateMembersCSV: generateMembersCSV,
    exportsDir: exportsDir
};
