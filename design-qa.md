# Homepage design QA

- Source: `C:\Users\Izual\.codex\generated_images\01a05d23-6967-7283-ae4a-39df47cfcd30\exec-046e1e70-c6a0-4f2b-a0ef-303613a8ed56.png`
- Implementation: `C:\Users\Izual\.codex\visualizations\2026\09\01\01a05d23-6967-7283-ae4a-39df47cfcd30\vcpkg-home-implementation-final.png`
- Desktop state: light theme, initial search state, 1280 × 720 CSS viewport, DPR 1
- Source pixels: 1487 × 1058; implementation capture pixels: 1265 × 712
- Comparison normalization: the source was resized with a top-anchored cover crop to 1265 × 712 so the header and hero could be judged against the captured browser area without stretching.
- Mobile state: light theme, initial search state, 390 × 844 CSS viewport, DPR 1

## Comparisons

- Full view: `C:\Users\Izual\.codex\visualizations\2026\09\01\01a05d23-6967-7283-ae4a-39df47cfcd30\vcpkg-home-comparison.png`
- Focused hero view: `C:\Users\Izual\.codex\visualizations\2026\09\01\01a05d23-6967-7283-ae4a-39df47cfcd30\vcpkg-home-comparison-focus.png`
- Mobile implementation: `C:\Users\Izual\.codex\visualizations\2026\09\01\01a05d23-6967-7283-ae4a-39df47cfcd30\vcpkg-home-mobile.png`

## Findings and fixes

1. P1: The first pass let the hero section shrink to the copy width, making the search row much narrower than the selected design. Fixed by giving the section full width and tuning the centered container to 52rem.
2. P2: The initial search field showed its focus ring on page load, while the selected design used a quiet resting state. Fixed with a configurable autofocus prop and disabled autofocus only on the homepage.
3. P2: The mobile metadata separator could wrap onto a line by itself. Fixed by hiding the decorative separator below the desktop breakpoint.
4. The existing Noto package icon and current product header were retained as established product assets. Their proportions, palette, hierarchy, and spacing match the selected direction.

## Functional checks

- Search button with `fmt` navigates to `/search#q=fmt` and renders two matching results.
- Desktop and 390px mobile layouts have no horizontal overflow.
- Browser console errors: none.

final result: passed
