/* ================================
	 * Tab
	 * requestAnimationFrame: 브라우저의 repaint 타이밍에 맞춰 코드를 실행하는 예약 함수
	-- e.target/e.relatedTarget 차이
	| 이벤트      | target | relatedTarget |
	| -------- | ------ | ------------- |
	| focus    | 들어온 애  | 이전 포커스        |
	| focusin  | 들어온 애  | 이전 포커스        |
	| blur     | 떠나는 애  | 다음 포커스        |
	| focusout | 떠나는 애  | 다음 포커스        |

	 * ================================ */
const tab = (function ($) {
	function activateTab($tab) {
		const $tablist = $tab.closest('[role="tablist"]');
		const panelId = $tab.attr("aria-controls");

		$tablist.find('[role="tab"]').each(function () {
			const $t = $(this);
			$("#" + $t.attr("aria-controls"))
				.attr("hidden", true)
				.removeClass("show");
			$t.attr({
				"aria-selected": "false",
				"aria-label": "",
			}).removeClass("active");
		});

		$tab
			.attr({
				"aria-selected": "true",
				"aria-label": "선택됨",
			})
			.addClass("active");

		$("#" + panelId).removeAttr("hidden");
		forceReflow($("#" + panelId));
		$("#" + panelId).addClass("show");
	}

	function bindEvents() {
		$(document).on("click keydown", '[role="tab"]', function (e) {
			if (e.type === "keydown" && !["Enter", " "].includes(e.key)) return;
			e.preventDefault();
			activateTab($(this));
		});
	}
	function init() {
		const $selectedTab = $("[role='tab'][aria-selected='true']").first();
		if ($selectedTab.length) {
			activateTab($selectedTab);
		}
		bindEvents();
	}
	return {
		init,
	};
})(jQuery);

/* ================================
 * Accordion
 * ================================ */
const accordion = (function ($) {
	function setAccordion($btn, expand) {
		const panelId = $btn.attr("aria-controls");
		const $panel = $("#" + panelId);

		$btn
			.attr({
				"aria-expanded": String(expand),
				"aria-label": expand ? "펼침" : "접힘",
			})
			.toggleClass("active", expand);

		// jquery 슬라이드효과
		if (expand) {
			$panel.stop(true, true).slideDown(200, function(){
				$panel.addClass("show")
			});
		} else {
			$panel.stop(true, true).slideUp(200, function(){
				$panel.removeClass("show")
			});
		}
	}

	function toggleAccordion($btn) {
		const expanded = $btn.attr("aria-expanded") === "true";
		const $accordion = $btn.closest(".ui-accordion");


		if(!$accordion.hasClass("multi")){
			$accordion
				.find("[aria-expanded='true']")
				.not($btn)
				.each(function () {
					setAccordion($(this), false);
				});
		}

		// 현재 버튼 토글
		setAccordion($btn, !expanded);
	}

	function bindEvents() {
		$(document).on("click keydown", ".ui-accordion button", function (e) {
			if (e.type === "keydown" && !["Enter", " "].includes(e.key)) return;
			e.preventDefault();
			toggleAccordion($(this));
		});
	}

	function init() {
		$(".ui-accordion").each(function () {
			const $acc = $(this);
			const $expanded = $acc.find("[aria-expanded='true']").first();

			$acc.find("[aria-expanded]").each(function () {
				setAccordion($(this), false);
			});
			if ($expanded.length) {
				setAccordion($expanded, true);
			}
		});
		bindEvents();
	}
	return {
		init,
	};
})(jQuery);

/* ================================
 * 드롭다운
 * ================================ */
const dropdown = (function ($) {
	function setDropdown($btn, expand) {
		const menuId = $btn.attr("aria-controls");

		$btn.attr({
			"aria-expanded": String(expand),
			"aria-label": expand ? "펼침" : "접힘",
		});

		$("#" + menuId).attr("hidden", !expand);
		forceReflow($("#" + menuId));
		$("#" + menuId).toggleClass("show", expand);
	}

	function toggleDropdown($btn) {
		const expanded = $btn.attr("aria-expanded") === "true";
		const $dropdown = $btn.closest(".ui-dropdown");

		if ($dropdown.hasClass("multi")) {
			// 다중오픈의 경우
			$(".ui-dropdown")
				.not(".multi")
				.find("[aria-expanded='true']")
				.each(function () {
					setDropdown($(this), false);
				});
		} else {
			closeAllDropdown();
		}

		setDropdown($btn, !expanded);
	}
	function closeAllDropdown() {
		$(".ui-dropdown")
			.find("[aria-expanded='true']")
			.each(function () {
				setDropdown($(this), false);
			});
	}

	function bindEvents() {
		$(document).on("click", ".dropdown-btn", function (e) {
			e.stopPropagation();
			toggleDropdown($(this));
		});
		// 영역 외 클릭시 닫기
		$(document).on("click", function (e) {
			if (!$(e.target).closest(".dropdown-item").length) {
				closeAllDropdown();
			}
		});
		// 포커스 나갈때 닫기
		$(".ui-dropdown")
			.not(".multi")
			.find(".dropdown-item")
			.on("focusout", (e) => {
				if (!$(e.relatedTarget).closest(".dropdown-list").length) {
					closeAllDropdown();
				}
			});
	}

	function init() {
		$(".ui-dropdown").each(function () {
			const $wrap = $(this);
			const $expanded = $wrap.find("[aria-expanded='true']").first();

			$wrap.find("[aria-expanded]").each(function () {
				setDropdown($(this), false);
			});

			if ($expanded.length) {
				setDropdown($expanded, true);
			}
		});
		bindEvents();
	}

	return {
		init,
	};
})(jQuery);

/* ============================================================================
 * Popup
 * ============================================================================ */
const layerPop = (function ($) {
	let focusStack = [];
	let zIndex = 1000;

	function openlayer(el) {
		const $dialog = typeof el === "string" ? $(`#${el}`) : el;
		if (!$dialog || !$dialog.length) return; // 요소 없으면 종료
		focusStack.push(document.activeElement);
		zIndex += 2;
		$dialog.removeAttr("hidden");
		forceReflow($dialog);
		$dialog.css("z-index", zIndex).removeClass("is-expanded").addClass("show");
		$dialog.one("transitionend", () => {
			const $firstFocusable = getFocusable($dialog).first();
			if ($firstFocusable.length) {
				$firstFocusable.focus();
			} else {
				$dialog.attr("tabindex", "-1").focus();
			}
		});
		if (!$(".layer-dimmed").length) {
			$("body").append('<div class="layer-dimmed"></div>');
			updateDimHeight();
		}
		$(".layer-dimmed")
			.css("z-index", zIndex - 1)
			.addClass("show");

		bodyScroll.lock();

		const scrollPoint = 40;

		$dialog
			.filter(".bottomsheet.show")
			.find(".popup-body")
			.off("scroll.sheet")
			.on("scroll.sheet", function () {
				const $sheet = $(this).closest(".layer-popup");
				const st = this.scrollTop;

				$sheet.find(".popup-header").toggleClass("shrink", st > scrollPoint);
				$sheet.hasClass("scroll") && $sheet.addClass("is-expanded");
			});
	}

	function closelayer(el) {
		zIndex -= 2;
		const $dialog = typeof el === "string" ? $(`#${el}`) : el;
		if (!$dialog || !$dialog.length) return; // 요소 없으면 종료
		$dialog.removeClass("show");
		$dialog.one("transitionend", () => {
			$dialog.css("z-index", ""); // z-index는 transition 중에 절대 건드리지 않는게 안정적
			$dialog.attr("hidden", true);
		});

		const $dim = $(".layer-dimmed");
		if ($(".layer-popup.show").length === 0) {
			$dim.removeClass("show");
			$dim.one("transitionend", () => {
				$dim.remove();
			});
		} else {
			$dim.css("z-index", zIndex - 1);
		}

		bodyScroll.unLock();

		const prevFocus = focusStack.pop();
		if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
	}

	function closeAllLayers() {
		const $openDialogs = $(".layer-popup.show");

		if (!$openDialogs.length) return;

		// 위에 쌓인 것부터 닫는 게 안전 (z-index 순서 고려)
		$($openDialogs.get().reverse()).each(function () {
			closelayer($(this));
		});

		const $dim = $(".layer-dimmed");
		if ($dim.length) {
			$dim.removeClass("show");
			$dim.remove();
		}

		bodyScroll.unLock();
		focusStack = [];
	}

	function bindEvents() {
		$(document)
			.on("click", ".openLayer", function () {
				const target = $(this).data("pop");
				openlayer(target);
			})
			.on("click", ".closeLayer", function () {
				const target = $(this).closest(".layer-popup");
				closelayer(target);
			})
			.on("keydown", ".layer-popup", trapFocus);
	}

	function init() {
		bindEvents();
	}

	return {
		init,
		openlayer,
		closelayer,
		closeAllLayers,
		focusStack,
	};
})(jQuery);

/* ================================
 * GNB
 * ================================ */
// function loadPartial(selector, url) {
//     return new Promise(resolve => {
//         $(selector).load(url, resolve);
//     });
// }

// $(async function () {
// 	await $("#header").load("/pages/partial/_header.html");
// 	gnbInit();
// });
// $(document).ready(async function () {
// 		위가 이것의 축약임
// })

function headerInit() {
	let $mMenu;

	// ---------------- PC ----------------
	if (!$(".header-bg").length) {
		$(".header").after('<div class="header-bg"></div>');
	}

	const $header = $(".header");
	const $headerBG = $(".header-bg");
	const $gnb = $(".gnb");
	const $subMenu = $gnb.find(".sub-menu");
	const h = $header.outerHeight();

	$gnb.on("mouseenter focusin", function () {
		let maxHeight = 0;
		$subMenu.each(function () {
			maxHeight = Math.max(maxHeight, $(this).outerHeight());
		});

		$header.addClass("menu-open");
		$header.css("height", "0");
		$headerBG.css("height", maxHeight + h);
	});

	$gnb.add($headerBG).on("mouseleave focusout", function (e) {
		const $to = $(e.relatedTarget);
		if (!$to.closest(".gnb").length && !$to.closest(".header-bg").length) {
			$header.removeClass("menu-open");
			$header.css("height", h);
			$headerBG.css("height", "0");
		}
	});

	// ---------------- MOBILE ----------------
	$mMenu = $(".gnb-mo");
	const $mMenuBtn = $(".openMenu");
	const $mMenuClose = $mMenu.find(".closeMenu");

	$mMenu.find(".gnb-mo-body").append($gnb.children().clone());

	$mMenuBtn.on("click", function () {
		$mMenu.removeAttr("hidden");
		bodyScroll.lock();
		forceReflow($mMenu);
		$mMenu.addClass("show");
		$mMenu.on("keydown", trapFocus); // 여기서 바로 걸기
	});

	$mMenuClose.on("click", function () {
		$mMenu.removeClass("show");
		bodyScroll.unLock();
		$mMenu.off("keydown", trapFocus);

		$mMenu.one("transitionend", () => {
			$mMenu.attr("hidden", true);
		});

		$mMenuBtn.focus();
	});

	const $mMenuItem = $mMenu.find(".gnb-mo-body>li>a");

	$mMenuItem.on("click", function () {
		const $sub = $(this).next(".sub-menu");
		if (!$sub.length) return;

		const height = $sub[0].scrollHeight + 20;

		$(this).parents("li").siblings().find(".sub-menu").css("height", 0).removeClass("show");

		if ($sub.hasClass("show")) {
			$sub.css("height", 0).removeClass("show");
		} else {
			$sub.css("height", height).addClass("show");
		}
	});

	// ---------------- RESIZE ----------------
	$(window).on("resize", function () {
		$header.removeAttr("style");
		if (window.innerWidth > 768) {
			const $gnbMo = $(".gnb-mo.show");
			if ($gnbMo.length) {
				$gnbMo.removeClass("show");
				bodyScroll.unLock();
			}
		} else {
			$(".layer-popup.sitemap:visible").each(function () {
				layerPop.closelayer(this.id);
			});
		}
	});
}
/* ============================================================================
 * 초기화 함수
 * ============================================================================ */
$(document).ready(function () {
	layerPop.init();
	tab.init();
	accordion.init();
	dropdown.init();
	const test = test1(); // 함수 실행 → 실제 객체 반환
	test.func(); // 호출 (하지만 즉시실행함수는 객체를 바로 반환하기 때문에 바로 쓸수 있음)
});

//  => this 참조 문제 가능성
// $(document).ready(tab.init);
// document.addEventListener("DOMContentLoaded", layerPop.init);

/* ============================================================================
 * 공통함수
 * ============================================================================ */
function getFocusable($el) {
	return $el.find('a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])');
}

function trapFocus(e) {
	if (e.key !== "Tab") return;

	const $el = $(this);
	const $items = getFocusable($el);
	const first = $items.first()[0];
	const last = $items.last()[0];

	if (e.shiftKey && document.activeElement === first) {
		e.preventDefault();
		last.focus();
	} else if (!e.shiftKey && document.activeElement === last) {
		e.preventDefault();
		first.focus();
	}
}

function forceReflow(target) {
	const el = target?.jquery ? target[0] : target;
	if (!el) return;
	return el.offsetHeight; //여기서 레이아웃 확정(강제로 계산)
}

const bodyScroll = (() => {
	let scrollLockCount = 0;
	return {
		lock() {
			scrollLockCount++;
			$("body").addClass("is-modal-open");
			console.log("lock" + scrollLockCount);
		},
		unLock() {
			scrollLockCount = Math.max(0, scrollLockCount - 1); //닫힌 layer 만큼 count 감소, 최소 0으로 유지

			if (scrollLockCount === 0) {
				$("body").removeClass("is-modal-open");
			}
			console.log("unlock" + scrollLockCount);
		},
	};
})();

const test1 = () => {
	function func() {
		$("body").addClass("is-test1");
		$("html").addClass(isSafari() ? "safari" : "");
	}
	return {
		func,
	};
};

const test2 = () => {};

function isSafari() {
	const ua = navigator.userAgent;
	const isSafari = ua.includes("Safari") && !ua.includes("Chrome");
	const isIOS = /iPhone|iPad|iPod/.test(ua);

	return isSafari || isIOS;
}

function updateDimHeight() {
	var height = Math.max($("body")[0].scrollHeight, $("html")[0].scrollHeight);
	$(".layer-dimmed").height(height);
}

// function closeSitemapIfMobile() {
// 	if (window.innerWidth >= 768) return;

// 	$(".layer-popup.sitemap:visible").each(function () {
// 		layerPop.closelayer(this.id);
// 	});

// 	bodyScroll.unLock();
// }

/*
**
1. 존재여부 체크
- jquery: firstFocusable.length
- vanilla: firstFocusable 자체
2. IIFE 변수 스코프 보호
- 괄호안의 변수는 그 안에서만 참조 가능 (밖에서는 불가/같은 파일안이라도..)
3. 로드 시점
HTML 파싱 시작
↓
DOM 생성 완료 → DOMContentLoaded → $(document).ready()
↓
이미지, CSS, iframe 등 로딩 완료 → window load → $(window).on("load")
* $(document).on("load")는 없음
4. defer 스크립트
- DOMContentLoaded 전 실행
5. layerPop() 호출해야 return { init, ... }이 만들어짐=>그래야 layerPop.init 이렇게 쓸수 있음
- IIFE 모드에서 즉시 실행이 되어서 되는거고 뒤에 () 안붙여서 그냥 함수로 남아있으므로
function(){layerPop.init();} 이렇게 써야 함
**
6. IIFE: (function($){})(jQuery)=>라이브러리 충돌 방지, $ 다른데서도 사용가능, 안전성 확보, 격리
$(function(){})=>$(document).ready(function (){}) 의 축약버전
7. transition 도중에 stacking context(z-index가 서로 비교되는 범위(묶음))가 바뀌면서 깜빡임, 클릭 막힘, transition 끊김 같은 문제가 생길 수 있음
*/
