// chimchim-home.js
// โค้ดเฉพาะหน้าแรกของแอป (home.html): แถบไอคอนหมวดหมู่, แท็บ Discovery Feed,
// การ์ดร้าน (ของทีมชิมชิม + ที่ชุมชนโพสต์), ค้นหาแบบพิมพ์กรองสด ๆ
// ทุกการ์ดกดแล้วพาไปหน้ารายละเอียดร้าน (restaurant.html) แทนที่ป็อปอัพเดิม

/* -----------------------------------------------------
   แถวเลื่อนแนวนอน "กำลังเป็นกระแส" + "เหมาะกับมื้อนี้"
   (กันไม่ให้ร้านเดิมโผล่ซ้ำในวันเดียวกัน ด้วย เลือกไม่ซ้ำวันนี้() จาก chimchim-core.js)
----------------------------------------------------- */
function buildMiniCard(ร้าน) {
    var คะแนน = คำนวณMatch(ร้าน, foodDNA);
    var card = document.createElement('div');
    card.className = 'mcard';
    card.setAttribute('data-id', ร้าน.id);
    card.innerHTML =
        '<div class="mimg">' +
            '<img src="' + ร้าน.รูป + '" alt="' + escapeHtml(ร้าน.เมนู) + '"/>' +
            '<div class="mmatch" data-match-score="' + คะแนน + '">' + matchBadgeText(คะแนน) + '</div>' +
            '<div class="mhrt"><i class="far fa-heart"></i></div>' +
        '</div>' +
        '<div class="mbody">' +
            '<div class="mcat">' + catEmoji(ร้าน.หมวด) + ' ' + escapeHtml(catLabel(ร้าน.หมวด)) + '</div>' +
            '<div class="mrestaurant">' + escapeHtml(ร้าน.ร้าน) + '</div>' +
            '<div class="mtit">' + escapeHtml(ร้าน.เมนู) + '</div>' +
            '<div class="mmeta"><span><i class="fas fa-location-dot"></i>' + distanceText(ร้าน.ระยะทาง) + '</span><span class="muni"><i class="fas fa-graduation-cap"></i>' + escapeHtml(ร้าน.มหาลัย) + '</span></div>' +
        '</div>';
    card.addEventListener('click', function() {
        window.location.href = 'restaurant.html?id=' + ร้าน.id;
    });
    initLikeUI(card);
    return card;
}

/* -----------------------------------------------------
   Match Hero — วงกลมเดียว แต่ภาพข้างในเลื่อนซ้ายขวาดูร้าน Match สูงสุดได้ทีละร้าน
   (Match% / ระยะทางจริง คำนวณจาก Food DNA ปัจจุบัน) ป้ายลอยอัปเดตตามภาพที่เลื่อนมาอยู่ตรงกลาง
   เรียก renderMatchHero() ซ้ำได้ทุกครั้งที่สลับภาษา เพื่อสร้างภาพชุดใหม่ให้ข้อความตรงโหมด
----------------------------------------------------- */
var mhState = { ranked: [], currentIndex: 0 };
function updateHeroBadges() {
    var item = mhState.ranked[mhState.currentIndex];
    if (!item) return;
    document.getElementById('mhMatchVal').textContent = matchHeadline(item.m);
    document.getElementById('mhDistVal').textContent = distanceText(item.r.ระยะทาง);
}
function renderMatchHero() {
    var wrap = document.getElementById('matchHero');
    var slidesEl = document.getElementById('mhSlides');
    if (!wrap || !slidesEl) return;

    mhState.ranked = รายการร้าน
        .map(function(r) { return { r: r, m: คำนวณMatch(r, foodDNA) }; })
        .sort(function(a, b) { return b.m - a.m; })
        .slice(0, 8);
    if (!mhState.ranked.length) return;
    mhState.currentIndex = 0;

    slidesEl.innerHTML = '';
    mhState.ranked.forEach(function(item) {
        var img = document.createElement('img');
        img.src = item.r.รูป;
        img.alt = item.r.เมนู;
        slidesEl.appendChild(img);
    });
    slidesEl.scrollLeft = 0;
    updateHeroBadges();

    if (!slidesEl.getAttribute('data-wired')) {
        slidesEl.setAttribute('data-wired', '1');
        var scrollTimer;
        slidesEl.addEventListener('scroll', function() {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(function() {
                var w = slidesEl.clientWidth || 1;
                var idx = Math.round(slidesEl.scrollLeft / w);
                if (idx < 0) idx = 0;
                if (idx >= mhState.ranked.length) idx = mhState.ranked.length - 1;
                mhState.currentIndex = idx;
                updateHeroBadges();
            }, 80);
        });
        document.getElementById('mhCircleWrap').addEventListener('click', function() {
            var item = mhState.ranked[mhState.currentIndex];
            if (item) window.location.href = 'restaurant.html?id=' + item.r.id;
        });

        /* --- เลื่อนอัตโนมัติทีละร้านทุก 5 วิ หยุดเองเมื่อผู้ใช้ปัดดู แล้วกลับมาเลื่อนอัตโนมัติอีกครั้ง --- */
        var mhAutoTimer = null;
        var mhAutoPaused = false;
        var mhResumeTimeout;
        function mhStepAuto() {
            if (mhAutoPaused || !mhState.ranked.length) return;
            var w = slidesEl.clientWidth || 1;
            var next = (mhState.currentIndex + 1) % mhState.ranked.length;
            slidesEl.scrollTo({ left: next * w, behavior: 'smooth' });
        }
        function mhStartAuto() {
            clearInterval(mhAutoTimer);
            mhAutoTimer = setInterval(mhStepAuto, 5000);
        }
        function mhPauseThenResume() {
            mhAutoPaused = true;
            clearTimeout(mhResumeTimeout);
            mhResumeTimeout = setTimeout(function() {
                mhAutoPaused = false;
            }, 6000);
        }
        ['pointerdown', 'touchstart', 'wheel'].forEach(function(evt) {
            slidesEl.addEventListener(evt, mhPauseThenResume, { passive: true });
        });
        mhStartAuto();
    }
    wrap.hidden = false;
}
renderMatchHero();

/* -----------------------------------------------------
   🎯 Recommended For You — เฉพาะร้าน Match 70% ขึ้นไป เรียงมากไปน้อย สูงสุด 6 ร้าน
----------------------------------------------------- */
(function renderRecommendedRow() {
    var row = document.getElementById('recommendedRow');
    if (!row) return;
    var แนะนำ = รายการร้าน
        .map(function(r) { return { r: r, m: คำนวณMatch(r, foodDNA) }; })
        .filter(function(x) { return x.m >= 70; })
        .sort(function(a, b) { return b.m - a.m; })
        .slice(0, 6);
    แนะนำ.forEach(function(x) {
        row.appendChild(buildMiniCard(x.r));
    });
    if (แนะนำ.length === 0) {
        row.innerHTML = '<p style="color:#bbb;font-size:.82rem;padding:6px 2px;">ยังไม่มีร้านที่ Match 70% ขึ้นไปตอนนี้ ลองทำแบบทดสอบ Food DNA เพื่อผลลัพธ์ที่แม่นขึ้น</p>';
    }
})();

/* -----------------------------------------------------
   ค้นหาแบบใช้งานได้จริง — ค้นหาข้าม 4 ประเภท: เมนูอาหาร / ร้านอาหาร / คน / สถานที่
   แสดงผลเป็น dropdown ใต้ช่องค้นหา กดแล้วพาไปหน้าที่เกี่ยวข้องได้ทันที
----------------------------------------------------- */
(function setupGlobalSearch() {
    var input = document.getElementById('homeSearchInput');
    var panel = document.getElementById('searchPanel');
    if (!input || !panel) return;

    function initials(name) {
        return (name || "?").trim().charAt(0).toUpperCase();
    }

    function buildGroup(labelKey, itemsHtml) {
        if (!itemsHtml) return "";
        return '<div class="spgroup"><div class="spgrouplbl">' + t(labelKey) + '</div>' + itemsHtml + '</div>';
    }

    function renderSearchResults(qRaw) {
        var q = qRaw.trim().toLowerCase();
        if (!q) {
            panel.hidden = true;
            panel.innerHTML = "";
            return;
        }

        var foodMatches = รายการร้าน.filter(function(r) {
            var blob = (r.เมนู + ' ' + r.หมวด + ' ' + catLabel(r.หมวด) + ' ' + (r.แท็ก || []).join(' ')).toLowerCase();
            return blob.indexOf(q) !== -1;
        }).slice(0, 4);
        var foodHtml = foodMatches.map(function(r) {
            return '<a class="spitem" href="restaurant.html?id=' + r.id + '"><img src="' + r.รูป + '" alt=""/><div><div class="sptit">' + escapeHtml(r.เมนู) + '</div><div class="spsub">' + escapeHtml(r.ร้าน) + '</div></div></a>';
        }).join("");

        var seenShops = {};
        var shopMatches = รายการร้าน.filter(function(r) {
            if (r.ร้าน.toLowerCase().indexOf(q) === -1) return false;
            if (seenShops[r.ร้าน]) return false;
            seenShops[r.ร้าน] = true;
            return true;
        }).slice(0, 4);
        var shopHtml = shopMatches.map(function(r) {
            return '<a class="spitem" href="restaurant.html?id=' + r.id + '"><img src="' + r.รูป + '" alt=""/><div><div class="sptit">' + escapeHtml(r.ร้าน) + '</div><div class="spsub">' + catLabel(r.หมวด) + ' • ฿' + r.ราคาต่ำ + '–' + r.ราคาสูง + '</div></div></a>';
        }).join("");

        var people = [];
        นักรีวิวเด่น.forEach(function(คน) {
            if (คน.ชื่อ.toLowerCase().indexOf(q) !== -1) {
                people.push({ id: คน.id, name: คน.ชื่อ, sub: "🦖 Food Explorer Lv." + คน.ระดับ, color: คน.สี });
            }
        });
        getUsers().forEach(function(u) {
            if (u.name && u.name.toLowerCase().indexOf(q) !== -1) {
                people.push({ id: u.id, name: u.name, sub: u.role === "vendor" ? "🏪 Vendor" : "🧑‍🎓 Member", color: "linear-gradient(135deg, var(--dark), #7d6fb0)" });
            }
        });
        var peopleHtml = people.slice(0, 4).map(function(p) {
            return '<a class="spitem" href="public-profile.html?u=' + encodeURIComponent(p.id) + '"><div class="spavatar" style="background:' + p.color + ';">' + initials(p.name) + '</div><div><div class="sptit">' + escapeHtml(p.name) + '</div><div class="spsub">' + p.sub + '</div></div></a>';
        }).join("");

        var locMatches = มหาวิทยาลัยทั้งหมด.filter(function(u) {
            return u.toLowerCase().indexOf(q) !== -1;
        }).slice(0, 3);
        var locHtml = locMatches.map(function(u) {
            return '<div class="spitem" data-goto-loc="' + escapeHtml(u) + '"><div class="spavatar" style="background:var(--green);"><i class="fas fa-location-dot"></i></div><div><div class="sptit">' + escapeHtml(u) + '</div><div class="spsub">' + t('search.locations') + '</div></div></div>';
        }).join("");

        var html =
            buildGroup('search.food', foodHtml) +
            buildGroup('search.restaurants', shopHtml) +
            buildGroup('search.people', peopleHtml) +
            buildGroup('search.locations', locHtml);

        if (!html) {
            html = '<p class="spempty">' + t('search.noResults') + '</p>';
        }
        panel.innerHTML = html;
        panel.hidden = false;

        panel.querySelectorAll('[data-goto-loc]').forEach(function(el) {
            el.addEventListener('click', function() {
                input.value = this.getAttribute('data-goto-loc');
                currentQuery = input.value.trim().toLowerCase();
                อัพเดตการ์ดที่เห็น();
                panel.hidden = true;
                document.getElementById('mgrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    input.addEventListener('input', function() {
        renderSearchResults(this.value);
    });
    input.addEventListener('focus', function() {
        if (this.value.trim()) renderSearchResults(this.value);
    });
    input.addEventListener('blur', function() {
        setTimeout(function() { panel.hidden = true; }, 150);
    });
})();

/* -----------------------------------------------------
   Horizontal Food Discovery Carousel — การ์ดใหญ่ เลื่อนอัตโนมัติเบา ๆ
   หยุดเองเมื่อผู้ใช้ปัด/แตะจอ แล้วกลับมาเลื่อนอัตโนมัติอีกครั้งหลังจากหยุดสักพัก
----------------------------------------------------- */
(function renderDiscoveryCarousel() {
    var track = document.getElementById('discoveryTrack');
    if (!track) return;

    var เรียงตามMatch = รายการร้าน.map(function(r) {
        return { r: r, m: คำนวณMatch(r, foodDNA) };
    }).sort(function(a, b) { return b.m - a.m; }).slice(0, 10);

    เรียงตามMatch.forEach(function(item) {
        var card = document.createElement('div');
        card.className = 'dcard';
        card.innerHTML =
            '<img src="' + item.r.รูป + '" alt="' + escapeHtml(item.r.เมนู) + '"/>' +
            '<div class="dcard-badge dcard-match" data-match-score="' + item.m + '">' + matchBadgeText(item.m) + '</div>' +
            '<div class="dcard-badge dcard-price">฿' + item.r.ราคาต่ำ + '–' + item.r.ราคาสูง + '</div>' +
            '<div class="dcard-cap"><div class="dtit">' + escapeHtml(item.r.เมนู) + '</div><div class="dsub">' + escapeHtml(item.r.ร้าน) + '</div></div>';
        card.addEventListener('click', function() {
            window.location.href = 'restaurant.html?id=' + item.r.id;
        });
        track.appendChild(card);
    });

    var timer = null;
    var paused = false;
    function เลื่อนหนึ่งช่วง() {
        if (paused || !track.firstElementChild) return;
        var cardWidth = track.firstElementChild.getBoundingClientRect().width + 14;
        if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 5) {
            track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            track.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
    }
    function เริ่มเลื่อนอัตโนมัติ() {
        clearInterval(timer);
        timer = setInterval(เลื่อนหนึ่งช่วง, 3200);
    }
    var resumeTimeout;
    function หยุดชั่วคราวแล้วเริ่มใหม่() {
        paused = true;
        clearInterval(timer);
        clearTimeout(resumeTimeout);
        resumeTimeout = setTimeout(function() {
            paused = false;
            เริ่มเลื่อนอัตโนมัติ();
        }, 3500);
    }
    ['pointerdown', 'touchstart', 'wheel'].forEach(function(evt) {
        track.addEventListener(evt, หยุดชั่วคราวแล้วเริ่มใหม่, { passive: true });
    });
    เริ่มเลื่อนอัตโนมัติ();
})();

(function renderTrendAndMealRows() {
    var trendRow = document.getElementById('trendRow');
    var mealRow = document.getElementById('mealRow');
    if (!trendRow || !mealRow) return;

    var เทรนด์พูล = รายการร้าน.filter(function(r) { return r.เทรนด์; });
    var เทรนด์เลือก = เลือกไม่ซ้ำวันนี้(เทรนด์พูล, Math.min(6, เทรนด์พูล.length));
    เทรนด์เลือก.forEach(function(r) {
        trendRow.appendChild(buildMiniCard(r));
    });

    var มื้อนี้ = ช่วงเวลาปัจจุบัน();
    document.getElementById('mealRowTitle').textContent = '🍽️ เหมาะกับ' + ชื่อมื้อไทย[มื้อนี้];
    var มื้อพูล = รายการร้าน.filter(function(r) {
        return r.มื้อที่เหมาะ && r.มื้อที่เหมาะ.indexOf(มื้อนี้) !== -1;
    });
    var มื้อเลือก = เลือกไม่ซ้ำวันนี้(มื้อพูล, Math.min(6, มื้อพูล.length));
    มื้อเลือก.forEach(function(r) {
        mealRow.appendChild(buildMiniCard(r));
    });
})();

/* -----------------------------------------------------
   ระบบกรอง Discovery Feed
   มี 3 มิติ: หมวดอาหาร (แถบไอคอน) / แท็บ (For You ฯลฯ) / คำค้นหา
----------------------------------------------------- */
var currentTab = "foryou";
var currentCat = "all";
var currentQuery = "";

function อัพเดตการ์ดที่เห็น() {
    var การ์ดทั้งหมด = document.querySelectorAll('.mwrap');
    var จำนวนที่เห็น = 0;
    var i;
    for (i = 0; i < การ์ดทั้งหมด.length; i++) {
        var การ์ด = การ์ดทั้งหมด[i];
        var หมวดการ์ด = การ์ด.getAttribute('data-c');
        var บัคเก็ตการ์ด = การ์ด.getAttribute('data-bucket');
        var mcard = การ์ด.querySelector('.mcard');
        var ร้านของการ์ดนี้ = หาร้านจากId(parseInt(mcard.getAttribute('data-id'), 10));
        var uniOfCard = ร้านของการ์ดนี้ ? ร้านของการ์ดนี้.มหาลัย : '';
        var textBlob = (mcard.getAttribute('data-title') + ' ' + mcard.getAttribute('data-restaurant') + ' ' + mcard.getAttribute('data-tags') + ' ' + uniOfCard).toLowerCase();

        var ผ่านแท็บ = currentTab === 'foryou' || บัคเก็ตการ์ด.indexOf(currentTab) !== -1;
        var ผ่านหมวด = currentCat === 'all' || หมวดการ์ด === currentCat;
        var ผ่านคำค้น = currentQuery === '' || textBlob.indexOf(currentQuery) !== -1;

        if (ผ่านแท็บ && ผ่านหมวด && ผ่านคำค้น) {
            การ์ด.classList.remove('gone');
            จำนวนที่เห็น++;
        } else {
            การ์ด.classList.add('gone');
        }
    }
    var emptyMsg = document.getElementById('feedEmpty');
    if (emptyMsg) emptyMsg.hidden = จำนวนที่เห็น > 0;
}

// กดแท็บด้านบน feed
var แท็บทั้งหมด = document.querySelectorAll('.filtbtn');
for (var tabIdx = 0; tabIdx < แท็บทั้งหมด.length; tabIdx++) {
    แท็บทั้งหมด[tabIdx].addEventListener('click', function() {
        currentTab = this.getAttribute('data-f');
        var j;
        for (j = 0; j < แท็บทั้งหมด.length; j++) {
            แท็บทั้งหมด[j].classList.remove('active');
        }
        this.classList.add('active');
        อัพเดตการ์ดที่เห็น();
    });
}

// กดหมวดในแถบไอคอน
function กรองตามหมวด(cat) {
    currentCat = cat;
    var chips = document.querySelectorAll('.catchip');
    var i;
    for (i = 0; i < chips.length; i++) {
        chips[i].classList.toggle('active', chips[i].getAttribute('data-filter') === cat);
    }
    อัพเดตการ์ดที่เห็น();
}
document.querySelectorAll('.catchip').forEach(function(chip) {
    chip.addEventListener('click', function() {
        กรองตามหมวด(this.getAttribute('data-filter'));
    });
});

// ค้นหาแบบพิมพ์กรองสด ๆ
var searchInput = document.getElementById('homeSearchInput');
if (searchInput) {
    searchInput.addEventListener('input', function() {
        currentQuery = this.value.trim().toLowerCase();
        อัพเดตการ์ดที่เห็น();
    });
}

/* -----------------------------------------------------
   Match % บนการ์ดเมนู (ต้องเรียกจาก chimchim-data.js เท่านั้น)
----------------------------------------------------- */
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
                ป้าย.setAttribute('data-match-score', คะแนน);
                ป้าย.textContent = matchBadgeText(คะแนน);
            }
            // เติมป้ายมหาวิทยาลัยใกล้ร้าน (นอกเหนือจากบอกแค่ระยะทาง) ถ้ายังไม่มี
            var เมตา = การ์ด.querySelector('.mmeta');
            if (เมตา && ร้าน.มหาลัย && !เมตา.querySelector('.muni')) {
                var uniSpan = document.createElement('span');
                uniSpan.className = 'muni';
                uniSpan.innerHTML = '<i class="fas fa-graduation-cap"></i>' + ร้าน.มหาลัย;
                เมตา.appendChild(uniSpan);
            }
            // เขียนระยะทางให้ตรงหน่วยของภาษาปัจจุบัน (350 ม. เทียบกับ 350 m)
            var ไอคอนระยะ = เมตา ? เมตา.querySelector('.fa-location-dot') : null;
            if (ไอคอนระยะ && ไอคอนระยะ.parentElement) {
                ไอคอนระยะ.parentElement.innerHTML = '<i class="fas fa-location-dot"></i>' + distanceText(ร้าน.ระยะทาง);
            }
            if (ร้าน.เทรนด์ && !การ์ด.querySelector('.mbdg.mbdg-trend')) {
                var trendBdg = document.createElement('div');
                trendBdg.className = 'mbdg mbdg-trend';
                trendBdg.style.background = 'var(--primary)';
                trendBdg.textContent = '🔥 เทรนด์';
                var imgBox = การ์ด.querySelector('.mimg');
                if (imgBox) imgBox.insertBefore(trendBdg, imgBox.firstChild.nextSibling);
            }
        }
    }
}

/* -----------------------------------------------------
   การ์ดร้าน -> กดแล้วพาไปหน้ารายละเอียดร้าน (restaurant.html)
   หัวใจ (Save) เป็นแค่การสลับสถานะเฉย ๆ ไม่ต้อง login
----------------------------------------------------- */
function wireMcard(card) {
    card.addEventListener('click', function() {
        window.location.href = 'restaurant.html?id=' + this.getAttribute('data-id');
    });
    initLikeUI(card);
}
document.querySelectorAll('.mcard').forEach(wireMcard);

/* -----------------------------------------------------
   วาดการ์ดร้านที่ชุมชนโพสต์ (มาจาก localStorage ผ่าน chimchim-core.js)
   เพิ่มไว้บนสุดของ feed ใหม่สุดก่อน
----------------------------------------------------- */
function renderCommunityShop(shop) {
    var wrap = document.createElement('div');
    wrap.className = 'col-sm-6 col-lg-4 mwrap';
    wrap.setAttribute('data-c', shop.cat);
    wrap.setAttribute('data-bucket', 'foryou,new');

    wrap.innerHTML =
        '<div class="mcard" data-id="' + shop.numId + '" data-img="' + shop.img + '" data-title="' + escapeHtml(shop.dish) + '" data-restaurant="' + escapeHtml(shop.name) + '" data-price="฿' + shop.priceLow + '–' + shop.priceHigh + '" data-distance="' + shop.distance + ' ม." data-desc="' + escapeHtml(shop.desc) + '" data-tags="' + escapeHtml(shop.cat) + ',ชุมชนโพสต์">' +
            '<div class="mimg">' +
                '<img src="' + shop.img + '" alt="' + escapeHtml(shop.dish) + '"/>' +
                '<div class="mbdg" style="background:var(--dark);">🏪 ชุมชนโพสต์</div>' +
                '<div class="mmatch"></div>' +
                '<div class="mhrt"><i class="far fa-heart"></i></div>' +
            '</div>' +
            '<div class="mbody">' +
                '<div class="mcat">' + catEmoji(shop.cat) + ' ' + escapeHtml(shop.cat) + '</div>' +
                '<div class="mrestaurant">' + escapeHtml(shop.name) + '</div>' +
                '<div class="mtit">' + escapeHtml(shop.dish) + '</div>' +
                '<div class="mdesc">' + escapeHtml(shop.desc) + '</div>' +
                '<div class="mmeta"><span><i class="fas fa-tag"></i>฿' + shop.priceLow + '–' + shop.priceHigh + '</span><span><i class="fas fa-location-dot"></i>' + distanceText(shop.distance) + '</span></div>' +
                '<div class="mtagswrap"><span class="mtagit">' + escapeHtml(shop.cat) + '</span><span class="mtagit">🏪 โพสต์โดย ' + escapeHtml(shop.vendorName) + '</span></div>' +
            '</div>' +
        '</div>';

    var grid = document.getElementById('mgrid');
    grid.insertBefore(wrap, grid.firstChild);
    wireMcard(wrap.querySelector('.mcard'));
}

(function renderAllCommunityShops() {
    var shops = window.__chimchimCommunityShops || [];
    var i;
    for (i = shops.length - 1; i >= 0; i--) {
        renderCommunityShop(shops[i]);
    }
})();

/* -----------------------------------------------------
   วาดร้านตัวอย่างที่เพิ่มใหม่ (id > 13 เช่น id 14-16) ลงในกริด "ร้านทั้งหมด" ด้วย
   เพราะร้าน 12 การ์ดแรกฝังเป็น HTML ตายตัวไว้ในหน้า ส่วนร้านใหม่กว่านั้นต้องวาดด้วย JS
----------------------------------------------------- */
function renderExtraSeedShop(ร้าน) {
    var wrap = document.createElement('div');
    wrap.className = 'col-sm-6 col-lg-4 mwrap';
    wrap.setAttribute('data-c', ร้าน.หมวด);
    wrap.setAttribute('data-bucket', ร้าน.บัคเก็ต.join(','));
    wrap.innerHTML =
        '<div class="mcard" data-id="' + ร้าน.id + '" data-img="' + ร้าน.รูป + '" data-title="' + escapeHtml(ร้าน.เมนู) + '" data-restaurant="' + escapeHtml(ร้าน.ร้าน) + '" data-price="฿' + ร้าน.ราคาต่ำ + '–' + ร้าน.ราคาสูง + '" data-distance="' + ร้าน.ระยะทาง + ' ม." data-tags="' + escapeHtml(ร้าน.แท็ก.join(',')) + '">' +
            '<div class="mimg">' +
                '<img src="' + ร้าน.รูป + '" alt="' + escapeHtml(ร้าน.เมนู) + '"/>' +
                '<div class="mmatch"></div>' +
                '<div class="mhrt"><i class="far fa-heart"></i></div>' +
            '</div>' +
            '<div class="mbody">' +
                '<div class="mcat">' + catEmoji(ร้าน.หมวด) + ' ' + escapeHtml(catLabel(ร้าน.หมวด)) + '</div>' +
                '<div class="mrestaurant">' + escapeHtml(ร้าน.ร้าน) + '</div>' +
                '<div class="mtit">' + escapeHtml(ร้าน.เมนู) + '</div>' +
                '<div class="mmeta"><span><i class="fas fa-tag"></i>฿' + ร้าน.ราคาต่ำ + '–' + ร้าน.ราคาสูง + '</span><span><i class="fas fa-location-dot"></i>' + distanceText(ร้าน.ระยะทาง) + '</span></div>' +
                '<div class="mtagswrap">' + ร้าน.แท็ก.map(function(tag) { return '<span class="mtagit">' + escapeHtml(tag) + '</span>'; }).join('') + '</div>' +
            '</div>' +
        '</div>';
    document.getElementById('mgrid').appendChild(wrap);
    wireMcard(wrap.querySelector('.mcard'));
}
(function renderAllExtraSeedShops() {
    รายการร้าน.filter(function(r) { return r.id > 13 && r.id < 9000000; }).forEach(renderExtraSeedShop);
})();

แสดงMatchในการ์ดทั้งหมด();

/* -----------------------------------------------------
   จัดการตอนถูกพามาที่หน้าแรกจากหน้าอื่น (วงล้อ/หลังโพสต์ร้าน)
----------------------------------------------------- */
window.addEventListener('load', function() {
    var params = new URLSearchParams(window.location.search);
    var cat = params.get('cat');
    if (cat) {
        กรองตามหมวด(cat);
        document.getElementById('mgrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (params.get('posted') === '1' && typeof showToast === 'function') {
        showToast('ร้านของคุณโพสต์เข้าชุมชนเรียบร้อยแล้ว! 🎉');
    }
});
