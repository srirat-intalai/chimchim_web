AOS.init({
    duration: 680,
    once: true,
    offset: 55
});

/* NAVBAR SCROLL & ACTIVE LINK */
window.addEventListener('scroll', function() {
    document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 60);
    document.getElementById('btt').classList.toggle('show', window.scrollY > 300);
    document.querySelectorAll('section[id]').forEach(function(sec) {
        var top = sec.offsetTop - 110,
            bot = top + sec.offsetHeight;
        if (window.scrollY >= top && window.scrollY < bot) {
            document.querySelectorAll('.nav-link').forEach(function(l) {
                l.classList.remove('active');
            });
            var lnk = document.querySelector('.nav-link[href="#' + sec.id + '"]');
            if (lnk) lnk.classList.add('active');
        }
    });
});

/* SMOOTH SCROLL + ปิดเมนูมือถือเวลากดลิงก์ */
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
        var href = this.getAttribute('href');
        if (href === '#') return;
        var t = document.querySelector(href);
        if (t) {
            e.preventDefault();
            var navCollapse = document.getElementById('navmenu');
            if (navCollapse && navCollapse.classList.contains('show')) {
                var bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
                if (bsCollapse) {
                    bsCollapse.hide();
                } else {
                    navCollapse.classList.remove('show');
                }
            }
            setTimeout(function() {
                window.scrollTo({
                    top: t.offsetTop - 78,
                    behavior: 'smooth'
                });
            }, 50);
        }
    });
});

/* -----------------------------------------------------
   ปุ่มสลับภาษา TH / EN
   ทุก element ที่มี data-th กับ data-en จะโดนสลับข้อความ
----------------------------------------------------- */
var ภาษาปัจจุบัน = "th";

function สลับภาษา(lang) {
    ภาษาปัจจุบัน = lang;
    var ทุกอัน = document.querySelectorAll('[data-th]');
    var i;
    for (i = 0; i < ทุกอัน.length; i++) {
        var el = ทุกอัน[i];
        if (lang === "th") {
            el.innerHTML = el.getAttribute('data-th');
        } else {
            el.innerHTML = el.getAttribute('data-en');
        }
    }
    document.getElementById('langThBtn').classList.toggle('active', lang === 'th');
    document.getElementById('langEnBtn').classList.toggle('active', lang === 'en');
}

document.getElementById('langThBtn').addEventListener('click', function() {
    สลับภาษา('th');
});
document.getElementById('langEnBtn').addEventListener('click', function() {
    สลับภาษา('en');
});


/* -----------------------------------------------------
   SEARCH OVERLAY
----------------------------------------------------- */
var searchOv = document.getElementById('searchOv');

document.getElementById('navSearchBtn').addEventListener('click', function() {
    searchOv.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function() {
        document.getElementById('searchInput').focus();
    }, 220);
});

document.getElementById('searchClose').addEventListener('click', closeSearch);

searchOv.addEventListener('click', function(e) {
    if (e.target === searchOv) closeSearch();
});

function closeSearch() {
    searchOv.classList.remove('open');
    document.body.style.overflow = '';
}

// กดหมวดในกล่องค้นหา -> ปิดกล่อง แล้วไปกรอง feed ให้เลย
document.querySelectorAll('.sovcat').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.sovcat').forEach(function(b) {
            b.classList.remove('active');
        });
        this.classList.add('active');
        var f = this.getAttribute('data-cat');
        closeSearch();
        setTimeout(function() {
            กรองตามหมวด(f);
            document.getElementById('feed').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 300);
    });
});

// แท็กค้นหายอดฮิต เอาไปใส่ในช่องค้นหาให้เลย
document.querySelectorAll('.sovtrend .ttag').forEach(function(t) {
    t.addEventListener('click', function() {
        document.getElementById('searchInput').value = this.textContent.trim();
        document.getElementById('searchInput').focus();
    });
});


$(document).ready(function() {
	$('.magnific_popup').magnificPopup({
	  disableOn: 700,
	  type: 'iframe',
	  mainClass: 'mfp-fade',
	  removalDelay: 160,
	  preloader: false,
	  fixedContentPos: false,
	  disableOn: 300
	});
});


/* -----------------------------------------------------
   ระบบกรอง Discovery Feed
   มี 2 มิติแยกกัน: หมวดอาหาร (มาจากการ์ด Category)
   กับ แท็บ For You / Near You / Hidden Gems / Popular / New
----------------------------------------------------- */
var currentTab = "foryou";
var currentCat = "all";

function อัพเดตการ์ดที่เห็น() {
    var การ์ดทั้งหมด = document.querySelectorAll('.mwrap');
    var i;
    for (i = 0; i < การ์ดทั้งหมด.length; i++) {
        var การ์ด = การ์ดทั้งหมด[i];
        var หมวดการ์ด = การ์ด.getAttribute('data-c');
        var บัคเก็ตการ์ด = การ์ด.getAttribute('data-bucket');

        var ผ่านแท็บ = false;
        if (currentTab === 'foryou') {
            ผ่านแท็บ = true;
        } else if (บัคเก็ตการ์ด.indexOf(currentTab) !== -1) {
            ผ่านแท็บ = true;
        }

        var ผ่านหมวด = false;
        if (currentCat === 'all' || หมวดการ์ด === currentCat) {
            ผ่านหมวด = true;
        }

        if (ผ่านแท็บ && ผ่านหมวด) {
            การ์ด.classList.remove('gone');
        } else {
            การ์ด.classList.add('gone');
        }
    }
}

// กดแท็บด้านบน feed
var แท็บทั้งหมด = document.querySelectorAll('.filtbtn');
for (var t = 0; t < แท็บทั้งหมด.length; t++) {
    แท็บทั้งหมด[t].addEventListener('click', function() {
        currentTab = this.getAttribute('data-f');
        var j;
        for (j = 0; j < แท็บทั้งหมด.length; j++) {
            แท็บทั้งหมด[j].classList.remove('active');
        }
        this.classList.add('active');
        currentCat = 'all';
        var หมวดการ์ดต่างๆ = document.querySelectorAll('.catcard');
        for (j = 0; j < หมวดการ์ดต่างๆ.length; j++) {
            หมวดการ์ดต่างๆ[j].classList.remove('active');
        }
        อัพเดตการ์ดที่เห็น();
    });
}

// กดการ์ดหมวดหมู่ -> เลื่อนไป feed แล้วกรองตามหมวด
function กรองตามหมวด(cat) {
    currentCat = cat;
    currentTab = 'foryou';

    var i;
    var catcards = document.querySelectorAll('.catcard');
    for (i = 0; i < catcards.length; i++) {
        catcards[i].classList.toggle('active', catcards[i].getAttribute('data-filter') === cat);
    }
    var tabs = document.querySelectorAll('.filtbtn');
    for (i = 0; i < tabs.length; i++) {
        tabs[i].classList.toggle('active', tabs[i].getAttribute('data-f') === 'foryou');
    }
    อัพเดตการ์ดที่เห็น();
}

document.querySelectorAll('.catcard').forEach(function(card) {
    card.addEventListener('click', function() {
        var f = this.getAttribute('data-filter');
        window.scrollTo({
            top: document.getElementById('feed').offsetTop - 80,
            behavior: 'smooth'
        });
        setTimeout(function() {
            กรองตามหมวด(f);
        }, 480);
    });
});


/* -----------------------------------------------------
   Match % บนการ์ดเมนู (ต้องเรียกจาก chimchim-data.js เท่านั้น)
----------------------------------------------------- */
function หาร้านจากId(id) {
    var i;
    for (i = 0; i < รายการร้าน.length; i++) {
        if (รายการร้าน[i].id === id) {
            return รายการร้าน[i];
        }
    }
    return null;
}

function แสดงMatchในการ์ดทั้งหมด() {
    var การ์ดเมนู = document.querySelectorAll('.mcard');
    var i;
    for (i = 0; i < การ์ดเมนู.length; i++) {
        var การ์ด = การ์ดเมนู[i];
        var id = parseInt(การ์ด.getAttribute('data-id'));
        var ร้าน = หาร้านจากId(id);
        if (ร้าน) {
            var คะแนน = คำนวณMatch(ร้าน, foodDNA);
            การ์ด.setAttribute('data-match', คะแนน);
            var ป้าย = การ์ด.querySelector('.mmatch');
            if (ป้าย) {
                ป้าย.textContent = '🎯 ' + คะแนน + '% Match';
            }
        }
    }
}
แสดงMatchในการ์ดทั้งหมด();


/* -----------------------------------------------------
   POPUP รายละเอียดเมนู
----------------------------------------------------- */
var menuPop = document.getElementById('menuPop');

function openMenuPop(card) {
    var img = card.getAttribute('data-img');
    var title = card.getAttribute('data-title');
    var restaurant = card.getAttribute('data-restaurant');
    var price = card.getAttribute('data-price');
    var distance = card.getAttribute('data-distance');
    var desc = card.getAttribute('data-desc');
    var tags = card.getAttribute('data-tags') || '';
    var id = parseInt(card.getAttribute('data-id'));

    var mwrapEl = card.closest('.mwrap');
    var cat = mwrapEl ? mwrapEl.getAttribute('data-c') : '';

    document.getElementById('mpImg').setAttribute('src', img);
    document.getElementById('mpCat').textContent = cat;
    document.getElementById('mpTitle').textContent = title;
    document.getElementById('mpRestaurant').textContent = restaurant;

    var ร้าน = หาร้านจากId(id);
    var คะแนน = 0;
    if (ร้าน) {
        คะแนน = คำนวณMatch(ร้าน, foodDNA);
    }
    document.getElementById('mpMatch').innerHTML = '🎯 ' + คะแนน + '% Match <i class="fas fa-chevron-down" style="font-size:.7rem;margin-left:4px;"></i>';

    var reasonBox = document.getElementById('mpReason');
    reasonBox.classList.remove('show');
    if (ร้าน) {
        reasonBox.textContent = สร้างเหตุผลmatch(ร้าน, foodDNA);
    }

    document.getElementById('mpDesc').textContent = desc;
    document.getElementById('mpPrice').innerHTML = price;

    document.getElementById('mpMeta').innerHTML =
        '<div class="mpm"><div class="mpmv">' + distance + '</div><div class="mpml">ระยะทาง</div></div>' +
        '<div class="mpm"><div class="mpmv">' + cat + '</div><div class="mpml">หมวด</div></div>' +
        '<div class="mpm"><div class="mpmv">' + คะแนน + '%</div><div class="mpml">Match</div></div>';

    var tagArr = tags.split(',');
    var tagHtml = '';
    var i;
    for (i = 0; i < tagArr.length; i++) {
        if (tagArr[i] !== '') {
            tagHtml += '<span class="mptag">' + tagArr[i].trim() + '</span>';
        }
    }
    document.getElementById('mpTags').innerHTML = tagHtml;

    // ทุกครั้งที่เปิด popup ใหม่ ให้เคลียร์ปุ่ม save/follow กลับค่าเดิมก่อน
    var saveBtn = document.getElementById('mpSaveBtn');
    saveBtn.classList.remove('saved');
    saveBtn.querySelector('span').textContent = 'Save';
    saveBtn.querySelector('i').className = 'far fa-heart';

    var followBtn = document.getElementById('mpFollowBtn');
    followBtn.classList.remove('following');
    followBtn.querySelector('span').textContent = 'Follow ร้าน';

    menuPop.classList.add('open');
    document.body.style.overflow = 'hidden';
}

document.querySelectorAll('.mcard').forEach(function(card) {
    card.addEventListener('click', function() {
        openMenuPop(this);
    });
});

// กดป้าย Match % ใน popup -> โชว์/ซ่อนเหตุผล
document.getElementById('mpMatch').addEventListener('click', function() {
    document.getElementById('mpReason').classList.toggle('show');
});

// หัวใจบนการ์ด (กดแล้วสลับสีเฉย ๆ ไม่เปิด popup)
document.querySelectorAll('.mhrt').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var ico = this.querySelector('i');
        ico.classList.toggle('far');
        ico.classList.toggle('fas');
        this.style.color = ico.classList.contains('fas') ? 'var(--primary)' : '#ccc';
    });
});

document.getElementById('mpClose').addEventListener('click', closeMenuPop);
menuPop.addEventListener('click', function(e) {
    if (e.target === this) closeMenuPop();
});

function closeMenuPop() {
    menuPop.classList.remove('open');
    document.body.style.overflow = '';
}

// ปุ่ม Save ใน popup
document.getElementById('mpSaveBtn').addEventListener('click', function() {
    this.classList.toggle('saved');
    var span = this.querySelector('span');
    var ico = this.querySelector('i');
    if (this.classList.contains('saved')) {
        span.textContent = 'Saved';
        ico.className = 'fas fa-heart';
    } else {
        span.textContent = 'Save';
        ico.className = 'far fa-heart';
    }
});

// ปุ่ม Follow ร้าน ใน popup
document.getElementById('mpFollowBtn').addEventListener('click', function() {
    this.classList.toggle('following');
    var span = this.querySelector('span');
    if (this.classList.contains('following')) {
        span.textContent = 'Following';
    } else {
        span.textContent = 'Follow ร้าน';
    }
});

// ปุ่มนำทาง (โหมดสาธิต ยังไม่พาไปจริง)
document.getElementById('mpNavBtn').addEventListener('click', function() {
    alert('🧭 กำลังพาไปหน้าแผนที่... (โหมดสาธิต ยังไม่เปิดใช้งานจริงใน prototype นี้)');
});


/* -----------------------------------------------------
   ปุ่ม Follow นักรีวิว (section Following)
----------------------------------------------------- */
document.querySelectorAll('.followbtn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        this.classList.toggle('following');
        if (this.classList.contains('following')) {
            this.textContent = '✓ Following';
        } else {
            this.textContent = '+ Follow';
        }
    });
});


/* -----------------------------------------------------
   ร้าน Sponsored - Match % ก็ต้องมาจากฟังก์ชันเดียวกัน ห้ามพิมพ์เอง
----------------------------------------------------- */
var sponsorร้าน = หาร้านSponsor();
var sponsorคะแนน = คำนวณMatch(sponsorร้าน, foodDNA);
document.getElementById('spMatch').textContent =
    'Sponsored · ' + sponsorคะแนน + '% Match — จ่ายเพื่อให้คนที่ Food DNA ตรงกันเห็นร้านนี้ก่อน';


/* -----------------------------------------------------
   GALLERY POPUP
----------------------------------------------------- */
var galPop = document.getElementById('galPop');
var galData = [];
var galIdx = 0;

document.querySelectorAll('.gitem').forEach(function(item) {
    galData.push({
        img: item.getAttribute('data-gimg'),
        title: item.getAttribute('data-gtitle'),
        desc: item.getAttribute('data-gdesc')
    });
    item.addEventListener('click', function() {
        openGal(parseInt(this.getAttribute('data-gi')));
    });
});

function openGal(i) {
    galIdx = i;
    var g = galData[i];
    document.getElementById('gpImg').setAttribute('src', g.img);
    document.getElementById('gpTitle').textContent = g.title;
    document.getElementById('gpDesc').innerHTML = g.desc;
    galPop.classList.add('open');
    document.body.style.overflow = 'hidden';
}

document.getElementById('gpClose').addEventListener('click', closeGal);
galPop.addEventListener('click', function(e) {
    if (e.target === this) closeGal();
});

function closeGal() {
    galPop.classList.remove('open');
    document.body.style.overflow = '';
}

document.getElementById('gpPrev').addEventListener('click', function() {
    openGal((galIdx - 1 + galData.length) % galData.length);
});
document.getElementById('gpNext').addEventListener('click', function() {
    openGal((galIdx + 1) % galData.length);
});

/* ESC ปิดทุก popup */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSearch();
        closeMenuPop();
        closeGal();
        if (typeof $.magnificPopup !== 'undefined') $.magnificPopup.close();
    }
});


new Swiper('.tesSwiper', {
    slidesPerView: 1,
    spaceBetween: 22,
    loop: true,
    autoplay: {
        delay: 4000,
        disableOnInteraction: false
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true
    },
    breakpoints: {
        640: {
            slidesPerView: 2
        },
        1024: {
            slidesPerView: 3
        }
    }
});


/* -----------------------------------------------------
   AI FOOD FINDER แบบย่อ (4 ขั้นตอน)
----------------------------------------------------- */
var เลือกหมวด = "";
var เลือกงบ = "";
var เลือกระยะ = "";
var เลือกรส = "";
var ขั้นตอนปัจจุบัน = 1;

function ไปขั้นตอน(n) {
    document.getElementById('aiStep1').style.display = (n === 1) ? 'block' : 'none';
    document.getElementById('aiStep2').style.display = (n === 2) ? 'block' : 'none';
    document.getElementById('aiStep3').style.display = (n === 3) ? 'block' : 'none';
    document.getElementById('aiStep4').style.display = (n === 4) ? 'block' : 'none';
    document.getElementById('airesults').classList.remove('show');

    var bars = [document.getElementById('aip1'), document.getElementById('aip2'), document.getElementById('aip3'), document.getElementById('aip4')];
    var i;
    for (i = 0; i < bars.length; i++) {
        if (i < n) {
            bars[i].classList.add('done');
        } else {
            bars[i].classList.remove('done');
        }
    }
}

// ปุ่มตัวเลือกในแต่ละสเต็ป
var ตัวเลือกทั้งหมด = document.querySelectorAll('.aiopt');
for (var o = 0; o < ตัวเลือกทั้งหมด.length; o++) {
    ตัวเลือกทั้งหมด[o].addEventListener('click', function() {
        var step = parseInt(this.getAttribute('data-step'));
        var val = this.getAttribute('data-val');

        // ไฮไลท์ปุ่มที่กดในสเต็ปเดียวกัน
        var พี่น้อง = this.parentNode.querySelectorAll('.aiopt');
        var j;
        for (j = 0; j < พี่น้อง.length; j++) {
            พี่น้อง[j].classList.remove('picked');
        }
        this.classList.add('picked');

        if (step === 1) {
            เลือกหมวด = val;
        } else if (step === 2) {
            เลือกงบ = val;
        } else if (step === 3) {
            เลือกระยะ = val;
        } else if (step === 4) {
            เลือกรส = val;
        }

        setTimeout(function() {
            if (step < 4) {
                ขั้นตอนปัจจุบัน = step + 1;
                ไปขั้นตอน(ขั้นตอนปัจจุบัน);
            } else {
                แสดงผลลัพธ์AI();
            }
        }, 350);
    });
}

// ปุ่มย้อนกลับ
document.querySelectorAll('.aiback').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var n = parseInt(this.getAttribute('data-back'));
        ขั้นตอนปัจจุบัน = n;
        ไปขั้นตอน(n);
    });
});

function แสดงผลลัพธ์AI() {
    // ถ้าเลือก "ไม่รู้" ไว้ ให้ใช้ Food DNA ช่วยตัดสินใจแทน (ตามกติกาใน blueprint)
    var ผลลัพธ์ = หาร้านให้ฉัน(เลือกหมวด, เลือกงบ, เลือกระยะ, เลือกรส);

    document.getElementById('aiStep1').style.display = 'none';
    document.getElementById('aiStep2').style.display = 'none';
    document.getElementById('aiStep3').style.display = 'none';
    document.getElementById('aiStep4').style.display = 'none';

    var bars = document.querySelectorAll('.aiprogress span');
    var i;
    for (i = 0; i < bars.length; i++) {
        bars[i].classList.add('done');
    }

    var หมวดข้อความ = (เลือกหมวด === 'ไม่รู้' || เลือกหมวด === '') ? 'ที่คุณชอบบ่อย ๆ' : เลือกหมวด;
    var รสข้อความ = (เลือกรส === 'ไม่รู้' || เลือกรส === '') ? 'ตามที่คุณชอบ' : ('รส' + เลือกรส);
    document.getElementById('airesWhy').textContent =
        'ตาม Food DNA ของคุณ: ' + หมวดข้อความ + ' - ' + (เลือกงบ || 'งบตามปกติ') + ' - ' + รสข้อความ;

    var กล่องผล = document.getElementById('airesList');
    กล่องผล.innerHTML = '';

    for (i = 0; i < ผลลัพธ์.length; i++) {
        var ร้าน = ผลลัพธ์[i].ข้อมูล;
        var คะแนน = ผลลัพธ์[i].คะแนน;
        var เหตุผล = สร้างเหตุผลmatch(ร้าน, foodDNA);

        var กล่อง = document.createElement('div');
        กล่อง.className = 'airescard';
        กล่อง.innerHTML =
            '<img src="' + ร้าน.รูป + '" alt="' + ร้าน.เมนู + '"/>' +
            '<div>' +
            '<span class="aires-match">🎯 ' + คะแนน + '% Match</span>' +
            '<div class="aires-title">' + ร้าน.เมนู + '</div>' +
            '<div class="aires-shop">' + ร้าน.ร้าน + ' • ฿' + ร้าน.ราคาต่ำ + '–' + ร้าน.ราคาสูง + ' • ' + ร้าน.ระยะทาง + ' ม.</div>' +
            '<div class="aires-why">' + เหตุผล + '</div>' +
            '</div>';
        กล่องผล.appendChild(กล่อง);
    }

    document.getElementById('airesults').classList.add('show');
    document.getElementById('airesults').scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
    });
}

document.getElementById('airetryBtn').addEventListener('click', function() {
    เลือกหมวด = "";
    เลือกงบ = "";
    เลือกระยะ = "";
    เลือกรส = "";
    var i;
    for (i = 0; i < ตัวเลือกทั้งหมด.length; i++) {
        ตัวเลือกทั้งหมด[i].classList.remove('picked');
    }
    ขั้นตอนปัจจุบัน = 1;
    ไปขั้นตอน(1);
});


/* -----------------------------------------------------
   ฟอร์มติดต่อ + Newsletter (กลไกเดิม แค่เปลี่ยนข้อความ)
----------------------------------------------------- */
document.getElementById('ctcBtn').addEventListener('click', function() {
    var btn = this;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังส่ง...';
    btn.disabled = true;
    setTimeout(function() {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>ส่งข้อความ</span>';
        btn.disabled = false;
        var ok = document.getElementById('ctcOk');
        ok.style.display = 'block';
        ok.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }, 1500);
});

document.getElementById('nlBtn').addEventListener('click', function() {
    var email = document.getElementById('nlEmail').value;
    if (email && email.indexOf('@') !== -1) {
        var btn = this;
        btn.textContent = '✓ รับทราบแล้ว!';
        btn.style.background = '#4ade80';
        btn.style.color = '#222';
        document.getElementById('nlEmail').value = '';
        setTimeout(function() {
            btn.innerHTML = '<i class="fas fa-paper-plane me-1"></i><span>แจ้งเตือนฉัน</span>';
            btn.style.background = '';
            btn.style.color = '';
        }, 3000);
    }
});


/* -----------------------------------------------------
   นับถอยหลังโปรโมชั่นร้าน Sponsored (กลไกเดิม)
----------------------------------------------------- */
var cH = 8,
    cM = 45,
    cS = 30;
setInterval(function() {
    cS--;
    if (cS < 0) {
        cS = 59;
        cM--;
    }
    if (cM < 0) {
        cM = 59;
        cH--;
    }
    if (cH < 0) {
        cH = 8;
        cM = 45;
        cS = 30;
    }
    document.getElementById('cdH').textContent = String(cH).padStart(2, '0');
    document.getElementById('cdM').textContent = String(cM).padStart(2, '0');
    document.getElementById('cdS').textContent = String(cS).padStart(2, '0');
}, 1000);


/* นับตัวเลขสถิติตอนเลื่อนผ่าน hero */
var numAnimated = false;
window.addEventListener('scroll', function() {
    var hero = document.getElementById('hero');
    if (!numAnimated && hero && window.scrollY > hero.offsetHeight - 300) {
        numAnimated = true;
        document.querySelectorAll('.snum').forEach(function(el) {
            var txt = el.textContent;
            var num = parseInt(txt);
            var suf = txt.replace(/[0-9]/g, '');
            if (isNaN(num)) return;
            var start = 0;
            var step = Math.ceil(num / 55);
            var iv = setInterval(function() {
                start += step;
                if (start >= num) {
                    start = num;
                    clearInterval(iv);
                }
                el.textContent = start + suf;
            }, 1400 / 55);
        });
    }
});
