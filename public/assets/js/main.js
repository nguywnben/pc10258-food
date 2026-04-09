// Nút +/− số lượng (giỏ hàng)
document.querySelectorAll('[aria-label="Tăng số lượng"], [aria-label="Giảm số lượng"]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var span = btn.parentElement.querySelector('span');
    var val = parseInt(span.textContent, 10);
    if (btn.textContent.trim() === '+') val++;
    else if (val > 1) val--;
    span.textContent = val;
  });
});

// Header: giờ (thứ/ngày) và vị trí hiển thị
(function () {
  var dtEl = document.getElementById('header-current-datetime');
  var locEl = document.getElementById('header-current-location');
  if (!dtEl && !locEl) return;

  var weekdays = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function renderDateTime() {
    if (!dtEl) return;
    var now = new Date();
    var weekday = weekdays[now.getDay()];
    var date = pad2(now.getDate()) + '/' + pad2(now.getMonth() + 1) + '/' + now.getFullYear();
    var time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    dtEl.textContent = weekday + ', ' + date + ' • ' + time;
  }

  renderDateTime();
  setInterval(renderDateTime, 60000);

  if (locEl) locEl.textContent = 'Vị trí: Thành phố Cần Thơ';
})();
