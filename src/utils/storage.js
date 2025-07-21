const USAGE_KEY = "triiip_usage";
const FREE_LIMIT = 3;
const PRO_KEY = "triiip_pro";

export async function getUsage() {
  return new Promise(resolve => {
    chrome.storage.local.get([USAGE_KEY], result => {
      resolve(result[USAGE_KEY] || 0);
    });
  });
}

export async function incrementUsage() {
  const usage = await getUsage();
  if (usage >= FREE_LIMIT) throw new Error("Free usage limit reached");
  return new Promise(resolve => {
    chrome.storage.local.set({ [USAGE_KEY]: usage + 1 }, resolve);
  });
}

export async function isPro() {
  return new Promise(resolve => {
    chrome.storage.local.get([PRO_KEY], result => {
      resolve(!!result[PRO_KEY]);
    });
  });
}

export async function setPro(val = true) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [PRO_KEY]: val }, resolve);
  });
}