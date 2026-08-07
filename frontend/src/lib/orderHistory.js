// Зочны хийсэн захиалгын ID-г тухайн browser дээр (localStorage) хадгалж,
// session hугацаа дуусаад (24ц) шинээр check-in хийсэн ч өмнөх захиалгаа
// харах боломжтой байлгана. Session cookie шиг биш — эргэлзээгүй урт хугацаанд
// хадгалагдана, зөвхөн энэ browser дээр.
const STORAGE_KEY = 'guest_order_history';
const MAX_ENTRIES = 50;

export function addOrderToHistory(orderId) {
  if (!orderId) return;
  try {
    const ids = getOrderHistory();
    if (!ids.includes(orderId)) {
      ids.unshift(orderId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ENTRIES)));
    }
  } catch {
    // Private browsing / quota exceeded — түүх хадгалагдахгүй ч захиалга өөрөө нөлөөлөхгүй.
  }
}

export function getOrderHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
