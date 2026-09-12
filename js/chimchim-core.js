// chimchim-core.js
// เลเยอร์ข้อมูล/เซสชันที่ต้องพร้อมใช้งาน "ก่อน" สคริปต์เฉพาะหน้าทุกไฟล์ (เพราะ Match % ต้องใช้)
// โหลดต่อจาก chimchim-data.js ทันที ในทุกหน้า ก่อน chimchim-nav.js และสคริปต์เฉพาะหน้า
// เก็บข้อมูลทั้งหมดใน localStorage ของเบราว์เซอร์ผู้ใช้เท่านั้น (prototype ฝั่ง front-end ล้วน ๆ)

/* =====================================================================
   HELPERS ทั่วไป
   ===================================================================== */
function escapeHtml(str) {
	var div = document.createElement("div");
	div.textContent = str == null ? "" : String(str);
	return div.innerHTML.replace(/"/g, "&quot;");
}

function catEmoji(cat) {
	var map = { "ข้าว": "🍚", "เส้น": "🍜", "ซุป": "🥣", "Fast Food": "🍔", "ญี่ปุ่น": "🍣", "ของหวาน": "🍰", "เผ็ด": "🌶️" };
	return map[cat] || "🍽️";
}

/* =====================================================================
   ระบบสมาชิก (Auth) — localStorage เท่านั้น เวอร์ชันทดลอง
   ===================================================================== */
var CHIMCHIM_USERS_KEY = "chimchim_users";
var CHIMCHIM_SESSION_KEY = "chimchim_session";
var CHIMCHIM_SHOPS_KEY = "chimchim_shops";
var CHIMCHIM_REVIEWS_KEY = "chimchim_reviews";
var CHIMCHIM_FOLLOWS_KEY = "chimchim_follows";
var CHIMCHIM_POSTS_KEY = "chimchim_posts";

function getUsers() {
	try {
		return JSON.parse(localStorage.getItem(CHIMCHIM_USERS_KEY)) || [];
	} catch (e) {
		return [];
	}
}
function saveUsers(list) {
	localStorage.setItem(CHIMCHIM_USERS_KEY, JSON.stringify(list));
}
function getSession() {
	try {
		return JSON.parse(localStorage.getItem(CHIMCHIM_SESSION_KEY));
	} catch (e) {
		return null;
	}
}
function setSession(user) {
	localStorage.setItem(CHIMCHIM_SESSION_KEY, JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }));
}
function clearSession() {
	localStorage.removeItem(CHIMCHIM_SESSION_KEY);
}
function getMe() {
	var session = getSession();
	if (!session) return null;
	var users = getUsers();
	var i;
	for (i = 0; i < users.length; i++) {
		if (users[i].id === session.id) return users[i];
	}
	return null;
}
function updateMe(patch) {
	var session = getSession();
	if (!session) return;
	var users = getUsers();
	var i;
	for (i = 0; i < users.length; i++) {
		if (users[i].id === session.id) {
			var key;
			for (key in patch) {
				if (Object.prototype.hasOwnProperty.call(patch, key)) {
					users[i][key] = patch[key];
				}
			}
			break;
		}
	}
	saveUsers(users);
}

/* --- ใช้ Food DNA ส่วนตัวของผู้ใช้ (ถ้าทำแบบสอบถามตอนสมัครไว้แล้ว) แทนค่าเริ่มต้น
   ถ้ายังไม่ได้ทำแบบทดสอบ/ยังไม่ได้ล็อกอิน ให้เดาความชอบจากพฤติกรรมจริงแทน (ร้านที่เคย
   กดถูกใจ/Follow ไว้ในเบราว์เซอร์นี้) เพื่อให้ Match % ตรงกับผู้ใช้จริง ไม่ใช่ค่ากลาง ๆ เดิมทุกคน --- */
function applyPersonalFoodDNA() {
	var me = getMe();
	if (me && me.foodDNA) {
		foodDNA.ชอบชาติอาหาร = me.foodDNA.ชอบชาติอาหาร;
		foodDNA.ชอบรส = me.foodDNA.ชอบรส;
		foodDNA.งบเฉลี่ยที่ใช้บ่อย = me.foodDNA.งบเฉลี่ยที่ใช้บ่อย;
		foodDNA.ระยะที่ยอมไป = me.foodDNA.ระยะที่ยอมไป;
		return;
	}
	var inferred = inferDnaFromBehavior();
	if (inferred) {
		if (inferred.ชอบชาติอาหาร.length) foodDNA.ชอบชาติอาหาร = inferred.ชอบชาติอาหาร;
		if (inferred.ชอบรส.length) foodDNA.ชอบรส = inferred.ชอบรส;
	}
}
function inferDnaFromBehavior() {
	var ids = getLikedShops().concat(getFollowedShops());
	if (!ids.length) return null;
	var cuisineCount = {};
	var flavorCount = {};
	ids.forEach(function(id) {
		var r = หาร้านจากId(id);
		if (!r) return;
		cuisineCount[r.ชาติอาหาร] = (cuisineCount[r.ชาติอาหาร] || 0) + 1;
		(r.รส || []).forEach(function(f) {
			flavorCount[f] = (flavorCount[f] || 0) + 1;
		});
	});
	var topCuisines = Object.keys(cuisineCount).sort(function(a, b) { return cuisineCount[b] - cuisineCount[a]; }).slice(0, 3);
	var topFlavors = Object.keys(flavorCount).sort(function(a, b) { return flavorCount[b] - flavorCount[a]; }).slice(0, 3);
	return { ชอบชาติอาหาร: topCuisines, ชอบรส: topFlavors };
}

/* =====================================================================
   ร้านค้าในชุมชน — ผสานเข้ากับ รายการร้าน ตั้งแต่ต้น เพื่อให้ทุกหน้า
   (Discovery Feed, AI Finder, หน้ารายละเอียดร้าน) มองเห็นร้านที่ผู้ใช้โพสต์ด้วย
   ===================================================================== */
function getShops() {
	try {
		return JSON.parse(localStorage.getItem(CHIMCHIM_SHOPS_KEY)) || [];
	} catch (e) {
		return [];
	}
}
function saveShops(list) {
	localStorage.setItem(CHIMCHIM_SHOPS_KEY, JSON.stringify(list));
}

function shopToร้าน(shop) {
	var ชาติอาหาร = "ไทย";
	if (shop.cat === "ญี่ปุ่น") ชาติอาหาร = "ญี่ปุ่น";
	else if (shop.cat === "ของหวาน") ชาติอาหาร = "ของหวาน";
	else if (shop.cat === "Fast Food") ชาติอาหาร = "ฝรั่ง";

	var รส = shop.cat === "เผ็ด" ? ["เผ็ด", "เค็ม"] : ["กลมกล่อม"];

	return {
		id: shop.numId,
		เมนู: shop.dish,
		ร้าน: shop.name,
		หมวด: shop.cat,
		ชาติอาหาร: ชาติอาหาร,
		รส: รส,
		ราคาต่ำ: shop.priceLow,
		ราคาสูง: shop.priceHigh,
		ระยะทาง: shop.distance,
		รูป: shop.img,
		บัคเก็ต: ["foryou", "new"],
		แท็ก: [shop.cat, "ชุมชนโพสต์"],
		มหาลัย: shop.uni || มหาวิทยาลัยทั้งหมด[0],
		เทรนด์: false,
		มื้อที่เหมาะ: ["เช้า", "เที่ยง", "บ่าย", "เย็น", "ดึก"],
		vendorName: shop.vendorName,
		เวลาเปิดกำหนดเอง: shop.hours || null,
		โปรโมชั่นกำหนดเอง: shop.promo || null,
		community: true
	};
}

// คืนค่ารายการร้านชุมชน (เรียงใหม่สุดก่อน) พร้อมผสานเข้า รายการร้าน ให้เรียบร้อยแล้ว
function mergeCommunityShopsIntoรายการร้าน() {
	var shops = getShops();
	var i;
	for (i = shops.length - 1; i >= 0; i--) {
		if (!shops[i].numId) {
			shops[i].numId = 9000000 + i;
		}
		รายการร้าน.push(shopToร้าน(shops[i]));
	}
	return shops;
}

/* =====================================================================
   ข้อมูลเสริมของร้าน (เวลาเปิด-ปิด + โปรโมชั่น) — เพื่อให้หน้าโปรไฟล์ร้านและ
   ฟีดอัปเดตใน Following ดูมีชีวิตชีวา ใช้สูตรคงที่จาก id ร้าน (ไม่ต้องเก็บ state)
   จะได้ผลลัพธ์เดิมทุกครั้งไม่ว่าจะรีเฟรชกี่รอบ ใช้ได้ทั้งร้านตัวอย่างและร้านที่ชุมชนโพสต์
   ===================================================================== */
var เวลาเปิดตัวอย่าง = ["10:00 – 20:00 น.", "08:00 – 18:00 น.", "11:00 – 22:00 น.", "09:00 – 19:00 น.", "17:00 – 01:00 น."];
var โปรโมชั่นตัวอย่าง = [
	{ icon: "🎉", text: "ลด 10% เมื่อสั่งผ่านแอปชิมชิม" },
	{ icon: "🍜", text: "ซื้อ 1 แถม 1 ทุกวันจันทร์" },
	{ icon: "🔥", text: "เมนูใหม่ประจำสัปดาห์นี้ ลองเลย!" },
	{ icon: "🎁", text: "สะสมแต้มครบ 10 ครั้ง รับฟรี 1 เมนู" },
	{ icon: "📢", text: "เปิดสาขาใหม่ใกล้มหาลัยของคุณแล้ว!" }
];
function getShopExtra(id) {
	var h = Math.abs((id * 2654435761) % 2147483647);
	return {
		hours: เวลาเปิดตัวอย่าง[h % เวลาเปิดตัวอย่าง.length],
		promo: โปรโมชั่นตัวอย่าง[Math.floor(h / 7) % โปรโมชั่นตัวอย่าง.length]
	};
}

/* =====================================================================
   รีวิวร้าน (เก็บแยกตาม id ร้าน)
   ===================================================================== */
function getReviews(shopId) {
	try {
		var all = JSON.parse(localStorage.getItem(CHIMCHIM_REVIEWS_KEY)) || {};
		return all[shopId] || [];
	} catch (e) {
		return [];
	}
}
function addReview(shopId, review) {
	var all;
	try {
		all = JSON.parse(localStorage.getItem(CHIMCHIM_REVIEWS_KEY)) || {};
	} catch (e) {
		all = {};
	}
	if (!all[shopId]) all[shopId] = [];
	all[shopId].unshift(review);
	localStorage.setItem(CHIMCHIM_REVIEWS_KEY, JSON.stringify(all));
}

/* =====================================================================
   Follow ร้าน (บันทึกไว้ในเบราว์เซอร์)
   ===================================================================== */
function getFollowedShops() {
	try {
		return JSON.parse(localStorage.getItem(CHIMCHIM_FOLLOWS_KEY)) || [];
	} catch (e) {
		return [];
	}
}
function toggleFollowShop(shopId) {
	var list = getFollowedShops();
	var idx = list.indexOf(shopId);
	if (idx === -1) {
		list.push(shopId);
	} else {
		list.splice(idx, 1);
	}
	localStorage.setItem(CHIMCHIM_FOLLOWS_KEY, JSON.stringify(list));
	return idx === -1;
}
function isShopFollowed(shopId) {
	return getFollowedShops().indexOf(shopId) !== -1;
}

/* =====================================================================
   Like ร้าน (กดถูกใจเร็ว ๆ เหมือนฟีดโซเชียล) — แยกจาก Follow
   Follow = ติดตามรับอัปเดตจากร้าน, Like = กดถูกใจโพสต์/เมนูเฉย ๆ ไม่ผูกกับการติดตาม
   ===================================================================== */
var CHIMCHIM_LIKES_KEY = "chimchim_likes";
function getLikedShops() {
	try {
		return JSON.parse(localStorage.getItem(CHIMCHIM_LIKES_KEY)) || [];
	} catch (e) {
		return [];
	}
}
function isShopLiked(shopId) {
	return getLikedShops().indexOf(shopId) !== -1;
}
function toggleLikeShop(shopId) {
	var list = getLikedShops();
	var idx = list.indexOf(shopId);
	if (idx === -1) list.push(shopId); else list.splice(idx, 1);
	localStorage.setItem(CHIMCHIM_LIKES_KEY, JSON.stringify(list));
	return idx === -1;
}
// ยอดไลก์เริ่มต้นของร้าน คำนวณแบบ deterministic จาก id (ทุกคนเห็นตัวเลขฐานเดียวกัน ไม่ต้องเก็บ state ส่วนกลาง)
function seedLikeCount(shopId) {
	var h = Math.abs((shopId * 40503) % 9973);
	return 20 + (h % 280);
}
function getLikeCount(shopId) {
	return seedLikeCount(shopId) + (isShopLiked(shopId) ? 1 : 0);
}
function formatLikeCount(n) {
	if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
	return String(n);
}
// ผูกปุ่มถูกใจ + ตัวเลขยอดไลก์ให้การ์ดร้าน (ใช้ได้ทุกหน้าที่มี .mhrt อยู่ในการ์ด)
function initLikeUI(card) {
	var id = parseInt(card.getAttribute("data-id"), 10);
	var heart = card.querySelector(".mhrt");
	if (!heart || isNaN(id) || heart.getAttribute("data-like-wired") === "1") return;
	heart.setAttribute("data-like-wired", "1");
	var countEl = heart.querySelector(".mhrtcount");
	if (!countEl) {
		countEl = document.createElement("span");
		countEl.className = "mhrtcount";
		heart.appendChild(countEl);
	}
	function refresh() {
		var liked = isShopLiked(id);
		var ico = heart.querySelector("i");
		ico.classList.toggle("far", !liked);
		ico.classList.toggle("fas", liked);
		heart.classList.toggle("liked", liked);
		countEl.textContent = formatLikeCount(getLikeCount(id));
	}
	heart.addEventListener("click", function(e) {
		e.stopPropagation();
		toggleLikeShop(id);
		refresh();
	});
	refresh();
}

/* --- Follow นักรีวิว/เพื่อนในชุมชน (แยกจาก Follow ร้าน) --- */
var CHIMCHIM_FOLLOWED_USERS_KEY = "chimchim_followed_users";
function getFollowedUsers() {
	try {
		return JSON.parse(localStorage.getItem(CHIMCHIM_FOLLOWED_USERS_KEY)) || [];
	} catch (e) {
		return [];
	}
}
function toggleFollowUser(userId) {
	var list = getFollowedUsers();
	var idx = list.indexOf(userId);
	if (idx === -1) list.push(userId); else list.splice(idx, 1);
	localStorage.setItem(CHIMCHIM_FOLLOWED_USERS_KEY, JSON.stringify(list));
	return idx === -1;
}
function isUserFollowed(userId) {
	return getFollowedUsers().indexOf(userId) !== -1;
}

/* =====================================================================
   จำร้านที่แนะนำไปแล้ว "วันนี้" — กันไม่ให้ขึ้นเมนูเดิมซ้ำในแถวแนะนำ/มื้อนี้
   พอข้ามวันใหม่ ตัวนับจะเริ่มใหม่เองอัตโนมัติ (key ผูกกับวันที่)
   ===================================================================== */
function วันนี้ตัวย่อ() {
	var d = new Date();
	return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}
function CHIMCHIM_SHOWN_KEY_TODAY() {
	return "chimchim_shown_" + วันนี้ตัวย่อ();
}
function getShownToday() {
	try {
		return JSON.parse(localStorage.getItem(CHIMCHIM_SHOWN_KEY_TODAY())) || [];
	} catch (e) {
		return [];
	}
}
function markShownToday(ids) {
	var list = getShownToday();
	ids.forEach(function(id) {
		if (list.indexOf(id) === -1) list.push(id);
	});
	localStorage.setItem(CHIMCHIM_SHOWN_KEY_TODAY(), JSON.stringify(list));
}
// เลือก n ร้านจาก pool โดยเลี่ยงร้านที่เคยโชว์ไปแล้ววันนี้ก่อน (ถ้าพอ) แล้วบันทึกว่าโชว์แล้ว
function เลือกไม่ซ้ำวันนี้(pool, n) {
	var shown = getShownToday();
	var ยังไม่เคย = pool.filter(function(r) { return shown.indexOf(r.id) === -1; });
	var แหล่งเลือก = ยังไม่เคย.length >= n ? ยังไม่เคย : pool;
	var ผล = แหล่งเลือก.slice(0, n);
	markShownToday(ผล.map(function(r) { return r.id; }));
	return ผล;
}

/* =====================================================================
   โพสต์ของสมาชิก (ภาพ + แคปชั่น) — โชว์ในหน้าโปรไฟล์ตัวเอง และหน้าโปรไฟล์สาธารณะ
   เวอร์ชันย่อของฟีเจอร์คอมมูนิตี้ (ยังไม่รองรับสตอรี่/รีล/วิดีโอในเวอร์ชันนี้)
   ===================================================================== */
function getAllPosts() {
	try {
		return JSON.parse(localStorage.getItem(CHIMCHIM_POSTS_KEY)) || [];
	} catch (e) {
		return [];
	}
}
function getPostsByUser(userId) {
	return getAllPosts().filter(function(p) { return p.userId === userId; });
}
function addPost(userId, img, caption) {
	var posts = getAllPosts();
	posts.unshift({ id: "post" + Date.now(), userId: userId, img: img, caption: caption, date: new Date().toISOString() });
	localStorage.setItem(CHIMCHIM_POSTS_KEY, JSON.stringify(posts));
}
function deletePost(postId) {
	var posts = getAllPosts().filter(function(p) { return p.id !== postId; });
	localStorage.setItem(CHIMCHIM_POSTS_KEY, JSON.stringify(posts));
}

/* --- รันทันทีตอนโหลดไฟล์: เตรียมข้อมูลให้พร้อมก่อนหน้าเพจจะคำนวณ Match % --- */
var __chimchimCommunityShops = mergeCommunityShopsIntoรายการร้าน();
applyPersonalFoodDNA();
