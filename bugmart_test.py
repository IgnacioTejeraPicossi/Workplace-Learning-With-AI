"""
BugMart bug hunter — comprehensive exploration of https://bugmart.pages.dev
"""
from playwright.sync_api import sync_playwright
import os, json, time

os.makedirs("C:/tmp/bugmart", exist_ok=True)
BUGS = []

def bug(title, detail, severity="MEDIUM"):
    entry = {"bug": title, "detail": detail, "severity": severity}
    BUGS.append(entry)
    print(f"\n🐛 [{severity}] {title}\n   {detail}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})

    # ─────────────────────────────────────────────
    # 1. HOME PAGE
    # ─────────────────────────────────────────────
    page.goto("https://bugmart.pages.dev", wait_until="networkidle", timeout=30000)
    page.screenshot(path="C:/tmp/bugmart/01_home.png", full_page=True)
    home_text = page.inner_text("body")
    print("=== HOME (first 2000 chars) ===")
    print(home_text[:2000])

    # Prices
    prices_els = page.locator("[class*='price'], .price, [class*='cost']").all_text_contents()
    print("\nPRICES:", prices_els)

    # Stock / quantity indicators
    stock_els = page.locator("[class*='stock'], [class*='quantity'], [class*='qty']").all_text_contents()
    print("STOCK:", stock_els)

    # ─────────────────────────────────────────────
    # 2. ADD ITEMS TO CART — normal flow
    # ─────────────────────────────────────────────
    add_btns = page.locator("button:has-text('Add to Cart')").all()
    print(f"\nAdd-to-cart buttons: {len(add_btns)}")

    # Click first item
    if add_btns:
        add_btns[0].click()
        page.wait_for_timeout(600)
        page.screenshot(path="C:/tmp/bugmart/02_after_first_add.png", full_page=True)

    # Click same item again (duplicate / quantity?)
    if add_btns:
        add_btns[0].click()
        page.wait_for_timeout(400)
        add_btns[0].click()
        page.wait_for_timeout(400)

    # Add multiple different items
    for btn in add_btns[1:5]:
        btn.click()
        page.wait_for_timeout(300)

    # ─────────────────────────────────────────────
    # 3. CART PAGE
    # ─────────────────────────────────────────────
    page.goto("https://bugmart.pages.dev/cart.html", wait_until="networkidle", timeout=30000)
    page.screenshot(path="C:/tmp/bugmart/03_cart.png", full_page=True)
    cart_text = page.inner_text("body")
    print("\n=== CART PAGE ===")
    print(cart_text[:3000])

    # Quantity inputs
    qty_inputs = page.locator("input[type='number'], input[class*='qty'], input[class*='quantity']").all()
    print(f"\nQuantity inputs in cart: {len(qty_inputs)}")

    for i, inp in enumerate(qty_inputs):
        val = inp.get_attribute("value") or inp.input_value()
        min_val = inp.get_attribute("min")
        max_val = inp.get_attribute("max")
        print(f"  Input {i}: value={val}, min={min_val}, max={max_val}")

    # Test: set quantity to 0
    if qty_inputs:
        qty_inputs[0].triple_click()
        qty_inputs[0].type("0")
        page.keyboard.press("Tab")
        page.wait_for_timeout(500)
        page.screenshot(path="C:/tmp/bugmart/04_qty_zero.png", full_page=True)
        after_zero = page.inner_text("body")
        if "0" in after_zero:
            bug("Quantity can be set to 0", "Setting cart quantity to 0 does not remove item or show error — allows 0-item purchase", "HIGH")

    # Test: negative quantity
    if qty_inputs:
        qty_inputs[0].triple_click()
        qty_inputs[0].type("-5")
        page.keyboard.press("Tab")
        page.wait_for_timeout(500)
        page.screenshot(path="C:/tmp/bugmart/05_qty_negative.png", full_page=True)
        neg_text = page.inner_text("body")
        print("\nAfter -5 quantity:", neg_text[:500])
        if "-5" in neg_text or "-" in neg_text:
            bug("Negative quantity accepted", "Setting quantity to -5 is not rejected; may produce negative totals", "HIGH")

    # Test: very large quantity
    if qty_inputs:
        qty_inputs[0].triple_click()
        qty_inputs[0].type("9999")
        page.keyboard.press("Tab")
        page.wait_for_timeout(500)
        page.screenshot(path="C:/tmp/bugmart/06_qty_9999.png", full_page=True)
        large_text = page.inner_text("body")
        print("\nAfter 9999 quantity:", large_text[:500])
        if "9999" in large_text:
            bug("No maximum order quantity enforced", "Quantity 9999 accepted with no upper limit validation", "MEDIUM")

    # Test: decimal quantity
    if qty_inputs:
        qty_inputs[0].triple_click()
        qty_inputs[0].type("1.5")
        page.keyboard.press("Tab")
        page.wait_for_timeout(500)
        decimal_text = page.inner_text("body")
        if "1.5" in decimal_text:
            bug("Decimal quantity accepted", "Non-integer quantity (1.5) is not rejected", "MEDIUM")

    # ─────────────────────────────────────────────
    # 4. CHECKOUT FORM
    # ─────────────────────────────────────────────
    # Look for checkout button
    checkout_btn = page.locator("button:has-text('Checkout'), a:has-text('Checkout'), button:has-text('checkout')").first
    if checkout_btn.count():
        checkout_btn.click()
        page.wait_for_timeout(1000)
        page.wait_for_load_state("networkidle")
        page.screenshot(path="C:/tmp/bugmart/07_checkout.png", full_page=True)
        checkout_text = page.inner_text("body")
        print("\n=== CHECKOUT PAGE ===")
        print(checkout_text[:3000])

        # Find all form inputs
        all_inputs = page.locator("input, select, textarea").all()
        print(f"\nForm inputs: {len(all_inputs)}")
        for inp in all_inputs:
            itype = inp.get_attribute("type") or "text"
            iname = inp.get_attribute("name") or inp.get_attribute("id") or inp.get_attribute("placeholder") or "?"
            print(f"  {itype}: {iname}")
    else:
        # Maybe checkout is on cart page
        print("\nNo explicit checkout button found on cart page")
        # Check all buttons
        all_btns = page.locator("button").all_text_contents()
        print("Buttons on cart:", all_btns)

    # ─────────────────────────────────────────────
    # 5. GO BACK TO CART, FIND CHECKOUT
    # ─────────────────────────────────────────────
    page.goto("https://bugmart.pages.dev/cart.html", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(500)

    # Reset quantity to valid first
    qty_inputs2 = page.locator("input[type='number']").all()
    if qty_inputs2:
        qty_inputs2[0].triple_click()
        qty_inputs2[0].type("1")
        page.keyboard.press("Tab")
        page.wait_for_timeout(300)

    # Find ALL links & buttons on cart
    all_cart_links = [(a.get_attribute("href"), a.inner_text()) for a in page.locator("a").all()]
    all_cart_btns = page.locator("button").all()
    print("\nCart links:", all_cart_links)
    print("Cart buttons:", [b.inner_text() for b in all_cart_btns])

    # Try to click the place-order / checkout button
    for btn_text in ["Place Order", "Checkout", "Buy", "Order", "Submit", "Continue"]:
        btn = page.locator(f"button:has-text('{btn_text}')").first
        if btn.count():
            print(f"\nFound button: {btn_text} — clicking")
            btn.click()
            page.wait_for_timeout(1000)
            page.wait_for_load_state("networkidle")
            page.screenshot(path=f"C:/tmp/bugmart/08_after_{btn_text.lower()}.png", full_page=True)
            order_text = page.inner_text("body")
            print(f"After {btn_text}:", order_text[:2000])
            break

    # ─────────────────────────────────────────────
    # 6. CHECK ALL PAGES / URLS
    # ─────────────────────────────────────────────
    for url_suffix in ["/", "/cart.html", "/checkout.html", "/order.html", "/contact.html"]:
        url = f"https://bugmart.pages.dev{url_suffix}"
        try:
            page.goto(url, wait_until="networkidle", timeout=15000)
            status_text = page.inner_text("body")[:200]
            page.screenshot(path=f"C:/tmp/bugmart/page_{url_suffix.strip('/').replace('.','_') or 'home'}.png")
            print(f"\n✅ {url}: reachable — {status_text[:80]}")

            # Collect inputs on each page
            inputs = page.locator("input, select, textarea").all()
            for inp in inputs:
                itype = inp.get_attribute("type") or "text"
                iname = inp.get_attribute("name") or inp.get_attribute("id") or inp.get_attribute("placeholder") or "?"
                print(f"   input: type={itype}, name={iname}")
        except Exception as e:
            print(f"\n❌ {url}: {e}")

    # ─────────────────────────────────────────────
    # FINAL SUMMARY
    # ─────────────────────────────────────────────
    print("\n\n" + "="*60)
    print(f"BUGS FOUND SO FAR: {len(BUGS)}")
    for b in BUGS:
        print(f"  [{b['severity']}] {b['bug']}: {b['detail']}")

    browser.close()
