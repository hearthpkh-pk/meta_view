/**
 * Payroll Core Logic (ระดับโลก)
 * 🧱 ป้องกันความผิดพลาดทางการเงินด้วย Integer Arithmetic (Satang-based)
 */

export const toSatang = (baht: number): number => Math.round(baht * 100);
export const toBaht = (satang: number): number => satang / 100;

export interface PayrollCalculation {
    baseSalary: number; // In Satang
    otMultiplier: number;
    otHours: number;
    bonus: number; // In Satang
    taxRate: number; // e.g., 0.05 for 5%
}

export const calculateNetSalary = (params: PayrollCalculation): number => {
    const { baseSalary, otMultiplier, otHours, bonus, taxRate } = params;
    
    // OT Pay = (Base / 30 / 8) * Hours * Multiplier
    // We use integer math as much as possible
    const hourlyRateSatang = Math.floor(baseSalary / 30 / 8);
    const otPaySatang = Math.floor(hourlyRateSatang * otHours * otMultiplier);
    
    const grossSalarySatang = baseSalary + otPaySatang + bonus;
    const taxSatang = Math.floor(grossSalarySatang * taxRate);
    
    return grossSalarySatang - taxSatang; // Final Net in Satang
};
