/*------------------------------------------------------------------------------------  */
// new Lenis({ autoRaf: true, autoToggle: true, anchors: true, allowNestedScroll: true, naiveDimensions: true, stopInertiaOnNavigate: true });
// const locomotiveScroll = new LocomotiveScroll();
$(function () {
gsap.registerPlugin(ScrollTrigger)

// 1. Lenis 생성
const lenis = new Lenis({
  duration: 1.2,
  smooth: true
})

// 2. RAF 루프 연결
function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

// 3. Lenis → GSAP 동기화
lenis.on('scroll', ScrollTrigger.update)

// 4. GSAP → Lenis 프레임 동기화
gsap.ticker.add((time) => {
  lenis.raf(time * 1000)
})

// (선택) GSAP lag 제거
gsap.ticker.lagSmoothing(0);

})