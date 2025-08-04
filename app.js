// Переключение "Приход"/"Расход", скрытие десятины и смена цвета кнопки
const incomeBtn = document.getElementById('income-btn');
const expenseBtn = document.getElementById('expense-btn');
const mainBtn = document.querySelector('.main-btn');
const titheRow = document.getElementById('tithe-row');
const amountInput = document.getElementById('amount-input');

incomeBtn.addEventListener('click', () => {
  incomeBtn.classList.add('active');
  expenseBtn.classList.remove('active');
  mainBtn.textContent = 'Добавить приход';
  mainBtn.classList.remove('expense');
  titheRow.classList.remove('hidden');
});

expenseBtn.addEventListener('click', () => {
  expenseBtn.classList.add('active');
  incomeBtn.classList.remove('active');
  mainBtn.textContent = 'Добавить расход';
  mainBtn.classList.add('expense');
  titheRow.classList.add('hidden');
});

// Скрытие клавиатуры при клике вне поля ввода суммы (только для мобильных)
document.addEventListener('touchstart', function(e) {
  if (
    amountInput === document.activeElement &&
    !amountInput.contains(e.target)
  ) {
    amountInput.blur();
  }
});

// Также для кликов мыши (на всякий случай)
document.addEventListener('mousedown', function(e) {
  if (
    amountInput === document.activeElement &&
    !amountInput.contains(e.target)
  ) {
    amountInput.blur();
  }
});