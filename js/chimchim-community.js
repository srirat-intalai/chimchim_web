// chimchim-community.js
// UI: ป็อปอัพเข้าสู่ระบบ/สมัครสมาชิก, ปุ่มบัญชีบน apptop, โพสต์ร้านเข้าชุมชน, toast แจ้งเตือน
// ต้องโหลดหลัง js/chimchim-core.js (ใช้ getSession/getUsers/getShops ฯลฯ จากที่นั่น)
// โหลดในทุกหน้า เพราะแถบบนสุด (apptop) กับป็อปอัพเข้าสู่ระบบใช้ร่วมกันทุกหน้า

/* =====================================================================
   TOAST แจ้งเตือนแบบลอยด้านล่าง (แทนมาสคอตลอยมุมจอเดิม)
   ===================================================================== */
function showToast(msg) {
	var toast = document.getElementById("appToast");
	if (!toast) return;
	toast.textContent = msg;
	toast.classList.add("show");
	clearTimeout(toast.__hideTimer);
	toast.__hideTimer = setTimeout(function() {
		toast.classList.remove("show");
	}, 2800);
}

/* =====================================================================
   แถบบนสุด (apptop) — ปุ่มเข้าสู่ระบบ / ไอคอนโปรไฟล์
   ===================================================================== */
function refreshAuthUI() {
	var session = getSession();
	var loginBtn = document.getElementById("loginBtn");
	var avatarLink = document.getElementById("userAvatarLink");
	var avatarIco = document.getElementById("userAvatarIco");
	if (session) {
		if (loginBtn) loginBtn.hidden = true;
		if (avatarLink) {
			avatarLink.hidden = false;
			if (avatarIco) avatarIco.textContent = session.role === "vendor" ? "🍳" : session.name.charAt(0).toUpperCase();
		}
	} else {
		if (loginBtn) loginBtn.hidden = false;
		if (avatarLink) avatarLink.hidden = true;
	}
}

/* --- เปิด/ปิด popup เข้าสู่ระบบ (เฉพาะหน้าที่มี #authPop อยู่จริง) --- */
var authPop = document.getElementById("authPop");
function openAuthPop(tab) {
	if (!authPop) return;
	switchAuthTab(tab || "login");
	document.getElementById("loginErr").classList.remove("show");
	document.getElementById("registerErr").classList.remove("show");
	authPop.classList.add("open");
	document.body.style.overflow = "hidden";
}
function closeAuthPop() {
	if (!authPop) return;
	authPop.classList.remove("open");
	document.body.style.overflow = "";
}
function switchAuthTab(tab) {
	var isLogin = tab === "login";
	document.getElementById("apTabLogin").classList.toggle("active", isLogin);
	document.getElementById("apTabRegister").classList.toggle("active", !isLogin);
	document.getElementById("loginForm").style.display = isLogin ? "block" : "none";
	document.getElementById("registerForm").style.display = isLogin ? "none" : "block";
}
var loginBtnEl = document.getElementById("loginBtn");
if (loginBtnEl) {
	loginBtnEl.addEventListener("click", function() {
		openAuthPop("login");
	});
}

if (authPop) {
	document.getElementById("apClose").addEventListener("click", closeAuthPop);
	authPop.addEventListener("click", function(e) {
		if (e.target === authPop) closeAuthPop();
	});
	document.getElementById("apTabLogin").addEventListener("click", function() {
		switchAuthTab("login");
	});
	document.getElementById("apTabRegister").addEventListener("click", function() {
		switchAuthTab("register");
	});
	document.querySelectorAll("[data-switch]").forEach(function(a) {
		a.addEventListener("click", function(e) {
			e.preventDefault();
			switchAuthTab(this.getAttribute("data-switch"));
		});
	});

	/* --- เลือกบทบาทตอนสมัคร --- */
	var selectedRegisterRole = "user";
	document.querySelectorAll(".aprole").forEach(function(el) {
		el.addEventListener("click", function() {
			document.querySelectorAll(".aprole").forEach(function(x) {
				x.classList.remove("active");
			});
			this.classList.add("active");
			selectedRegisterRole = this.getAttribute("data-role");
			document.getElementById("registerNameLbl").textContent = selectedRegisterRole === "vendor" ? "ร้าน / เจ้าของร้าน" : "ของคุณ";
		});
	});

	/* --- สมัครสมาชิก --- */
	document.getElementById("registerForm").addEventListener("submit", function(e) {
		e.preventDefault();
		var errBox = document.getElementById("registerErr");
		errBox.classList.remove("show");

		var name = document.getElementById("registerName").value.trim();
		var email = document.getElementById("registerEmail").value.trim().toLowerCase();
		var password = document.getElementById("registerPassword").value;

		if (!name || !email || password.length < 4) {
			errBox.textContent = "กรอกข้อมูลให้ครบ และรหัสผ่านอย่างน้อย 4 ตัวอักษร";
			errBox.classList.add("show");
			return;
		}

		var users = getUsers();
		var exists = users.some(function(u) {
			return u.email === email;
		});
		if (exists) {
			errBox.textContent = "อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทนนะ";
			errBox.classList.add("show");
			return;
		}

		var newUser = { id: "u" + Date.now(), name: name, email: email, password: password, role: selectedRegisterRole };
		users.push(newUser);
		saveUsers(users);
		setSession(newUser);
		closeAuthPop();
		refreshAuthUI();
		this.reset();
		document.querySelectorAll(".aprole").forEach(function(x) {
			x.classList.remove("active");
		});
		document.querySelector('.aprole[data-role="user"]').classList.add("active");
		selectedRegisterRole = "user";

		// ผู้ใช้ทั่วไปที่เพิ่งสมัคร -> พาไปทำแบบสอบถาม Food DNA ต่อ (ยกเว้นบัญชีร้านค้า)
		if (newUser.role === "vendor") {
			window.location.href = "profile.html";
		} else {
			window.location.href = "profile-setup.html";
		}
	});

	/* --- เข้าสู่ระบบ --- */
	document.getElementById("loginForm").addEventListener("submit", function(e) {
		e.preventDefault();
		var errBox = document.getElementById("loginErr");
		errBox.classList.remove("show");

		var email = document.getElementById("loginEmail").value.trim().toLowerCase();
		var password = document.getElementById("loginPassword").value;

		var users = getUsers();
		var found = users.filter(function(u) {
			return u.email === email && u.password === password;
		})[0];

		if (!found) {
			errBox.textContent = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
			errBox.classList.add("show");
			return;
		}

		setSession(found);
		closeAuthPop();
		refreshAuthUI();
		this.reset();
		showToast("ยินดีต้อนรับกลับมา " + found.name + "! 🦖");
		// รีเฟรชหน้าปัจจุบันเพื่อให้ Food DNA ส่วนตัว + สถานะล็อกอินอัปเดตทุกจุด
		setTimeout(function() {
			window.location.reload();
		}, 600);
	});
}

document.addEventListener("keydown", function(e) {
	if (e.key === "Escape") {
		closeAuthPop();
		if (typeof closeShopPop === "function") closeShopPop();
	}
});

/* =====================================================================
   โพสต์ร้านเข้าชุมชน (เฉพาะหน้า profile.html ที่มีฟอร์มนี้อยู่จริง)
   ===================================================================== */
var shopPop = document.getElementById("shopPop");
if (shopPop) {
	var openShopPop = function() {
		shopPop.classList.add("open");
		document.body.style.overflow = "hidden";
	};
	var closeShopPop = function() {
		shopPop.classList.remove("open");
		document.body.style.overflow = "";
	};
	document.getElementById("spClose").addEventListener("click", closeShopPop);
	shopPop.addEventListener("click", function(e) {
		if (e.target === shopPop) closeShopPop();
	});

	/* --- เติมตัวเลือกรูปเมนูในฟอร์มโพสต์ร้าน จากคลังรูปเดียวกับวงล้อ --- */
	(function populateShopImgSelect() {
		var sel = document.getElementById("shopImg");
		var i, j;
		for (i = 0; i < วงล้อหมวดอาหาร.length; i++) {
			var cat = วงล้อหมวดอาหาร[i];
			var og = document.createElement("optgroup");
			og.label = cat.emoji + " " + cat.label;
			for (j = 0; j < cat.pool.length; j++) {
				var opt = document.createElement("option");
				opt.value = cat.pool[j].img;
				opt.textContent = cat.pool[j].name;
				og.appendChild(opt);
			}
			sel.appendChild(og);
		}
	})();

	document.getElementById("postShopBtn").addEventListener("click", function() {
		resetShopFormToCreateMode();
		openShopPop();
	});

	/* --- รีเซ็ตฟอร์มกลับเป็นโหมด "โพสต์ร้านใหม่" (ล้าง id ที่กำลังแก้ไขทิ้ง) --- */
	function resetShopFormToCreateMode() {
		document.getElementById("shopForm").reset();
		document.getElementById("shopEditId").value = "";
		document.getElementById("shopPopTitle").innerHTML = '<i class="fas fa-store me-2"></i><span data-i18n="shop.postMyShop">' + t("shop.postMyShop") + "</span>";
		document.getElementById("shopSubmitBtn").innerHTML = '<i class="fas fa-paper-plane"></i><span data-i18n="shop.submit">' + t("shop.submit") + "</span>";
	}

	/* --- เปิดฟอร์มพร้อมข้อมูลเดิม เพื่อแก้ไขร้านที่โพสต์ไปแล้ว (เรียกจากหน้าโปรไฟล์) --- */
	window.openShopPopForEdit = function(shop) {
		document.getElementById("shopEditId").value = shop.id;
		document.getElementById("shopName").value = shop.name;
		document.getElementById("shopCat").value = shop.cat;
		document.getElementById("shopImg").value = shop.img;
		document.getElementById("shopDish").value = shop.dish;
		document.getElementById("shopPriceLow").value = shop.priceLow;
		document.getElementById("shopPriceHigh").value = shop.priceHigh;
		document.getElementById("shopDistance").value = shop.distance;
		document.getElementById("shopUni").value = shop.uni;
		document.getElementById("shopDesc").value = shop.desc;
		document.getElementById("shopHours").value = shop.hours || "";
		document.getElementById("shopPromo").value = shop.promo || "";
		document.getElementById("shopPopTitle").innerHTML = '<i class="fas fa-store me-2"></i><span>' + t("shop.editMyShop") + "</span>";
		document.getElementById("shopSubmitBtn").innerHTML = '<i class="fas fa-check"></i><span>' + t("shop.saveChanges") + "</span>";
		openShopPop();
	};

	document.getElementById("shopForm").addEventListener("submit", function(e) {
		e.preventDefault();
		var session = getSession();
		if (!session || session.role !== "vendor") return;

		var errBox = document.getElementById("shopErr");
		errBox.classList.remove("show");

		var editId = document.getElementById("shopEditId").value;
		var name = document.getElementById("shopName").value.trim();
		var cat = document.getElementById("shopCat").value;
		var img = document.getElementById("shopImg").value;
		var dish = document.getElementById("shopDish").value.trim();
		var priceLow = parseInt(document.getElementById("shopPriceLow").value, 10);
		var priceHigh = parseInt(document.getElementById("shopPriceHigh").value, 10);
		var distance = parseInt(document.getElementById("shopDistance").value, 10);
		var uni = document.getElementById("shopUni").value;
		var desc = document.getElementById("shopDesc").value.trim();
		var hours = document.getElementById("shopHours").value.trim();
		var promo = document.getElementById("shopPromo").value.trim();

		if (!name || !dish || !desc || isNaN(priceLow) || isNaN(priceHigh) || isNaN(distance)) {
			errBox.textContent = "กรอกข้อมูลให้ครบทุกช่องนะ";
			errBox.classList.add("show");
			return;
		}
		if (priceHigh < priceLow) {
			errBox.textContent = "ราคาสูงต้องมากกว่าหรือเท่ากับราคาต่ำ";
			errBox.classList.add("show");
			return;
		}

		var shops = getShops();

		if (editId) {
			/* --- โหมดแก้ไข: อัปเดตร้านเดิมในอาร์เรย์ตาม id --- */
			var i;
			for (i = 0; i < shops.length; i++) {
				if (shops[i].id === editId) {
					shops[i].name = name;
					shops[i].cat = cat;
					shops[i].img = img;
					shops[i].dish = dish;
					shops[i].priceLow = priceLow;
					shops[i].priceHigh = priceHigh;
					shops[i].distance = distance;
					shops[i].uni = uni;
					shops[i].desc = desc;
					shops[i].hours = hours;
					shops[i].promo = promo;
					break;
				}
			}
			saveShops(shops);
			closeShopPop();
			showToast("บันทึกการแก้ไขร้าน “" + name + "” แล้ว! ✅");
		} else {
			/* --- โหมดโพสต์ใหม่ --- */
			var shop = {
				id: "shop" + Date.now(),
				numId: 9000000 + (Date.now() % 1000000),
				vendorId: session.id,
				vendorName: session.name,
				name: name,
				cat: cat,
				img: img,
				dish: dish,
				priceLow: priceLow,
				priceHigh: priceHigh,
				distance: distance,
				uni: uni,
				desc: desc,
				hours: hours,
				promo: promo
			};
			shops.unshift(shop);
			saveShops(shops);
			closeShopPop();
			showToast("โพสต์ร้าน “" + name + "” เข้าชุมชนเรียบร้อยแล้ว! 🎉");
		}

		resetShopFormToCreateMode();
		if (typeof renderMyShops === "function") renderMyShops();
	});
}

/* =====================================================================
   Post Viewer Modal — กดดูโพสต์แบบเต็มจอเหมือนอินสตาแกรม
   ใช้ร่วมกันได้ทุกหน้า (โปรไฟล์ตัวเอง + โปรไฟล์คนอื่น) โดยสร้าง DOM ของโมดัลขึ้นเองที่นี่
   เรียกใช้ผ่าน window.openPostView({ img, caption, posterName, posterColor })
   ===================================================================== */
(function setupPostViewerModal() {
	var modal = document.createElement("div");
	modal.id = "postViewModal";
	modal.innerHTML =
		'<div class="pvbox">' +
			'<button class="pvclose" id="pvClose"><i class="fas fa-times"></i></button>' +
			'<img id="pvImg" src="" alt=""/>' +
			'<div class="pvinfo">' +
				'<div class="pvhead">' +
					'<div class="pvavatar" id="pvAvatar"></div>' +
					'<div class="pvname" id="pvName"></div>' +
				"</div>" +
				'<div class="pvcap" id="pvCap"></div>' +
			"</div>" +
		"</div>";
	document.body.appendChild(modal);

	function closePostView() {
		modal.classList.remove("open");
		document.body.style.overflow = "";
	}
	modal.addEventListener("click", function(e) {
		if (e.target === modal) closePostView();
	});
	document.getElementById("pvClose").addEventListener("click", closePostView);
	document.addEventListener("keydown", function(e) {
		if (e.key === "Escape") closePostView();
	});

	window.openPostView = function(post) {
		document.getElementById("pvImg").src = post.img;
		document.getElementById("pvImg").alt = post.caption || "";
		document.getElementById("pvCap").textContent = post.caption || "";
		var avatarEl = document.getElementById("pvAvatar");
		avatarEl.style.background = post.posterColor || "linear-gradient(135deg, var(--dark), #7d6fb0)";
		avatarEl.textContent = (post.posterName || "?").trim().charAt(0).toUpperCase();
		document.getElementById("pvName").textContent = post.posterName || "";
		modal.classList.add("open");
		document.body.style.overflow = "hidden";
	};
})();

/* =====================================================================
   เริ่มต้น UI ตอนโหลดหน้า
   ===================================================================== */
refreshAuthUI();
