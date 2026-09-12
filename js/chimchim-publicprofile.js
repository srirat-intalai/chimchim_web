// chimchim-publicprofile.js
// หน้าโปรไฟล์สาธารณะ (public-profile.html) — อ่าน ?u= จาก URL
// รองรับทั้งนักรีวิวเด่นตัวอย่าง (id ขึ้นต้นด้วย seed-) และสมาชิกที่สมัครจริง

var ppParams = new URLSearchParams(window.location.search);
var ppUid = ppParams.get("u");
var ppIsSeed = ppUid && ppUid.indexOf("seed-") === 0;
var ppSession = getSession();

function ppRenderPosts(posts) {
	var grid = document.getElementById("ppPostGrid");
	var emptyMsg = document.getElementById("ppEmpty");
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
			'<div class="ppostcap">' + escapeHtml(p.caption || "") + "</div>";
		grid.appendChild(el);
	});
}

if (ppIsSeed) {
	var creator = หานักรีวิวจากId(ppUid);
	if (!creator) {
		document.getElementById("ppContent").innerHTML = '<p style="text-align:center;padding:60px 20px;color:#999;">ไม่พบโปรไฟล์นี้</p>';
	} else {
		document.title = creator.ชื่อ + " - ชิมชิม (CHIMCHIM)";
		document.getElementById("ppAvatar").style.background = creator.สี;
		document.getElementById("ppAvatar").textContent = creator.ชื่อ.charAt(0).toUpperCase();
		document.getElementById("ppName").textContent = creator.ชื่อ;
		document.getElementById("ppSub").textContent = creator.รีวิว + " รีวิว";
		document.getElementById("ppLevel").textContent = "🦖 Food Explorer Lv." + creator.ระดับ;
		document.getElementById("ppBio").textContent = creator.bio;

		var followBtn = document.getElementById("ppFollowBtn");
		function refreshFollow() {
			var followed = isUserFollowed(ppUid);
			followBtn.innerHTML = followed ? '<i class="fas fa-check"></i><span>Following</span>' : '<i class="fas fa-user-plus"></i><span>Follow</span>';
		}
		refreshFollow();
		followBtn.addEventListener("click", function() {
			toggleFollowUser(ppUid);
			refreshFollow();
		});

		ppRenderPosts(creator.โพสต์.map(function(p) { return { img: p.รูป, caption: p.แคปชั่น }; }));
	}
} else {
	var users = getUsers();
	var user = users.filter(function(u) { return u.id === ppUid; })[0];
	if (!user) {
		document.getElementById("ppContent").innerHTML = '<p style="text-align:center;padding:60px 20px;color:#999;">ไม่พบโปรไฟล์นี้</p>';
	} else {
		document.title = user.name + " - ชิมชิม (CHIMCHIM)";
		document.getElementById("ppAvatar").textContent = user.role === "vendor" ? "🍳" : user.name.charAt(0).toUpperCase();
		document.getElementById("ppName").textContent = user.name;
		document.getElementById("ppSub").textContent = user.role === "vendor" ? "บัญชีร้านค้า" : "ผู้ใช้ชิมชิม";
		document.getElementById("ppLevel").textContent = user.role === "vendor" ? "🍳 ร้านค้าพันธมิตร" : "🧑‍🎓 นักชิมชิมชิม";
		document.getElementById("ppBio").textContent = "สมาชิกชิมชิม แชร์เมนูและร้านโปรดผ่านโพสต์ด้านล่าง";

		var followBtn2 = document.getElementById("ppFollowBtn");
		if (ppSession && ppSession.id === user.id) {
			followBtn2.hidden = true;
		} else {
			(function() {
				function refreshFollow2() {
					var followed = isUserFollowed(user.id);
					followBtn2.innerHTML = followed ? '<i class="fas fa-check"></i><span>Following</span>' : '<i class="fas fa-user-plus"></i><span>Follow</span>';
				}
				refreshFollow2();
				followBtn2.addEventListener("click", function() {
					toggleFollowUser(user.id);
					refreshFollow2();
				});
			})();
		}

		ppRenderPosts(getPostsByUser(user.id));
	}
}
