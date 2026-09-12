// chimchim-following.js
// รายชื่อนักรีวิวเด่น (กดรูปเพื่อดูโปรไฟล์สาธารณะ + โพสต์ของเขา) และ
// รายการร้านที่ผู้ใช้กด Follow ไว้จากหน้ารายละเอียดร้าน

/* --- สลับแท็บ People / Restaurants --- */
(function setupFollowTabs() {
	var tabs = document.querySelectorAll('#followTabs .rmodebtn');
	var panePeople = document.getElementById('followPanePeople');
	var paneRestaurants = document.getElementById('followPaneRestaurants');
	if (!tabs.length) return;
	tabs.forEach(function(btn) {
		btn.addEventListener('click', function() {
			tabs.forEach(function(b) { b.classList.remove('active'); });
			this.classList.add('active');
			var tab = this.getAttribute('data-followtab');
			panePeople.hidden = tab !== 'people';
			paneRestaurants.hidden = tab !== 'restaurants';
		});
	});
})();

/* --- ฟีดอัปเดตจากร้านที่ Follow ไว้ (โปรโมชั่น/เมนูใหม่/ประกาศ) --- */
(function renderRestaurantUpdates() {
	var feed = document.getElementById('restaurantUpdatesFeed');
	var emptyMsg = document.getElementById('updatesEmpty');
	if (!feed) return;

	var ids = getFollowedShops();
	if (ids.length === 0) {
		emptyMsg.hidden = false;
		return;
	}
	emptyMsg.hidden = true;

	var html = "";
	ids.forEach(function(id) {
		var ร้าน = หาร้านจากId(id);
		if (!ร้าน) return;
		var เสริม = getShopExtra(id);
		html +=
			'<a href="restaurant.html?id=' + id + '" class="updatecard">' +
				'<img src="' + ร้าน.รูป + '" alt=""/>' +
				'<div class="updatebody">' +
					'<div class="updateshop">' + escapeHtml(ร้าน.ร้าน) + '</div>' +
					'<div class="updatetxt"><span class="updateicon">' + เสริม.promo.icon + '</span>' + escapeHtml(เสริม.promo.text) + '</div>' +
				'</div>' +
			'</a>';
	});
	feed.innerHTML = html;
})();

/* --- แสดงการ์ดนักรีวิวเด่น จากข้อมูลใน chimchim-data.js --- */
(function renderCreators() {
    var grid = document.getElementById('creatorGrid');
    if (!grid) return;

    นักรีวิวเด่น.forEach(function(คน) {
        var col = document.createElement('div');
        col.className = 'col-6 col-lg-3';
        col.innerHTML =
            '<div class="chcard">' +
                '<a href="public-profile.html?u=' + encodeURIComponent(คน.id) + '" class="chimg" style="background:' + คน.สี + ';display:flex;align-items:center;justify-content:center;">' +
                    '<span style="font-size:3rem;font-weight:800;color:#fff;">' + escapeHtml(คน.ชื่อ.charAt(0).toUpperCase()) + '</span>' +
                '</a>' +
                '<div class="chbody">' +
                    '<a href="public-profile.html?u=' + encodeURIComponent(คน.id) + '" class="chnm" style="text-decoration:none;color:inherit;display:block;">' + escapeHtml(คน.ชื่อ) + '</a>' +
                    '<div class="chlv">🦖 Food Explorer Lv.' + คน.ระดับ + '</div>' +
                    '<div class="chexp">' + คน.รีวิว + ' รีวิว</div>' +
                    '<button class="followbtn" data-uid="' + คน.id + '">+ Follow</button>' +
                '</div>' +
            '</div>';
        grid.appendChild(col);
    });

    document.querySelectorAll('.followbtn').forEach(function(btn) {
        var uid = btn.getAttribute('data-uid');
        if (isUserFollowed(uid)) {
            btn.classList.add('following');
            btn.textContent = '✓ Following';
        }
        btn.addEventListener('click', function() {
            var nowFollowing = toggleFollowUser(uid);
            this.classList.toggle('following', nowFollowing);
            this.textContent = nowFollowing ? '✓ Following' : '+ Follow';
        });
    });
})();

/* --- แสดงร้านที่ผู้ใช้กด Follow ไว้จากหน้ารายละเอียดร้าน --- */
(function renderFollowedShops() {
    var ids = getFollowedShops();
    var grid = document.getElementById('followedGrid');
    var emptyMsg = document.getElementById('followedEmpty');
    if (!grid) return;

    if (ids.length === 0) {
        emptyMsg.hidden = false;
        return;
    }
    emptyMsg.hidden = true;

    var i;
    for (i = 0; i < ids.length; i++) {
        var ร้าน = หาร้านจากId(ids[i]);
        if (!ร้าน) continue;
        var คะแนน = คำนวณMatch(ร้าน, foodDNA);

        var col = document.createElement('div');
        col.className = 'col-sm-6 col-lg-4';
        col.innerHTML =
            '<div class="mcard" data-id="' + ร้าน.id + '">' +
                '<div class="mimg">' +
                    '<img src="' + ร้าน.รูป + '" alt="' + escapeHtml(ร้าน.เมนู) + '"/>' +
                    '<div class="mmatch" data-match-score="' + คะแนน + '">' + matchBadgeText(คะแนน) + '</div>' +
                    '<div class="mhrt"><i class="far fa-heart"></i></div>' +
                '</div>' +
                '<div class="mbody">' +
                    '<div class="mcat">' + catEmoji(ร้าน.หมวด) + ' ' + escapeHtml(catLabel(ร้าน.หมวด)) + '</div>' +
                    '<div class="mrestaurant">' + escapeHtml(ร้าน.ร้าน) + '</div>' +
                    '<div class="mtit">' + escapeHtml(ร้าน.เมนู) + '</div>' +
                    '<div class="mmeta"><span><i class="fas fa-tag"></i>฿' + ร้าน.ราคาต่ำ + '–' + ร้าน.ราคาสูง + '</span><span><i class="fas fa-location-dot"></i>' + distanceText(ร้าน.ระยะทาง) + '</span></div>' +
                '</div>' +
            '</div>';
        var cardEl = col.querySelector('.mcard');
        cardEl.addEventListener('click', function() {
            window.location.href = 'restaurant.html?id=' + this.getAttribute('data-id');
        });
        initLikeUI(cardEl);
        grid.appendChild(col);
    }
})();
