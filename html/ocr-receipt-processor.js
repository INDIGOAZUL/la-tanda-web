/**
 * OCR Receipt Processor - La Tanda Fintech
 * Procesamiento de comprobantes con OCR (placeholder para Tesseract.js)
 */

class OCRReceiptProcessor {
    constructor() {
        this.isReady = false;
        this.tesseractLoaded = false;
        console.log('🔍 OCR Receipt Processor initialized');
    }

    async init() {
        // Placeholder - en producción cargar Tesseract.js
        console.log('🔍 OCR Engine ready (placeholder mode)');
        this.isReady = true;
        return true;
    }

    async processReceipt(imageFile) {
        if (!this.isReady) {
            await this.init();
        }

        console.log('🔍 Processing receipt image...');
        
        // Placeholder - simular procesamiento OCR
        return {
            success: true,
            extracted: {
                amount: null,
                date: null,
                reference: null,
                bank: null
            },
            confidence: 0,
            raw_text: '',
            message: 'OCR en modo placeholder - implementar Tesseract.js para producción'
        };
    }

    async extractAmount(text) {
        // Buscar patrones de montos en el texto
        var patterns = [
            /L\.\s*[\d,]+\.?\d*/gi,
            /HNL\s*[\d,]+\.?\d*/gi,
            /\$\s*[\d,]+\.?\d*/gi
        ];
        
        for (var i = 0; i < patterns.length; i++) {
            var match = text.match(patterns[i]);
            if (match && match.length > 0) {
                return match[0];
            }
        }
        return null;
    }

    async extractDate(text) {
        // Buscar patrones de fecha
        var patterns = [
            /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
            /\d{1,2}-\d{1,2}-\d{2,4}/g
        ];
        
        for (var i = 0; i < patterns.length; i++) {
            var match = text.match(patterns[i]);
            if (match && match.length > 0) {
                return match[0];
            }
        }
        return null;
    }

    async extractReference(text) {
        // Buscar números de referencia
        var patterns = [
            /REF[:\s]*[\w\d]+/gi,
            /REFERENCIA[:\s]*[\w\d]+/gi,
            /NO\.\s*[\d]+/gi
        ];
        
        for (var i = 0; i < patterns.length; i++) {
            var match = text.match(patterns[i]);
            if (match && match.length > 0) {
                return match[0];
            }
        }
        return null;
    }

    validateReceipt(extractedData) {
        var issues = [];
        
        if (!extractedData.amount) {
            issues.push('No se detectó monto');
        }
        if (!extractedData.date) {
            issues.push('No se detectó fecha');
        }
        
        return {
            valid: issues.length === 0,
            issues: issues
        };
    }
}

window.OCRReceiptProcessor = new OCRReceiptProcessor();
console.log('✅ OCR Receipt Processor loaded');
