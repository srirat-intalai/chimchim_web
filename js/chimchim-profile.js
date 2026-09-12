// chimchim-profile.js
// หน้าโปรไฟล์ (profile.html) — โชว์ข้อมูลบัญชี, Food DNA, ร้านที่ Follow, ร้านของฉัน (บัญชีร้านค้า)

var session = getSession();

document.getElementById("profSignupBtn").addEventListener("click", function() {
	openAuthPop("register");
});

var logoutBtnEl = document.getElementById("logoutBtn");
if (logoutBtnEl) {
	logoutBtnEl.addEventListener("click", function() {
		clearSession();
		showToast("ออกจากระบบแล้ว แล้วเจอกันใหม่นะ 👋");
		setTimeout(function() {
			window.location.reload();
		}, 400);
	});
}

if (!session) {
	document.getElementById("profGuestBox").hidden = false;
} else {
	document.getElementById("profContent").hidden = false;

	var me = getMe() || session;
	document.getElementById("profAvatar").textContent = session.role === "vendor" ? "🍳" : session.name.charAt(0).toUpperCase();
	document.getElementById("profName").textContent = session.name;
	document.getElementById("profEmail").textContent = session.email;
	document.getElementById("profRole").textContent = session.role === "vendor" ? "🍳 บัญชีร้านค้า" : "🧑‍🎓 ผู้ใช้ทั่วไป";

	/* --- Food DNA --- */
	if (session.role !== "vendor") {
		if (me.foodDNA) {
			document.getElementById("profDnaCard").hidden = false;
			var dna = me.foodDNA;
			var maxBudget = 300;
			var maxDist = 3000;
			var rows = [];
			if (dna.ชอบหมวด && dna.ชอบหมวด.length) {
				rows.push({ label: "หมวดที่ชอบ", value: dna.ชอบหมวด.join(", "), pct: 100 });
			}
			rows.push({ label: "ชอบชาติอาหาร", value: dna.ชอบชาติอาหาร.join(", "), pct: 100 });
			rows.push({ label: "ชอบรส", value: dna.ชอบรส.join(", "), pct: 100 });
			rows.push({ label: "งบเฉลี่ยที่ใช้บ่อย", value: "฿" + dna.งบเฉลี่ยที่ใช้บ่อย, pct: Math.min(100, Math.round((dna.งบเฉลี่ยที่ใช้บ่อย / maxBudget) * 100)) });
			rows.push({ label: "ระยะที่ยอมไป", value: dna.ระยะที่ยอมไป + " ม.", pct: Math.min(100, Math.round((dna.ระยะที่ยอมไป / maxDist) * 100)) });
			var html = "";
			rows.forEach(function(r) {
				html +=
					'<div class="obdnarow">' +
						'<div class="obdnalbl"><span>' + r.label + '</span><span>' + escapeHtml(r.value) + '</span></div>' +
						'<div class="obdnabar"><span style="width:' + r.pct + '%;"></span></div>' +
					"</div>";
			});
			document.getElementById("profDnaBody").innerHTML = html;
		} else {
			document.getElementById("profNoDnaCard").hidden = false;
		}
	}

	/* --- ร้านที่ Follow --- */
	var followCount = getFollowedShops().length;
	document.getElementById("profFollowCount").textContent =
		followCount > 0 ? ("Follow ไว้ทั้งหมด " + followCount + " ร้าน") : "ยังไม่ได้ Follow ร้านไหนเลย";

	/* --- ร้านของฉัน (เฉพาะบัญชีร้านค้า) --- */
	if (session.role === "vendor") {
		document.getElementById("profShopsCard").hidden = false;
		renderMyShops();
	}

	/* --- โพสต์ของฉัน (ทุกบัญชี) --- */
	document.getElementById("profPostsCard").hidden = false;
	initMyPosts();
}

function renderMyShops() {
	var listBox = document.getElementById("profShopsList");
	if (!listBox) return;
	var myShops = getShops().filter(function(s) {
		return s.vendorId === session.id;
	});
	if (myShops.length === 0) {
		listBox.innerHTML = '<p style="font-size:.82rem;color:#999;">ยังไม่มีร้านที่โพสต์ กด "โพสต์ร้านใหม่" ด้านล่างได้เลย</p>';
		return;
	}
	listBox.innerHTML = "";
	myShops.forEach(function(shop) {
		var row = document.createElement("div");
		row.className = "profshoprow";
		row.innerHTML =
			'<img src="' + shop.img + '" alt="' + escapeHtml(shop.dish) + '"/>' +
			'<div style="flex:1;min-width:0;">' +
				'<div class="profshopnm">' + escapeHtml(shop.name) + "</div>" +
				'<div class="profshopmeta">' + escapeHtml(shop.dish) + " · ฿" + shop.priceLow + "–" + shop.priceHigh + "</div>" +
			"</div>" +
			'<button type="button" class="profshopeditbtn" title="' + t("profile.editShop") + '"><i class="fas fa-pen"></i></button>';
		row.querySelector(".profshopeditbtn").addEventListener("click", function() {
			if (typeof openShopPopForEdit === "function") openShopPopForEdit(shop);
		});
		listBox.appendChild(row);
	});
}

/* --- โพสต์ของฉัน: ฟอร์มเพิ่มโพสต์ + แสดงกริดโพสต์ ---
   (เวอร์ชันย่อของฟีเจอร์คอมมูนิตี้ - ภาพ + แคปชั่นเท่านั้น ยังไม่รองรับสตอรี่/รีล/วิดีโอ) */
function initMyPosts() {
	var toggle = document.getElementById("addPostToggle");
	var form = document.getElementById("postForm");
	var imgSelect = document.getElementById("postImg");

	// เติมตัวเลือกรูปจากคลังรูปเดียวกับวงล้อสุ่มเมนู
	วงล้อหมวดอาหาร.forEach(function(cat) {
		var og = document.createElement("optgroup");
		og.label = cat.emoji + " " + cat.label;
		cat.pool.forEach(function(item) {
			var opt = document.createElement("option");
			opt.value = item.img;
			opt.textContent = item.name;
			og.appendChild(opt);
		});
		imgSelect.appendChild(og);
	});

	toggle.addEventListener("click", function() {
		form.style.display = form.style.display === "none" ? "block" : "none";
	});

	form.addEventListener("submit", function(e) {
		e.preventDefault();
		var errBox = document.getElementById("postErr");
		errBox.classList.remove("show");
		var img = imgSelect.value;
		var caption = document.getElementById("postCaption").value.trim();
		if (!img || !caption) {
			errBox.textContent = "เลือกรูปและใส่แคปชั่นก่อนนะ";
			errBox.classList.add("show");
			return;
		}
		addPost(session.id, img, caption);
		this.reset();
		form.style.display = "none";
		showToast("โพสต์เรียบร้อยแล้ว! 🎉");
		renderMyPosts();
	});

	renderMyPosts();
}

function renderMyPosts() {
	var grid = document.getElementById("myPostGrid");
	var emptyMsg = document.getElementById("myPostEmpty");
	grid.innerHTML = "";
	var posts = getPostsByUser(session.id);
	if (posts.length === 0) {
		emptyMsg.hidden = false;
		return;
	}
	emptyMsg.hidden = true;
	posts.forEach(function(p) {
		var el = document.createElement("div");
		el.className = "ppost";
		el.innerHTML =
			'<img src="' + p.img + '" alt=""/>' +
			'<div class="ppostcap">' + escapeHtml(p.caption) + '</div>' +
			'<button class="ppostdel" data-id="' + p.id + '" title="ลบโพสต์"><i class="fas fa-times"></i></button>';
		el.addEventListener("click", function() {
			openPostView({ img: p.img, caption: p.caption, posterName: session.name, posterColor: "linear-gradient(135deg, var(--primary), var(--secondary))" });
		});
		el.querySelector(".ppostdel").addEventListener("click", function(e) {
			e.stopPropagation();
			deletePost(this.getAttribute("data-id"));
			renderMyPosts();
		});
		grid.appendChild(el);
	});
}
