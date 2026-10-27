(function () {
  'use strict';
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Hero: cross out the problems one by one */
  var probs = document.querySelectorAll('#probs .prob');
  if (probs.length && !calm) {
    probs.forEach(function (p) { p.classList.remove('done'); });
    probs.forEach(function (p, i) {
      setTimeout(function () { p.classList.add('done'); }, 700 + i * 900);
    });
  }

  /* Shift planner demo */
  var grid = document.getElementById('pl-grid');
  if (grid) {
    var P = ['Anna', 'Bekir', 'Carla', 'Dominik'], D = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
    var LABEL = { f: 'Früh', s: 'Spät', u: 'Urlaub', '': '+' };
    var NAME = { f: 'Frühschicht', s: 'Spätschicht', u: 'Urlaub', '': 'frei' };
    var TARGET = 128;
    var plan = [['f','f','f','s',''],['s','f','f','','u'],['u','u','f','f','s'],['f','f','','s','s']];
    var note = '';
    var renderPlanner = function () {
      var bad = plan.map(function () { return [false,false,false,false,false]; }), conflicts = [];
      plan.forEach(function (row, p) {
        for (var d = 0; d < 4; d++) {
          if (row[d] === 's' && row[d + 1] === 'f') {
            bad[p][d] = bad[p][d + 1] = true;
            conflicts.push(P[p] + ', ' + D[d] + ' Spät auf ' + D[d + 1] + ' Früh');
          }
        }
      });
      var html = '<span></span>' + D.map(function (d) { return '<span class="day">' + d + '</span>'; }).join('');
      plan.forEach(function (row, p) {
        html += '<span class="who-cell">' + P[p] + '</span>';
        row.forEach(function (v, d) {
          html += '<button type="button" class="cell ' + v + (bad[p][d] ? ' x' : '') + '" data-p="' + p + '" data-d="' + d + '" aria-label="' + P[p] + ', ' + D[d] + ': ' + NAME[v] + '">' + LABEL[v] + '</button>';
        });
      });
      grid.innerHTML = html;
      var hours = 0;
      plan.forEach(function (r) { r.forEach(function (v) { if (v === 'f' || v === 's') hours += 8; }); });
      document.getElementById('pl-hours').textContent = hours + ' Std.';
      var c = document.getElementById('pl-conflicts');
      c.textContent = conflicts.length;
      c.style.color = conflicts.length ? 'var(--alert)' : 'var(--ok)';
      var msg = document.getElementById('pl-msg');
      if (note) { msg.textContent = note; msg.style.color = 'var(--muted)'; }
      else if (conflicts.length) { msg.textContent = 'Ruhezeit unter 11 Std.: ' + conflicts.join('; ') + '.'; msg.style.color = 'var(--alert)'; }
      else if (hours < TARGET) { msg.textContent = 'Keine Konflikte. Noch ' + (TARGET - hours) + ' Std. offen bis zum Soll.'; msg.style.color = 'var(--muted)'; }
      else { msg.textContent = 'Plan vollständig, keine Konflikte.'; msg.style.color = 'var(--ok)'; }
      note = '';
    };
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var p = +b.dataset.p, d = +b.dataset.d, v = plan[p][d];
      if (v === 'u') note = P[p] + ' hat Urlaub. Der Plan lässt hier keine Schicht zu.';
      else plan[p][d] = v === '' ? 'f' : v === 'f' ? 's' : '';
      renderPlanner();
      var again = grid.querySelector('[data-p="' + p + '"][data-d="' + d + '"]');
      if (again) again.focus();
    });
    renderPlanner();
  }

  /* Absence Cover demo */
  var anna = document.getElementById('ac-anna');
  if (anna) {
    var ben = document.getElementById('ac-ben'), log = document.getElementById('ac-log');
    var go = document.getElementById('ac-go'), cust = document.getElementById('ac-cust');
    var sa = document.getElementById('ac-sa'), sb = document.getElementById('ac-sb');
    var A = [
      { k: 'Ticket #2041', t: 'Lieferung beschädigt, Meier GmbH', q: false },
      { k: 'Ticket #2057', t: 'Frage zur Rechnung Oktober', q: false },
      { k: 'Ticket #1872', t: 'Katalog-Anfrage, ruht seit 34 Tagen', q: true },
      { k: 'Aufgabe', t: 'Angebot für Krause Logistik fertigstellen', q: false }
    ];
    var B = [{ k: 'Ticket #2033', t: 'Lieferzeit Ersatzteil' }, { k: 'Aufgabe', t: 'Retoure prüfen, Lager 2' }];
    var timers = [], state = 'idle', count = 2, quiet = null;

    var makeCard = function (o) {
      var d = document.createElement('div');
      d.className = 'card' + (o.q ? ' q' : '');
      var k = document.createElement('span'); k.className = 'k'; k.textContent = o.k;
      d.appendChild(k); d.appendChild(document.createTextNode(o.t));
      return d;
    };
    var addNote = function (el, text, ping) {
      el.querySelectorAll('.note').forEach(function (n) { n.remove(); });
      var s = document.createElement('span'); s.className = 'note' + (ping ? ' ping' : ''); s.textContent = text;
      el.appendChild(s);
    };
    var logLine = function (text, ok) {
      var li = document.createElement('li'); li.textContent = text; if (ok) li.className = 'ok';
      log.appendChild(li);
    };
    var move = function (el, target) {
      var a = el.getBoundingClientRect(); target.appendChild(el); var b = el.getBoundingClientRect();
      if (calm) return;
      el.style.transition = 'none';
      el.style.transform = 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px)';
      el.getBoundingClientRect();
      el.style.transition = 'transform .7s cubic-bezier(.2,.75,.25,1)';
      el.style.transform = ''; el.style.zIndex = '2';
      setTimeout(function () { el.style.zIndex = ''; }, 750);
    };
    var bump = function () { count++; sb.textContent = 'Vertretung für Anna, ' + count + ' offene Vorgänge'; };
    var later = function (fn, ms) { timers.push(setTimeout(fn, calm ? 0 : ms)); };

    var setup = function () {
      timers.forEach(clearTimeout); timers = []; state = 'idle'; count = 2;
      anna.innerHTML = ''; ben.innerHTML = ''; log.innerHTML = '';
      A.forEach(function (o) { var c = makeCard(o); c._o = o; if (o.q) quiet = c; anna.appendChild(c); });
      B.forEach(function (o) { ben.appendChild(makeCard(o)); });
      sa.textContent = 'Kundenservice, im Büro'; sa.className = 'sim-state';
      sb.textContent = 'Vertretung für Anna, 2 offene Vorgänge';
      go.textContent = 'Anna geht in den Urlaub'; cust.disabled = false;
    };
    var run = function () {
      if (state !== 'idle') return;
      state = 'running'; go.textContent = 'Läuft…';
      sa.textContent = 'Abwesend bis 14. November'; sa.className = 'sim-state away';
      logLine('Abwesenheit eingetragen: 03.11. bis 14.11.');
      var t = 600;
      Array.prototype.slice.call(anna.querySelectorAll('.card')).forEach(function (c) {
        var o = c._o;
        later(function () {
          if (o.q) { addNote(c, 'Bleibt bei Anna, weil es ruht'); logLine(o.k + ' bleibt liegen, weil es seit 34 Tagen ruht.'); }
          else { move(c, ben); c.classList.add('moved'); addNote(c, 'Übernommen von Anna'); bump(); logLine(o.k + ' an Ben übergeben.'); }
        }, t);
        t += 1000;
      });
      later(function () {
        state = 'away'; go.textContent = 'Noch einmal abspielen';
        logLine('Offene Vorgänge sind bei Ben. Jetzt schreiben Sie als Kunde auf #1872.');
      }, t);
    };
    var customer = function () {
      if (state === 'idle') { logLine('Erst Anna in den Urlaub schicken, dann schreibt der Kunde.'); return; }
      if (state !== 'away' || !quiet || quiet.parentElement === ben) return;
      addNote(quiet, 'Neue Nachricht vom Kunden', true);
      logLine('Kunde schreibt auf Ticket #1872.');
      later(function () {
        move(quiet, ben); quiet.classList.remove('q'); quiet.classList.add('moved');
        addNote(quiet, 'Sofort bei Ben, weil der Kunde geschrieben hat'); bump();
        logLine('Ticket #1872 liegt jetzt bei Ben. Kein Kunde wartet vergeblich.', true);
        cust.disabled = true;
      }, 900);
    };

    go.addEventListener('click', function () {
      if (state === 'away') { setup(); setTimeout(run, 50); } else run();
    });
    cust.addEventListener('click', customer);
    document.getElementById('ac-reset').addEventListener('click', setup);
    setup();
  }
})();