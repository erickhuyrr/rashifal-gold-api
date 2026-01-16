const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

/** ======================
 *  Rashifal (Horoscope)
 * ====================== */
const rashiNames = [
  "मेष", "वृष", "मिथुन", "कर्कट",
  "सिंह", "कन्या", "तुला", "वृश्चिक",
  "धनु", "मकर", "कुम्भ", "मीन"
];

const getRashifal = async (type = "daily") => {
  const urlMap = {
    daily: "https://www.hamropatro.com/rashifal",
    weekly: "https://www.hamropatro.com/rashifal/weekly",
    monthly: "https://www.hamropatro.com/rashifal/monthly",
    yearly: "https://www.hamropatro.com/rashifal/yearly",
  };
  if (!urlMap[type]) throw new Error("Invalid type");

  const { data } = await axios.get(urlMap[type]);
  const $ = cheerio.load(data);
  const results = [];

  $(".desc p").each((i, el) => {
    if (i < 12) {
      results.push({
        rashi_id: i + 1,
        rashi_name: rashiNames[i],
        rashifal: $(el).text().trim(),
        image: `https://www.hamropatro.com/images/dummy/ic_sodiac_${i + 1}.png`
      });
    }
  });

  return results;
};

/** ======================
 *  Gold & Silver Prices
 * ====================== */
const GOLD_URL = "https://www.hamropatro.com/gold";

const getGoldPrices = async () => {
  const { data } = await axios.get(GOLD_URL);
  const $ = cheerio.load(data);

  const title = $("h2.articleTitle span").text().trim();
  const updatedAt = $("p > b").first().text().trim();
  const description = $("p.des_text").text().trim();

  const list = [];
  $("ul.gold-silver > li").each((i, el) => {
    list.push($(el).text().trim());
  });

  const prices = [];
  for (let i = 0; i < list.length; i += 2) {
    prices.push({
      id: prices.length + 1,
      price: list[i + 1] ? `${list[i]} - ${list[i + 1]}` : list[i]
    });
  }

  return { title, updatedAt, description, prices };
};

/** ======================
 *  API Endpoints
 * ====================== */

// Health check
app.get("/", (req, res) => {
  res.send("🚀 Nepal All-in-One API is running");
});

// Rashifal
app.get("/api/rashifal/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const data = await getRashifal(type);
    res.json({ success: true, type, total: data.length, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Gold & Silver
app.get("/api/gold", async (req, res) => {
  try {
    const data = await getGoldPrices();
    res.json({ success: true, source: "hamropatro.com", data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch gold prices" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
