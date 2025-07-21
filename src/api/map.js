export async function generateMapLink({ itinerary }) {
  const GAODE_KEY = "84dcfc49282d7305892d771b466d7625";
  const GAODE_SECRET = "11fa1bb38382a80c83ddc6482496379b";
  const res = await fetch("https://your-backend.com/api/generate-map-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itinerary,
      gaodeKey: GAODE_KEY,
      gaodeSecret: GAODE_SECRET
    })
  });
  if (!res.ok) throw new Error("Failed to generate map link");
  return await res.json(); // { success: true, url: "..." }
}
