/**
 * ML Prediction API Helper
 * Calls Python XGBoost model for predictions
 */

const { execSync } = require('child_process');
const path = require('path');

const ML_SCRIPT = path.join(__dirname, 'lottery-ml-model.py');

function getPredictionML(drawTime = '11am') {
    try {
        const result = execSync(`python3 ${ML_SCRIPT} predict ${drawTime}`, {
            encoding: 'utf8',
            timeout: 10000,
            cwd: __dirname
        });
        return JSON.parse(result);
    } catch (error) {
        console.error('ML prediction error:', error.message);
        return null;
    }
}

function getBacktestML() {
    try {
        const result = execSync(`python3 ${ML_SCRIPT} backtest`, {
            encoding: 'utf8',
            timeout: 30000,
            cwd: __dirname
        });
        return JSON.parse(result);
    } catch (error) {
        console.error('ML backtest error:', error.message);
        return null;
    }
}

function trainModelML() {
    try {
        execSync(`python3 ${ML_SCRIPT} train`, {
            encoding: 'utf8',
            timeout: 60000,
            cwd: __dirname
        });
        return { success: true, message: 'Model trained successfully' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = { getPredictionML, getBacktestML, trainModelML };
