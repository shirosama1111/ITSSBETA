const STORAGE_KEY = 'hust-parking-companion-v1';
const form = document.querySelector('#parking-form');
const balanceInput = document.querySelector('#balance');
const feeInput = document.querySelector('#fee');
const weeklyInput = document.querySelector('#weekly');
const reserveInput = document.querySelector('#reserve');
const estimateContent = document.querySelector('#estimate-content');
const emptyState = document.querySelector('#empty-state');
const noticeBanner = document.querySelector('#notice-banner');
const editLink = document.querySelector('#edit-link');
const toast = document.querySelector('#toast');
let currentEstimate = null;
let toastTimer;

const formatMoney = (value) => new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
const formatCount = (value) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value);

function loadSavedData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved) return;
    if (saved.balance !== undefined) balanceInput.value = saved.balance;
    if (saved.fee !== undefined) feeInput.value = saved.fee;
    if (saved.weekly !== undefined) weeklyInput.value = saved.weekly;
    if (saved.reserve !== undefined) reserveInput.value = saved.reserve;
    if (Array.isArray(saved.days)) {
      document.querySelectorAll('.weekday-picker input').forEach((input) => { input.checked = saved.days.includes(input.value); });
    }
    updateThreshold();
    if (Number(saved.balance) > 0 && Number(saved.fee) > 0 && Number(saved.weekly) > 0) calculateEstimate();
  } catch (error) {
    console.warn('Không thể đọc dữ liệu đã lưu.', error);
  }
}

function persistData() {
  const data = {
    balance: Number(balanceInput.value),
    fee: Number(feeInput.value),
    weekly: Number(weeklyInput.value),
    reserve: Number(reserveInput.value),
    days: [...document.querySelectorAll('.weekday-picker input:checked')].map((input) => input.value),
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (error) { console.warn('Không thể lưu dữ liệu.', error); }
  return data;
}

function getExpiryDate(remaining, weekly, selectedDays) {
  const daysUntil = Math.ceil((remaining / weekly) * 7);
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  if (!selectedDays.length) {
    date.setDate(date.getDate() + daysUntil);
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  let useCount = 0;
  const maxDays = Math.max(daysUntil * 3, 3650);
  for (let offset = 1; offset <= maxDays; offset++) {
    const candidate = new Date(date);
    candidate.setDate(date.getDate() + offset);
    if (selectedDays.includes(String(candidate.getDay()))) useCount += 1;
    if (useCount >= remaining) return candidate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  date.setDate(date.getDate() + daysUntil);
  return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function calculateEstimate() {
  const balance = Number(balanceInput.value);
  const fee = Number(feeInput.value);
  const weekly = Number(weeklyInput.value);
  const reserve = Math.max(0, Math.floor(Number(reserveInput.value) || 0));
  if (!Number.isFinite(balance) || balance < 0 || !Number.isFinite(fee) || fee <= 0 || !Number.isFinite(weekly) || weekly <= 0) return;

  const remaining = Math.floor(balance / fee);
  const remainder = balance % fee;
  const days = [...document.querySelectorAll('.weekday-picker input:checked')].map((input) => input.value);
  currentEstimate = { balance, fee, weekly, reserve, remaining, remainder, days };
  const weeks = remaining / weekly;
  const wholeWeeks = Math.floor(weeks);
  const extraDays = Math.round((weeks - wholeWeeks) * 7);
  let duration = 'Chưa xác định';
  if (remaining === 0) duration = 'Đã hết lượt';
  else if (wholeWeeks === 0) duration = `Khoảng ${Math.max(1, extraDays)} ngày`;
  else if (extraDays === 0) duration = `Khoảng ${wholeWeeks} tuần`;
  else duration = `Khoảng ${wholeWeeks} tuần ${extraDays} ngày`;

  document.querySelector('#remaining-count').textContent = formatCount(remaining);
  document.querySelector('#remaining-time').textContent = duration;
  document.querySelector('#expiry-date').textContent = remaining === 0 ? 'Đã hết lượt' : getExpiryDate(remaining, weekly, days);
  document.querySelector('#balance-display').textContent = formatMoney(balance) + (remainder ? ` · dư ${formatMoney(remainder)}` : '');
  emptyState.hidden = true;
  estimateContent.hidden = false;
  editLink.hidden = false;
  updateNotice(remaining, reserve);
}

function updateNotice(remaining, reserve) {
  const threshold = reserve + 1;
  document.querySelector('#threshold-value').textContent = `${threshold} lượt`;
  const shouldWarn = remaining <= threshold;
  noticeBanner.hidden = !shouldWarn;
  if (shouldWarn) {
    const title = document.querySelector('#notice-title');
    const message = document.querySelector('#notice-text');
    if (remaining === 0) {
      title.textContent = 'Thẻ đã hết lượt';
      message.textContent = 'Hãy nạp thêm tiền trước lần gửi xe tiếp theo.';
    } else {
      title.textContent = 'Sắp chạm mức dự phòng';
      message.textContent = `Còn ${formatCount(remaining)} lượt — cân nhắc nạp thêm tiền vào thẻ.`;
    }
  }
}

function updateThreshold() {
  const reserve = Math.max(0, Math.floor(Number(reserveInput.value) || 0));
  document.querySelector('#threshold-value').textContent = `${reserve + 1} lượt`;
  if (currentEstimate) updateNotice(currentEstimate.remaining, reserve);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const weekly = Number(weeklyInput.value);
  if (Number(balanceInput.value) < 0 || Number(feeInput.value) <= 0 || weekly <= 0) return;
  persistData();
  calculateEstimate();
  document.querySelector('#estimate-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

document.querySelector('#save-reserve').addEventListener('click', () => {
  reserveInput.value = Math.max(0, Math.floor(Number(reserveInput.value) || 0));
  persistData();
  updateThreshold();
  showToast('Đã lưu mức dự phòng và cập nhật cảnh báo.');
});

reserveInput.addEventListener('input', updateThreshold);
editLink.addEventListener('click', () => {
  balanceInput.focus();
  document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.querySelector('#reset-button').addEventListener('click', () => {
  if (!window.confirm('Xóa toàn bộ dữ liệu đã lưu trên thiết bị này?')) return;
  localStorage.removeItem(STORAGE_KEY);
  form.reset();
  reserveInput.value = 5;
  document.querySelectorAll('.weekday-picker input').forEach((input) => { input.checked = false; });
  currentEstimate = null;
  estimateContent.hidden = true;
  noticeBanner.hidden = true;
  editLink.hidden = true;
  emptyState.hidden = false;
  updateThreshold();
  showToast('Đã xóa dữ liệu trên thiết bị.');
});

document.querySelector('#year').textContent = new Date().getFullYear();
loadSavedData();
