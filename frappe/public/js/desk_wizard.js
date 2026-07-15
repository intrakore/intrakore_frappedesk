// desk_wizard.js
// Production-ready version for Intrakore — VERIFIED TOKEN VALUES
// Location: ~/frappe-bench/apps/frappe/frappe/public/js/desk_wizard.js
// (No separate "intrakore" app exists — this lives inside the frappe app
//  alongside your intrakore_frappedesk SCSS, same repo/workflow.)
// Registered in: ~/frappe-bench/apps/frappe/frappe/hooks.py
//   app_include_js = [ ..., "/assets/frappe/js/desk_wizard.js" ]
//
// STRUCTURE (updated 2026-06-17):
//   - Step counter ("Step X of Y") sits in a SINGLE unified row together
//     with the numbered step circles, which sit directly ON the
//     connecting progress line (no separate progress bar above).
//   - Previous / Next buttons render as a footer nav AFTER all tab content,
//     at the bottom of the form, GROUPED TOGETHER on the right side.
//
// All token names below were confirmed live in browser console / SCSS source on 2026-06-17:
//   --surface-blueprint-1..8, --outline-blueprint-1..4 (brand tokens)
//   --surface-green-1..3 (Espresso default green, NOT the branded "Clearing"
//     token — used here per explicit request; surface-green-3 = #30A66D)
// Dark mode handled via [data-theme='dark'] selector (never Tailwind dark: prefix).

// ─── DOCTYPE ALLOWLIST ────────────────────────────────────────────────────────
// Leave empty [] to apply to ALL forms with tabs, or list specific doctypes.
const WIZARD_DOCTYPES = [
    // "Sales Invoice",
    // "Purchase Order",
    // "Project",
];

// ─── STYLES ───────────────────────────────────────────────────────────────────

frappe.dom.set_style(`

    /* ── Wizard wrapper bar ── */
    .desk-wizard-wrap {
        background: var(--card-bg);
        padding: 20px 20px 20px 20px;
    }

    /* ── Single unified row: counter text + step circles on the line ── */
    .wizard-progress-row {
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .wizard-step-counter-top {
        font-size: 14px;
        color: var(--ink-gray-6);
        font-weight: 600;
        white-space: nowrap;
        flex-shrink: 0;
        height: 30px;
    line-height: 30px;
    }

    /* ── Step row sits ON the connecting line ── */
    .wizard-steps {
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        flex: 1;
    }
    .wizard-steps::before {
        content: '';
        position: absolute;
        top: 15px;
        left: 14px;
        right: 14px;
        height: 2px;
        background: var(--surface-gray-2);
        z-index: 0;
    }
    /* Filled portion of the line, driven by JS width % */
    .wizard-steps::after {
        content: '';
        position: absolute;
        top: 15px;
        left: 14px;
        height: 2px;
        background: var(--surface-blueprint-7);
        z-index: 1;
        width: var(--wizard-fill-width, 0%);
        transition: width 0.4s cubic-bezier(.4, 0, .2, 1);
    }

    /* ── Individual step ── */
    .wizard-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        flex: 1;
        position: relative;
        z-index: 2;
    }

    /* ── Step circle (default / upcoming) ── */
    .wizard-circle {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: var(--surface-gray-1);
        border: 2px solid var(--outline-gray-3);
        color: var(--ink-gray-5);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        transition: background 0.3s, border-color 0.3s, color 0.3s, transform 0.2s;
    }

    /* Active step — Blueprint solid fill (surface-blueprint-7 = #000FCC) */
    .wizard-step.active .wizard-circle {
        background: var(--surface-blueprint-7);
        border-color: var(--surface-blueprint-7);
        color: var(--ink-white);
        transform: scale(1.15);
        box-shadow: 0 0 0 4px var(--surface-blueprint-2);
    }

    /* Completed step — Espresso Green (surface-green-3 = #30A66D) */
    .wizard-step.complete .wizard-circle {
        background: var(--surface-green-3);
        border-color: var(--surface-green-3);
        color: var(--ink-white);
    }
    .wizard-step.complete .wizard-circle::after {
        content: '✓';
        font-size: 13px;
    }
    .wizard-step.complete .wizard-circle span {
        display: none;
    }

    /* ── Step labels ── */
    .wizard-label {
        font-size: 12px;
        margin-top: 12px;
        color: var(--ink-gray-5);
        text-align: center;
        white-space: nowrap;
        transition: color 0.2s, font-weight 0.2s;
        padding-bottom: 4px;
    }
    .wizard-step.active .wizard-label {
        color: var(--surface-blueprint-7);
        font-weight: 700;
    }
    .wizard-step.complete .wizard-label {
        color: var(--surface-green-3);
    }

    /* ── Prev / Next footer nav (sits at bottom of form, after fields) ── */
    .desk-wizard-footer-nav {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
        padding: 16px 20px;
        margin-top: 8px;
    }

    .wizard-prev,
    .wizard-next {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 13px;
        font-weight: 600;
        padding: 6px 18px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        transition: background 0.2s, transform 0.15s;
    }

    /* Previous — ghost style */
    .wizard-prev {
        background: var(--surface-gray-1);
        color: var(--ink-gray-8);
        border: 1px solid var(--outline-gray-3);
    }
    .wizard-prev:hover {
        background: var(--surface-gray-2);
        transform: translateX(-2px);
    }

    /* Next — Blueprint filled */
    .wizard-next {
        background: var(--surface-blueprint-7);
        color: var(--ink-white);
        border: none;
    }
    .wizard-next:hover {
        background: var(--surface-blueprint-8);
        color: var(--ink-white);
        transform: translateX(2px);
    }

    /* Finish state — Espresso Green */
    .wizard-next.finish {
        background: var(--surface-blueprint-5);
    }
    .wizard-next.finish:hover {
        background: var(--surface-blueprint-6);
        transform: translateX(2px);
    }

    /* ── Slide animations ── */
    .tab-pane.wizard-slide-in-right {
        animation: wizardSlideInRight 0.28s cubic-bezier(.4, 0, .2, 1) both;
    }
    .tab-pane.wizard-slide-in-left {
        animation: wizardSlideInLeft 0.28s cubic-bezier(.4, 0, .2, 1) both;
    }
    @keyframes wizardSlideInRight {
        from { opacity: 0; transform: translateX(32px); }
        to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes wizardSlideInLeft {
        from { opacity: 0; transform: translateX(-32px); }
        to   { opacity: 1; transform: translateX(0); }
    }
        /* ── Responsive: tablet ── */
    @media (max-width: 768px) {
        .desk-wizard-wrap {
            padding: 16px 12px;
        }
        .wizard-progress-row {
            gap: 10px;
        }
        .wizard-label {
            display: none;
        }
        .wizard-steps {
            overflow-x: auto;
            scrollbar-width: none;
            padding: 8 0px;
        }
        .wizard-steps::-webkit-scrollbar {
            display: none;
        }
        .wizard-circle {
            width: 26px;
            height: 26px;
            font-size: 11px;
        }
    }

    /* ── Responsive: mobile ── */
    @media (max-width: 390px) {
        .wizard-step-counter-top {
            font-size: 12px;
        }
        .wizard-circle {
            width: 24px;
            height: 24px;
        }
            .wizard-steps {
            padding: 8 0px;
        }
        .desk-wizard-footer-nav {
            padding: 12px 12px;
        }
        .wizard-prev,
        .wizard-next {
            padding: 6px 14px;
            font-size: 12px;
        }
    }
`);

// ─── FORM HOOK ────────────────────────────────────────────────────────────────

frappe.ui.form.on("*", {
    refresh(frm) {
        if (WIZARD_DOCTYPES.length && !WIZARD_DOCTYPES.includes(frm.doctype)) return;
        setTimeout(() => init_step_wizard(frm), 300);
    }
});

// ─── INIT ─────────────────────────────────────────────────────────────────────

function init_step_wizard(frm) {
    const $wrapper = frm.layout.wrapper;
    const $native_tabs = $wrapper.find(".form-tabs-list");
    if (!$native_tabs.length) return;

    const $nav_links = $native_tabs.find(".nav-link");
    if ($nav_links.length < 2) return;

    if ($wrapper.find(".desk-wizard-wrap").length) {
        update_wizard_state($wrapper, $nav_links);
        return;
    }

    const steps = $nav_links.map((i, el) => $(el).text().trim()).get();
    $native_tabs.hide();

    const $wrap = build_wizard_bar(steps);
    const $footer_nav = build_wizard_footer_nav();

    // Step bar goes where the native tabs were (top of form)
    $native_tabs.before($wrap);

    // Footer nav goes at the very bottom of the form content,
    // after all tab panes — mirrors a page-footer pagination control
    const $tab_content = $wrapper.find(".form-tab-content, .tab-content").first();
    if ($tab_content.length) {
        $tab_content.after($footer_nav);
    } else {
        // fallback: append to end of layout wrapper
        $wrapper.append($footer_nav);
    }

    // Guard against Frappe re-appending stray nav elements elsewhere
    const observer = new MutationObserver(() => {
        $wrapper.find(".desk-wizard-footer-nav").each((i, el) => {
            // keep only the first instance; remove accidental duplicates
            if (i > 0) $(el).remove();
        });
    });
    observer.observe($wrapper[0], { childList: true, subtree: true });

    bind_wizard_events(frm, $wrapper, $nav_links, steps.length);
    update_wizard_state($wrapper, $nav_links);
}

// ─── DOM BUILDERS ─────────────────────────────────────────────────────────────

function build_wizard_bar(steps) {
    const circles = steps.map((label, i) => `
        <div class="wizard-step" data-index="${i}">
            <div class="wizard-circle"><span>${i + 1}</span></div>
            <div class="wizard-label">${frappe.utils.escape_html(label)}</div>
        </div>
    `).join("");

    return $(`
        <div class="desk-wizard-wrap">
            <div class="wizard-progress-row">
                <span class="wizard-step-counter-top"></span>
                <div class="wizard-steps">${circles}</div>
            </div>
        </div>
    `);
}

function build_wizard_footer_nav() {
    return $(`
        <div class="desk-wizard-footer-nav">
            <button class="btn wizard-prev">‹ Previous</button>
            <button class="btn wizard-next">Next ›</button>
        </div>
    `);
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────

function bind_wizard_events(frm, $wrapper, $nav_links, total) {
    $wrapper.on("click", ".wizard-next", () => {
        const current = get_active_index($nav_links);
        if (current < total - 1) {
            $nav_links.eq(current + 1).trigger("click");
            animate_tab($wrapper, 1);
            update_wizard_state($wrapper, $nav_links);
        }
    });

    $wrapper.on("click", ".wizard-prev", () => {
        const current = get_active_index($nav_links);
        if (current > 0) {
            $nav_links.eq(current - 1).trigger("click");
            animate_tab($wrapper, -1);
            update_wizard_state($wrapper, $nav_links);
        }
    });

    $wrapper.on("click", ".wizard-step", function () {
        const target = $(this).data("index");
        const current = get_active_index($nav_links);
        $nav_links.eq(target).trigger("click");
        animate_tab($wrapper, target >= current ? 1 : -1);
        update_wizard_state($wrapper, $nav_links);
    });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function animate_tab($wrapper, direction) {
    setTimeout(() => {
        const $pane = $wrapper.find(".tab-pane.show.active");
        const cls = direction >= 0 ? "wizard-slide-in-right" : "wizard-slide-in-left";
        $pane.removeClass("wizard-slide-in-right wizard-slide-in-left");
        void $pane[0]?.offsetWidth;
        $pane.addClass(cls);
    }, 20);
}

function get_active_index($nav_links) {
    let idx = 0;
    $nav_links.each((i, el) => {
        if ($(el).hasClass("active")) idx = i;
    });
    return idx;
}

function update_wizard_state($wrapper, $nav_links) {
    const total = $nav_links.length;
    const current = get_active_index($nav_links);

    $wrapper.find(".wizard-step").each((i, el) => {
        $(el).toggleClass("active", i === current);
        $(el).toggleClass("complete", i < current);
    });

    const pct = total > 1 ? (current / (total - 1)) * 100 : 100;
    $wrapper.find(".wizard-steps").css("--wizard-fill-width", `${pct}%`);
    $wrapper.find(".wizard-step-counter-top").text(`Step ${current + 1} of ${total}`);
    $wrapper.find(".wizard-prev").toggle(current > 0);

    const $next = $wrapper.find(".wizard-next");
    if (current === total - 1) {
        $next.text("Finish ✓").addClass("finish");
    } else {
        $next.text("Next ›").removeClass("finish");
    }
}
