import { clsx } from "clsx";
import { g as getContext, a6 as attributes, a7 as clsx$1, a8 as ensure_array_like, a9 as element, a5 as derived, aa as spread_props, ab as bind_props } from "../../chunks/index.js";
import { twMerge } from "tailwind-merge";
const KEY = "redbun-theme";
function getTheme() {
  try {
    return localStorage.getItem(KEY) || "system";
  } catch {
    return "system";
  }
}
function setTheme(mode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
  }
  apply(mode);
}
function apply(mode = getTheme()) {
  const dark = mode === "dark" || mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", dark);
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
/**
 * @file
 * @license @lucide/svelte v1.37.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};
/**
 * @file
 * @license @lucide/svelte v1.37.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const hasA11yProp = (props) => {
  for (const prop in props) {
    if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
      return true;
    }
  }
  return false;
};
/**
 * @file
 * @license @lucide/svelte v1.37.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const LucideContext = Symbol("lucide-context");
const getLucideContext = () => getContext(LucideContext);
function Icon($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const globalProps = getLucideContext() ?? {};
    const {
      name,
      color = globalProps.color ?? "currentColor",
      size = globalProps.size ?? 24,
      strokeWidth = globalProps.strokeWidth ?? 2,
      absoluteStrokeWidth = globalProps.absoluteStrokeWidth ?? false,
      iconNode = [],
      children,
      $$slots,
      $$events,
      ...props
    } = $$props;
    const calculatedStrokeWidth = derived(() => absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth);
    $$renderer2.push(`<svg${attributes(
      {
        ...defaultAttributes,
        ...!children && !hasA11yProp(props) && { "aria-hidden": "true" },
        ...props,
        width: size,
        height: size,
        stroke: color,
        "stroke-width": calculatedStrokeWidth(),
        class: clsx$1([
          "lucide-icon lucide",
          globalProps.class,
          name && `lucide-${name}`,
          props.class
        ])
      },
      void 0,
      void 0,
      void 0,
      3
    )}><!--[-->`);
    const each_array = ensure_array_like(iconNode);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let [tag, attrs] = each_array[$$index];
      element($$renderer2, tag, () => {
        $$renderer2.push(`${attributes({ ...attrs }, void 0, void 0, void 0, 3)}`);
      });
    }
    $$renderer2.push(`<!--]-->`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></svg>`);
  });
}
function Arrow_right($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "M5 12h14" }],
    ["path", { "d": "m12 5 7 7-7 7" }]
  ];
  Icon($$renderer, spread_props([{ name: "arrow-right" }, props, { iconNode }]));
}
new Set(
  `the a an and or but if then so of to in on at by for with from as into about over under is are was were be been being have has had do does did will would can could may might must just not no nor more most other some such only own same too very i you he she it we they me my your our their this that these those im dont its got get like one there here what when where who how why gt amp really actually even also because thing things people know think want going make said say says now new time year day good bad`.split(
    /\s+/
  )
);
Array.from({ length: 24 }, (_, i) => `${(i + 11) % 12 + 1}${i < 12 ? "a" : "p"}`);
function Button($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      class: className,
      variant = "default",
      size = "default",
      type = "button",
      href = void 0,
      children,
      $$slots,
      $$events,
      ...rest
    } = $$props;
    const variants = {
      default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline"
    };
    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-11 rounded-md px-6",
      icon: "h-9 w-9"
    };
    const classes = derived(() => cn("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer", variants[variant], sizes[size], className));
    if (href) {
      $$renderer2.push(`<!--[0--><a${attributes({ href, class: clsx$1(classes()), ...rest })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></a>`);
    } else {
      $$renderer2.push(`<!--[-1--><button${attributes({ type, class: clsx$1(classes()), ...rest })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></button>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function Input($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { class: className, value = void 0, $$slots, $$events, ...rest } = $$props;
    $$renderer2.push(`<input${attributes(
      {
        value,
        class: clsx$1(cn("flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className)),
        ...rest
      },
      void 0,
      void 0,
      void 0,
      4
    )}/>`);
    bind_props($$props, { value });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let input = "";
    let theme = "system";
    function changeTheme(e) {
      theme = e.currentTarget.value;
      setTheme(theme);
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<header class="sticky top-0 z-20 border-b bg-background"><div class="mx-auto flex max-w-3xl items-center justify-between px-5 py-3"><button class="flex items-center gap-2.5"><img src="/icon.svg" alt="" width="30" height="30"/> <span class="text-lg font-semibold tracking-tight">redbun</span></button> <div class="flex items-center gap-3 text-xs text-muted-foreground"><a class="hidden hover:text-foreground sm:inline" href="https://github.com/Openmentia/" target="_blank" rel="noreferrer">A product by <span class="font-medium text-foreground">Openmentia</span></a> `);
      $$renderer3.select(
        {
          value: theme,
          onchange: changeTheme,
          "aria-label": "Theme",
          class: "rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        },
        ($$renderer4) => {
          $$renderer4.option({ value: "system" }, ($$renderer5) => {
            $$renderer5.push(`System`);
          });
          $$renderer4.option({ value: "light" }, ($$renderer5) => {
            $$renderer5.push(`Light`);
          });
          $$renderer4.option({ value: "dark" }, ($$renderer5) => {
            $$renderer5.push(`Dark`);
          });
        }
      );
      $$renderer3.push(` <a class="hover:text-foreground" href="https://github.com/Openmentia/redbun" target="_blank" rel="noreferrer" aria-label="Source on GitHub"><svg viewBox="0 0 16 16" class="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"></path></svg></a></div></div></header> `);
      {
        $$renderer3.push(`<!--[0--><section class="mx-auto max-w-2xl px-5 pt-[12vh]"><p class="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Reddit account lookup</p> <h1 class="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Every archived post and comment a Reddit account ever made.</h1> <p class="mt-3 max-w-lg text-muted-foreground">Removed and deleted items included. Pulled the moment you ask, from public archives,
      and read back as a summary.</p> <form class="mt-7 flex gap-2">`);
        Input($$renderer3, {
          placeholder: "username, @handle, or profile URL  ( / to focus )",
          class: "h-11 flex-1 text-base",
          autofocus: true,
          get value() {
            return input;
          },
          set value($$value) {
            input = $$value;
            $$settled = false;
          }
        });
        $$renderer3.push(`<!----> `);
        Button($$renderer3, {
          type: "submit",
          size: "lg",
          class: "gap-1.5",
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->Look up `);
            Arrow_right($$renderer4, { class: "h-4 w-4" });
            $$renderer4.push(`<!---->`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----></form></section>`);
      }
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
export {
  _page as default
};
