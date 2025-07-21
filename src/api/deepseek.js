// 假设Deepseek API为RESTful，需替换为真实接口
const API_URL = "https://api.deepseek.com/chat/completions";
const API_KEY = "sk-REVOKED_DEEPSEEK_KEY"; // 用户提供的真实key

const SYSTEM_PROMPT_ZH = "你是一个专业的旅行规划师。请根据用户输入的景点、关键词或社交平台内容，为中国旅行者生成合理的行程天数建议，并输出多种版本（如紧凑/舒适/放松），每个版本请结构化输出每日行程安排。";
const SYSTEM_PROMPT_EN = "You are a professional travel planner. Based on the user's input (spots, keywords, or social links), generate a reasonable itinerary for a trip to China, including day suggestions and multiple versions (compact/comfortable/relaxed). For each version, output a structured daily plan.";

export async function generateItinerary(userInput, lang = "en") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15秒超时
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: lang === "zh" ? SYSTEM_PROMPT_ZH : SYSTEM_PROMPT_EN },
          { role: "user", content: userInput }
        ],
        stream: false
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) {
      let msg = "API error";
      try { msg = (await res.json()).error || msg; } catch {}
      throw new Error(msg);
    }
    const data = await res.json();
    // 解析返回内容
    const content = data.choices?.[0]?.message?.content || "";
    // 尝试按“版本”分割
    const versions = content.split(/(紧凑版|舒适版|放松版|Compact version|Comfortable version|Relaxed version)/i)
      .filter(Boolean)
      .reduce((arr, cur, idx, src) => {
        if (/版|version/i.test(cur) && src[idx + 1]) {
          arr.push({ type: cur.trim(), text: src[idx + 1].trim() });
        }
        return arr;
      }, []);
    // 若无法分割，则整体作为一个版本
    return { versions: versions.length ? versions : [{ type: lang === "zh" ? "推荐行程" : "Recommended", text: content }] };
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('API请求超时，请稍后重试');
    throw e;
  }
}