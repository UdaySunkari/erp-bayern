(function () {
  'use strict';

  var hd = document.getElementById('hd'), ticking = false;
  if (hd) {
    addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        hd.classList.toggle('stuck', scrollY > 16);
        ticking = false;
      });
    }, { passive: true });
  }

  var mnb = document.getElementById('mnb'), mn = document.getElementById('mn');
  if (mnb && mn) {
    mnb.onclick = function () {
      var open = mn.hasAttribute('hidden');
      open ? mn.removeAttribute('hidden') : mn.setAttribute('hidden', '');
      mnb.setAttribute('aria-expanded', open);
      mnb.setAttribute('aria-label', mnb.dataset[open ? 'close' : 'open']);
    };
    mn.querySelectorAll('a').forEach(function (a) {
      a.onclick = function () {
        mn.setAttribute('hidden', '');
        mnb.setAttribute('aria-expanded', 'false');
        mnb.setAttribute('aria-label', mnb.dataset.open);
      };
    });
  }

  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: .07, rootMargin: '0px 0px -40px 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  var fw = document.getElementById('faqw');
  if (fw) {
    fw.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      var q = b.closest('.q'), open = q.classList.contains('open');
      fw.querySelectorAll('.q.open').forEach(function (o) {
        o.classList.remove('open');
        o.querySelector('button').setAttribute('aria-expanded', 'false');
      });
      if (!open) { q.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
    });
  }

  var lb = document.getElementById('lb'), lbi = document.getElementById('lbi'),
      lbx = document.getElementById('lbx'), last = null;
  function openLb(im) {
    last = im; lbi.src = im.currentSrc || im.src; lbi.alt = im.alt;
    lb.removeAttribute('hidden'); document.body.style.overflow = 'hidden'; lbx.focus();
  }
  function closeLb() {
    lb.setAttribute('hidden', ''); lbi.src = '';
    document.body.style.overflow = ''; if (last) last.focus();
  }
  if (lb) {
    document.querySelectorAll('img.zoom').forEach(function (im) {
      im.tabIndex = 0; im.setAttribute('role', 'button');
      im.onclick = function () { openLb(im); };
      im.onkeydown = function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(im); }
      };
    });
    lb.onclick = closeLb;
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lb.hasAttribute('hidden')) closeLb();
    });
  }

  var toast = document.getElementById('toast'),
      tt = document.getElementById('toasttxt'),
      cpy = document.getElementById('cpy'), tmr;
  if (cpy && toast) {
    cpy.onclick = function () {
      var mail = 'kontakt@erp-bayern.de';
      function ok() {
        tt.textContent = toast.dataset.copied;
        toast.classList.add('on');
        clearTimeout(tmr);
        tmr = setTimeout(function () { toast.classList.remove('on'); }, 2200);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(mail).then(ok).catch(function () { location.href = 'mailto:' + mail; });
      } else { location.href = 'mailto:' + mail; }
    };
  }
})();
