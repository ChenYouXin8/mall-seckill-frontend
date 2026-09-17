<template>
  <div class="product-visual" :class="{ 'is-compact': compact }" :aria-label="`商品 ${productId ?? ''} 视觉占位`">
    <div class="visual-grid"></div>
    <div class="visual-glow"></div>
    <div class="visual-orbit orbit-a"></div>
    <div class="visual-orbit orbit-b"></div>
    <div class="visual-card">
      <span class="visual-card-top">SECKILL</span>
      <span class="visual-card-id mono">#{{ productId ?? '—' }}</span>
    </div>
    <div class="visual-copy">
      <span class="visual-kicker">LIMITED DROP</span>
      <span class="visual-label">PRODUCT PREVIEW</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  productId: { type: [Number, String], default: null },
  compact: { type: Boolean, default: false }
})
</script>

<style scoped>
.product-visual {
  position: relative;
  min-height: 260px;
  overflow: hidden;
  isolation: isolate;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 72% 26%, rgba(255, 255, 255, .13), transparent 28%),
    radial-gradient(circle at 24% 84%, rgba(255, 255, 255, .06), transparent 34%),
    #0b0d11;
  border: 1px solid rgba(255, 255, 255, .08);
}

.product-visual.is-compact {
  min-height: 218px;
  border-radius: var(--r-lg);
}

.visual-grid {
  position: absolute;
  inset: 0;
  opacity: .14;
  background-image:
    linear-gradient(rgba(255, 255, 255, .1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, .1) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: linear-gradient(to bottom right, rgba(0, 0, 0, .9), transparent 70%);
}

.visual-glow {
  position: absolute;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, .12), transparent 68%);
  filter: blur(12px);
}

.visual-orbit {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 50%;
  transform: rotate(-16deg);
}

.orbit-a {
  width: 300px;
  height: 128px;
}

.orbit-b {
  width: 360px;
  height: 168px;
  transform: rotate(22deg);
  border-color: rgba(255, 255, 255, .07);
}

.visual-card {
  position: relative;
  width: 150px;
  height: 190px;
  border: 1px solid rgba(255, 255, 255, .22);
  border-radius: 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 18px;
  background: linear-gradient(145deg, rgba(255, 255, 255, .15), rgba(255, 255, 255, .03));
  box-shadow: 0 25px 60px rgba(0, 0, 0, .45), inset 0 1px 0 rgba(255, 255, 255, .12);
  transform: rotate(-8deg);
  backdrop-filter: blur(5px);
}

.visual-card::after {
  content: '';
  position: absolute;
  right: 16px;
  bottom: 16px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, .28);
  box-shadow: inset 0 0 0 8px rgba(255, 255, 255, .04);
}

.visual-card-top,
.visual-kicker,
.visual-label {
  font-size: 9px;
  letter-spacing: 2.2px;
  text-transform: uppercase;
}

.visual-card-top,
.visual-kicker {
  color: rgba(255, 255, 255, .58);
}

.visual-card-id {
  font-family: var(--font-display);
  font-size: 28px;
  line-height: 1;
  letter-spacing: 1px;
  color: #ffffff;
}

.visual-copy {
  position: absolute;
  left: 22px;
  bottom: 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  z-index: 2;
}

.visual-label {
  color: rgba(255, 255, 255, .26);
}

@media (max-width: 768px) {
  .product-visual,
  .product-visual.is-compact {
    min-height: 200px;
  }

  .visual-card {
    width: 122px;
    height: 156px;
  }
}
</style>
