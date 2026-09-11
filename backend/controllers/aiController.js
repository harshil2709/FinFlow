const { GoogleGenAI } = require('@google/genai');

// Categories reference
const EXPENSE_CATEGORIES = ['Food', 'Rent', 'Utilities', 'Entertainment', 'Travel', 'Shopping', 'Medical', 'Education', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

// Helper: Intelligent Natural Language Parser (Regex + NLP fallback)
const parsePromptLocally = (text) => {
  const lower = text.toLowerCase();
  
  // Extract numbers (amount)
  const numberMatch = text.match(/(?:₹|\$|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
  const amount = numberMatch ? parseFloat(numberMatch[1].replace(/,/g, '')) : 100;

  // Determine type
  const isIncome = /earned|received|salary|income|freelance|got|credited|gift/i.test(lower);
  const type = isIncome ? 'income' : 'expense';

  // Determine category
  let category = isIncome ? 'Salary' : 'Other';
  if (/food|dinner|lunch|breakfast|swiggy|zomato|burger|pizza|restaurant|coffee|cafe/i.test(lower)) category = 'Food';
  else if (/rent|flat|house|pg|deposit/i.test(lower)) category = 'Rent';
  else if (/electricity|water|wifi|bill|recharge|phone|internet|gas/i.test(lower)) category = 'Utilities';
  else if (/movie|netflix|spotify|game|cinema|show|party/i.test(lower)) category = 'Entertainment';
  else if (/uber|ola|cab|flight|train|bus|petrol|fuel|travel|taxi/i.test(lower)) category = 'Travel';
  else if (/cloth|dress|amazon|flipkart|mall|shoe|shopping/i.test(lower)) category = 'Shopping';
  else if (/hospital|doctor|medicine|pharmacy|health|clinic/i.test(lower)) category = 'Medical';
  else if (/fee|course|book|tuition|school|college|education/i.test(lower)) category = 'Education';
  else if (/freelance|client|project/i.test(lower)) category = 'Freelance';
  else if (/dividend|stock|crypto|interest|investment/i.test(lower)) category = 'Investment';

  // Extract clean title
  let title = text
    .replace(/(?:spent|paid|bought|earned|got|credited|for|on|rs\.?|inr|₹|\$|\d+(?:,\d+)*(?:\.\d+)?)/gi, '')
    .trim();
  
  if (!title || title.length < 2) {
    title = `${category} ${type === 'income' ? 'Income' : 'Expense'}`;
  } else {
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return {
    title,
    amount,
    type,
    category,
    date: new Date().toISOString().split('T')[0]
  };
};

// 1. Natural Language Prompt -> Structured Expense Data
const parsePromptToExpense = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, message: 'Prompt text is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: `Extract financial transaction data from this text: "${prompt}". Return valid JSON matching schema: { "title": string, "amount": number, "type": "expense" | "income", "category": string }. Categories allowed for expense: [Food, Rent, Utilities, Entertainment, Travel, Shopping, Medical, Education, Other]. Categories allowed for income: [Salary, Freelance, Investment, Gift, Other].`,
          config: { responseMimeType: 'application/json' }
        });

        if (response && response.text) {
          const parsed = JSON.parse(response.text);
          return res.status(200).json({
            success: true,
            source: 'gemini-llm',
            data: {
              title: parsed.title || 'Parsed Transaction',
              amount: Number(parsed.amount) || 0,
              type: parsed.type || 'expense',
              category: parsed.category || 'Other',
              date: new Date().toISOString().split('T')[0]
            }
          });
        }
      } catch (llmErr) {
        console.warn('⚠️ LLM API call failed, falling back to local NLP parser:', llmErr.message);
      }
    }

    // Fallback: Smart Local Natural Language Parser
    const fallbackData = parsePromptLocally(prompt);
    return res.status(200).json({
      success: true,
      source: 'smart-nlp-parser',
      data: fallbackData
    });
  } catch (error) {
    console.error('AI Parser Error:', error);
    res.status(500).json({ success: false, message: 'Failed to parse prompt', error: error.message });
  }
};

// 2. Interactive AI Financial Advisor Chat
const getAiAdvisorChat = async (req, res) => {
  try {
    const { query, summaryStats } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are FinFlow AI, an expert financial coach. Context: Net Balance: ${summaryStats?.balance || 0}, Total Income: ${summaryStats?.income || 0}, Total Expenses: ${summaryStats?.expenses || 0}. User Question: "${query}". Provide 3 short, actionable, friendly bullet points advising the user.`;

        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: systemPrompt
        });

        if (response && response.text) {
          return res.status(200).json({
            success: true,
            source: 'gemini-llm',
            answer: response.text
          });
        }
      } catch (err) {
        console.warn('⚠️ Gemini Chat API failed, returning fallback advice:', err.message);
      }
    }

    // Fallback Smart Rule-based Financial Advice
    let answer = `• Try allocating at least 20% of your net income towards your Savings Goals.\n• Keep category spending on non-essentials (Entertainment, Shopping) below 30% of total expenses.\n• Set up a 3-month Emergency Fund reserve in FinFlow Goals.`;
    
    if (query.toLowerCase().includes('save') || query.toLowerCase().includes('saving')) {
      answer = `• Track your daily expenses in the FinFlow Transaction log to identify micro-spending leaks.\n• Set category budget limits for Food and Shopping to receive automated warnings.\n• Use the FinFlow Horizon tab to model 8% compound SIP growth on your savings!`;
    }

    return res.status(200).json({
      success: true,
      source: 'smart-rules-engine',
      answer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI Chat Error', error: error.message });
  }
};

module.exports = {
  parsePromptToExpense,
  getAiAdvisorChat
};
