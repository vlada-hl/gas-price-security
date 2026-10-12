document.addEventListener('DOMContentLoaded', () => {
  let state = {
    country: '',
    yearsCount: 0,
    years: [],
    data: {} // рік: { ukraine: val, europe: val }
  };

  const wizardContent = document.getElementById('wizardContent');
  const stepBadge = document.getElementById('stepBadge');
  const wizardTitle = document.getElementById('wizardTitle');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const message = document.getElementById('message');
  const resultsSection = document.getElementById('resultsSection');

  function showMessage(text, type = 'error') {
    message.textContent = text;
    message.className = `message ${type}`;
  }

  function updateProgress(step, percent, title) {
    stepBadge.textContent = `Крок ${step}`;
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${step} / 4`;
    wizardTitle.textContent = title;
  }

  // Крок 1: Введення країни
  document.getElementById('countryNext').addEventListener('click', () => {
    const val = document.getElementById('countryInput').value.trim();
    if (val.length < 2) {
      showMessage('Назва повинна містити щонайменше 2 літери.');
      return;
    }
    state.country = val;
    showMessage('');
    renderStep2();
  });

  // Крок 2: Вибір кількості років
  function renderStep2() {
    updateProgress(2, 50, 'Період дослідження');
    wizardContent.innerHTML = `
      <p class="instruction">Вкажіть кількість років для аналізу (від 1 до 10).</p>
      <div class="field">
        <label for="yearsCountInput">Кількість років</label>
        <input id="yearsCountInput" type="number" min="1" max="10" value="3">
      </div>
      <div class="button-row"><button class="btn primary" id="yearsCountNext" type="button">Далі</button></div>
    `;
    document.getElementById('yearsCountNext').addEventListener('click', () => {
      const count = parseInt(document.getElementById('yearsCountInput').value, 10);
      if (isNaN(count) || count < 1 || count > 10) {
        showMessage('Будь ласка, введіть число від 1 до 10.');
        return;
      }
      state.yearsCount = count;
      showMessage('');
      renderStep3();
    });
  }

  // Крок 3: Введення років
  function renderStep3() {
    updateProgress(3, 75, 'Визначення років');
    const currentYear = new Date().getFullYear();
    let html = `<p class="instruction">Введіть конкретні роки для аналізу.</p>`;
    for (let i = 0; i < state.yearsCount; i++) {
      html += `
        <div class="field">
          <label for="year_${i}">Рік ${i + 1}</label>
          <input id="year_${i}" type="number" value="${currentYear - state.yearsCount + i + 1}">
        </div>
      `;
    }
    html += `<div class="button-row"><button class="btn primary" id="yearsNext" type="button">Далі</button></div>`;
    wizardContent.innerHTML = html;

    document.getElementById('yearsNext').addEventListener('click', () => {
      let years = [];
      for (let i = 0; i < state.yearsCount; i++) {
        let y = parseInt(document.getElementById(`year_${i}`).value, 10);
        if (isNaN(y) || y < 1900 || y > 2100) {
          showMessage(`Перевірте правильність введення років.`);
          return;
        }
        years.push(y);
      }
      // Перевірка на унікальність
      if (new Set(years).size !== years.length) {
        showMessage('Роки не повинні повторюватися.');
        return;
      }
      state.years = years.sort((a, b) => a - b);
      showMessage('');
      renderStep4(0);
    });
  }

  // Крок 4: Введення показників по роках
  function renderStep4(index) {
    updateProgress(4, 90, `Показники за рік: ${state.years[index]}`);
    const yr = state.years[index];
    wizardContent.innerHTML = `
      <p class="instruction">Введіть ціни на газ у розрахунковому році <strong>${yr}</strong>.</p>
      <div class="field">
        <label for="ukraineVal">Ціна в Україні (дол./тис. куб. м)</label>
        <input id="ukraineVal" type="text" placeholder="Наприклад, 350,5">
      </div>
      <div class="field">
        <label for="europeVal">Ціна в Європі (дол./тис. куб. м)</label>
        <input id="europeVal" type="text" placeholder="Наприклад, 320,0">
      </div>
      <div class="button-row">
        ${index > 0 ? `<button class="btn secondary" id="prevVal" type="button">Назад</button>` : ''}
        <button class="btn primary" id="nextVal" type="button">${index === state.yearsCount - 1 ? 'Розрахувати' : 'Далі'}</button>
      </div>
    `;

    if (index > 0) {
      document.getElementById('prevVal').addEventListener('click', () => renderStep4(index - 1));
    }

    document.getElementById('nextVal').addEventListener('click', () => {
      let ukrStr = document.getElementById('ukraineVal').value.trim().replace(',', '.');
      let eurStr = document.getElementById('europeVal').value.trim().replace(',', '.');

      let ukr = parseFloat(ukrStr);
      let eur = parseFloat(eurStr);

      if (isNaN(ukr) || isNaN(eur) || ukr < 0 || eur <= 0) {
        showMessage('Введіть коректні додатні числа. Ціна в Європі не може дорівнювати 0.');
        return;
      }

      state.data[yr] = { ukraine: ukr, europe: eur };
      showMessage('');

      if (index < state.yearsCount - 1) {
        renderStep4(index + 1);
      } else {
        finishWizard();
      }
    });
  }

  // Завершення та побудова результатів
  function finishWizard() {
    document.querySelector('.wizard-card').classList.add('hidden');
    resultsSection.classList.remove('hidden');

    document.getElementById('countryPeriod').textContent = `Об'єкт: ${state.country} | Період: ${state.years[0]} – ${state.years[state.years.length - 1]}`;

    let tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';

    let sumRatio = 0;
    let validCount = 0;

    state.years.forEach(yr => {
      let item = state.data[yr];
      let ratio = item.ukraine / item.europe;
      sumRatio += ratio;
      validCount++;

      let tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${yr}</td>
        <td>${item.ukraine.toFixed(2).replace('.', ',')}</td>
        <td>${item.europe.toFixed(2).replace('.', ',')}</td>
        <td><strong>${ratio.toFixed(3).replace('.', ',')}</strong></td>
      `;
      tbody.appendChild(tr);
    });

    let avg = validCount > 0 ? sumRatio / validCount : 0;
    document.getElementById('averageCell').textContent = avg.toFixed(3).replace('.', ',');

    evaluateSecurity(avg);
  }

  // Оцінка рівня безпеки за шкалою МЕРТ № 1277
  function evaluateSecurity(avg) {
    let level = '';
    let color = '';
    let description = '';

    if (avg <= 0.8) {
      level = 'Оптимальний рівень';
      color = '#198754';
      description = 'Імпортна ціна в Україні суттєво нижча за європейську, що забезпечує найвищий рівень економічної та енергетичної безпеки.';
    } else if (avg <= 0.9) {
      level = 'Задовільний рівень';
      color = '#20c997';
      description = 'Цінові параметри знаходяться в межах контрольованих значень із незначними ризиками.';
    } else if (avg <= 1.0) {
      level = 'Незадовільний рівень';
      color = '#ffc107';
      description = 'Ціна в Україні практично зрівнялася з європейською, що підвищує навантаження на економіку.';
    } else if (avg <= 1.1) {
      level = 'Небезпечний рівень';
      color = '#fd7e14';
      description = 'Українська ціна перевищує європейську, формуючи додаткові цінові шоки для промисловості та домогосподарств.';
    } else if (avg <= 1.25) {
      level = 'Критичний рівень';
      color = '#e35d6a';
      description = 'Суттєве перевищення європейських цін створює серйозні загрози конкурентоспроможності.';
    } else {
      level = 'Абсолютна небезпека';
      color = '#d9381e';
      description = 'Критично високе співвідношення цін, що руйнує фінансову стійкість енергоємних галузей та економічну безпеку держави.';
    }

    const secRes = document.getElementById('securityResult');
    secRes.style.backgroundColor = color;
    secRes.style.color = '#fff';
    secRes.textContent = `Рівень економічної безпеки: ${level} (Середнє співвідношення: ${avg.toFixed(3).replace('.', ',')} разів)`;

    document.getElementById('analysisText').innerHTML = `
      <h3>Аналітичний висновок</h3>
      <p>За результатами розрахунку для об'єкта <strong>${state.country}</strong> за аналізований період середнє співвідношення імпортної ціни на газ в Україні та Європі становить <strong>${avg.toFixed(3).replace('.', ',')}</strong>.</p>
      <p>${description}</p>
    `;
  }

  // Кнопки дій
  document.getElementById('restartBtn').addEventListener('click', () => {
    state = { country: '', yearsCount: 0, years: [], data: {} };
    resultsSection.classList.add('hidden');
    document.querySelector('.wizard-card').classList.remove('hidden');
    document.getElementById('countryInput').value = '';
    renderStep1Base();
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Очистити введені дані?')) {
      location.reload();
    }
  });

  document.getElementById('printBtn').addEventListener('click', () => window.print());

  document.getElementById('csvBtn').addEventListener('click', () => {
    let csv = 'Рік;Ціна Україна;Ціна Європа;Співвідношення\n';
    state.years.forEach(yr => {
      let item = state.data[yr];
      let ratio = item.ukraine / item.europe;
      csv += `${yr};${item.ukraine};${item.europe};${ratio.toFixed(3)}\n`;
    });
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'gas_price_ratio_analysis.csv';
    a.click();
  });

  function renderStep1Base() {
    updateProgress(1, 25, 'Вибір країни / об\'єкта');
    wizardContent.innerHTML = `
      <p class="instruction">Введіть назву об'єкта аналізу (наприклад, Україна / Європа).</p>
      <div class="field">
        <label for="countryInput">Назва об'єкта дослідження</label>
        <input id="countryInput" type="text" maxlength="80" placeholder="Наприклад, Україна">
        <span class="helper">Поле не може бути порожнім і повинно містити щонайменше 2 літери.</span>
      </div>
      <div class="button-row"><button class="btn primary" id="countryNext" type="button">Далі</button></div>
    `;
    document.getElementById('countryNext').addEventListener('click', () => {
      const val = document.getElementById('countryInput').value.trim();
      if (val.length < 2) {
        showMessage('Назва повинна містити щонайменше 2 літери.');
        return;
      }
      state.country = val;
      showMessage('');
      renderStep2();
    });
  }
});