
import { GoogleGenAI } from "@google/genai";
import { LoanParams, LoanResult } from "../types";
import { formatCurrency } from "../utils/financial";

const apiKey = process.env.API_KEY;

export const getFinancialAdvice = async (
  params: LoanParams, 
  results: LoanResult, 
  loanTitle: string, 
  loanType: string,
  isGracePeriodViolation: boolean = false,
  isCashWithdrawal: boolean = false,
  isFeeAmortized: boolean = false
): Promise<string> => {
  if (!apiKey) {
    return "API ключ не знайдено. Будь ласка, налаштуйте змінну оточення API_KEY для отримання порад ШІ.";
  }

  const ai = new GoogleGenAI({ apiKey });

  let rateDescription = "";
  if (loanType === 'monobank_black') {
    rateDescription = `${params.rate}% на місяць (нарахування на ЗАЛИШОК заборгованості).`;
    if (isCashWithdrawal) {
      rateDescription += ` УВАГА: Це зняття готівки/переказ. Додано комісію 4%${isFeeAmortized ? " (розбито на частини)" : " (сплачується одразу)"}. ПІЛЬГОВИЙ ПЕРІОД СКАСОВАНО! Відсотки нараховуються з першого дня.`;
    } else if (isGracePeriodViolation) {
      rateDescription += " УВАГА: Вихід за межі пільгового періоду (62 дні). Включено штрафні відсотки за минулі місяці.";
    } else {
      rateDescription += " Розрахунок у межах пільгового періоду або поточний платіж.";
    }
  } else if (loanType === 'pumb_credit_card') {
    rateDescription = `${params.rate}% на місяць (35.88% річних) - Кредитна картка ПУМБ "всеМОЖУ". Нарахування на ЗАЛИШОК.`;
    rateDescription += " Дата погашення: завжди 30-те число наступного місяця.";
    if (isCashWithdrawal) {
        rateDescription += ` УВАГА: Це зняття готівки/переказ. Додано комісію 3.99%${isFeeAmortized ? " (розбито на частини)" : " (сплачується одразу)"}. ПІЛЬГОВИЙ ПЕРІОД ЗБЕРІГАЄТЬСЯ (якщо погасити вчасно).`;
    }
    if (isGracePeriodViolation) {
        rateDescription += " УВАГА: Прострочено дату погашення (30-те число). Включено штрафні відсотки.";
    }
  } else {
    rateDescription = `${params.rate}% на місяць (комісія на ПОЧАТКОВУ суму, тип "Оплата частинами").`;
  }

  const prompt = `
    Дій як досвідчений фінансовий консультант в Україні.
    Користувач розглядає кредитний продукт: "${loanTitle}".
    
    Параметри:
    - Сума: ${formatCurrency(params.amount)}
    - Ставка/Комісія: ${rateDescription}
    - Термін: ${params.months} місяців
    ${isCashWithdrawal ? "- ТИП ОПЕРАЦІЇ: Зняття готівки або переказ коштів (це важливо!)" : ""}
    
    Результати розрахунку:
    - Перший платіж: ${formatCurrency(results.schedule[0]?.payment || 0)} ${(isGracePeriodViolation || (isCashWithdrawal && !isFeeAmortized)) ? "(включає комісії/штрафи)" : ""}
    - Загальна переплата: ${formatCurrency(results.totalInterest)}
    - Підсумкова виплата: ${formatCurrency(results.totalPayment)}
    
    Проаналізуй цю ситуацію. 
    1. Оціни реальну вартість ("${loanTitle}").
    2. Якщо це зняття готівки:
       - Для Монобанку: Поясни, що це НЕВИГІДНО, бо втрачається грейс-період + 4% комісія.
       - Для ПУМБ: Поясни, що грейс діє, але є комісія 3.99%. Це краще ніж Моно, але все одно дорого.
    3. Якщо це кредитка ПУМБ, нагадай про "небезпечну дату" (30-те число).
    4. Дай чітку пораду: чи варто це робити, чи є альтернативи (наприклад, просто розплатитися карткою в магазині).
    
    Відповідай стисло, по суті, використовуй форматування Markdown. Відповідь має бути українською мовою.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Не вдалося отримати відповідь від ШІ.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Виникла помилка при зверненні до фінансового помічника. Спробуйте пізніше.";
  }
};
