import React, { useState, useEffect } from "react";
import { generateItinerary } from "../api/deepseek";
import { getUsage, incrementUsage, isPro, setPro } from "../utils/storage";
import Tesseract from "tesseract.js";
import jsPDF from "jspdf";
import messages from "./i18n";
import { generateMapLink } from "../api/map";

const PRO_LIMIT = 100;

export default function Popup() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [itineraries, setItineraries] = useState([]);
  const [error, setError] = useState("");
  // 默认英文
  const [lang, setLang] = useState("en");
  const t = messages[lang];
  const [ocrLoading, setOcrLoading] = useState(false);
  const [pro, setProState] = useState(false);
  const [usage, setUsage] = useState(0);
  const [mapLink, setMapLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    isPro().then(setProState);
    getUsage().then(setUsage);
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      await incrementUsage();
      setUsage(await getUsage());
      const result = await generateItinerary(input, lang);
      setItineraries(result.versions || []);
      if (!result.versions || result.versions.length === 0) {
        setError(lang === "zh" ? "未能生成行程，请检查输入内容。" : "No itinerary generated. Please check your input.");
      }
    } catch (e) {
      setError(
        e.message === "Free usage limit reached"
          ? t.usageLimit
          : t.error
      );
    }
    setLoading(false);
  };

  // Pro用户也有次数限制
  const canGenerate = pro ? usage < PRO_LIMIT : usage < 3;

  // Pro按钮点击提示
  const handleUpgrade = () => {
    alert(lang === "zh"
      ? "暂未接入支付，Pro用户最多可生成100次。如需升级请联系官方。"
      : "Payment not integrated. Pro users can generate up to 100 times. For upgrade, please contact support.");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(16);
    doc.text(t.title, 10, y);
    y += 10;
    itineraries.forEach((item, idx) => {
      doc.setFontSize(12);
      doc.text(t.version.replace("{type}", item.type), 10, y);
      y += 8;
      const lines = doc.splitTextToSize(item.text, 180);
      doc.text(lines, 10, y);
      y += lines.length * 7 + 5;
    });
    doc.save("itinerary.pdf");
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setOcrLoading(true);
    const { data: { text } } = await Tesseract.recognize(file, lang === "zh" ? "chi_sim" : "eng");
    setInput(input + "\n" + text.trim());
    setOcrLoading(false);
  };

  const parseSocialLink = (text) => {
    if (/instagram\.com|tiktok\.com/.test(text)) {
      return lang === "zh"
        ? "检测到社交平台链接，已自动纳入行程分析。"
        : "Social platform link detected, included in itinerary analysis.";
    }
    return "";
  };

  const socialTip = parseSocialLink(input);

  const MAX_INPUT = 2048;
  const inputInvalid = input.length > MAX_INPUT;

  const emailRegex = /^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$/;

  const handleGenerateMapLink = async () => {
    setGeneratingLink(true);
    setMapLink("");
    try {
      const res = await generateMapLink({ itinerary: itineraries.map(i=>i.text).join("\n\n") });
      setMapLink(res.url);
    } catch {
      setMapLink(lang === "zh" ? "生成失败，请稍后重试" : "Failed to generate, please try again.");
    }
    setGeneratingLink(false);
  };

  return (
    <div style={{ width: 350, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>{t.title}</h2>
        <button onClick={() => setLang(lang === "en" ? "zh" : "en")}
                style={{ border: "none", background: "#f0f0f0", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}>
          {t.langSwitch}
        </button>
      </div>
      {/* 增加标题与输入框间距 */}
      <div style={{ height: 24 }} />
      <textarea
        placeholder={t.placeholder}
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={5}
        style={{ width: "100%" }}
      />
      {inputInvalid && (
        <div style={{ color: "orange", fontSize: 12, marginBottom: 4 }}>
          {lang === "zh"
            ? `输入内容过长，最多支持${MAX_INPUT}字符`
            : `Input too long, max ${MAX_INPUT} characters allowed.`}
        </div>
      )}
      <div style={{ margin: '12px 0', color: '#888', fontSize: 13 }}>
        {pro ? (
          lang === "zh"
            ? `Pro用户最多可生成${PRO_LIMIT}次，已用${usage}次。`
            : `Pro users can generate up to ${PRO_LIMIT} times. Used ${usage}.`
        ) : (
          <>
            {lang === "zh"
              ? `免费版仅可生成3次，已用${usage}次。升级Pro享更多权益。`
              : `Free version: 3 generations only. Used ${usage}. Upgrade to Pro for more.`}
            <button onClick={handleUpgrade} style={{ marginLeft: 8, color: '#fff', background: '#007bff', border: 'none', borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}>
              {lang === "zh" ? "升级Pro" : "Upgrade Pro"}
            </button>
          </>
        )}
      </div>
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        style={{ border: "1px dashed #aaa", padding: 8, marginBottom: 8, background: "#fafafa", textAlign: "center" }}
      >
        {ocrLoading
          ? (lang === "zh" ? "图片识别中..." : "Recognizing image...")
          : (lang === "zh" ? "拖拽截图到此处自动识别" : "Drag screenshot here for OCR")}
      </div>
      {socialTip && <div style={{ color: '#007bff', fontSize: 13, marginBottom: 8 }}>{socialTip}</div>}
      <button
        onClick={handleGenerate}
        disabled={loading || !input.trim() || !canGenerate || inputInvalid}
        style={loading ? { opacity: 0.6, pointerEvents: "none" } : {}}
      >
        {loading ? t.generating : t.generate}
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {itineraries.length === 0 && !loading && !error && (
        <div style={{ color: "#aaa", fontSize: 13, marginTop: 16 }}>
          {lang === "zh" ? "暂无行程结果，请输入内容并生成。" : "No itinerary yet. Please enter content and generate."}
        </div>
      )}
      <div>
        {itineraries.map((item, idx) => (
          <div key={idx} style={{ marginTop: 12, border: "1px solid #eee", padding: 8 }}>
            <b>{t.version.replace("{type}", item.type)}</b>
            <pre style={{ whiteSpace: "pre-wrap" }}>{item.text}</pre>
          </div>
        ))}
      </div>
      {itineraries.length > 0 && (
        <>
          <button
            onClick={handleGenerateMapLink}
            disabled={generatingLink}
            style={{ marginTop: 16, width: "100%", background: "#007bff", color: "#fff", border: "none", borderRadius: 4, padding: "8px 0", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
          >
            {generatingLink ? (lang === "zh" ? "生成中..." : "Generating...") : (lang === "zh" ? "生成地图链接" : "Generate Map Link")}
          </button>
          {mapLink && (
            <div style={{ marginTop: 12 }}>
              <a href={mapLink} target="_blank" rel="noopener noreferrer">{mapLink}</a>
              <button onClick={() => { navigator.clipboard.writeText(mapLink); }}>
                {lang === "zh" ? "复制链接" : "Copy Link"}
              </button>
            </div>
          )}
        </>
      )}
      {itineraries.length > 0 && (
        <button
          onClick={handleExportPDF}
          style={{ marginTop: 12, width: "100%" }}
          disabled={loading}
        >
          {lang === "zh" ? "导出PDF" : "Export PDF"}
        </button>
      )}
    </div>
  );
}
