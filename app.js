(function () {
  'use strict';

  var STORAGE_KEY = 'fin-app-transactions';
  var STORAGE_KEY_CATEGORIES = 'fin-app-categories';
  var STORAGE_KEY_GOALS = 'fin-app-goals';

  var DEFAULT_CATEGORIES = {
    income: ['Зарплата', 'Подработка', 'Подарок', 'Возврат', 'Дивиденды', 'Прочее доход'],
    expense: ['Еда', 'Транспорт', 'Жильё', 'Развлечения', 'Здоровье', 'Одежда', 'Подписки', 'Прочее расход']
  };

  var transactions = [];
  var goals = [];

  var $balance = document.getElementById('balance');
  var $totalIncome = document.getElementById('total-income');
  var $totalExpense = document.getElementById('total-expense');
  var $totalTithe = document.getElementById('total-tithe');
  var $transactionList = document.getElementById('transaction-list');
  var $emptyState = document.getElementById('empty-state');
  var $btnIncome = document.getElementById('btn-income');
  var $btnExpense = document.getElementById('btn-expense');
  var $modalOverlay = document.getElementById('modal-overlay');
  var $modal = document.getElementById('modal');
  var $modalClose = document.getElementById('modal-close');
  var $modalForm = document.getElementById('modal-form');
  var $transactionType = document.getElementById('transaction-type');
  var $amount = document.getElementById('amount');
  var $category = document.getElementById('category');
  var $note = document.getElementById('note');
  var $modalTitle = document.getElementById('modal-title');
  var $fieldTithe = document.getElementById('field-tithe');
  var $titheSlider = document.getElementById('tithe-slider');
  var $titheValue = document.getElementById('tithe-value');
  var $monthLabel = document.getElementById('month-label');
  var $monthPrev = document.getElementById('month-prev');
  var $monthNext = document.getElementById('month-next');

  var $viewHome = document.getElementById('view-home');
  var $viewGoals = document.getElementById('view-goals');
  var $viewSettings = document.getElementById('view-settings');
  var $goalsList = document.getElementById('goals-list');
  var $btnAddGoal = document.getElementById('btn-add-goal');
  var $categoriesIncome = document.getElementById('categories-income');
  var $categoriesExpense = document.getElementById('categories-expense');
  var $btnAddCatIncome = document.getElementById('btn-add-cat-income');
  var $btnAddCatExpense = document.getElementById('btn-add-cat-expense');

  var $modalCatOverlay = document.getElementById('modal-cat-overlay');
  var $modalCat = document.getElementById('modal-cat');
  var $modalCatClose = document.getElementById('modal-cat-close');
  var $modalCatForm = document.getElementById('modal-cat-form');
  var $modalCatTitle = document.getElementById('modal-cat-title');
  var $catType = document.getElementById('cat-type');
  var $catName = document.getElementById('cat-name');

  var $modalGoalOverlay = document.getElementById('modal-goal-overlay');
  var $modalGoal = document.getElementById('modal-goal');
  var $modalGoalClose = document.getElementById('modal-goal-close');
  var $modalGoalForm = document.getElementById('modal-goal-form');
  var $modalGoalTitle = document.getElementById('modal-goal-title');
  var $goalId = document.getElementById('goal-id');
  var $goalName = document.getElementById('goal-name');
  var $goalTarget = document.getElementById('goal-target');
  var $goalCurrent = document.getElementById('goal-current');

  var selectedMonth = new Date().getMonth();
  var selectedYear = new Date().getFullYear();
  var currentCatType = 'income';

  function loadFromStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      transactions = raw ? JSON.parse(raw) : [];
    } catch (e) {
      transactions = [];
    }
    try {
      var rawGoals = localStorage.getItem(STORAGE_KEY_GOALS);
      goals = rawGoals ? JSON.parse(rawGoals) : [];
    } catch (e) {
      goals = [];
    }
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }

  function getCategories() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (raw) {
        var data = JSON.parse(raw);
        if (data.income && data.income.length) return data;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  }

  function saveCategories(cats) {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(cats));
  }

  function saveGoals() {
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals));
  }

  var CURRENCY = ' BYN';

  function formatMoney(value) {
    return new Intl.NumberFormat('ru-BY', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value) + CURRENCY;
  }

  function isTransactionInMonth(isoDate, month, year) {
    var d = new Date(isoDate);
    return d.getMonth() === month && d.getFullYear() === year;
  }

  function getFilteredTransactions() {
    return transactions.filter(function (t) {
      return isTransactionInMonth(t.date, selectedMonth, selectedYear);
    });
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function openModal(type) {
    $transactionType.value = type;
    $modalTitle.textContent = type === 'income' ? 'Добавить доход' : 'Добавить расход';

    $fieldTithe.style.display = type === 'income' ? 'block' : 'none';
    $titheSlider.value = '10';
    $titheValue.textContent = '10%';

    var cats = getCategories();
    var list = type === 'income' ? cats.income : cats.expense;
    var options = list.map(function (cat) {
      return '<option value="' + escapeHtml(cat) + '">' + escapeHtml(cat) + '</option>';
    }).join('');
    $category.innerHTML = '<option value="">Выберите категорию</option>' + options;

    $amount.value = '';
    $note.value = '';
    $category.value = '';

    $modalOverlay.setAttribute('aria-hidden', 'false');
    $modalOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { $amount.focus(); }, 300);
  }

  function closeModal() {
    $modalOverlay.classList.remove('visible');
    $modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function addTransaction(type, amount, category, note, tithePercent) {
    var id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    var amountNum = Math.round(Number(amount) * 100) / 100 || 0;
    var tithePct = type === 'income' && tithePercent != null ? Math.min(20, Math.max(0, Number(tithePercent))) : 0;
    var titheAmount = Math.round((amountNum * tithePct / 100) * 100) / 100;
    transactions.unshift({
      id: id,
      type: type,
      amount: amountNum,
      category: category || '',
      note: (note || '').trim() || category || (type === 'income' ? 'Доход' : 'Расход'),
      date: new Date().toISOString(),
      tithePercent: type === 'income' ? tithePct : 0,
      titheAmount: titheAmount
    });
    saveToStorage();
    render();
  }

  function deleteTransaction(id) {
    transactions = transactions.filter(function (t) { return t.id !== id; });
    saveToStorage();
    render();
  }

  function renderBalance() {
    var list = getFilteredTransactions();
    var income = 0, expense = 0, titheTotal = 0;
    list.forEach(function (t) {
      if (t.type === 'income') {
        income += t.amount;
        titheTotal += (t.titheAmount != null ? t.titheAmount : 0);
      } else {
        expense += t.amount;
      }
    });
    var netIncome = income - titheTotal;
    var balance = netIncome - expense;

    $totalIncome.textContent = formatMoney(income);
    $totalExpense.textContent = formatMoney(expense);
    $totalTithe.textContent = formatMoney(titheTotal);
    $balance.textContent = formatMoney(Math.abs(balance));
    $balance.classList.remove('positive', 'negative');
    if (balance > 0) $balance.classList.add('positive');
    if (balance < 0) $balance.classList.add('negative');
  }

  function formatDate(iso) {
    var d = new Date(iso);
    var today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Сегодня';
    var yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }

  var MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  function updateMonthLabel() {
    $monthLabel.textContent = MONTH_NAMES[selectedMonth] + ' ' + selectedYear;
    var now = new Date();
    $monthNext.disabled = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
  }

  function renderList() {
    var list = getFilteredTransactions();
    $transactionList.innerHTML = '';
    list.forEach(function (t) {
      var li = document.createElement('li');
      li.className = 'transaction-item ' + t.type;
      li.setAttribute('data-id', t.id);

      var amountStr = (t.type === 'income' ? '+' : '−') + formatMoney(t.amount);
      var titheBadge = '';
      if (t.type === 'income' && t.tithePercent > 0 && t.titheAmount > 0) {
        titheBadge = '<span class="tithe-badge">' + escapeHtml(t.tithePercent + '%') + ' → Господу ' + formatMoney(t.titheAmount) + '</span>';
      }

      li.innerHTML =
        '<div class="transaction-info">' +
          '<div class="transaction-note">' + escapeHtml(t.note) + '</div>' +
          '<div class="transaction-meta">' + escapeHtml(t.category) + ' · ' + formatDate(t.date) + '</div>' +
          (titheBadge ? '<div class="transaction-tithe">' + titheBadge + '</div>' : '') +
        '</div>' +
        '<span class="transaction-amount">' + amountStr + '</span>' +
        '<button type="button" class="transaction-delete" data-id="' + escapeHtml(t.id) + '" aria-label="Удалить">×</button>';
      $transactionList.appendChild(li);
    });

    if (list.length === 0) {
      var isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();
      $emptyState.textContent = isCurrentMonth
        ? 'Пока нет операций.\nДобавьте доход или расход.'
        : 'В этом месяце нет операций.';
    }
  }

  function showView(name) {
    $viewHome.hidden = name !== 'home';
    $viewGoals.hidden = name !== 'goals';
    $viewSettings.hidden = name !== 'settings';
    document.querySelectorAll('.nav-item').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-view') === name);
      el.setAttribute('aria-current', el.getAttribute('data-view') === name ? 'page' : null);
    });
    if (name === 'settings') renderSettings();
    if (name === 'goals') renderGoals();
  }

  function renderSettings() {
    var cats = getCategories();
    function renderPillList(container, type, list) {
      container.innerHTML = '';
      list.forEach(function (name) {
        var pill = document.createElement('span');
        pill.className = 'pill pill-' + type;
        pill.innerHTML = '<button type="button" class="pill-remove" aria-label="Удалить">×</button> ' + escapeHtml(name);
        pill.dataset.name = name;
        pill.dataset.type = type;
        container.appendChild(pill);
      });
    }
    renderPillList($categoriesIncome, 'income', cats.income);
    renderPillList($categoriesExpense, 'expense', cats.expense);

    $categoriesIncome.querySelectorAll('.pill-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pill = btn.closest('.pill');
        if (pill && pill.dataset.type && pill.dataset.name) removeCategory(pill.dataset.type, pill.dataset.name);
      });
    });
    $categoriesExpense.querySelectorAll('.pill-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pill = btn.closest('.pill');
        if (pill && pill.dataset.type && pill.dataset.name) removeCategory(pill.dataset.type, pill.dataset.name);
      });
    });
  }

  function openCatModal(type, existingName) {
    currentCatType = type;
    $catType.value = type;
    $modalCatTitle.textContent = existingName ? 'Редактировать категорию' : (type === 'income' ? 'Новая категория дохода' : 'Новая категория расхода');
    $catName.value = existingName || '';
    $modalCatOverlay.classList.add('visible');
    $modalCatOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { $catName.focus(); }, 200);
  }

  function closeCatModal() {
    $modalCatOverlay.classList.remove('visible');
    $modalCatOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function addCategory(type, name) {
    var cats = getCategories();
    name = (name || '').trim();
    if (!name) return;
    if (cats[type].indexOf(name) !== -1) return;
    cats[type].push(name);
    saveCategories(cats);
    renderSettings();
  }

  function removeCategory(type, name) {
    var cats = getCategories();
    cats[type] = cats[type].filter(function (n) { return n !== name; });
    if (cats[type].length === 0) cats[type] = type === 'income' ? ['Прочее доход'] : ['Прочее расход'];
    saveCategories(cats);
    renderSettings();
  }

  function renderGoals() {
    $goalsList.innerHTML = '';
    goals.forEach(function (g) {
      var current = Number(g.current) || 0;
      var target = Number(g.target) || 1;
      var percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      var li = document.createElement('li');
      li.className = 'goal-item';
      li.dataset.id = g.id;
      li.innerHTML =
        '<div class="goal-info">' +
          '<div class="goal-name">' + escapeHtml(g.name) + '</div>' +
          '<div class="goal-progress">' + formatMoney(current) + ' / ' + formatMoney(target) + ' · <span class="percent">' + percent + '%</span></div>' +
        '</div>' +
        '<div class="goal-actions">' +
          '<button type="button" class="edit" aria-label="Изменить">✎</button>' +
          '<button type="button" class="delete" aria-label="Удалить">×</button>' +
        '</div>';
      $goalsList.appendChild(li);
    });
    $goalsList.querySelectorAll('.goal-actions .edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.closest('.goal-item').dataset.id;
        var g = goals.find(function (x) { return x.id === id; });
        if (g) openGoalModal(g);
      });
    });
    $goalsList.querySelectorAll('.goal-actions .delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.closest('.goal-item').dataset.id;
        goals = goals.filter(function (x) { return x.id !== id; });
        saveGoals();
        renderGoals();
      });
    });
  }

  function openGoalModal(goal) {
    $goalId.value = goal ? goal.id : '';
    $modalGoalTitle.textContent = goal ? 'Редактировать цель' : 'Новая цель';
    $goalName.value = goal ? goal.name : '';
    $goalTarget.value = goal ? goal.target : '';
    $goalCurrent.value = goal ? goal.current : '0';
    $modalGoalOverlay.classList.add('visible');
    $modalGoalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { $goalName.focus(); }, 200);
  }

  function closeGoalModal() {
    $modalGoalOverlay.classList.remove('visible');
    $modalGoalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function saveGoal(id, name, target, current) {
    target = Math.max(0, Number(target) || 0);
    current = Math.max(0, Number(current) || 0);
    if (id) {
      var g = goals.find(function (x) { return x.id === id; });
      if (g) {
        g.name = name;
        g.target = target;
        g.current = current;
      }
    } else {
      goals.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        name: name,
        target: target,
        current: current
      });
    }
    saveGoals();
    renderGoals();
  }

  function render() {
    updateMonthLabel();
    renderBalance();
    renderList();
  }

  $btnIncome.addEventListener('click', function () { openModal('income'); });
  $btnExpense.addEventListener('click', function () { openModal('expense'); });
  $modalClose.addEventListener('click', closeModal);
  $modalOverlay.addEventListener('click', function (e) {
    if (e.target === $modalOverlay) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && $modalOverlay.classList.contains('visible')) closeModal();
  });

  $titheSlider.addEventListener('input', function () {
    $titheValue.textContent = this.value + '%';
  });

  $modalForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var type = $transactionType.value;
    var amount = $amount.value;
    var category = $category.value;
    var note = $note.value.trim();
    var tithePercent = type === 'income' ? $titheSlider.value : 0;
    if (!amount || Number(amount) <= 0 || !category) return;
    addTransaction(type, amount, category, note || undefined, tithePercent);
    closeModal();
  });

  $monthPrev.addEventListener('click', function () {
    selectedMonth -= 1;
    if (selectedMonth < 0) { selectedMonth = 11; selectedYear -= 1; }
    render();
  });

  $monthNext.addEventListener('click', function () {
    if (selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear()) return;
    selectedMonth += 1;
    if (selectedMonth > 11) { selectedMonth = 0; selectedYear += 1; }
    render();
  });

  $transactionList.addEventListener('click', function (e) {
    var btn = e.target.closest('.transaction-delete');
    if (btn && btn.dataset.id) deleteTransaction(btn.dataset.id);
  });

  document.querySelectorAll('.nav-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showView(btn.getAttribute('data-view'));
    });
  });

  $btnAddCatIncome.addEventListener('click', function () { openCatModal('income'); });
  $btnAddCatExpense.addEventListener('click', function () { openCatModal('expense'); });
  $modalCatClose.addEventListener('click', closeCatModal);
  $modalCatOverlay.addEventListener('click', function (e) {
    if (e.target === $modalCatOverlay) closeCatModal();
  });
  $modalCatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $catName.value.trim();
    if (!name) return;
    addCategory(currentCatType, name);
    closeCatModal();
  });

  $btnAddGoal.addEventListener('click', function () { openGoalModal(null); });
  $modalGoalClose.addEventListener('click', closeGoalModal);
  $modalGoalOverlay.addEventListener('click', function (e) {
    if (e.target === $modalGoalOverlay) closeGoalModal();
  });
  $modalGoalForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var id = $goalId.value;
    var name = $goalName.value.trim();
    var target = $goalTarget.value;
    var current = $goalCurrent.value || '0';
    if (!name) return;
    saveGoal(id, name, target, current);
    closeGoalModal();
  });

  loadFromStorage();
  render();
})();
