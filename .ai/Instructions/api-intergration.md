# API Integration Guidelines

This file defines rules for integrating backend endpoints into frontend components.

---

## 1. New Endpoint Integration

When integrating a new backend endpoint:

1. **Do not write any backend logic inside the main frontend file** (e.g., `Dashboard.tsx`).
2. Always create **two separate files** for the endpoint:

   - Service file: `src/api/services/{endpoints}.service.ts`
   - Adapter file: `src/api/adapters/{endpoints}.adapter.ts`

3. The main frontend file imports **only the adapter or service functions** — no backend logic inside the component and remove all mock data from main frontend file.

**Example:**

Integrating a new `Dashboard` endpoint:

- `src/API/services/dashboard.service.js`
- `src/API/adapters/dashboard.adapter.js`
- `Dashboard.tsx` (imports the adapter/service, does not contain backend code)

---

- **Do not modify these files**.
- Only import and use the functions from these files.

**Example usage in Dashboard.tsx:**

```typescript
import { getAcademicYears } from "src/API/services/dashboard.service";
import { ClassesAdapter } from "src/API/adapters/dashboard.adapter";

// Use these to fetch and display academic years, grades, sections
```

---

## 2. Loading States

Every component that waits on an API request must show a loading state until the request completes (success or failure).

- Use the shared React Native `Skeleton` component at `src/components/Skeleton.tsx` for API-dependent content.
- While initial data is loading, replace each API-dependent text field, number, and icon with an in-place skeleton. Match width, height, spacing, and shape to the final content to avoid layout shifts.
- Keep stable headings and controls visible when they do not depend on the response. The Dashboard intentionally keeps “Overview” and its wallet icon, plus “Calculated Balance” and its calculator icon, visible during loading.
- Render representative skeleton items for lists and grids, matching their expected item count and layout.
- Use `src/components/LoadingButton.tsx` for actions waiting on requests. It displays a native spinner, disables interaction, exposes busy/disabled accessibility state, and lowers opacity.
- Loading state belongs to the screen or a hook, not the visual components. Reset it in `finally` and surface failures with the existing app error/toast pattern.

### 2.1 React Native Loading Components

Use the shared React Native components in `src/components/Skeleton.tsx` and `src/components/LoadingButton.tsx`; do not add web/CSS loading components.

While initial response data is loading, replace every response-dependent text field, number, and icon with an in-place skeleton. Match width, height, spacing, and shape to the real content so the layout does not shift. Keep stable headings and controls visible when they do not depend on the response. On the Dashboard, “Overview” and its wallet icon, and “Calculated Balance” and its calculator icon intentionally remain visible.

Loading state belongs to the screen or a hook, not the visual loading components. Reset it in `finally` and surface request failures using the existing app error/toast pattern. During pull-to-refresh, keep already-loaded content visible and use a separate refresh indicator.

### 2.2 Skeleton Component

Import and reuse `Skeleton` from `src/components/Skeleton.tsx`. Its `width` and `height` props are required; use `style` for spacing, shape, and placement.

```tsx
import { Skeleton } from '../../components/Skeleton';

{isLoading ? (
  <Skeleton width={ms(120)} height={ms(20)} style={{ borderRadius: ms(10) }} />
) : (
  <Text style={styles.amount}>{formatCurrency(amount)}</Text>
)}
```

The component uses React Native `Animated` to pulse opacity between `0.3` and `1` every 650 ms with the native driver, and stops the animation when it unmounts. Its fill color is `rgba(85, 64, 93, 0.22)`. Preserve this animation and color; do not add CSS/web shimmer or static one-off placeholders.

Keep data-dependent cards visible. Replace each response-dependent label, amount, caption, and icon in place while preserving the final layout. Use rounded skeletons sized to the icons they replace, and render representative placeholder items for lists and grids. Keep unrelated decoration and stable headings/actions visible. If a modal needs API data, render its frame immediately and skeletonize only its response-dependent content.

### 2.3 Loading State in a Screen

Services and adapters return data or reject; they do not return a loading flag. The screen or a hook owns request state and resets it in `finally`:

```tsx
const [data, setData] = useState<DashboardData>(initialData);
const [isLoading, setIsLoading] = useState(true);

const loadData = async (): Promise<void> => {
  setIsLoading(true);
  try {
    setData(await getDashboard()); // adapter function
  } catch (error) {
    showErrorToast(getApiErrorMessage(error, 'Unable to load data. Please try again.'));
  } finally {
    setIsLoading(false);
  }
};
```

Render skeletons for response-dependent fields using `isLoading`. During pull-to-refresh, preserve already-loaded content and use a separate refresh flag/indicator rather than showing initial-load skeletons again. Surface failures using the existing app error/toast pattern.

### 2.4 Loading Button

Import `LoadingButton` from `src/components/LoadingButton.tsx` for actions waiting on API requests. It accepts `children`, required `isLoading`, `onPress`, and optional `disabled` and `style` props. Use React Native `onPress`; do not use web button props or create a separate spinner.

```tsx
import { LoadingButton } from '../../components/LoadingButton';

const [isSaving, setIsSaving] = useState(false);

const handleSave = async (): Promise<void> => {
  setIsSaving(true);
  try {
    await saveDashboardSettings(payload); // adapter function
  } catch (error) {
    showErrorToast(getApiErrorMessage(error, 'Unable to save changes. Please try again.'));
  } finally {
    setIsSaving(false);
  }
};

<LoadingButton
  isLoading={isSaving}
  onPress={handleSave}
  style={styles.saveButton}
>
  <Text style={styles.saveButtonText}>Save changes</Text>
</LoadingButton>
```

The shared component uses React Native `ActivityIndicator` in white, disables interaction, exposes busy/disabled accessibility state, and applies `0.6` opacity while loading. Keep the action's existing style on its `style` prop.

### 2.5 Loading Checklist

Before completing an endpoint integration, confirm that:

1. Every response-dependent text field, number, and icon is replaced with a size-matched skeleton during initial loading.
2. Stable headings and controls independent of response data remain visible.
3. Lists and grids have representative skeleton items without layout shifts.
4. Request-triggering buttons use `LoadingButton` and are disabled while pending.
5. Loading flags reset in `finally`, including after request failures.
6. Pull-to-refresh preserves existing content and refreshes the endpoint when supported.
7. Errors are surfaced using the existing app error/toast pattern.
8. The shared animated `Skeleton` and its original fill color are reused; no web-only loading UI is added.

---

## 3. Rules Summary

- Each new endpoint gets its own service + adapter.
- Use src/services/api.ts for the baseurl.
- Main frontend files must remain free of backend logic.
- Reuse existing services/adapters for shared data — do not modify them.
- Always integrate via service → adapter → component.
- Keep code modular, maintainable, and aligned with existing project architecture.
- Replace API-dependent text, numbers, and icons with the shared animated `Skeleton` while initial data loads; preserve stable headings and controls.
- Use the shared React Native `LoadingButton` for pending user actions; it displays an `ActivityIndicator`, disables presses, and lowers opacity.
- Reset loading state in `finally`, preserve existing content during pull-to-refresh, and surface errors using the established toast pattern.